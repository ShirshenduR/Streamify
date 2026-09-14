/**
 * Generates the PWA icon set and the social preview card.
 *
 * Everything is rasterised here with the built-in zlib encoder: no image
 * dependency, no network, and the output is deterministic so re-running it never
 * produces a spurious diff.
 *
 * The Streamify mark is described in public/streamify-logo.svg as a single path in
 * a 176x211 viewBox. Every command in that path is an axis-aligned H or V, so the
 * shape is exactly the union of two rectangles, which is trivial to rasterise.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, "../public");
const iconsDir = resolve(publicDir, "icons");

/* ------------------------------------------------------------------- brand -- */

const BRAND_FROM = [168, 85, 247]; // violet-500
const BRAND_TO = [217, 70, 239]; // fuchsia-500
const BG_TOP = [24, 17, 40];
const BG_BOTTOM = [8, 8, 11];
const GLOW = [139, 92, 246];

/* -------------------------------------------------------------------- mark -- */

const MARK = [
  { x0: 88, x1: 175.75, y0: 0.083, y1: 140.639 },
  { x0: 0.25, x1: 88, y0: 70.361, y1: 210.917 },
];
const MARK_W = 176;
const MARK_H = 211;

/* --------------------------------------------------------------- encoding --- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- rendering --- */

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function renderIcon({ width, height = width, markRatio, cornerRatio = 0, opaqueGround = false }) {
  const rgba = Buffer.alloc(width * height * 4);
  const markH = height * markRatio;
  const markW = markH * (MARK_W / MARK_H);
  const markX = (width - markW) / 2;
  const markY = (height - markH) / 2;
  const radius = Math.min(width, height) * cornerRatio;
  const samples = 3;
  const total = samples * samples;
  const glowRadius = Math.max(width, height) * 0.75;

  const insideShape = (x, y) => {
    if (radius <= 0) return true;
    const nearestX = Math.min(Math.max(x, radius), width - radius);
    const nearestY = Math.min(Math.max(y, radius), height - radius);
    const dx = x - nearestX;
    const dy = y - nearestY;
    return dx * dx + dy * dy <= radius * radius;
  };

  const insideMark = (x, y) => {
    const mx = ((x - markX) / markW) * MARK_W;
    const my = ((y - markY) / markH) * MARK_H;
    return MARK.some((rect) => mx >= rect.x0 && mx <= rect.x1 && my >= rect.y0 && my <= rect.y1);
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let shapeCoverage = 0;
      let markCoverage = 0;

      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          if (opaqueGround || insideShape(px, py)) shapeCoverage += 1;
          if (insideMark(px, py)) markCoverage += 1;
        }
      }

      shapeCoverage /= total;
      markCoverage /= total;

      const cx = x + 0.5 - width / 2;
      const cy = y + 0.5 - height * 0.42;
      const distance = Math.sqrt(cx * cx + cy * cy);
      const glow = clamp01(1 - distance / glowRadius);

      let color = mix(BG_TOP, BG_BOTTOM, y / height);
      color = mix(color, GLOW, 0.22 * glow);

      if (markCoverage > 0) {
        const markT = clamp01((y - markY) / markH);
        const markColor = mix(BRAND_FROM, BRAND_TO, markT);
        color = mix(color, markColor, markCoverage);
      }

      const offset = (y * width + x) * 4;
      rgba[offset] = Math.round(color[0]);
      rgba[offset + 1] = Math.round(color[1]);
      rgba[offset + 2] = Math.round(color[2]);
      rgba[offset + 3] = Math.round(shapeCoverage * 255);
    }
  }

  return encodePng(width, height, rgba);
}

/* ------------------------------------------------------------------ output -- */

mkdirSync(iconsDir, { recursive: true });

const targets = [
  // name, options
  ["icons/icon-192.png", { width: 192, markRatio: 0.5, cornerRatio: 0.22 }],
  ["icons/icon-512.png", { width: 512, markRatio: 0.5, cornerRatio: 0.22 }],
  // Android maskable: full bleed, mark kept inside the 80% safe zone.
  ["icons/maskable-512.png", { width: 512, markRatio: 0.37, opaqueGround: true }],
  // iOS applies its own mask and ignores transparency.
  ["icons/apple-touch-icon.png", { width: 180, markRatio: 0.46, opaqueGround: true }],
  ["icons/favicon-48.png", { width: 48, markRatio: 0.58, cornerRatio: 0.22 }],
  ["og.png", { width: 1200, height: 630, markRatio: 0.34, opaqueGround: true }],
];

for (const [relativePath, options] of targets) {
  const file = resolve(publicDir, relativePath);
  mkdirSync(dirname(file), { recursive: true });
  const png = renderIcon(options);
  writeFileSync(file, png);
  console.log(`${relativePath} — ${(png.length / 1024).toFixed(1)} kB`);
}
