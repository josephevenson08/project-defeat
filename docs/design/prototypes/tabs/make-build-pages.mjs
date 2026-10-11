// Builds build-a.html, build-b.html and build-c.html from planner.html: the same Character Planner (with its chosen
// Gear, Compare, Talents, Buffs and Ranked Gear tabs) with only the Build sub-tab swapped for one design (build-<x>.js,
// over build-common.js, which reads and writes the Gear, Talents and Buffs tabs' shared stores). Each page opens on the
// Build sub-tab. Run from the repo root:
//   node docs/design/prototypes/tabs/make-build-pages.mjs
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "planner.html"), "utf8");
const DESIGNS = { a: "Share card", b: "Character select", c: "Bring your character in" };
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="bdui"')) { console.log("planner.html already holds a chosen Build tab; nothing to build."); process.exit(0); }
for (const [k, name] of Object.entries(DESIGNS)) {
  if (!fs.existsSync(path.join(T, `build-${k}.js`))) { console.log(`build-${k}.js not written yet, skipped`); continue; }
  let s = base;
  s = rep(s, "<title>Project Defeat · Character Planner</title>", `<title>Project Defeat · Character Planner · Build ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">Step 2 · Character Planner · Build design ${k.toUpperCase()}: ${name}. Its share link opens the same build in the live app. Prototype only, not the live app.</div>`);
  const i = s.indexOf('<div class="panel" id="p-build"'), j = s.indexOf("\n  </section></div>\n</main>", i);
  if (i < 0 || j < i) throw new Error("build panel markers");
  s = s.slice(0, i) + `<div class="panel" id="p-build" role="tabpanel" aria-labelledby="t-build">
      <div id="bdui"><p class="prov">The Build design needs JavaScript.</p></div>
    </div>` + s.slice(j);
  s = rep(s, '<script src="ranked-c.js"></script>\n', `<script src="ranked-c.js"></script>\n<script src="build-common.js"></script>\n<script src="build-${k}.js"></script>\n`, "design script");
  fs.writeFileSync(path.join(T, `build-${k}.html`), s);
  console.log(`build-${k}.html written (${Math.round(s.length / 1024)} KB)`);
}
