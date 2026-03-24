#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { maybeBuild } = require('./lib/build');
const { ensureDirFor, fail } = require('./lib/common');
const { collectActions, executeActions } = require('./lib/actions');
const { launchSession, resolveCliPath } = require('./lib/devtools_client');
const { captureGuiScreenshot } = require('./lib/gui_screenshot');
const { buildArtifactPaths, buildPageCapturePlan, defaultArtifactDir } = require('./lib/output_paths');
const { loadProjectContext, printRoutes, resolveRoute } = require('./lib/project_discovery');
const { acquireSessionLock } = require('./lib/session_lock');
const { applyScroll, chooseScrollController, parseScrollPositions } = require('./lib/scroll');

function splitRouteAndQuery(routeInput) {
  const raw = String(routeInput || '').trim();
  const queryIndex = raw.indexOf('?');
  if (queryIndex < 0) {
    return {
      route: raw,
      searchParams: new URLSearchParams()
    };
  }

  return {
    route: raw.slice(0, queryIndex),
    searchParams: new URLSearchParams(raw.slice(queryIndex + 1))
  };
}

function appendCliQueries(searchParams, queryEntries) {
  for (const entry of queryEntries || []) {
    const token = String(entry || '').trim();
    if (!token) {
      continue;
    }
    const eqIndex = token.indexOf('=');
    if (eqIndex < 0) {
      searchParams.append(token, '');
      continue;
    }
    const key = token.slice(0, eqIndex);
    const value = token.slice(eqIndex + 1);
    searchParams.append(key, value);
  }
  return searchParams;
}

function buildUrl(route, searchParams) {
  const queryString = searchParams.toString();
  return queryString ? `/${route}?${queryString}` : `/${route}`;
}

function chooseMethod(routeRecord, requestedMethod, hasQuery) {
  if (requestedMethod !== 'auto') {
    return requestedMethod;
  }
  if (hasQuery) {
    return 'reLaunch';
  }
  if (routeRecord?.tabBar) {
    return 'switchTab';
  }
  return 'reLaunch';
}

function preprocessArgv(argv) {
  const knownSubcommands = new Set(['routes', 'shot', 'scroll-shot', 'gui-shot', 'open']);
  const first = argv[0];
  const subcommand = first && !first.startsWith('-') && knownSubcommands.has(first) ? first : 'shot';
  const rest = subcommand === 'shot' && first && !first.startsWith('-') && !knownSubcommands.has(first)
    ? argv.slice()
    : (subcommand === 'shot' && first !== 'shot' ? argv.slice() : argv.slice(1));

  if (subcommand === 'routes') {
    return { argv: ['--list-pages', ...rest], subcommand };
  }
  if (subcommand === 'gui-shot') {
    return { argv: ['--gui', ...rest], subcommand };
  }
  if (subcommand === 'scroll-shot') {
    const nextArgv = rest.slice();
    if (!nextArgv.includes('--scroll-y') && !nextArgv.includes('--scroll-step')) {
      nextArgv.push('--scroll-step', '900', '--scroll-captures', '3');
    }
    return { argv: nextArgv, subcommand };
  }
  if (subcommand === 'open') {
    return { argv: ['--keep-open', '--no-page-shot', ...rest], subcommand };
  }
  return { argv: argv.slice(), subcommand };
}

