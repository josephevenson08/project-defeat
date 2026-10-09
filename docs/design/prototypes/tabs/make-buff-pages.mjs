// Builds buffs-a.html, buffs-b.html and buffs-c.html from planner.html: the same Character Planner (with its chosen
// Gear, Compare and Talents tabs) with only the Buffs sub-tab swapped for one design (buffs-<x>.js, over buff-common.js).
// buff-data.js and buff-common.js load before the gear scripts, because the stat bar's hit cap reads Improved Faerie
// Fire from them. Each page opens on the Buffs sub-tab. Run from the repo root:
//   node docs/design/prototypes/tabs/make-buff-pages.mjs
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "planner.html"), "utf8");
const DESIGNS = { a: "Buff bar", b: "What it adds up to", c: "From your raid" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="bufui"')) { console.log("planner.html already holds a chosen Buffs tab; nothing to build."); process.exit(0); }
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `buffs-${k}.js`))) { console.log(`buffs-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Character Planner</title>", `<title>Project Defeat · Character Planner · Buffs ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Character Planner · Buffs design ${k.toUpperCase()}: ${name}. Improved Faerie Fire moves the stat bar's hit cap. Prototype only, not the live app.</div>`);
  const i = s.indexOf('<div class="panel" id="p-buffs"'), j = s.indexOf('<div class="panel" id="p-ranked"');
  if (i < 0 || j < i) throw new Error("buffs panel markers");
  s = s.slice(0, i) + `<div class="panel" id="p-buffs" role="tabpanel" aria-labelledby="t-buffs">
      <div id="bufui"><p class="prov">The buffs design needs JavaScript.</p></div>
    </div>

    ` + s.slice(j);
  s = rep(s, '<script src="talent-common.js"></script>\n', '<script src="talent-common.js"></script>\n<script src="buff-data.js"></script>\n<script src="buff-common.js"></script>\n', "buff scripts");
  s = rep(s, '<script src="talents-a.js"></script>\n', `<script src="talents-a.js"></script>\n<script src="buffs-${k}.js"></script>\n`, "design script");
  fs.writeFileSync(path.join(T, `buffs-${k}.html`), s);
  console.log(`buffs-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
