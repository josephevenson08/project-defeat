// Builds profs-a.html, profs-b.html and profs-c.html from professions.html: the same Professions tab (amber scene, hero)
// with the picker and profession page swapped for one design (profs-<x>.js, over profs-common.js). The pasted window.PD
// data and the Step 1 page script go; every design reads prof-data.js, which gen-prof-data.mjs makes from the live app's
// own data. Run from the repo root:
//   node docs/design/prototypes/tabs/make-prof-pages.mjs
// It stops once professions.html holds a design (id="profui"). With --tab it builds the owner's pick into
// professions.html itself (2026-10-12: design A, the profession window, with design B's "Which two" behind a switch), once.
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "professions.html"), "utf8");
const DESIGNS = {
  a: { name: "The profession window", eyebrow: "Professions · 13 professions · the profession window",
    h1: "Take a profession to <em>375</em>, one recipe at a time.",
    p: "Like the game's own profession window: set your skill, and every recipe on the path to 375 takes its colour — orange, yellow, green or grey. Pick one for what it takes and what it makes; a gathering profession shows where to ride instead." },
  b: { name: "Which two to take", eyebrow: "Professions · 13 professions · which two to take",
    h1: "Pick your two, and know what <em>each is worth</em> at 70.",
    p: "Every profession by what it gives a level 70 character, led by what it makes for your spec from Wowhead's lists. Pick two to see the pair: what you get, and whether one feeds the other." },
  c: { name: "The road to 375", eyebrow: "Professions · 13 professions · the road to 375",
    h1: "From where you are <em>to 375</em>.",
    p: "Set your skill and see the rest of the climb: where to stop and train, what to make or where to ride, then the shopping list from here, with what a vendor sells priced and what you farm counted." },
};
/* the tab: design A with design B behind its "Level it / Which two" switch */
const TAB = { eyebrow: "Professions · 13 professions · level it, or pick your two",
  h1: "Take a profession to <em>375</em>, and know what it is worth at 70.",
  p: "Like the game's own profession window: set your skill, and every recipe on the path to 375 takes its colour. Pick one for what it takes and what it makes. Switch to Which two to compare all thirteen by what they give a level 70 character, led by what they make for your spec.",
  dirline: "Tab prototype · Professions · Step 2, decided 2026-10-12: design A, the profession window, with design B's Which two. Prototype only, not the live app.",
  scripts: ["prof-data.js", "profs-common.js", "profs-b.js", "profs-a.js"] };
const tabMode = process.argv.includes("--tab");
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="profui"')) { console.log("professions.html already holds a chosen design; nothing to build."); process.exit(0); }
if (!fs.existsSync(path.join(T, "prof-data.js"))) throw new Error("prof-data.js is missing: run gen-prof-data.mjs first");
const jobs = tabMode ? [["tab", TAB]] : Object.entries(DESIGNS);
for (const [k, d] of jobs) {
  const tab = k === "tab";
  if (!tab && !fs.existsSync(path.join(T, `profs-${k}.js`))) { console.log(`profs-${k}.js not written yet, skipped`); continue; }
  let s = base;
  if (!tab) s = rep(s, "<title>Project Defeat · Professions</title>", `<title>Project Defeat · Professions ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">${tab ? d.dirline : `Step 2 · Professions design ${k.toUpperCase()}: ${d.name}. On the live app's own data. Prototype only, not the live app.`}</div>`);
  s = rep(s, '<div class="eyebrow">Professions · 13 professions · Serpentshrine light</div>', `<div class="eyebrow">${d.eyebrow}</div>`, "eyebrow");
  s = s.replace(/<h1 id="h-prof">.*?<\/h1>/, `<h1 id="h-prof">${d.h1}</h1>`);
  s = s.replace(/<p>Where to stop and train[^<]*<\/p>/, `<p>${d.p}</p>`);
  const i = s.indexOf('  <div class="layer" style="--z:4" id="pickwrap">'), jEnd = '<div id="ppage" hidden tabindex="-1" aria-live="off"></div>', j = s.indexOf(jEnd);
  if (i < 0 || j < i) throw new Error("content markers");
  s = s.slice(0, i) + `  <div id="profui"><p class="prov">The Professions design needs JavaScript.</p></div>` + s.slice(j + jEnd.length);
  const da = s.indexOf("<script>\n/* Profession data"), db = s.indexOf("</script>\n", da);
  if (da < 0 || db < da) throw new Error("data script markers");
  s = s.slice(0, da) + s.slice(db + "</script>\n".length);
  /* the Step 1 page ends on its last script with no closing tags; the designs close the document properly */
  const kit = '<script src="tbc-kit.js"></script>\n', a = s.indexOf(kit) + kit.length, b = s.lastIndexOf("</script>");
  if (a < kit.length || b < a) throw new Error("page script markers");
  const tail = s.slice(b + "</script>".length).replace(/^\s*(<\/body>)?\s*(<\/html>)?\s*$/, "");
  if (tail) throw new Error("unexpected content after the page script");
  const scripts = tab ? d.scripts : ["prof-data.js", "profs-common.js", `profs-${k}.js`];
  s = s.slice(0, a) + (tab ? "<!-- the live app's data, the shared shell, design B (the \"Which two\" view), then design A, which starts the page -->\n<script>window.PROFS_IN_TAB=true;</script>\n" : "<!-- the live app's data, the shared shell, then the design -->\n") +
    scripts.map(f => `<script src="${f}"></script>`).join("\n") + "\n</body>\n</html>\n";
  const out = tab ? "professions.html" : `profs-${k}.html`;
  fs.writeFileSync(path.join(T, out), s);
  console.log(`${out} written (${Math.round(s.length / 1024)} KB)`);
}
