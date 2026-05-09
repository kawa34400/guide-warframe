// Parses the two CSVs into clean JSON consumed by the app.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "src/data");
mkdirSync(outDir, { recursive: true });

const SOURCES = {
  M: "Marché",
  D: "Dojo",
  B: "Boss",
  DM: "Drop en Mission",
  CS: "Céphalon Simaris",
  Q: "Quête",
};

function splitCsv(line) {
  // simple split — these CSVs don't contain quoted commas
  return line.split(",");
}

function readCsv(path) {
  const txt = readFileSync(path, "utf8").replace(/^﻿/, "");
  return txt.split(/\r?\n/).map(splitCsv);
}

// ---------- Construction ----------
function parseConstruction() {
  const rows = readCsv(
    "C:/Users/alexa/Downloads/Tableaux des Armes  - Armes Requises pour Construction.csv",
  );

  // 3 sections: Primary (cols B-F => 1..5 but built at 7..10), Secondary (12..20), Melee (22..30)
  // Pattern per section: [_, _, resourceName, lvl30, srcCode, "=", _, builtName, builtLvl30, builtSrcCode]
  // Layout from header row 7 (1-indexed):
  // col 1 empty, 2 "" (FALSE flag), 3 "Armes Ressources", 4 "Lvl. 30", 5 "Ac", 6 "=" sep, 7 "" flag, 8 "Armes Construite", 9 "Lvl. 30", 10 "Ac"
  // For each block of 10 cols, there's also a separator empty col before the next section.

  const sections = [
    { name: "Principales", offset: 1 }, // cols 1..10 (0-indexed)
    { name: "Secondaires", offset: 11 }, // cols 11..20
    { name: "Mélée", offset: 21 }, // cols 21..30
  ];

  const result = { Principales: [], Secondaires: [], "Mélée": [] };

  // Skip legend rows (the source code reference table) — only keep rows where
  // the FALSE/TRUE flag is present at the section's offset, which marks an
  // actual data row.
  const isDataFlag = (v) => v === "FALSE" || v === "TRUE";

  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 10) continue;

    for (const sec of sections) {
      const o = sec.offset;
      const resFlag = (row[o] || "").trim();
      const resName = (row[o + 1] || "").trim();
      const resSrc = (row[o + 3] || "").trim();
      const builtFlag = (row[o + 5] || "").trim();
      const builtName = (row[o + 6] || "").trim();
      const builtSrc = (row[o + 8] || "").trim();

      const resOk = resName && isDataFlag(resFlag);
      const builtOk = builtName && isDataFlag(builtFlag);
      if (!resOk && !builtOk) continue;

      result[sec.name].push({
        resource: resOk
          ? { name: resName, source: SOURCES[resSrc] || resSrc || null }
          : null,
        built: builtOk
          ? { name: builtName, source: SOURCES[builtSrc] || builtSrc || null }
          : null,
      });
    }
  }

  return result;
}

