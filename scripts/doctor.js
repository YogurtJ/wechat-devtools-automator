#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

function printHelp() {
  console.log(`Usage:
  node doctor.js [options]

Options:
  --project <path>     Project root or any child path (default: cwd)
  --devtools-app <p>   WeChat DevTools app bundle path
  --cli-path <path>    WeChat DevTools CLI path
  --json               Print machine-readable JSON
  -h, --help           Show help
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    project: process.cwd(),
    json: false,
    devtoolsApp: process.env.WECHAT_DEVTOOLS_APP || '/Applications/wechatwebdevtools.app',
    cliPath: process.env.WECHAT_DEVTOOLS_CLI || ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    switch (token) {
      case '--project':
        if (!next) fail('--project requires a value');
        args.project = next;
        index += 1;
        break;
      case '--devtools-app':
        if (!next) fail('--devtools-app requires a value');
        args.devtoolsApp = next;
        index += 1;
        break;
      case '--cli-path':
        if (!next) fail('--cli-path requires a value');
        args.cliPath = next;
        index += 1;
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

  return args;
}

function exists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isExecutable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findProjectRoot(startPath) {
  let current = path.resolve(startPath);
  while (true) {
    const candidate = path.join(current, 'project.config.json');
    if (exists(candidate)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function addCheck(list, check) {
  list.push(check);
}

function summarize(checks) {
  return checks.reduce(
    (accumulator, item) => {
      accumulator[item.status] += 1;
      return accumulator;
    },
    { pass: 0, warn: 0, fail: 0 }
  );
}

function nodeVersionMajor() {
  const value = String(process.versions.node || '');
  const major = Number(value.split('.')[0]);
  return Number.isFinite(major) ? major : 0;
}

function runDoctor(args) {
  const checks = [];
  const environment = {
    cwd: process.cwd(),
    projectInput: path.resolve(args.project),
    nodeVersion: process.version,
    platform: process.platform,
    devtoolsApp: path.resolve(args.devtoolsApp),
    cliPath: args.cliPath
      ? path.resolve(args.cliPath)
      : path.join(path.resolve(args.devtoolsApp), 'Contents', 'MacOS', 'cli'),
    screenshotHelper:
      process.env.CODEX_SCREENSHOT_HELPER ||
      path.join(os.homedir(), '.codex/skills/screenshot/scripts/take_screenshot.py')
  };

  const major = nodeVersionMajor();
  const hasBuiltinWebSocket = typeof globalThis.WebSocket === 'function';
  const nodeStatus = hasBuiltinWebSocket ? 'pass' : major >= 22 ? 'warn' : 'fail';
  addCheck(checks, {
    id: 'node-runtime',
    required: true,
    status: nodeStatus,
    title: 'Node runtime and WebSocket support',
    detail: `Detected ${process.version}; built-in WebSocket is ${hasBuiltinWebSocket ? 'available' : 'missing'}.`,
    fix:
      nodeStatus === 'pass'
        ? ''
        : 'Upgrade Node.js to a modern version that provides global WebSocket support (recommended: Node 22+).'
  });

  const devtoolsAppExists = exists(environment.devtoolsApp);
  addCheck(checks, {
    id: 'devtools-app',
    required: true,
    status: devtoolsAppExists ? 'pass' : 'fail',
    title: 'WeChat DevTools app bundle',
    detail: devtoolsAppExists
      ? `Found app bundle: ${environment.devtoolsApp}`
      : `App bundle not found: ${environment.devtoolsApp}`,
    fix: devtoolsAppExists
      ? ''
      : 'Install WeChat DevTools or set WECHAT_DEVTOOLS_APP / --devtools-app to the correct bundle path.'
  });

  const cliExists = exists(environment.cliPath);
  const cliExecutable = cliExists && isExecutable(environment.cliPath);
  addCheck(checks, {
    id: 'devtools-cli',
    required: true,
    status: cliExists && cliExecutable ? 'pass' : 'fail',
    title: 'WeChat DevTools CLI',
    detail: cliExists
      ? cliExecutable
        ? `Found executable CLI: ${environment.cliPath}`
        : `CLI exists but is not executable: ${environment.cliPath}`
      : `CLI not found: ${environment.cliPath}`,
    fix: cliExists && cliExecutable
      ? ''
      : 'Set WECHAT_DEVTOOLS_CLI / --cli-path or reinstall WeChat DevTools to restore the `cli` binary.'
  });

  const projectRoot = findProjectRoot(environment.projectInput);
  addCheck(checks, {
    id: 'project-config',
    required: true,
    status: projectRoot ? 'pass' : 'fail',
    title: 'Project root discovery',
    detail: projectRoot
      ? `Found project root: ${projectRoot}`
      : `Could not find project.config.json from: ${environment.projectInput}`,
    fix: projectRoot
      ? ''
      : 'Run doctor with --project <your-mini-program-path> so it can locate project.config.json.'
  });

  let miniprogramRoot = null;
  let appJsonPath = null;
  if (projectRoot) {
    try {
      const projectConfig = readJson(path.join(projectRoot, 'project.config.json'));
      miniprogramRoot = path.resolve(projectRoot, projectConfig.miniprogramRoot || '.');
      addCheck(checks, {
        id: 'miniprogram-root',
        required: true,
        status: exists(miniprogramRoot) ? 'pass' : 'fail',
        title: 'miniprogramRoot path',
        detail: exists(miniprogramRoot)
          ? `Resolved miniprogramRoot: ${miniprogramRoot}`
          : `miniprogramRoot does not exist: ${miniprogramRoot}`,
        fix: exists(miniprogramRoot)
          ? ''
          : 'Fix `miniprogramRoot` in project.config.json or restore that directory.'
      });
      appJsonPath = path.join(miniprogramRoot, 'app.json');
    } catch (error) {
      addCheck(checks, {
        id: 'project-config-json',
        required: true,
        status: 'fail',
        title: 'project.config.json readability',
        detail: `Failed to parse project.config.json: ${error.message || String(error)}`,
        fix: 'Repair project.config.json to valid JSON.'
      });
    }
  }

  if (appJsonPath) {
    if (exists(appJsonPath)) {
      try {
        const appJson = readJson(appJsonPath);
        const topPages = Array.isArray(appJson.pages) ? appJson.pages.length : 0;
        const subPages = Array.isArray(appJson.subpackages)
          ? appJson.subpackages.reduce((count, pack) => {
              const pages = Array.isArray(pack.pages) ? pack.pages.length : 0;
              return count + pages;
            }, 0)
          : 0;
        addCheck(checks, {
          id: 'app-json',
          required: true,
          status: 'pass',
          title: 'app.json route manifest',
          detail: `Found app.json with ${topPages + subPages} routes (${topPages} top-level, ${subPages} subpackage).`,
          fix: ''
        });
      } catch (error) {
        addCheck(checks, {
          id: 'app-json-parse',
          required: true,
          status: 'fail',
          title: 'app.json readability',
          detail: `Failed to parse app.json: ${error.message || String(error)}`,
          fix: 'Repair app.json to valid JSON.'
        });
      }
    } else {
      addCheck(checks, {
        id: 'app-json-missing',
        required: true,
        status: 'fail',
        title: 'app.json presence',
        detail: `app.json not found at: ${appJsonPath}`,
        fix: 'Ensure miniprogramRoot points to a valid mini-program source directory containing app.json.'
      });
    }
  }

  const helperExists = exists(environment.screenshotHelper);
  addCheck(checks, {
    id: 'screenshot-helper',
    required: false,
    status: helperExists ? 'pass' : 'warn',
    title: 'Screenshot helper',
    detail: helperExists
      ? `Found helper: ${environment.screenshotHelper}`
      : `Optional helper not found: ${environment.screenshotHelper}`,
    fix: helperExists
      ? ''
      : 'Install screenshot skill or set CODEX_SCREENSHOT_HELPER if you need `gui-shot` capture.'
  });

  const summary = summarize(checks);
  const requiredFailures = checks.some((item) => item.required && item.status === 'fail');

  return {
    ok: !requiredFailures,
    summary,
    environment,
    checks
  };
}

function renderHuman(payload) {
  console.log('WeChat DevTools Automator Doctor');
  console.log(`Project input: ${payload.environment.projectInput}`);
  console.log(`Node: ${payload.environment.nodeVersion}`);
  console.log('');

  for (const item of payload.checks) {
    const label = item.status.toUpperCase().padEnd(4, ' ');
    const required = item.required ? 'required' : 'optional';
    console.log(`[${label}] ${item.title} (${required})`);
    console.log(`  ${item.detail}`);
    if (item.fix) {
      console.log(`  Fix: ${item.fix}`);
    }
  }

  console.log('');
  console.log(
    `Summary: ${payload.summary.pass} pass, ${payload.summary.warn} warn, ${payload.summary.fail} fail`
  );
  console.log(`Doctor status: ${payload.ok ? 'ready' : 'not-ready'}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = runDoctor(args);
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    renderHuman(payload);
  }
  process.exit(payload.ok ? 0 : 1);
}

main();