function parseArgs(rawArgv) {
  const preprocessed = preprocessArgv(rawArgv);
  const argv = preprocessed.argv;
  const args = {
    actionWait: 800,
    actions: [],
    artifactDir: null,
    build: false,
    capturePage: true,
    consoleLimit: 50,
    gui: false,
    json: false,
    keepOpen: false,
    listPages: false,
    method: 'auto',
    port: null,
    project: process.cwd(),
    queries: [],
    scrollDebug: false,
    scrollTarget: 'auto',
    scrollWait: 900,
    taps: [],
    triggers: [],
    subcommand: preprocessed.subcommand,
    wait: 1500,
    inputs: [],
    longPresses: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    switch (token) {
      case '--artifact-dir':
        args.artifactDir = next;
        index += 1;
        break;
      case '--project':
        args.project = next;
        index += 1;
        break;
      case '--route':
        args.route = next;
        index += 1;
        break;
      case '--output':
        args.output = next;
        index += 1;
        break;
      case '--action':
        args.actions.push(next);
        index += 1;
        break;
      case '--action-wait':
        args.actionWait = Number(next);
        index += 1;
        break;
      case '--gui-output':
        args.guiOutput = next;
        index += 1;
        break;
      case '--wait':
        args.wait = Number(next);
        index += 1;
        break;
      case '--scroll-wait':
        args.scrollWait = Number(next);
        index += 1;
        break;
      case '--port':
        args.port = Number(next);
        index += 1;
        break;
      case '--query':
        args.queries.push(next);
        index += 1;
        break;
      case '--tap':
        args.taps.push(next);
        index += 1;
        break;
      case '--longpress':
        args.longPresses.push(next);
        index += 1;
        break;
      case '--input':
        args.inputs.push(next);
        index += 1;
        break;
      case '--trigger':
        args.triggers.push(next);
        index += 1;
        break;
      case '--console-limit':
        args.consoleLimit = Number(next);
        index += 1;
        break;
      case '--scroll-y':
        args.scrollY = next;
        index += 1;
        break;
      case '--scroll-step':
        args.scrollStep = Number(next);
        index += 1;
        break;
      case '--scroll-captures':
        args.scrollCaptures = Number(next);
        index += 1;
        break;
      case '--scroll-target':
        args.scrollTarget = next;
        index += 1;
        break;
      case '--scroll-selector':
        args.scrollSelector = next;
        index += 1;
        break;
      case '--scroll-debug':
        args.scrollDebug = true;
        break;
      case '--cli-path':
        args.cliPath = next;
        index += 1;
        break;
      case '--method':
        args.method = next;
        index += 1;
        break;
      case '--build':
        args.build = true;
        break;
      case '--list-pages':
        args.listPages = true;
        break;
      case '--gui':
        args.gui = true;
        break;
      case '--keep-open':
        args.keepOpen = true;
        break;
      case '--no-page-shot':
        args.capturePage = false;
        break;
      case '--json':
        args.json = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        fail(`Unknown argument: ${token}`);
    }
  }

  if (!Number.isFinite(args.wait) || args.wait < 0) {
    fail('--wait must be a non-negative number');
  }
  if (!Number.isFinite(args.actionWait) || args.actionWait < 0) {
    fail('--action-wait must be a non-negative number');
  }
  if (args.port !== null && (!Number.isFinite(args.port) || args.port <= 0)) {
    fail('--port must be a positive number');
  }
  if (!Number.isFinite(args.consoleLimit) || args.consoleLimit < 0) {
    fail('--console-limit must be a non-negative number');
  }
  if (!Number.isFinite(args.scrollWait) || args.scrollWait < 0) {
    fail('--scroll-wait must be a non-negative number');
  }
  if (!['auto', 'reLaunch', 'navigateTo', 'switchTab'].includes(args.method)) {
    fail('--method must be one of: auto, reLaunch, navigateTo, switchTab');
  }
  if (!['auto', 'page', 'inner'].includes(args.scrollTarget)) {
    fail('--scroll-target must be one of: auto, page, inner');
  }
  if (args.scrollStep !== undefined && (!Number.isFinite(args.scrollStep) || args.scrollStep < 0)) {
    fail('--scroll-step must be a non-negative number');
  }
  if (args.scrollCaptures !== undefined && (!Number.isFinite(args.scrollCaptures) || args.scrollCaptures <= 0)) {
    fail('--scroll-captures must be a positive number');
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node visual_check.js [routes|shot|scroll-shot|gui-shot|open] --project <path> [options]
  node visual_check.js --project <path> --route <route-or-alias> [options]

Commands:
  routes              List discovered routes and aliases
  shot                Open a page and capture the simulator screenshot
  scroll-shot         Capture below-the-fold screenshots with scrolling
  gui-shot            Also capture the WeChat DevTools GUI window
  open                Open a page and keep DevTools open without a page screenshot

Options:
  --project <path>      Project root or any child path
  --route <value>       Route, route alias, or route with query
  --artifact-dir <dir>  Output directory for report and default captures
  --output <path>       Page screenshot output path
  --gui-output <path>   GUI screenshot output path
  --build               Run mini-program build before launch
  --wait <ms>           Wait time before capture (default: 1500)
  --query <k=v>         Append query parameter (repeatable)
  --tap <selector>      Tap an element before capture (repeatable)
  --longpress <sel>     Long-press an element before capture (repeatable)
  --input <sel>::<v>    Input text into a field before capture (repeatable)
  --trigger <spec>      Trigger event: <selector>::<event>[::jsonDetail]
  --action <spec>       Generic action: tap:..., input:...::..., wait:1000
  --action-wait <ms>    Wait after each action (default: 800)
  --console-limit <n>   Max console/exception events stored in report
  --scroll-y <list>     Comma-separated scrollTop values
  --scroll-step <n>     Auto-generate scroll positions by step size
  --scroll-captures <n> Number of captures when using --scroll-step
  --scroll-wait <ms>    Wait after each scroll (default: 900)
  --scroll-target <m>   auto | page | inner
  --scroll-selector <s> Explicit selector for inner scroll container
  --scroll-debug        Print ranked scroll candidates
  --port <n>            DevTools automation port
  --method <name>       auto | reLaunch | navigateTo | switchTab
  --gui                 Also capture the DevTools GUI via screenshot helper
  --keep-open           Keep DevTools open after the run
  --no-page-shot        Do not capture the simulator page screenshot
  --json                Print machine-readable JSON output
`);
}

function formatConsoleEvents(events) {
  const safeStringify = (value) => {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  return (events || []).map((event, index) => {
    const params = event.params || {};
    if (event.kind === 'exception') {
      const details = params.exceptionDetails || {};
      const text = params.message
        || details.text
        || details.exception?.description
        || details.exception?.value
        || 'Unhandled exception';
      return {
        index,
        kind: 'exception',
        message: text,
        stack: params.stack || details.stackTrace || null,
        raw: params
      };
    }

    const rawMessage = params.message
      || params.text
      || params.log
      || params.data
      || params.content
      || (Array.isArray(params.args) ? params.args.map((item) => safeStringify(item)).join(' ') : '');
    const message = safeStringify(rawMessage);
    return {
      index,
      kind: 'console',
      level: params.level || params.type || 'log',
      message,
      raw: params
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cliPath = resolveCliPath(args.cliPath);
  const context = loadProjectContext(args.project);

  if (args.listPages) {
    printRoutes(context.routes, context.aliasMap, args.json);
    return;
  }

  const splitInput = splitRouteAndQuery(args.route || '');
  const searchParams = appendCliQueries(splitInput.searchParams, args.queries);
  const resolvedRoute = resolveRoute(splitInput.route || args.route, context.routes, context.aliasMap);
  const routeRecord = context.routes.find((item) => item.route === resolvedRoute);
  const method = chooseMethod(routeRecord, args.method, Array.from(searchParams.keys()).length > 0);
  const inferredArtifactDir = args.artifactDir
    || (args.output ? path.dirname(path.resolve(args.output)) : null)
    || (args.guiOutput ? path.dirname(path.resolve(args.guiOutput)) : null)
    || defaultArtifactDir(context.projectRoot, resolvedRoute, args.subcommand);
  const artifactDir = path.resolve(inferredArtifactDir);
  const artifactPaths = buildArtifactPaths({
    artifactDir,
    captureGui: args.gui,
    capturePage: args.capturePage,
    guiOutput: args.guiOutput,
    output: args.output
  });
  const scrollPositions = args.capturePage ? parseScrollPositions(args) : [];
  const actions = collectActions(args);
  const pageCapturePlan = args.capturePage
    ? buildPageCapturePlan(artifactPaths.output, scrollPositions)
    : [];
  const url = buildUrl(resolvedRoute, searchParams);

  if (args.build) {
    maybeBuild(context.projectRoot, cliPath);
  }

  let session;
  let releaseLock = null;

  try {
    releaseLock = await acquireSessionLock();
    session = await launchSession({
      cliPath,
      port: args.port,
      projectPath: context.projectRoot,
      trustProject: true
    });

    const page = await session.open(url, method);
    await page.waitFor(args.wait);
    const actionResult = actions.length
      ? await executeActions({
          actionWait: args.actionWait,
          actions,
          initialPage: page,
          session
        })
      : { actions: [], page };
    const activePage = actionResult.page;
    const currentPage = await session.currentPage();

    const scrollController = scrollPositions.length ? await chooseScrollController(activePage, args) : null;
    const pageScreenshots = [];

    for (const item of pageCapturePlan) {
      if (item.scrollTop !== null) {
        await applyScroll(scrollController, session, item.scrollTop);
        await activePage.waitFor(args.scrollWait);
      }
      ensureDirFor(item.path);
      const screenshotPath = await session.screenshot({ path: item.path });
      pageScreenshots.push({
        path: path.resolve(screenshotPath || item.path),
        scrollTop: item.scrollTop
      });
    }

    let guiScreenshot = null;
    if (args.gui) {
      guiScreenshot = captureGuiScreenshot(artifactPaths.guiOutput);
    }

    const payload = {
      artifactDir,
      artifacts: [],
      cliPath,
      currentPage: currentPage ? currentPage.path : null,
      guiScreenshot,
      method,
      miniprogramRoot: context.miniprogramRoot,
      performedActions: actionResult.actions,
      pageScreenshots,
      projectRoot: context.projectRoot,
      reportPath: artifactPaths.reportPath,
      route: resolvedRoute,
      consoleEvents: formatConsoleEvents(session.getConsoleEvents(args.consoleLimit)),
      scrollController: scrollController
        ? {
            className: scrollController.className || '',
            id: scrollController.id || '',
            index: scrollController.index,
            mode: scrollController.mode
          }
        : null,
      url
    };

    for (const pageShot of pageScreenshots) {
      payload.artifacts.push({
        kind: pageShot.scrollTop === null ? 'page' : `page-scroll-${pageShot.scrollTop}`,
        path: pageShot.path
      });
    }
    if (guiScreenshot) {
      const guiPaths = Array.isArray(guiScreenshot) ? guiScreenshot : [guiScreenshot];
      for (const guiPath of guiPaths) {
        payload.artifacts.push({
          kind: 'gui',
          path: path.resolve(guiPath)
        });
      }
    }

    ensureDirFor(payload.reportPath);
    fs.writeFileSync(payload.reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    payload.artifacts.push({ kind: 'report', path: payload.reportPath });

    if (args.json) {
      console.log(JSON.stringify(payload, null, 2));
    } else {
      console.log(`PROJECT_ROOT ${payload.projectRoot}`);
      console.log(`MINIPROGRAM_ROOT ${payload.miniprogramRoot}`);
      console.log(`RESOLVED_ROUTE ${payload.route}`);
      console.log(`RESOLVED_URL ${payload.url}`);
      console.log(`METHOD ${payload.method}`);
      console.log(`CURRENT_PAGE ${payload.currentPage}`);
      console.log(`ARTIFACT_DIR ${payload.artifactDir}`);
      if (payload.scrollController) {
        console.log(
          `SCROLL_TARGET mode=${payload.scrollController.mode} class=${payload.scrollController.className || '-'} id=${payload.scrollController.id || '-'} index=${payload.scrollController.index ?? '-'}`
        );
      }
      for (const action of payload.performedActions) {
        console.log(`ACTION type=${action.type}${action.selector ? ` selector=${action.selector}` : ''}${action.value ? ` value=${action.value}` : ''}${action.eventName ? ` event=${action.eventName}` : ''}${action.ms !== undefined ? ` ms=${action.ms}` : ''}`);
      }
      for (const consoleEvent of payload.consoleEvents) {
        console.log(`CONSOLE kind=${consoleEvent.kind}${consoleEvent.level ? ` level=${consoleEvent.level}` : ''} message=${JSON.stringify(consoleEvent.message)}`);
      }
      for (const artifact of payload.artifacts) {
        console.log(`ARTIFACT kind=${artifact.kind} path=${artifact.path}`);
      }
    }

    if (!args.keepOpen) {
      await session.close();
      session = null;
    }
  } finally {
    if (session && !args.keepOpen) {
      try {
        await session.close();
      } catch {
        // no-op
      }
    }
    if (releaseLock) {
      releaseLock();
    }
  }
}

main().catch((error) => {
  console.error(error.message || 'visual_check failed');
  if (error.detail) {
    console.error(error.detail);
  }
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
