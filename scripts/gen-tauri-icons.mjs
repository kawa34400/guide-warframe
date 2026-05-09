// Generates Tauri-compatible icons from the existing PWA SVG glyph.
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, "../src-tauri/icons");
mkdirSync(out, { recursive: true });

// Re-use the same lotus glyph as PWA icons
const svg = (size) => {
  const padding = size * 0.12;
  const inner = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const r = inner / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#131a23"/>
      <stop offset="100%" stop-color="#0b0f14"/>
    </linearGradient>
    <linearGradient id="lotus" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7be0c2"/>
      <stop offset="100%" stop-color="#5fb3ff"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.18}"/>
  <g transform="translate(${cx} ${cy})">
    <polygon points="0,${-r * 0.85} ${r * 0.55},${r * 0.45} ${-r * 0.55},${r * 0.45}" fill="url(#lotus)" opacity="0.95"/>
    <polygon points="0,${-r * 0.45} ${r * 0.30},${r * 0.25} ${-r * 0.30},${r * 0.25}" fill="#0b0f14"/>
    <circle cx="0" cy="${r * 0.12}" r="${r * 0.10}" fill="#7be0c2"/>
  </g>
</svg>`;
};

async function emitPng(size, name) {
  const buf = await sharp(Buffer.from(svg(size))).png().toBuffer();
  writeFileSync(resolve(out, name), buf);
  console.log(`  ${name} (${size}x${size})`);
}

console.log("Generating Tauri icons...");
await emitPng(32, "32x32.png");
await emitPng(128, "128x128.png");
await emitPng(256, "128x128@2x.png");
await emitPng(512, "icon.png");

// .ico for Windows: package multiple sizes into one ICO
// sharp doesn't write .ico directly, so we'll rely on icon.png for now
// and use a convertor in CI, OR write a simple ICO with one size.
// Actually let's just bundle the 256x256 PNG-as-ICO (Windows accepts modern PNG-in-ICO).
import { Buffer as Buf } from "node:buffer";

async function emitIco() {
  // Build a minimal ICO container with a single 256x256 PNG entry (Vista+).
  const png = await sharp(Buffer.from(svg(256))).png().toBuffer();
  const ico = Buf.alloc(6 + 16);
  // ICONDIR
  ico.writeUInt16LE(0, 0); // reserved
  ico.writeUInt16LE(1, 2); // type 1 = icon
  ico.writeUInt16LE(1, 4); // count
  // ICONDIRENTRY
  ico.writeUInt8(0, 6); // width 0 = 256
  ico.writeUInt8(0, 7); // height 0 = 256
  ico.writeUInt8(0, 8); // colors (0 = palette unused)
  ico.writeUInt8(0, 9); // reserved
  ico.writeUInt16LE(1, 10); // color planes
  ico.writeUInt16LE(32, 12); // bits per pixel
  ico.writeUInt32LE(png.length, 14); // size of bytes
  ico.writeUInt32LE(22, 18); // offset to data
  const final = Buf.concat([ico, png]);
  writeFileSync(resolve(out, "icon.ico"), final);
  console.log(`  icon.ico (PNG-in-ICO 256)`);
}
await emitIco();

console.log("Done.");
