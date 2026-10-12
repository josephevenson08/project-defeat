// Builds raids-a.html, raids-b.html and raids-c.html from raids.html: the same Raids tab (scene that follows the raid,
// hero with the raid picker and the loot search) with the content area swapped for one design (raids-<x>.js, over
// raids-common.js). The pasted DATA blob and the old page script go; every design reads raid-data.js, which
// gen-raid-data.mjs makes from the live app's own data. Run from the repo root:
//   node docs/design/prototypes/tabs/make-raids-pages.mjs
// With --tab it builds the owner's pick into raids.html itself (2026-10-11: design A, the boss journal, with design C's
// "For my raid" view behind a switch), once; after that raids.html holds a design and this builder stops.
import fs from "node:fs";
import path from "node:path";
const T = "docs/design/prototypes/tabs";
const base = fs.readFileSync(path.join(T, "raids.html"), "utf8");
const DESIGNS = {
  a: { name: "The Adventure Guide", eyebrow: "Raids · the boss journal",
    h1: "Every boss, <em>every drop</em>, one at a time.",
    p: "Pick a raid, then a boss: its loot as the game shows it, with your spec's picks marked from Wowhead's Phase 2 lists. Fury Warrior first, or any of 27 specs." },
  b: { name: "The way in", eyebrow: "Raids · attunements and what waits inside",
    h1: "The way in, <em>step by step</em>.",
    p: "Tick off the attunement steps you've done to see which raids are open to you and what to do next, then what's waiting inside for your spec. In Phase 2, Karazhan, Serpentshrine Cavern and Tempest Keep each need one." },
  c: { name: "From your raid", eyebrow: "Raids · loot for your raid",
    h1: "Who in your raid <em>wants what</em>.",
    p: "Your raid from Raid Composition, boss by boss: who in it wants each drop, by Wowhead's Phase 2 lists, and which drops will be contested." },
};
/* the tab: design A with design C behind its "For me / For my raid" switch */
const TAB = { eyebrow: "Raids · the boss journal and your raid's loot",
  h1: "Every boss, <em>every drop</em>, and who wants it.",
  p: "Pick a raid, then a boss: its loot as the game shows it, with your spec's picks marked from Wowhead's Phase 2 lists. Switch to your raid to see who in it wants each drop, and which drops will be contested.",
  dirline: "Tab prototype · Raids · Step 2, decided 2026-10-11: design A, the boss journal, with design C's raid view. Prototype only, not the live app.",
  scripts: ["raid-data.js", "raids-common.js", "raids-c.js", "raids-a.js"] };
const tabMode = process.argv.includes("--tab");
const rep = (s, a, b, label) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error(`${label}: ${n} matches`); return s.replace(a, () => b); };
if (base.includes('id="raidui"')) { console.log("raids.html already holds a chosen design; nothing to build."); process.exit(0); }
if (!fs.existsSync(path.join(T, "raid-data.js"))) throw new Error("raid-data.js is missing: run gen-raid-data.mjs first");
const jobs = tabMode ? [["tab", TAB]] : Object.entries(DESIGNS);
for (const [k, d] of jobs) {
  const tab = k === "tab";
  if (!tab && !fs.existsSync(path.join(T, `raids-${k}.js`))) { console.log(`raids-${k}.js not written yet, skipped`); continue; }
  let s = base;
  if (!tab) s = rep(s, "<title>Project Defeat · Raids</title>", `<title>Project Defeat · Raids ${k.toUpperCase()}</title>`, "title");
  s = s.replace(/<div class="dirline">[^<]*<\/div>/, `<div class="dirline">${tab ? d.dirline : `Step 2 · Raids design ${k.toUpperCase()}: ${d.name}. On the live app's own raid data. Prototype only, not the live app.`}</div>`);
  /* the hash can carry a boss now (#raid/boss): the pre-paint backdrop reads only the raid */
  s = rep(s, "var h=decodeURIComponent(location.hash.slice(1)),d=", 'var h=decodeURIComponent(location.hash.slice(1)).split("/")[0],d=', "pre-paint hash");
  s = rep(s, '<div class="eyebrow">Raids · five instances · loot and attunements</div>', `<div class="eyebrow">${d.eyebrow}</div>`, "eyebrow");
  s = s.replace(/<h1 id="h-raids">.*?<\/h1>/, `<h1 id="h-raids">${d.h1}</h1>`);
  s = s.replace(/<p>Pick a raid to see a card per boss[^<]*<\/p>/, `<p>${d.p}</p>`);
  s = s.replace(/<noscript>.*?<\/noscript>/, '<noscript><p class="static-note">The Raids designs need JavaScript.</p></noscript>');
  const i = s.indexOf('<div id="raidview"'), jEnd = '<div id="lresults" hidden></div>', j = s.indexOf(jEnd);
  if (i < 0 || j < i) throw new Error("raidview markers");
  s = s.slice(0, i) + `<div id="raidui"><p class="prov">The Raids design needs JavaScript.</p></div>` + s.slice(j + jEnd.length);
  const a = s.indexOf("<script>/* generated from src/domain/raids"), b = s.lastIndexOf("</script>\n</body>");
  if (a < 0 || b < a) throw new Error("page script markers");
  const scripts = tab ? d.scripts : ["raid-data.js", "raids-common.js", `raids-${k}.js`];
  s = s.slice(0, a) + (tab ? "<!-- the live app's raid data, the shared shell, design C (the \"For my raid\" view), then design A, which starts the page -->\n<script>window.RAIDS_IN_TAB=true;</script>\n" : "<!-- the live app's raid data, the shared shell, then the design -->\n") +
    scripts.map(f => `<script src="${f}"></script>`).join("\n") + "\n</body>" + s.slice(b + "</script>\n</body>".length);
  s = s.replace("Raids, bosses, loot, attunements: <code>src/domain/raids</code> · Wowhead · Phase 2 · updated 27 Sep",
    "Raids, bosses, loot, attunements: <code>src/domain/raids</code> · ranks: Wowhead's Phase 2 lists for 27 specs · Phase 2");
  const out = tab ? "raids.html" : `raids-${k}.html`;
  fs.writeFileSync(path.join(T, out), s);
  console.log(`${out} written (${Math.round(s.length / 1024)} KB)`);
}
