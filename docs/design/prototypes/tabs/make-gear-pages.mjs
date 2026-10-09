// Builds gear-a.html, gear-b.html and gear-c.html from planner.html: the same Character Planner with only the Gear
// sub-tab swapped for one design (gear-<x>.js, over gear-data.js + gear-common.js). Run from the repo root:
//   node docs/design/prototypes/tabs/make-gear-pages.mjs
// Re-run after changing planner.html so the three pages keep its other sub-tabs.
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "planner.html"), "utf8");
/* Retired 2026-10-09: the owner picked B with C's checklist, and planner.html now holds that Gear tab. Building from
   it again would stack a second design onto it, so the A/B/C pages stay as they were built (see the tab README). */
if (base.includes('id="gearui"')) { console.log("planner.html already holds the chosen Gear tab; gear-a/b/c.html are kept as built. Nothing to do."); process.exit(0); }
const DESIGNS = { a: "List and side pane", b: "Character sheet", c: "Upgrade checklist" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `gear-${k}.js`))) { console.log(`gear-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Character Planner</title>", `<title>Project Defeat · Character Planner · Gear ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Character Planner · Gear design ${k.toUpperCase()}: ${name}. Prototype only, not the live app.</div>`);
  s = rep(s, '<p class="prov" style="margin:0">Stats from your import', '<p class="prov" style="margin:0" id="statnote">Stats from your import', "statnote");
  /* the Gear panel: the design mounts into #gearui; the original list stays, hidden, because the Compare and
     Ranked Gear sub-tabs read "what is equipped" from it */
  const i = s.indexOf('<div class="panel" id="p-gear"'), j = s.indexOf('<div class="panel" id="p-compare"');
  if (i < 0 || j < i) throw new Error("gear panel markers");
  const old = s.slice(i, j);
  const ol = old.slice(old.indexOf('<ol class="gear" id="gear"'), old.indexOf("</ol>") + 5).replace('<ol class="gear" id="gear"', '<ol class="gear" id="gear" hidden style="display:none"');
  const panel = `<div class="panel" id="p-gear" role="tabpanel" aria-labelledby="t-gear">
      <div id="gearui"><p class="prov">The gear design needs JavaScript.</p></div>
      ${ol}
    </div>

    `;
  s = s.slice(0, i) + panel + s.slice(j);
  s = rep(s, "</body>", `<script src="gear-data.js"></script>\n<script src="gear-common.js"></script>\n<script src="gear-${k}.js"></script>\n</body>`, "scripts");
  fs.writeFileSync(path.join(T, `gear-${k}.html`), s);
  console.log(`gear-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
