// Builds ranked-a.html, ranked-b.html and ranked-c.html from planner.html: the same Character Planner (with its chosen
// Gear, Compare, Talents and Buffs tabs) with only the Ranked Gear sub-tab swapped for one design (ranked-<x>.js, over
// ranked-common.js, which reads the Gear tab's character through compare-common.js). Each page opens on the Ranked
// Gear sub-tab. Run from the repo root:
//   node docs/design/prototypes/tabs/make-ranked-pages.mjs
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "planner.html"), "utf8");
const DESIGNS = { a: "The guide, slot by slot", b: "What each one does for you", c: "Where to get it" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="rkui"')) { console.log("planner.html already holds a chosen Ranked Gear tab; nothing to build."); process.exit(0); }
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `ranked-${k}.js`))) { console.log(`ranked-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Character Planner</title>", `<title>Project Defeat · Character Planner · Ranked Gear ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Character Planner · Ranked Gear design ${k.toUpperCase()}: ${name}. It reads and equips the Gear tab's character. Prototype only, not the live app.</div>`);
  const i = s.indexOf('<div class="panel" id="p-ranked"'), j = s.indexOf('<div class="panel" id="p-build"');
  if (i < 0 || j < i) throw new Error("ranked panel markers");
  s = s.slice(0, i) + `<div class="panel" id="p-ranked" role="tabpanel" aria-labelledby="t-ranked">
      <div id="rkui"><p class="prov">The Ranked Gear design needs JavaScript.</p></div>
    </div>

    ` + s.slice(j);
  s = rep(s, '<script src="buffs-c.js"></script>\n', `<script src="buffs-c.js"></script>\n<script src="ranked-common.js"></script>\n<script src="ranked-${k}.js"></script>\n`, "design script");
  fs.writeFileSync(path.join(T, `ranked-${k}.html`), s);
  console.log(`ranked-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
