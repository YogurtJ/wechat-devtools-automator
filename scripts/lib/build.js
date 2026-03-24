const path = require('path');
const { fail, fileExists } = require('./common');
const { runChecked } = require('./shell');

function maybeBuild(projectRoot, cliPath) {
  const buildScript = path.join(projectRoot, 'scripts', 'mp_build_npm.sh');
  if (fileExists(buildScript)) {
    runChecked('bash', [buildScript], { cwd: projectRoot });
    return 'script';
  }

  runChecked(cliPath, ['build-npm', '--project', projectRoot], { cwd: projectRoot });
  return 'cli';
}

module.exports = {
  maybeBuild
};
