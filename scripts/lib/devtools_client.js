const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { compareVersions, delay, ensureDirFor, fail, fileExists } = require('./common');

function resolveCliPath(explicitCliPath) {
  if (explicitCliPath) {
    return explicitCliPath;
  }

  if (process.env.WECHAT_DEVTOOLS_CLI) {
    return process.env.WECHAT_DEVTOOLS_CLI;
  }

  const appRoot = process.env.WECHAT_DEVTOOLS_APP
    || (process.platform === 'darwin'
      ? '/Applications/wechatwebdevtools.app'
      : 'C:/Program Files (x86)/Tencent/微信web开发者工具');

  if (process.platform === 'win32') {
    return path.join(appRoot, 'cli.bat');
  }

  return path.join(appRoot, 'Contents', 'MacOS', 'cli');
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}

function allocateEphemeralPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = address && typeof address === 'object' ? address.port : null;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function resolvePort(preferredPort) {
  if (preferredPort) {
    const available = await isPortFree(preferredPort);
    if (!available) {
      fail(`Port ${preferredPort} is already in use`);
    }
    return preferredPort;
  }

  return allocateEphemeralPort();
}

async function websocketText(event) {
  if (typeof event.data === 'string') {
    return event.data;
  }

  if (event.data && typeof event.data.text === 'function') {
    return event.data.text();
  }

  if (event.data instanceof ArrayBuffer) {
    return Buffer.from(event.data).toString('utf8');
  }

  return String(event.data || '');
}

class RpcConnection {
  constructor(socket) {
    this.listeners = new Map();
    this.pending = new Map();
    this.socket = socket;

    socket.addEventListener('message', async (event) => {
      const raw = await websocketText(event);
      const message = JSON.parse(raw);
      const { id, method, error, result, params } = message;

      if (!id) {
        this.emitEvent(method, params);
        return;
      }

      const callbacks = this.pending.get(id);
      if (!callbacks) {
        return;
      }

      this.pending.delete(id);
      if (error) {
        callbacks.reject(new Error(error.message || String(error)));
        return;
      }
      callbacks.resolve(result);
    });

    socket.addEventListener('close', () => {
      for (const callbacks of this.pending.values()) {
        callbacks.reject(new Error('Connection closed'));
      }
      this.pending.clear();
    });

    socket.addEventListener('error', (event) => {
      const error = event.error || new Error('WebSocket error');
      for (const callbacks of this.pending.values()) {
        callbacks.reject(error);
      }
      this.pending.clear();
    });
  }

  emitEvent(method, params) {
    const listeners = this.listeners.get(method) || [];
    for (const listener of listeners) {
      try {
        listener(params);
      } catch {
        // ignore listener failures
      }
    }
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}) {
    const id = crypto.randomUUID();
    const payload = JSON.stringify({ id, method, params });

    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
      try {
        this.socket.send(payload);
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }

  close() {
    try {
      this.socket.close();
    } catch {
      return;
    }
  }

  static async connect(wsUrl, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        try {
          socket.close();
        } catch {
          return;
        }
        reject(new Error(`Timed out connecting to ${wsUrl}`));
      }, timeoutMs);

      socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve(new RpcConnection(socket));
      });

      socket.addEventListener('error', (event) => {
        clearTimeout(timer);
        reject(event.error || new Error(`Failed connecting to ${wsUrl}`));
      });
    });
  }
}

class ElementHandle {
  constructor(connection, elementId, pageId, tagName) {
    this.connection = connection;
    this.elementId = elementId;
    this.pageId = pageId;
    this.tagName = tagName || '';
  }

  send(method, params = {}) {
    return this.connection.send(method, {
      ...params,
      elementId: this.elementId,
      pageId: this.pageId
    });
  }

  async outerWxml() {
    const { wxml } = await this.send('Element.getWXML', { type: 'outer' });
    return wxml;
  }

  async size() {
    const { properties } = await this.send('Element.getDOMProperties', {
      names: ['offsetWidth', 'offsetHeight']
    });
    return {
      height: properties[1],
      width: properties[0]
    };
  }

  async callFunction(functionName, ...args) {
    const { result } = await this.send('Element.callFunction', {
      args,
      functionName
    });
    return result;
  }

  async scrollHeight() {
    return this.callFunction('scroll-view.scrollHeight');
  }

  async scrollTo(left, top) {
    return this.callFunction('scroll-view.scrollTo', left, top);
  }

  async tap() {
    await this.send('Element.tap');
  }

  async touchstart(options = {}) {
    await this.send('Element.touchstart', options);
  }

  async touchend(options = {}) {
    await this.send('Element.touchend', options);
  }

  async longpress() {
    await this.touchstart();
    await delay(350);
    await this.touchend();
  }

  async trigger(eventName, detail) {
    const payload = { type: eventName };
    if (detail !== undefined) {
      payload.detail = detail;
    }
    await this.send('Element.triggerEvent', payload);
  }

