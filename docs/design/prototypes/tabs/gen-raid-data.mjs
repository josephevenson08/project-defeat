// Builds raid-data.js for the Raids designs from the live app's own data, so the prototypes read the real loot instead of
// a pasted copy. Run from the repo root:
//   node docs/design/prototypes/tabs/gen-raid-data.mjs
// It bundles src/domain with the rolldown Vite already ships (as gen-sim-engine.mjs does) and reads:
//   raids/ (sampleRaids, the five *Bosses.ts, sampleAttunements, bossArt.json), gear/itemCatalogue (quality, slot,
//   item level, stats), icons/icons.json (the files public/icons holds), stats/describeStats (the app's own stat line),
//   raidcomp/raidBuilds (the 29 raid builds and their spec icons) and bis/bisRankings.json (Wowhead's Phase 2 list for
//   each of 27 specs), so every drop can say which specs rank it and how high.
// Regenerate after any of those change; never hand-edit raid-data.js.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const REPO = path.resolve(".");
const T = path.join(REPO, "docs/design/prototypes/tabs");
const { rolldown } = await import(pathToFileURL(path.join(REPO, "node_modules/rolldown/dist/index.mjs")).href);

const ENTRY = `
import { sampleRaids, getBossesForRaid, getAttunementChainForRaid } from '../../src/domain/raids'
import { hasBossArt } from '../../src/domain/raids/bossArt'
import { getItemById } from '../../src/domain/gear/itemCatalogue'
import { getIconName } from '../../src/domain/icons/icons'
import { describeStats } from '../../src/domain/stats/describeStats'
import { raidBuilds } from '../../src/domain/raidcomp'
import bis from '../../src/domain/bis/bisRankings.json' with { type: 'json' }
export { sampleRaids, getBossesForRaid, getAttunementChainForRaid, hasBossArt, getItemById, getIconName, describeStats, raidBuilds, bis }
`;
const inside = path.join(REPO, "node_modules", ".raid-data");
fs.mkdirSync(inside, { recursive: true });
fs.writeFileSync(path.join(inside, "entry.ts"), ENTRY);
const bundle = await rolldown({ input: path.join(inside, "entry.ts"), platform: "browser", logLevel: "warn" });
const { output } = await bundle.generate({ format: "iife", name: "PDRaid" });
await bundle.close?.();
fs.rmSync(inside, { recursive: true, force: true });
const box = {};
vm.runInNewContext(output[0].code + ";this.PDRaid=PDRaid;", box);
const X = box.PDRaid;

/* Wowhead's lists: one per spec (Rogue's three specs and Priest's two healers share a guide, kept per spec as the app does) */
const lists = Object.entries(X.bis.specs).map(([key, s]) => ({ key, cls: s.className, spec: s.spec, src: s.sourceName, url: s.sourceUrl }));
const listIx = Object.fromEntries(lists.map((l, i) => [l.key, i]));
/* best rank per list for each wowItemId (an item can sit in two sections of one list, e.g. Main Hand and Off Hand) */
const ranks = {};
for (const [key, s] of Object.entries(X.bis.specs)) for (const [slot, entries] of Object.entries(s.slots)) for (const e of entries) {
  const m = (ranks[e.wowItemId] ||= {});
  const li = listIx[key];
  if (!m[li] || e.rank < m[li].rank) m[li] = { rank: e.rank, slot, note: e.note || "" };
}
/* the raid builds (Raid Composition's 29), each pointing at its spec's list; Feral (Bear) has none: Wowhead's Feral list is cat DPS */
const builds = X.raidBuilds.map(b => {
  const key = `${b.className}|${b.spec}`;
  const li = b.id === "druid-feral-tank" ? -1 : (listIx[key] ?? -1);
  return { id: b.id, cls: b.className, spec: b.spec, label: b.label, role: b.role, icon: b.icon, list: li };
});

