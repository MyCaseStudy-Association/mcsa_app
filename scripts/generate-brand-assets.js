const fs = require('fs');
const os = require('os');
const path = require('path');
const { PNG } = require('pngjs');
const { generateImageAsync } = require('@expo/image-utils');

const root = path.resolve(__dirname, '..');
const primary = '#0F766E';
const lightBackground = '#DFF9F6';
const white = '#FFFFFF';
const accent = '#5EEAD4';
const text = '#0B2F2C';

function hexToRgba(hex, alpha = 255) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    a: alpha,
  };
}

function createPng(width, height, fill) {
  const png = new PNG({ width, height });
  const color = fill ? hexToRgba(fill) : { r: 0, g: 0, b: 0, a: 0 };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(png, x, y, color);
    }
  }

  return png;
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;

  const index = (Math.floor(y) * png.width + Math.floor(x)) * 4;
  png.data[index] = color.r;
  png.data[index + 1] = color.g;
  png.data[index + 2] = color.b;
  png.data[index + 3] = color.a;
}

function blendPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || color.a === 0) return;

  const index = (Math.floor(y) * png.width + Math.floor(x)) * 4;
  const alpha = color.a / 255;
  const inv = 1 - alpha;
  png.data[index] = Math.round(color.r * alpha + png.data[index] * inv);
  png.data[index + 1] = Math.round(color.g * alpha + png.data[index + 1] * inv);
  png.data[index + 2] = Math.round(color.b * alpha + png.data[index + 2] * inv);
  png.data[index + 3] = Math.round(255 * (alpha + (png.data[index + 3] / 255) * inv));
}

function drawCircle(png, cx, cy, radius, color) {
  const rgba = typeof color === 'string' ? hexToRgba(color) : color;
  const r2 = radius * radius;

  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) {
        blendPixel(png, x, y, rgba);
      }
    }
  }
}

function drawRoundedRect(png, x, y, width, height, radius, color) {
  const rgba = typeof color === 'string' ? hexToRgba(color) : color;
  const right = x + width;
  const bottom = y + height;

  for (let py = Math.floor(y); py < Math.ceil(bottom); py += 1) {
    for (let px = Math.floor(x); px < Math.ceil(right); px += 1) {
      const clampedX = Math.max(x + radius, Math.min(px + 0.5, right - radius));
      const clampedY = Math.max(y + radius, Math.min(py + 0.5, bottom - radius));
      const dx = px + 0.5 - clampedX;
      const dy = py + 0.5 - clampedY;
      if (dx * dx + dy * dy <= radius * radius) {
        blendPixel(png, px, py, rgba);
      }
    }
  }
}

function drawThickLine(png, x1, y1, x2, y2, thickness, color) {
  const rgba = typeof color === 'string' ? hexToRgba(color) : color;
  const radius = thickness / 2;
  const minX = Math.floor(Math.min(x1, x2) - radius);
  const maxX = Math.ceil(Math.max(x1, x2) + radius);
  const minY = Math.floor(Math.min(y1, y2) - radius);
  const maxY = Math.ceil(Math.max(y1, y2) + radius);
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const wx = x + 0.5 - x1;
      const wy = y + 0.5 - y1;
      const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
      const px = x1 + t * vx;
      const py = y1 + t * vy;
      const dx = x + 0.5 - px;
      const dy = y + 0.5 - py;
      if (dx * dx + dy * dy <= radius * radius) {
        blendPixel(png, x, y, rgba);
      }
    }
  }
}

function drawMark(png, x, y, size, options = {}) {
  const markColor = options.markColor || primary;
  const strokeColor = options.strokeColor || white;
  const showAccent = options.showAccent !== false;

  drawRoundedRect(png, x, y, size, size, size * 0.26, markColor);

  if (showAccent) {
    drawCircle(png, x + size * 0.78, y + size * 0.24, size * 0.095, hexToRgba(accent, 184));
  }

  const thickness = size * 0.115;
  drawThickLine(png, x + size * 0.23, y + size * 0.75, x + size * 0.23, y + size * 0.31, thickness, strokeColor);
  drawThickLine(png, x + size * 0.23, y + size * 0.31, x + size * 0.5, y + size * 0.58, thickness, strokeColor);
  drawThickLine(png, x + size * 0.5, y + size * 0.58, x + size * 0.77, y + size * 0.31, thickness, strokeColor);
  drawThickLine(png, x + size * 0.77, y + size * 0.31, x + size * 0.77, y + size * 0.75, thickness, strokeColor);
}

function drawGoogleG(png, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const outer = size * 0.36;
  const inner = size * 0.22;
  const colors = [
    { start: -40, end: 35, color: '#4285F4' },
    { start: 35, end: 138, color: '#EA4335' },
    { start: 138, end: 215, color: '#FBBC05' },
    { start: 215, end: 318, color: '#34A853' },
    { start: 318, end: 360, color: '#4285F4' },
  ];

  for (let py = 0; py < png.height; py += 1) {
    for (let px = 0; px < png.width; px += 1) {
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < inner || r > outer) continue;

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      const segment = colors.find((item) => angle >= item.start && angle < item.end) || colors[0];
      blendPixel(png, px, py, hexToRgba(segment.color));
    }
  }

  drawRoundedRect(png, cx, cy - size * 0.055, size * 0.31, size * 0.11, size * 0.055, '#4285F4');
  drawRoundedRect(png, cx + size * 0.17, cy - size * 0.23, size * 0.16, size * 0.21, size * 0.02, white);
}

function writePng(filePath, png) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

async function resize(source, destination, width, height, backgroundColor = 'transparent') {
  const result = await generateImageAsync(
    { projectRoot: root },
    {
      src: source,
      name: path.basename(destination),
      resizeMode: 'contain',
      backgroundColor,
      width,
      height,
    }
  );
  fs.writeFileSync(destination, result.source);
}

async function main() {
  const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcsa-assets-'));

  const app = createPng(1024, 1024, lightBackground);
  drawMark(app, 152, 152, 720);
  writePng(path.join(root, 'assets', 'icons', 'app-icon.png'), app);

  const background = createPng(1024, 1024, lightBackground);
  writePng(path.join(root, 'assets', 'icons', 'adaptive-icon-background.png'), background);

  const foreground = createPng(1024, 1024);
  drawMark(foreground, 222, 222, 580);
  writePng(path.join(root, 'assets', 'icons', 'adaptive-icon-foreground.png'), foreground);

  const monochrome = createPng(1024, 1024);
  drawMark(monochrome, 222, 222, 580, { markColor: text, strokeColor: white, showAccent: false });
  writePng(path.join(root, 'assets', 'icons', 'adaptive-icon-monochrome.png'), monochrome);

  const mark = createPng(512, 512);
  drawMark(mark, 48, 48, 416);
  const markSource = path.join(sourceDir, 'mcsa-mark-source.png');
  writePng(markSource, mark);

  await resize(markSource, path.join(root, 'assets', 'images', 'mcsa-mark.png'), 256, 256);
  await resize(markSource, path.join(root, 'assets', 'icons', 'splash-icon.png'), 256, 256);
  await resize(path.join(root, 'assets', 'icons', 'app-icon.png'), path.join(root, 'assets', 'icons', 'favicon.png'), 64, 64, lightBackground);

  const google = createPng(192, 192);
  drawGoogleG(google, 0, 0, 192);
  const googleSource = path.join(sourceDir, 'google-g-source.png');
  writePng(googleSource, google);
  await resize(googleSource, path.join(root, 'assets', 'images', 'google-g.png'), 96, 96);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
