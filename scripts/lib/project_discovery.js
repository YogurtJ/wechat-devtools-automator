const path = require('path');
const { fail, fileExists, normalizeRoute, readJson } = require('./common');

function findProjectRoot(startPath) {
  let current = path.resolve(startPath);

  while (true) {
    if (fileExists(path.join(current, 'project.config.json'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

function discoverPages(appJson) {
  const routes = [];
  const tabBarPages = new Set((appJson.tabBar?.list || []).map((item) => normalizeRoute(item.pagePath)));

  for (const route of appJson.pages || []) {
    routes.push({
      route: normalizeRoute(route),
      source: 'pages',
      tabBar: tabBarPages.has(normalizeRoute(route))
    });
  }

  for (const subpackage of appJson.subpackages || []) {
    const root = normalizeRoute(subpackage.root);
    for (const page of subpackage.pages || []) {
      routes.push({
        route: normalizeRoute(path.posix.join(root, page)),
        source: `subpackage:${root}`,
        tabBar: false
      });
    }
  }

  return routes;
}

function buildAliasMap(routes) {
  const aliasMap = new Map();

  function push(alias, route) {
    const normalizedAlias = normalizeRoute(alias);
    if (!normalizedAlias) {
      return;
    }
    const existing = aliasMap.get(normalizedAlias) || [];
    if (!existing.includes(route)) {
      existing.push(route);
    }
    aliasMap.set(normalizedAlias, existing);
  }

  for (const item of routes) {
    const route = item.route;
    const segments = route.split('/').filter(Boolean);
    const noIndex = segments[segments.length - 1] === 'index' ? segments.slice(0, -1) : segments.slice();

    push(route, route);
    push(`/${route}`, route);

    if (noIndex.length > 0) {
      push(noIndex[noIndex.length - 1], route);
    }

    const pagesMarker = noIndex.indexOf('pages');
    if (pagesMarker >= 0) {
      push(noIndex.slice(pagesMarker + 1).join('/'), route);
    }

    const subpackagesMarker = noIndex.indexOf('subpackages');
    if (subpackagesMarker >= 0 && noIndex.length > subpackagesMarker + 2) {
      const packageName = noIndex[subpackagesMarker + 1];
      const pagesIndex = noIndex.indexOf('pages', subpackagesMarker + 2);
      if (pagesIndex >= 0) {
        const pageTail = noIndex.slice(pagesIndex + 1).join('/');
        push(`${packageName}/${pageTail}`, route);
        push(pageTail, route);
      }
    }
  }

  return aliasMap;
}

function resolveRoute(input, routes, aliasMap) {
  if (!input) {
    return routes[0]?.route || null;
  }

  const normalized = normalizeRoute(input);
  const exact = routes.find((item) => item.route === normalized);
  if (exact) {
    return exact.route;
  }

  const aliasMatches = aliasMap.get(normalized) || [];
  if (aliasMatches.length === 1) {
    return aliasMatches[0];
  }
  if (aliasMatches.length > 1) {
    fail(`Ambiguous route alias: ${input}`, `Candidates:\n${aliasMatches.map((value) => `- ${value}`).join('\n')}`);
  }

  const fuzzy = routes
    .map((item) => item.route)
    .filter((route) => route.includes(normalized) || route.endsWith(`/${normalized}`));

  if (fuzzy.length === 1) {
    return fuzzy[0];
  }
  if (fuzzy.length > 1) {
    fail(`Ambiguous route match: ${input}`, `Candidates:\n${fuzzy.map((value) => `- ${value}`).join('\n')}`);
  }

  fail(`Could not resolve route: ${input}`);
}

function getRoutesPayload(routes, aliasMap) {
  return {
    routes: routes.map((item) => ({
      route: item.route,
      source: item.source,
      tabBar: item.tabBar
    })),
    aliases: Object.fromEntries([...aliasMap.entries()].filter(([, values]) => values.length === 1))
  };
}

function printRoutes(routes, aliasMap, asJson) {
  const payload = getRoutesPayload(routes, aliasMap);
  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('DISCOVERED_PAGES');
  for (const item of payload.routes) {
    console.log(`- ${item.route}${item.tabBar ? ' [tabBar]' : ''} (${item.source})`);
  }
  console.log('ALIASES');
  for (const [alias, route] of Object.entries(payload.aliases)) {
    console.log(`- ${alias} -> ${route}`);
  }
}

function loadProjectContext(startPath) {
  const projectRoot = findProjectRoot(startPath);
  if (!projectRoot) {
    fail(`Could not find project.config.json from: ${startPath}`);
  }

  const projectConfigPath = path.join(projectRoot, 'project.config.json');
  const projectConfig = readJson(projectConfigPath);
  const miniprogramRoot = path.resolve(projectRoot, projectConfig.miniprogramRoot || '.');
  const appJsonPath = path.join(miniprogramRoot, 'app.json');
  if (!fileExists(appJsonPath)) {
    fail(`Mini-program app.json not found: ${appJsonPath}`);
  }

  const appJson = readJson(appJsonPath);
  const routes = discoverPages(appJson);
  const aliasMap = buildAliasMap(routes);

  return {
    appJson,
    appJsonPath,
    aliasMap,
    miniprogramRoot,
    projectConfig,
    projectConfigPath,
    projectRoot,
    routes
  };
}

module.exports = {
  buildAliasMap,
  discoverPages,
  findProjectRoot,
  getRoutesPayload,
  loadProjectContext,
  printRoutes,
  resolveRoute
};
