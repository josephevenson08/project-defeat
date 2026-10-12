// Builds tiers-a.html, tiers-b.html and tiers-c.html from tier-lists.html: the same Spec Tier Lists tab (emerald scene,
// hero with its facts) with the lists swapped for one design (tiers-<x>.js, over tiers-common.js). The page's own
// script (the Step 1 shelves and filters) goes; every design reads tier-data.js, which gen-tier-data.mjs makes from the
// live app's own data. Run from the repo root:
//   node docs/design/prototypes/tabs/make-tier-pages.mjs
// It stops once tier-lists.html holds a design (id="tierui"). With --tab it builds the owner's pick into tier-lists.html
// itself (2026-10-12: design A, the tier board, with design B's "Against the logs" chart behind a switch), once.
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "tier-lists.html"), "utf8");
const DESIGNS = {
  a: { name: "The tier board", eyebrow: "Spec Tier Lists · Phase 2 · the tier board",
    h1: "Where every spec stands in <em>Tier 5 raiding</em>.",
    p: "Wowhead's three Phase 2 rankings as a board of spec icons. Press any spec for its place on every list, what the logs say it does, and what it brings to a raid." },
  b: { name: "Two opinions", eyebrow: "Spec Tier Lists · Phase 2 · the guide and the logs",
    h1: "Wowhead's tiers, <em>and what the logs say</em>.",
    p: "Wowhead ranks specs by judgement; archon.gg averages what players actually parse in Serpentshrine and Tempest Keep. Here are both for every damage spec, with where they disagree." },
  c: { name: "What each spec brings", eyebrow: "Spec Tier Lists · Phase 2 · for building a raid",
    h1: "Who to bring, <em>and what they bring</em>.",
    p: "Every spec with its tier and the buffs and debuffs it brings to a raid, from the same data Raid Composition counts. Pick a buff to see who brings it; the specs in your raid are marked." },
};
/* the tab: design A with design B behind its "The board / Against the logs" switch */
const TAB = { eyebrow: "Spec Tier Lists · Phase 2 · the board and the logs",
  h1: "Where every spec stands in <em>Tier 5 raiding</em>.",
  p: "Wowhead's three Phase 2 rankings as a board of spec icons: press any spec for its place on every list, what the logs say and what it brings to a raid. Switch to the logs to see Wowhead's tiers against what players actually parse.",
  dirline: "Tab prototype · Spec Tier Lists · Step 2, decided 2026-10-12: design A, the tier board, with design B's chart against the logs. Prototype only, not the live app.",
  scripts: ["tier-data.js", "tiers-common.js", "tiers-b.js", "tiers-a.js"] };
const tabMode = process.argv.includes("--tab");
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="tierui"')) { console.log("tier-lists.html already holds a chosen design; nothing to build."); process.exit(0); }
if (!fs.existsSync(path.join(T, "tier-data.js"))) throw new Error("tier-data.js is missing: run gen-tier-data.mjs first");
const jobs = tabMode ? [["tab", TAB]] : Object.entries(DESIGNS);
for (const [k, d] of jobs) {
  const tab = k === "tab";
  if (!tab && !fs.existsSync(path.join(T, `tiers-${k}.js`))) { console.log(`tiers-${k}.js not written yet, skipped`); continue; }
  let s = base;
  if (!tab) s = rep(s, "<title>Project Defeat · Spec Tier Lists</title>", `<title>Project Defeat · Spec Tier Lists ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">${tab ? d.dirline : `Step 2 · Spec Tier Lists design ${k.toUpperCase()}: ${d.name}. On the live app's own data. Prototype only, not the live app.`}</div>`);
  s = rep(s, '<div class="eyebrow">Spec Tier Lists · Phase 2 · Serpentshrine Cavern and Tempest Keep</div>', `<div class="eyebrow">${d.eyebrow}</div>`, "eyebrow");
  s = s.replace(/<h1 id="h-tl">.*?<\/h1>/, `<h1 id="h-tl">${d.h1}</h1>`);
  s = s.replace(/<p>Wowhead's three Phase 2 PvE rankings[^<]*<\/p>/, `<p>${d.p}</p>`);
  const i = s.indexOf('  <div class="lists">'), jEnd = "</section>\n</main>", j = s.indexOf(jEnd);
  if (i < 0 || j < i) throw new Error("lists markers");
  s = s.slice(0, i) + `  <div id="tierui"><p class="prov">The Spec Tier Lists design needs JavaScript.</p></div>\n` + s.slice(j);
  const kit = '<script src="tbc-kit.js"></script>\n', a = s.indexOf(kit) + kit.length, b = s.lastIndexOf("</script>\n</body>");
  if (a < kit.length || b < a) throw new Error("page script markers");
  const scripts = tab ? d.scripts : ["tier-data.js", "tiers-common.js", `tiers-${k}.js`];
  s = s.slice(0, a) + (tab ? "<!-- the live app's data, the shared shell, design B (the \"Against the logs\" view), then design A, which starts the page -->\n<script>window.TIERS_IN_TAB=true;</script>\n" : "<!-- the live app's data, the shared shell, then the design -->\n") +
    scripts.map(f => `<script src="${f}"></script>`).join("\n") + "\n</body>" + s.slice(b + "</script>\n</body>".length);
  s = s.replace("Source: Wowhead · Phase 2 PvE tier lists · <code>tierLists.json</code> · ingested 12 Aug 2026",
    "Sources: Wowhead's Phase 2 PvE tier lists (<code>tierLists.json</code>, ingested 12 Aug 2026) · archon.gg logs (read 23 Aug 2026)");
  const out = tab ? "tier-lists.html" : `tiers-${k}.html`;
  fs.writeFileSync(path.join(T, out), s);
  console.log(`${out} written (${Math.round(s.length / 1024)} KB)`);
}
