const fs = require('fs');
const os = require('os');
const path = require('path');
const { delay, fail } = require('./common');

const LOCK_PATH = path.join(os.tmpdir(), 'wechat-devtools-automator.lock');

async function acquireSessionLock(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const handle = fs.openSync(LOCK_PATH, 'wx');
      fs.writeFileSync(handle, String(process.pid), 'utf8');
      return () => {
        try {
          fs.closeSync(handle);
        } catch {
          // ignore
        }
        try {
          fs.unlinkSync(LOCK_PATH);
        } catch {
          // ignore
        }
      };
    } catch (error) {
      if (error && error.code !== 'EEXIST') {
        fail(`Failed to acquire DevTools session lock: ${error.message || String(error)}`);
      }
      await delay(700);
    }
  }

  fail(`Timed out waiting for WeChat DevTools lock: ${LOCK_PATH}`);
}

module.exports = {
  acquireSessionLock
};
