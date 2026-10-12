// Builds prof-data.js for the Professions designs from the live app's own data. Run from the repo root:
//   node docs/design/prototypes/tabs/gen-prof-data.mjs
// It bundles src/domain with the rolldown Vite already ships (as gen-sim-engine.mjs does) and reads:
//   professions/ (the 13 profiles, trainer stops, payoffs, the nine crafting paths with their counts, materials and vendor
//   prices, the four gathering guides with their ranges, and each range's computed routes over nodeSpawns.json),
//   tools/ingest/data/professionRecipes.json (each path recipe's skill colours: orange, yellow, green, grey — the source
//   craftingPaths.json was computed from), bis/bisRankings.json (the profession-made items on every spec's Wowhead
//   list), gear/itemCatalogue (their names) and icons.
// Routes are kept as zone percentages for a plain grid: the prototypes don't use the live app's zone map art.
// Regenerate after any of those change; never hand-edit prof-data.js.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const REPO = path.resolve(".");
const T = path.join(REPO, "docs/design/prototypes/tabs");
const { rolldown } = await import(pathToFileURL(path.join(REPO, "node_modules/rolldown/dist/index.mjs")).href);

const ENTRY = `
export * from '../../src/domain/professions'
import { getItemByWowItemId } from '../../src/domain/gear/itemCatalogue'
import { getIconName } from '../../src/domain/icons/icons'
import bis from '../../src/domain/bis/bisRankings.json' with { type: 'json' }
export { getItemByWowItemId, getIconName, bis }
`;
const inside = path.join(REPO, "node_modules", ".prof-data");
fs.mkdirSync(inside, { recursive: true });
fs.writeFileSync(path.join(inside, "entry.ts"), ENTRY);
const bundle = await rolldown({ input: path.join(inside, "entry.ts"), platform: "browser", logLevel: "warn" });
const { output } = await bundle.generate({ format: "iife", name: "PDProf" });
await bundle.close?.();
fs.rmSync(inside, { recursive: true, force: true });
const box = {};
vm.runInNewContext(output[0].code + ";this.PDProf=PDProf;", box);
const X = box.PDProf;
if (typeof X.getItemByWowItemId !== "function") throw new Error("itemCatalogue has no getItemByWowItemId");

/* each recipe's skill colours, by spell id */
const recipes = JSON.parse(fs.readFileSync(path.join(REPO, "tools/ingest/data/professionRecipes.json"), "utf8"));
const COLORS = {};
for (const list of Object.values(recipes.professions)) for (const r of list) COLORS[r.spellId] = { c: r.colors, at: r.learnedAt, ups: r.skillUpsPerCraft };

/* the profession-made items on each spec's Wowhead Phase 2 list; a specialisation names its base profession */
const BASE = [["Leatherworking", /Leatherworking/], ["Blacksmithing", /Blacksmith|Armorsmith|Swordsmith|Hammersmith|Axesmith|Weaponsmith/], ["Engineering", /Engineering/],
  ["Tailoring", /Tailoring/], ["Jewelcrafting", /Jewelcrafting/], ["Alchemy", /Alchemy/], ["Enchanting", /Enchanting/]];
