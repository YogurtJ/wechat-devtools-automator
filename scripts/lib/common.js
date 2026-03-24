const fs = require('fs');
const path = require('path');

function fail(message, extra) {
  const error = new Error(message);
  if (extra !== undefined) {
    error.detail = extra;
  }
  throw error;
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(filePath, { recursive: true });
}

function ensureDirFor(filePath) {
  ensureDir(path.dirname(filePath));
}

function normalizeRoute(route) {
  return String(route || '').replace(/^\/+/, '').trim();
}

function parseNumberLike(value) {
  const parsed = Number(String(value || '').replace(/px$/i, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function snippet(text, maxLength = 120) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function timestamp(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/^[./\\]+/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default';
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function compareVersions(left, right) {
  const leftParts = String(left || '')
    .split('.')
    .map((part) => Number(part) || 0);
  const rightParts = String(right || '')
    .split('.')
    .map((part) => Number(part) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;
    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }
  return 0;
}

module.exports = {
  compareVersions,
  delay,
  ensureDir,
  ensureDirFor,
  fail,
  fileExists,
  normalizeRoute,
  parseNumberLike,
  readJson,
  slugify,
  snippet,
  timestamp
};
