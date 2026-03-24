const path = require('path');
const fs = require('fs');
const { ensureDirFor, fail, fileExists } = require('./common');
const { runChecked } = require('./shell');

function guiMode() {
  return process.env.WECHAT_DEVTOOLS_GUI_MODE || 'simulator';
}

function parseImageSize(imagePath) {
  const ffprobe = runChecked(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'csv=p=0:s=x',
      imagePath
    ],
    { encoding: 'utf8', stdio: 'pipe' }
  );
  const raw = String(ffprobe.stdout || '').trim();
  const [widthText, heightText] = raw.split('x');
  const width = Number(widthText);
  const height = Number(heightText);

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    fail(`Could not determine GUI screenshot size for ${imagePath}`);
  }

  return { height, width };
}

function parseCropRatios() {
  const raw = process.env.WECHAT_DEVTOOLS_SIMULATOR_CROP || '0.585,0.104,0.228,0.795';
  const parts = raw.split(',').map((item) => Number(item.trim()));
  if (parts.length !== 4 || parts.some((item) => !Number.isFinite(item) || item < 0 || item > 1)) {
    fail(`Invalid WECHAT_DEVTOOLS_SIMULATOR_CROP: ${raw}`);
  }
  return {
    heightRatio: parts[3],
    widthRatio: parts[2],
    xRatio: parts[0],
    yRatio: parts[1]
  };
}

function maybeCropSimulator(fullWindowPath, outputPath) {
  if (process.platform !== 'darwin') {
    return path.resolve(fullWindowPath);
  }

  if (guiMode() === 'window') {
    return path.resolve(fullWindowPath);
  }

  try {
    const { width, height } = parseImageSize(fullWindowPath);
    const ratios = parseCropRatios();
    const cropWidth = Math.max(100, Math.round(width * ratios.widthRatio));
    const cropHeight = Math.max(100, Math.round(height * ratios.heightRatio));
    const cropX = Math.max(0, Math.round(width * ratios.xRatio));
    const cropY = Math.max(0, Math.round(height * ratios.yRatio));

    runChecked(
      'ffmpeg',
      [
        '-y',
        '-i',
        fullWindowPath,
        '-vf',
        `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`,
        '-frames:v',
        '1',
        outputPath
      ],
      { encoding: 'utf8', stdio: 'pipe' }
    );
    if (path.resolve(fullWindowPath) !== path.resolve(outputPath) && fs.existsSync(fullWindowPath)) {
      fs.unlinkSync(fullWindowPath);
    }
    return path.resolve(outputPath);
  } catch {
    return path.resolve(fullWindowPath);
  }
}

function captureGuiScreenshot(outputPath) {
  const helper = process.env.CODEX_SCREENSHOT_HELPER || path.join(process.env.HOME || '', '.codex/skills/screenshot/scripts/take_screenshot.py');
  const appName = process.env.WECHAT_DEVTOOLS_APP_NAME || '微信开发者工具';
  const rawOutputPath = guiMode() === 'window'
    ? outputPath
    : outputPath.replace(/\.png$/i, '-window.png');

  if (!fileExists(helper)) {
    fail(`GUI screenshot helper not found: ${helper}`);
  }

  ensureDirFor(rawOutputPath);
  const result = runChecked(
    'python3',
    [helper, '--app', appName, '--path', rawOutputPath],
    { encoding: 'utf8', stdio: 'pipe' }
  );
  const lines = String(result.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return maybeCropSimulator(path.resolve(rawOutputPath), path.resolve(outputPath));
  }

  if (lines.length === 1) {
    const fullWindowPath = path.resolve(lines[0]);
    return maybeCropSimulator(fullWindowPath, path.resolve(outputPath));
  }

  return lines.map((item, index) => {
    const fullWindowPath = path.resolve(item);
    const candidatePath = index === 0
      ? path.resolve(outputPath)
      : path.resolve(outputPath.replace(/\.png$/i, `-${index + 1}.png`));
    return maybeCropSimulator(fullWindowPath, candidatePath);
  });
}

module.exports = {
  captureGuiScreenshot
};
