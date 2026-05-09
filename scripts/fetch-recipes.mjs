// Fetches all weapon crafting recipes from warframestat /weapons,
// extracts pairs where one weapon is a prerequisite component of another,
// and writes src/data/construction.json.
// Uses uniqueName for deduplication to avoid EN/FR name mismatches.

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outFile = resolve(root, "src/data/construction.json");

const SECTIONS = {
  Primary: "Principales",
  Secondary: "Secondaires",
  Melee: "Mélée",
  "Arch-Gun": "Arch-Gun",
  "Arch-Melee": "Arch-Mélée",
};

function isWeapon(component) {
  if (!component.productCategory) return false;
  if (component.name === "Blueprint") return false;
  if (component.type === "Resource") return false;
  return true;
}

function sectionFor(category) {
  return SECTIONS[category] ?? null;
}

console.log("Fetching warframestat /weapons (FR)...");
const r = await fetch("https://api.warframestat.us/weapons/?language=fr");
if (!r.ok) {
  console.error("Failed:", r.status);
  process.exit(1);
}
const all = await r.json();
console.log(`  ${all.length} weapons`);

// Build map: uniqueName -> canonical name (prefer FR display)
const nameByUniqueName = new Map();
for (const w of all) {
  if (w.uniqueName && w.name) nameByUniqueName.set(w.uniqueName, w.name);
}

// Pairs by section, deduped via (resourceUniqueName, builtUniqueName)
const pairs = {
  Principales: [],
  Secondaires: [],
  "Mélée": [],
  "Arch-Gun": [],
  "Arch-Mélée": [],
};
const seen = new Set();

for (const w of all) {
  const section = sectionFor(w.category);
  if (!section) continue;

  const components = w.components ?? [];
  for (const c of components) {
    if (!isWeapon(c)) continue;
    if (!c.uniqueName || !w.uniqueName) continue;
    const key = `${c.uniqueName}->${w.uniqueName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Use the canonical name from /weapons map (since component.name may diverge)
    const resName = nameByUniqueName.get(c.uniqueName) ?? c.name;
    const builtName = w.name;
    pairs[section].push({
      resource: { name: resName, source: null },
      built: { name: builtName, source: null },
    });
  }
}

// Sort within each section by built name then resource name
for (const section of Object.keys(pairs)) {
  pairs[section].sort((a, b) => {
    const aKey = `${a.built.name}|${a.resource.name}`;
    const bKey = `${b.built.name}|${b.resource.name}`;
    return aKey.localeCompare(bKey, "fr");
  });
}

writeFileSync(outFile, JSON.stringify(pairs, null, 2));
console.log("Output:");
for (const [k, v] of Object.entries(pairs)) console.log(`  ${k}: ${v.length} pairs`);
console.log(`Wrote ${outFile}`);