const WH = {};
for (const [key, s] of Object.entries(X.bis.specs)) for (const [slot, list] of Object.entries(s.slots)) for (const e of list) {
  const m = /Profession: ([^-(]+?)\s*(?:-|\(|$)(.*)/.exec(e.source || "");
  if (!m) continue;
  const label = m[1].trim(), base = (BASE.find(([, re]) => re.test(label)) || [])[0];
  if (!base) continue;
  const it = X.getItemByWowItemId(e.wowItemId);
  (WH[base] ||= []).push({ spec: key, slot, rank: e.rank, w: e.wowItemId, n: it ? it.name : `Item ${e.wowItemId}`, ic: X.getIconName(e.wowItemId) || null,
    bop: /BoP/i.test(e.source), via: label !== base ? label : null, note: e.note || "" });
}

const thin = (coords, n) => coords.length <= n ? coords : coords.filter((_, i) => i % Math.ceil(coords.length / n) === 0);
const r1 = p => [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
const profs = X.allProfessions.map(name => {
  const p = X.getProfessionProfile(name), pay = X.payoffFor(name), guide = X.guideFor(name), path = X.craftingPathFor(name);
  const out = {
    n: name, cat: p.category, cap: p.skillCap, icon: p.icon, guide: p.guideUrl, specUrl: p.specializationUrl || null, notes: p.notes || "",
    stops: X.trainingMilestones(name).map(m => ({ tier: m.tier, at: m.atSkill, lvl: m.requiredCharacterLevel, from: m.trainedFrom, nv: m.needsVerification ? 1 : 0 })),
    payoff: pay ? { verdict: pay.verdict, perks: pay.perks.map(k => ({ n: k.name, kind: k.kind, d: k.detail, skill: k.requiresSkill || null, ph: k.phase || null, nv: k.needsVerification ? 1 : 0 })), sources: pay.sources } : null,
    wh: WH[name] || [],
  };
  if (path.length) out.craft = path.map(s => ({
    name: s.name, sp: s.spellId, range: s.skillRange, crafts: s.crafts, trainer: s.trainerTaught ? 1 : 0, creates: s.creates || s.name, cIcon: s.createsIcon || null,
    vendor: s.vendorCopper || 0, colors: COLORS[s.spellId] ? COLORS[s.spellId].c : null, learned: COLORS[s.spellId] ? COLORS[s.spellId].at : null,
    mats: s.materials.map(m => ({ n: m.name, q: m.quantity, ic: m.icon || null, v: m.vendorOnly ? 1 : 0, unit: m.unitCopper || 0,
      from: (m.craftedFrom || []).map(f => ({ n: f.name, q: f.quantity, ic: f.icon || null })) })),
  }));
  if (guide) out.gather = guide.ranges.map(r => {
    const routes = X.routesForRange(name, r).slice(0, 3).map(rt => ({
      zone: rt.zone, mats: rt.materials.map(m => [m.material, m.count]), len: Math.round(rt.routeLength), sampled: rt.sampled ? 1 : 0,
      stops: rt.stops.map(r1), spawns: rt.spawns.map(s => [s.material, thin(s.coords, 90).map(r1)]),
    }));
    return { range: r.skillRange, zones: r.zones, lvl: r.recommendedCharacterLevel, guidance: r.guidance, notes: (r.zoneNotes || []).map(z => [z.zone, z.note]),
      mats: [...X.materialsForRange(name, r)], routes, noMap: X.recommendedWithoutMaps(name, r) };
  });
  return out;
});

/* which gathering profession feeds which crafting one: the share of a path's farmed materials a gatherer brings in.
   A gatherer's materials are what its ranges gather; Mining's ores also feed the bars smelted from them. */
const gathered = {};
for (const p of profs) if (p.gather) { const s = new Set(); p.gather.forEach(r => r.mats.forEach(m => { s.add(m); if (/ Ore$/.test(m)) s.add(m.replace(/ Ore$/, " Bar")); })); gathered[p.n] = s; }
if (gathered.Mining) ["Rough Stone", "Coarse Stone", "Heavy Stone", "Solid Stone", "Dense Stone"].forEach(x => gathered.Mining.add(x));
if (gathered.Mining) ["Copper Bar", "Tin Bar", "Bronze Bar", "Iron Bar", "Steel Bar", "Mithril Bar", "Thorium Bar", "Fel Iron Bar", "Adamantite Bar", "Khorium Bar", "Eternium Bar", "Silver Bar", "Gold Bar", "Truesilver Bar", "Hardened Adamantite Bar", "Felsteel Bar", "Dark Iron Bar"].forEach(x => gathered.Mining.add(x));
/* material -> the gathering profession that brings it in, for the designs' shopping lists */
const gatherOf = {};
for (const [g, set] of Object.entries(gathered)) for (const m of set) if (!gatherOf[m]) gatherOf[m] = g;
const feeds = {};
for (const p of profs) if (p.craft) {
  const farmed = {}; let total = 0;
  p.craft.forEach(s => s.mats.forEach(m => { if (m.v) return; const parts = m.from.length ? m.from : [m]; parts.forEach(x => { farmed[x.n] = (farmed[x.n] || 0) + x.q; total += x.q; }); }));
  const by = {};
  for (const [g, set] of Object.entries(gathered)) { const q = Object.entries(farmed).filter(([n]) => set.has(n)).reduce((a, [, v]) => a + v, 0); if (q) by[g] = Math.round(q / total * 100); }
  feeds[p.n] = by;
}
const specs = Object.entries(X.bis.specs).map(([key, s]) => ({ key, cls: s.className, spec: s.spec }));
const out = { profs, feeds, gatherOf, specs, me: "Warrior|Fury", model: X.craftingPathModel };
const day = new Date().toISOString().slice(0, 10);
const js = `/* prof-data.js — GENERATED by gen-prof-data.mjs on ${day} from src/domain (do not edit by hand).
   The 13 professions: trainer stops, payoff (verdict and perks), the crafting paths (crafts, materials, vendor prices and
   each recipe's skill colours from professionRecipes.json), the gathering ranges with routes as zone percentages, the
   profession-made items on every spec's Wowhead Phase 2 list, and which gatherer feeds which crafter (share of farmed
   materials). */
window.PROF_DATA=${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(T, "prof-data.js"), js);
const nCraft = profs.filter(p => p.craft).length, nGather = profs.filter(p => p.gather).length, nWh = Object.values(WH).reduce((a, l) => a + l.length, 0);
console.log(`prof-data.js written (${Math.round(js.length / 1024)} KB): ${profs.length} professions, ${nCraft} crafting paths (${profs.reduce((a, p) => a + (p.craft ? p.craft.length : 0), 0)} steps), ${nGather} gathering guides (${profs.reduce((a, p) => a + (p.gather ? p.gather.length : 0), 0)} ranges), ${nWh} profession-made places on Wowhead lists`);
