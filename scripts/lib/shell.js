const { spawnSync } = require('child_process');
const { fail } = require('./common');

function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || process.cwd(),
    encoding: options.encoding || undefined,
    env: options.env || process.env,
    stdio: options.stdio || 'inherit'
  });
}

function runChecked(command, args, options = {}) {
  const result = runCommand(command, args, options);
  if (result.status !== 0) {
    fail(`Command failed: ${command} ${args.join(' ')}`, result.stderr || result.stdout || '');
  }
  return result;
}

module.exports = {
  runChecked,
  runCommand
};