// ---------- Incarnon ----------
function parseIncarnon() {
  const rows = readCsv(
    "C:/Users/alexa/Downloads/Tableau Warframe _ Arme Liche et Incarnon _ Blondy - Incarnon.csv",
  );

  // Evolution unlocks: 3 columns (3, 6, 9) — main list rows 5-20 (index), Zariman extension rows 24-28
  const evolutionsMain = [];
  const evolutionsZariman = [];
  for (let i = 5; i <= 20; i++) {
    const r = rows[i];
    if (!r) continue;
    for (const c of [3, 6, 9]) {
      const v = (r[c] || "").trim();
      if (v && !evolutionsMain.includes(v)) evolutionsMain.push(v);
    }
  }
  for (let i = 24; i <= 28; i++) {
    const r = rows[i];
    if (!r) continue;
    const v = (r[3] || "").trim();
    if (v && !evolutionsZariman.includes(v)) evolutionsZariman.push(v);
  }

  // Weekly Incarnon adapter rotation: 8 weeks, cols 13-17 (week# in col 13, names in 15, second batch col 18-20)
  // Looking at the data: col 13 has week number (1..4), col 15 has weapons (5 each), col 18 has next week #, col 20 weapons
  // Actually from the CSV:
  //   row 4: ",,,,,,,,,,,,,1,Braton,FALSE,,5,Torid,FALSE"
  //   so col indices (0-based): 13="1", 15="Braton", 18="5", 20="Torid"
  const incarnonWeeks = {};
  let leftWeek = null;
  let rightWeek = null;
  for (let i = 3; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const lw = (r[14] || "").trim();
    const lwName = (r[15] || "").trim();
    const rw = (r[18] || "").trim();
    const rwName = (r[19] || "").trim();
    if (/^\d+$/.test(lw)) leftWeek = parseInt(lw, 10);
    if (/^\d+$/.test(rw)) rightWeek = parseInt(rw, 10);
    if (leftWeek && lwName) {
      (incarnonWeeks[leftWeek] ||= []).push(lwName);
    }
    if (rightWeek && rwName) {
      (incarnonWeeks[rightWeek] ||= []).push(rwName);
    }
  }

  // Warframe rotation: cols 2-7 starting around row 33
  // Format: ",,1,Excalibur,FALSE,7,Mesa,FALSE"
  // col 2 = week# (left), col 3 = name, col 5 = week# (right), col 6 = name
  const warframeWeeks = {};
  let lFrameWeek = null;
  let rFrameWeek = null;
  for (let i = 30; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    // stop when the rotation wraps back (row 48: "2,Excalibur,...,12,...")
    if ((r[2] || "").trim() === "2" && (r[3] || "").trim() === "Excalibur" &&
        Object.keys(warframeWeeks).length > 1) break;
    const lw = (r[2] || "").trim();
    const lwName = (r[3] || "").trim();
    const rw = (r[5] || "").trim();
    const rwName = (r[6] || "").trim();
    if (/^\d+$/.test(lw)) lFrameWeek = parseInt(lw, 10);
    if (/^\d+$/.test(rw)) rFrameWeek = parseInt(rw, 10);
    if (lFrameWeek && lwName && !/^\d+$/.test(lwName)) {
      const set = (warframeWeeks[lFrameWeek] ||= []);
      if (!set.includes(lwName)) set.push(lwName);
    }
    if (rFrameWeek && rwName && !rwName.includes("--->")) {
      const set = (warframeWeeks[rFrameWeek] ||= []);
      if (!set.includes(rwName)) set.push(rwName);
    }
  }

  // Manual overrides for missing weeks in source spreadsheet
  warframeWeeks[6] ||= ["Hydroid", "Mirage", "Limbo"];

  // Sort weeks numerically
  const sortedWarframe = Object.fromEntries(
    Object.entries(warframeWeeks).sort(
      ([a], [b]) => parseInt(a, 10) - parseInt(b, 10),
    ),
  );

  return {
    evolutions: evolutionsMain,
    evolutionsZariman,
    incarnonRotation: incarnonWeeks,
    warframeRotation: sortedWarframe,
  };
}

const construction = parseConstruction();
const incarnon = parseIncarnon();

writeFileSync(
  resolve(outDir, "construction.json"),
  JSON.stringify(construction, null, 2),
);
writeFileSync(
  resolve(outDir, "incarnon.json"),
  JSON.stringify(incarnon, null, 2),
);

console.log("Construction:");
for (const [k, v] of Object.entries(construction)) {
  console.log(`  ${k}: ${v.length} pairs`);
}
console.log("Incarnon:");
console.log(`  evolutions: ${incarnon.evolutions.length}`);
console.log(
  `  incarnon weeks: ${Object.keys(incarnon.incarnonRotation).length}`,
);
console.log(
  `  warframe weeks: ${Object.keys(incarnon.warframeRotation).length}`,
);
