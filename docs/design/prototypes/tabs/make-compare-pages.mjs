// Builds compare-a.html, compare-b.html and compare-c.html from planner.html: the same Character Planner (with its
// chosen Gear tab) with only the Compare sub-tab swapped for one design (compare-<x>.js, over compare-common.js).
// Each page opens on the Compare sub-tab. Run from the repo root:
//   node docs/design/prototypes/tabs/make-compare-pages.mjs
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "planner.html"), "utf8");
const DESIGNS = { a: "Side-by-side tooltips", b: "Change chart", c: "Shortlist table" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="cmpui"')) { console.log("planner.html already holds a chosen Compare tab; nothing to build."); process.exit(0); }
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `compare-${k}.js`))) { console.log(`compare-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Character Planner</title>", `<title>Project Defeat · Character Planner · Compare ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Character Planner · Compare design ${k.toUpperCase()}: ${name}. It compares against the gear in the Gear tab. Prototype only, not the live app.</div>`);
  const i = s.indexOf('<div class="panel" id="p-compare"'), j = s.indexOf('<div class="panel" id="p-talents"');
  if (i < 0 || j < i) throw new Error("compare panel markers");
  s = s.slice(0, i) + `<div class="panel" id="p-compare" role="tabpanel" aria-labelledby="t-compare">
      <div id="cmpui"><p class="prov">The compare design needs JavaScript.</p></div>
    </div>

    ` + s.slice(j);
  s = rep(s, '<script src="gear-c.js"></script>\n', `<script src="gear-c.js"></script>\n<script src="compare-common.js"></script>\n<script src="compare-${k}.js"></script>\n`, "scripts");
  fs.writeFileSync(path.join(T, `compare-${k}.html`), s);
  console.log(`compare-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
