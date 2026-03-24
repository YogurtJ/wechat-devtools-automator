const { fail, parseNumberLike, snippet } = require('./common');

function parseScrollPositions(args) {
  if (args.scrollY) {
    const values = String(args.scrollY)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item));
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      fail('--scroll-y must contain non-negative numbers');
    }
    return values;
  }

  if (args.scrollStep !== undefined || args.scrollCaptures !== undefined) {
    const step = args.scrollStep !== undefined ? args.scrollStep : 900;
    const captures = args.scrollCaptures !== undefined ? args.scrollCaptures : 2;
    const values = [];
    for (let index = 0; index < captures; index += 1) {
      values.push(step * index);
    }
    return values;
  }

  return [];
}

function parseOpenTagAttributes(wxml) {
  const openTagMatch = String(wxml || '').match(/^<([a-zA-Z0-9-]+)\s*([^>]*)>/);
  const attrsText = openTagMatch?.[2] || '';
  const classMatch = attrsText.match(/\bclass\s*=\s*["']([^"']+)["']/);
  const idMatch = attrsText.match(/\bid\s*=\s*["']([^"']+)["']/);

  return {
    attrsText,
    className: classMatch?.[1] || '',
    horizontal: /\bscroll-x\b/.test(attrsText),
    id: idMatch?.[1] || '',
    vertical: /\bscroll-y\b/.test(attrsText)
  };
}

function scoreScrollCandidate(candidate) {
  let score = 0;

  if (candidate.vertical) {
    score += 600;
  }
  if (candidate.horizontal) {
    score -= 250;
  }
  if (candidate.scrollHeight > candidate.height + 24) {
    score += 700;
  }
  score += Math.min(candidate.width * candidate.height, 500000) / 4000;
  score += Math.min(Math.max(candidate.scrollHeight - candidate.height, 0), 3000) / 12;
  if (/(main|content|body|list|feed|products?|orders?|detail|scroll)/i.test(candidate.className)) {
    score += 100;
  }
  if (/(sidebar|side|nav|tabs?|strip|chip)/i.test(candidate.className)) {
    score -= 140;
  }

  return score;
}

async function describeScrollElement(element, index) {
  let outer = '';
  let size = { width: '0', height: '0' };
  let scrollHeight = 0;

  try {
    outer = await element.outerWxml();
  } catch {
    outer = '';
  }

  try {
    size = await element.size();
  } catch {
    size = { width: '0', height: '0' };
  }

  try {
    scrollHeight = parseNumberLike(await element.scrollHeight());
  } catch {
    scrollHeight = 0;
  }

  const attrs = parseOpenTagAttributes(outer);
  const candidate = {
    className: attrs.className,
    element,
    height: parseNumberLike(size.height),
    horizontal: attrs.horizontal,
    id: attrs.id,
    index,
    preview: snippet(outer),
    scrollHeight,
    vertical: attrs.vertical,
    width: parseNumberLike(size.width)
  };
  candidate.score = scoreScrollCandidate(candidate);
  return candidate;
}

async function listAutoScrollCandidates(page) {
  let elements = [];

  try {
    elements = await page.$$('scroll-view');
  } catch {
    elements = [];
  }

  const candidates = [];
  for (let index = 0; index < elements.length; index += 1) {
    candidates.push(await describeScrollElement(elements[index], index));
  }
  return candidates;
}

async function resolveExplicitScrollSelector(page, selector) {
  let element = null;

  try {
    element = await page.$(selector);
  } catch {
    element = null;
  }

  if (!element) {
    fail(`Could not find scroll selector: ${selector}`);
  }

  const candidate = await describeScrollElement(element, 0);
  candidate.mode = 'selector';
  candidate.selector = selector;
  return candidate;
}

async function chooseScrollController(page, args) {
  if (args.scrollSelector) {
    return resolveExplicitScrollSelector(page, args.scrollSelector);
  }

  if (args.scrollTarget === 'page') {
    return { mode: 'page' };
  }

  const candidates = await listAutoScrollCandidates(page);
  const sorted = candidates.slice().sort((left, right) => right.score - left.score);
  const winner = sorted.find((candidate) => candidate.vertical && candidate.scrollHeight > candidate.height + 24);

  if (args.scrollDebug && sorted.length) {
    for (const candidate of sorted) {
      console.log(
        `SCROLL_CANDIDATE index=${candidate.index} score=${candidate.score.toFixed(1)} vertical=${candidate.vertical} horizontal=${candidate.horizontal} size=${candidate.width}x${candidate.height} scrollHeight=${candidate.scrollHeight} class=${candidate.className || '-'} id=${candidate.id || '-'} preview=${candidate.preview || '-'}`
      );
    }
  }

  if (winner) {
    winner.mode = 'inner-auto';
    return winner;
  }

  if (args.scrollTarget === 'inner') {
    fail('Could not auto-detect a vertical inner scroll container');
  }

  return { candidates: sorted, mode: 'page' };
}

async function applyScroll(controller, session, scrollTop) {
  if (!controller || scrollTop === null) {
    return;
  }

  if (controller.mode === 'page') {
    await session.pageScrollTo(scrollTop);
    return;
  }

  await controller.element.scrollTo(0, scrollTop);
}

module.exports = {
  applyScroll,
  chooseScrollController,
  parseScrollPositions
};
