// Generates PWA icons from an SVG.
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, "../public");
mkdirSync(out, { recursive: true });

// Glyph: stylized "⟁" (warframe-ish lotus angle) on dark background
const svg = (size, maskable = false) => {
  const padding = maskable ? size * 0.2 : size * 0.12;
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
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${maskable ? 0 : size * 0.18}"/>
  <g transform="translate(${cx} ${cy})">
    <polygon points="0,${-r * 0.85} ${r * 0.55},${r * 0.45} ${-r * 0.55},${r * 0.45}" fill="url(#lotus)" opacity="0.95"/>
    <polygon points="0,${-r * 0.45} ${r * 0.30},${r * 0.25} ${-r * 0.30},${r * 0.25}" fill="#0b0f14"/>
    <circle cx="0" cy="${r * 0.12}" r="${r * 0.10}" fill="#7be0c2"/>
  </g>
</svg>`;
};

async function emit(size, name, maskable = false) {
  const buf = await sharp(Buffer.from(svg(size, maskable)))
    .png()
    .toBuffer();
  writeFileSync(resolve(out, name), buf);
  console.log(`  ${name} (${size}x${size})`);
}

console.log("Generating PWA icons...");
await emit(192, "icon-192.png");
await emit(512, "icon-512.png");
await emit(512, "icon-maskable-512.png", true);
await emit(180, "apple-touch-icon.png");
await emit(32, "favicon-32.png");
console.log("Done.");