  async input(value) {
    if (this.tagName !== 'input' && this.tagName !== 'textarea') {
      fail(`Element ${this.tagName || '(unknown)'} does not support input()`);
    }
    await this.callFunction(`${this.tagName}.input`, value);
  }
}

class PageHandle {
  constructor(connection, pageId, pathName, query) {
    this.connection = connection;
    this.id = pageId;
    this.path = pathName;
    this.query = query || {};
  }

  send(method, params = {}) {
    return this.connection.send(method, {
      ...params,
      pageId: this.id
    });
  }

  async waitFor(ms) {
    await delay(ms);
  }

  async $(selector) {
    try {
      const result = await this.send('Page.getElement', { selector });
      return new ElementHandle(this.connection, result.elementId, this.id, result.tagName);
    } catch {
      return null;
    }
  }

  async $$(selector) {
    const result = await this.send('Page.getElements', { selector });
    return (result.elements || []).map((item) => new ElementHandle(this.connection, item.elementId, this.id, item.tagName));
  }
}

class DevtoolsSession {
  constructor(connection, meta) {
    this.consoleEvents = [];
    this.connection = connection;
    this.meta = meta;

    this.connection.on('App.logAdded', (params) => {
      this.consoleEvents.push({
        kind: 'console',
        params,
        timestamp: Date.now()
      });
    });

    this.connection.on('App.exceptionThrown', (params) => {
      this.consoleEvents.push({
        kind: 'exception',
        params,
        timestamp: Date.now()
      });
    });
  }

  async getInfo() {
    return this.connection.send('Tool.getInfo');
  }

  async checkVersion(minSdkVersion = '2.7.3') {
    const info = await this.getInfo();
    if (info.SDKVersion && info.SDKVersion !== 'dev' && compareVersions(info.SDKVersion, minSdkVersion) < 0) {
      fail(`SDKVersion ${info.SDKVersion} is below required ${minSdkVersion}`);
    }
    return info;
  }

  async callWxMethod(method, ...args) {
    const result = await this.connection.send('App.callWxMethod', { args, method });
    return result.result;
  }

  async enableConsoleCapture() {
    try {
      await this.connection.send('App.enableLog');
      return true;
    } catch {
      return false;
    }
  }

  async currentPage() {
    const page = await this.connection.send('App.getCurrentPage');
    return new PageHandle(this.connection, page.pageId, page.path, page.query);
  }

  async open(url, method) {
    await this.callWxMethod(method, { url });
    await delay(3000);
    return this.currentPage();
  }

  async evaluate(appFunction, ...args) {
    const functionDeclaration = typeof appFunction === 'function'
      ? appFunction.toString()
      : String(appFunction);
    const result = await this.connection.send('App.callFunction', {
      args,
      functionDeclaration
    });
    return result.result;
  }

  async pageScrollTo(scrollTop) {
    await this.callWxMethod('pageScrollTo', { duration: 0, scrollTop });
  }

  async screenshot(options = {}) {
    const result = await this.connection.send('App.captureScreenshot');
    if (options.path) {
      ensureDirFor(options.path);
      fs.writeFileSync(options.path, result.data, 'base64');
      return path.resolve(options.path);
    }
    return result.data;
  }

  async close() {
    try {
      await this.connection.send('App.exit');
      await delay(1000);
    } catch {
      // ignore close race
    }

    try {
      await this.connection.send('Tool.close');
    } catch {
      // ignore close race
    }

    this.connection.close();
  }

  getConsoleEvents(limit = 50) {
    return this.consoleEvents.slice(-limit);
  }
}

async function waitForConnection(port, timeoutMs) {
  const wsUrl = `ws://127.0.0.1:${port}`;
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await RpcConnection.connect(wsUrl, 2000);
    } catch (error) {
      lastError = error;
      await delay(700);
    }
  }

  throw lastError || new Error(`Timed out waiting for ${wsUrl}`);
}

async function launchSession(options) {
  const cliPath = resolveCliPath(options.cliPath);
  if (!fileExists(cliPath)) {
    fail(`WeChat DevTools CLI not found: ${cliPath}`);
  }
  if (!options.projectPath) {
    fail('projectPath is required');
  }

  const projectPath = path.resolve(options.projectPath);
  if (!fileExists(projectPath)) {
    fail(`Project path does not exist: ${projectPath}`);
  }

  const port = await resolvePort(options.port);
  const args = ['auto', '--project', projectPath, '--auto-port', String(port)];
  if (options.trustProject !== false) {
    args.push('--trust-project');
  }

  const child = spawn(cliPath, args, {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();

  const connection = await waitForConnection(port, options.timeoutMs || 30000);
  const session = new DevtoolsSession(connection, {
    cliPath,
    pid: child.pid,
    port,
    projectPath
  });
  await session.checkVersion(options.minSdkVersion || '2.7.3');
  await session.enableConsoleCapture();
  return session;
}

module.exports = {
  launchSession,
  resolveCliPath
};