const Q = { Epic: "e", Rare: "r", Uncommon: "u", Legendary: "l" };
const RECIPE = /^(Pattern|Plans|Formula|Schematic|Design|Recipe):/;
const items = [], itemIx = new Map();
function kindOf(e) {
  if (e.dropType === "Trash") return "x";
  if (e.dropType === "Quest Reward") return "q";
  if (e.dropType === "Tier Token") return e.itemId ? "s" : "t";
  if (RECIPE.test(e.name)) return "r";
  if (/Reins|Charger/.test(e.name) || /^Mount\b/.test(e.notes || "")) return "m";
  return "";
}
/* one entry per distinct drop; the same pattern dropping from several bosses is one item listed under each */
function itemOf(e) {
  const it = e.itemId ? X.getItemById(e.itemId) : undefined;
  const w = e.wowItemId ?? it?.wowItemId;
  const k = kindOf(e);
  const id = `${w || e.name}|${k}`;
  if (itemIx.has(id)) return itemIx.get(id);
  const x = { n: e.name, w: w || null, q: it ? (Q[it.quality] || "") : "", k };
  if (it?.slot) x.slot = it.slot;
  if (it?.itemLevel) x.ilvl = it.itemLevel;
  const st = it ? X.describeStats(it.stats) : "";
  if (st) x.st = st;
  if (it?.unique) x.uq = 1;
  /* what a game tooltip shows under the name: armor type or weapon line, damage and speed, sockets and their bonus */
  if (it?.armorType) x.at = it.armorType;
  if (it?.weaponType) x.wt = [it.handType || "", it.weaponType].filter(Boolean).join(" ");
  if (it?.weaponDamageMin) x.dmg = [it.weaponDamageMin, it.weaponDamageMax, it.weaponSpeed];
  if (it?.sockets?.length) x.sock = it.sockets;
  const sb = it?.socketBonus ? X.describeStats(it.socketBonus) : "";
  if (sb) x.sb = sb;
  const ic = X.getIconName(w);
  if (ic) x.ic = ic;
  if (e.roles?.length) x.roles = e.roles;
  const r = ranks[w];
  if (r) x.r = Object.entries(r).map(([li, v]) => [+li, v.rank, v.slot, v.note]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  if (e.needsVerification) x.nv = 1;
  if (e.notes) x.note = e.notes;
  itemIx.set(id, items.length);
  items.push(x);
  return items.length - 1;
}

const raids = X.sampleRaids.map(r => {
  const bosses = X.getBossesForRaid(r.id).map(b => ({
    id: b.id, n: b.name, o: b.encounterOrder ?? null, opt: b.optional ? 1 : 0, m: b.mechanics,
    rn: (b.roleNotes || []).map(n => [n.role, n.note]), art: X.hasBossArt(b.id) ? 1 : 0,
    loot: b.loot.map(itemOf), ...(b.needsVerification ? { nv: 1, note: b.notes || "" } : {}),
  }));
  const c = X.getAttunementChainForRaid(r.id);
  const ch = c ? {
    id: c.id, n: c.name, sum: c.summary, pre: c.prerequisites, rew: c.reward, nv: c.needsVerification ? 1 : 0, note: c.notes || "",
    steps: c.steps.map(s => ({ o: s.order, q: s.questName || "", t: s.title, req: s.requirement, loc: s.location, d: s.difficulty || "", note: s.notes || "", nv: s.needsVerification ? 1 : 0 })),
  } : null;
  return {
    id: r.id, n: r.name, tier: r.tier, sz: r.playerSize, ph: r.phase, zone: r.zone, loc: r.location, att: r.attunement,
    reset: r.resetDays, desc: r.description, ch, bosses, trash: (r.notableTrashLoot || []).map(itemOf),
    ...(r.needsVerification ? { nv: 1, note: r.notes || "" } : {}),
  };
});

const drops = raids.reduce((n, r) => n + r.bosses.reduce((m, b) => m + b.loot.length, 0) + r.trash.length, 0);
const ranked = items.filter(x => x.r).length, catalogued = items.filter(x => x.q).length;
const out = { lists, builds, raids, items, counts: { drops, items: items.length, ranked, catalogued } };
const day = new Date().toISOString().slice(0, 10);
const js = `/* raid-data.js — GENERATED by gen-raid-data.mjs on ${day} from src/domain (do not edit by hand).
   The five raids with their bosses, loot, notable trash and attunement chains (raids/), each drop's quality, slot, item
   level, stat line and icon (gear/itemCatalogue, icons/), the raid builds (raidcomp/raidBuilds) and, per drop, the specs
   whose Wowhead Phase 2 list ranks it (bis/bisRankings.json): items[i].r = [[list, rank, slot, note], ...]. A raid's
   bosses list item indices; k is the kind (t tier token, s set piece from a token, r recipe, m mount, q quest item,
   x trash); q the quality (e/r/u/l, blank when the item is not in the catalogue). */
window.RAID_DATA=${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(T, "raid-data.js"), js);
console.log(`raid-data.js written (${Math.round(js.length / 1024)} KB): ${raids.length} raids, ${raids.reduce((n, r) => n + r.bosses.length, 0)} bosses, ${drops} drops (${items.length} distinct items, ${catalogued} catalogued, ${ranked} on a Wowhead list), ${lists.length} lists, ${builds.length} builds`);
