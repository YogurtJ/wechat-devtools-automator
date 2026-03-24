const os = require('os');
const path = require('path');
const { ensureDir, slugify, timestamp } = require('./common');

function withPathSuffix(filePath, suffix) {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}-${suffix}${parsed.ext || '.png'}`);
}

function buildPageCapturePlan(outputPath, scrollPositions) {
  if (!scrollPositions.length) {
    return [{ scrollTop: null, path: outputPath }];
  }

  return scrollPositions.map((scrollTop, index) => ({
    scrollTop,
    path: withPathSuffix(
      outputPath,
      scrollTop === 0 ? 'top' : `y${scrollTop || index}`
    )
  }));
}

function defaultArtifactDir(projectRoot, route, mode) {
  const routeSlug = slugify(route || 'home');
  return path.join(projectRoot, 'output', 'wechat-devtools-automator', `${timestamp()}-${slugify(mode)}-${routeSlug}`);
}

function buildArtifactPaths({
  artifactDir,
  captureGui,
  capturePage,
  guiOutput,
  output
}) {
  ensureDir(artifactDir);

  return {
    artifactDir,
    guiOutput: captureGui ? path.resolve(guiOutput || path.join(artifactDir, 'gui.png')) : null,
    output: capturePage ? path.resolve(output || path.join(artifactDir, 'page.png')) : null,
    reportPath: path.resolve(path.join(artifactDir, 'report.json'))
  };
}

function tempArtifactDir(prefix = 'wechat-devtools-automator') {
  return path.join(os.tmpdir(), `${prefix}-${timestamp()}`);
}

module.exports = {
  buildArtifactPaths,
  buildPageCapturePlan,
  defaultArtifactDir,
  tempArtifactDir,
  withPathSuffix
};
