const { fail } = require('./common');

function parseInputSpec(spec) {
  const marker = '::';
  const splitIndex = String(spec || '').indexOf(marker);
  if (splitIndex < 0) {
    fail(`Input action must use "<selector>::<value>" syntax, got: ${spec}`);
  }

  return {
    selector: spec.slice(0, splitIndex).trim(),
    value: spec.slice(splitIndex + marker.length)
  };
}

function parseTriggerSpec(spec) {
  const parts = String(spec || '').split('::');
  if (parts.length < 2) {
    fail(`Trigger action must use "<selector>::<eventName>[::jsonDetail]" syntax, got: ${spec}`);
  }

  let detail = undefined;
  if (parts[2]) {
    try {
      detail = JSON.parse(parts.slice(2).join('::'));
    } catch (error) {
      fail(`Trigger detail must be valid JSON in: ${spec}`, error.message || String(error));
    }
  }

  return {
    detail,
    eventName: parts[1].trim(),
    selector: parts[0].trim()
  };
}

function parseActionSpec(spec) {
  const token = String(spec || '').trim();
  const colonIndex = token.indexOf(':');
  if (colonIndex < 0) {
    fail(`Action must use "<type>:<payload>" syntax, got: ${token}`);
  }

  const action = token.slice(0, colonIndex).trim();
  const payload = token.slice(colonIndex + 1);

  switch (action) {
    case 'tap':
    case 'longpress':
      return { selector: payload.trim(), type: action };
    case 'wait':
      return { ms: Number(payload.trim()), type: action };
    case 'input': {
      const parsed = parseInputSpec(payload);
      return { ...parsed, type: action };
    }
    case 'trigger': {
      const parsed = parseTriggerSpec(payload);
      return { ...parsed, type: action };
    }
    default:
      fail(`Unsupported action type: ${action}`);
  }
}

function collectActions(args) {
  const actions = [];

  for (const selector of args.taps || []) {
    actions.push({ selector: selector.trim(), type: 'tap' });
  }
  for (const selector of args.longPresses || []) {
    actions.push({ selector: selector.trim(), type: 'longpress' });
  }
  for (const spec of args.inputs || []) {
    actions.push({ ...parseInputSpec(spec), type: 'input' });
  }
  for (const spec of args.triggers || []) {
    actions.push({ ...parseTriggerSpec(spec), type: 'trigger' });
  }
  for (const spec of args.actions || []) {
    actions.push(parseActionSpec(spec));
  }

  return actions;
}

async function requireElement(page, selector) {
  const element = await page.$(selector);
  if (!element) {
    fail(`Could not find element for selector: ${selector}`);
  }
  return element;
}

async function executeActions({ actionWait, initialPage, session, actions }) {
  let page = initialPage;
  const results = [];

  for (const action of actions) {
    switch (action.type) {
      case 'tap': {
        const element = await requireElement(page, action.selector);
        await element.tap();
        results.push({ selector: action.selector, type: action.type });
        break;
      }
      case 'longpress': {
        const element = await requireElement(page, action.selector);
        await element.longpress();
        results.push({ selector: action.selector, type: action.type });
        break;
      }
      case 'input': {
        const element = await requireElement(page, action.selector);
        await element.input(action.value);
        results.push({ selector: action.selector, type: action.type, value: action.value });
        break;
      }
      case 'trigger': {
        const element = await requireElement(page, action.selector);
        await element.trigger(action.eventName, action.detail);
        results.push({
          detail: action.detail,
          eventName: action.eventName,
          selector: action.selector,
          type: action.type
        });
        break;
      }
      case 'wait': {
        if (!Number.isFinite(action.ms) || action.ms < 0) {
          fail(`wait action requires a non-negative number, got: ${action.ms}`);
        }
        await page.waitFor(action.ms);
        results.push({ ms: action.ms, type: action.type });
        break;
      }
      default:
        fail(`Unknown action type: ${action.type}`);
    }

    await page.waitFor(actionWait);
    page = await session.currentPage();
  }

  return { actions: results, page };
}

module.exports = {
  collectActions,
  executeActions
};
