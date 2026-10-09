// Builds talents-a.html, talents-b.html and talents-c.html from planner.html: the same Character Planner (with its
// chosen Gear and Compare tabs) with only the Talents sub-tab swapped for one design (talents-<x>.js, over
// talent-common.js, which planner.html already loads for the hit cap). Each page opens on the Talents sub-tab.
// Run from the repo root:
//   node docs/design/prototypes/tabs/make-talent-pages.mjs
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "planner.html"), "utf8");
const DESIGNS = { a: "Talent window", b: "What it gives you", c: "Against the preset" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="talui"')) { console.log("planner.html already holds a chosen Talents tab; nothing to build."); process.exit(0); }
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `talents-${k}.js`))) { console.log(`talents-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Character Planner</title>", `<title>Project Defeat · Character Planner · Talents ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Character Planner · Talents design ${k.toUpperCase()}: ${name}. The stat bar's hit cap follows Precision. Prototype only, not the live app.</div>`);
  const i = s.indexOf('<div class="panel" id="p-talents"'), j = s.indexOf('<div class="panel" id="p-buffs"');
  if (i < 0 || j < i) throw new Error("talents panel markers");
  s = s.slice(0, i) + `<div class="panel" id="p-talents" role="tabpanel" aria-labelledby="t-talents">
      <div id="talui"><p class="prov">The talents design needs JavaScript.</p></div>
    </div>

    ` + s.slice(j);
  s = rep(s, '<script src="compare-a.js"></script>\n', `<script src="compare-a.js"></script>\n<script src="talents-${k}.js"></script>\n`, "scripts");
  fs.writeFileSync(path.join(T, `talents-${k}.html`), s);
  console.log(`talents-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
