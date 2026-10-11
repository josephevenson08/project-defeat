// Builds sim-a.html, sim-b.html and sim-c.html from simulation.html: the same Simulation tab (hero, fixed encounter and
// the "What is and isn't modelled" panel) with the result area swapped for one design (sim-<x>.js, over sim-common.js).
// Every design runs the live app's own simulator (sim-engine.js, made by gen-sim-engine.mjs) on the Character Planner's
// shared character, so the page also loads the planner's data and shared stores (talents, buffs, gear) and
// build-common.js, which snapshots that character in the app's build format. Run from the repo root:
//   node docs/design/prototypes/tabs/make-sim-pages.mjs
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "simulation.html"), "utf8");
const DESIGNS = { a: "The log", b: "The workbench", c: "What to do next" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="simui"')) { console.log("simulation.html already holds a chosen design; nothing to build."); process.exit(0); }
for (const f of ["sim-engine.js", "sim-data.js"]) if (!fs.existsSync(path.join(T, f))) throw new Error(`${f} is missing: run gen-sim-engine.mjs first`);
const SCRIPTS = ["talent-data.js", "talent-common.js", "buff-data.js", "buff-common.js", "gear-data.js", "gear-common.js", "build-common.js",
  "sim-engine.js", "sim-data.js", "sim-common.js"];
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `sim-${k}.js`))) { console.log(`sim-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Simulation</title>", `<title>Project Defeat · Simulation ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Simulation design ${k.toUpperCase()}: ${name}. It runs the live app's own simulator on the Character Planner's character. Prototype only, not the live app.</div>`);
  const i = s.indexOf('<div class="simgrid">') + '<div class="simgrid">'.length;
  const j = s.indexOf('    <div class="layer full" style="--z:2"><section class="box" id="b-model"');
  if (i < 30 || j < i) throw new Error("simgrid markers");
  s = s.slice(0, i) + `
    <div class="layer full" style="--z:6"><section class="box" id="b-sim" aria-label="Simulation"><div class="in" id="simui"><p class="prov">The Simulation design needs JavaScript.</p></div></section></div>

` + s.slice(j);
  s = rep(s, "</script>\n</body>", "</script>\n<!-- the planner's shared character, the live app's simulator, then the design -->\n" +
    SCRIPTS.map(f => `<script src="${f}"></script>`).join("\n") + `\n<script src="sim-${k}.js"></script>\n</body>`, "scripts");
  fs.writeFileSync(path.join(T, `sim-${k}.html`), s);
  console.log(`sim-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
