// Generates docs/design/prototypes/tabs/gear-data.js for the three Gear designs, from the app's real data:
// bisRankings.json (Fury Warrior Phase 2), bisRecommendations.json, itemCatalogue.json, enchantCatalogue.json,
// gemCatalogue.json, icons.json and the raid boss loot tables. Run from the repo root.
import fs from "node:fs";
const D = "src/domain/";
const J = p => JSON.parse(fs.readFileSync(D + p, "utf8"));
const ranks = J("bis/bisRankings.json").specs["Warrior|Fury"];
const rec = J("bis/bisRecommendations.json").specs["Warrior|Fury"];
const items = J("gear/itemCatalogue.json").items, byW = new Map(items.map(i => [i.wowItemId, i]));
const ench = J("enchants/enchantCatalogue.json").enchants, enchById = new Map(ench.map(e => [e.id, e]));
const gems = J("gems/gemCatalogue.json").gems, gemById = new Map(gems.map(g => [g.id, g]));
const icons = J("icons/icons.json").icons;
const iconOf = w => icons[String(w)] || null;

/* boss for each wowItemId, read from the raid boss files (boss order kept) */
const bossOf = {};
for (const [file, raid] of [["karazhanBosses", "Karazhan"], ["gruulsLairBosses", "Gruul's Lair"], ["magtheridonsLairBosses", "Magtheridon's Lair"],
  ["serpentshrineCavernBosses", "Serpentshrine Cavern"], ["tempestKeepBosses", "Tempest Keep"]]) {
  const t = fs.readFileSync(D + "raids/" + file + ".ts", "utf8");
  const starts = [...t.matchAll(/name: '((?:[^'\\]|\\.)+)',\s*raidId: '[^']+',\s*encounterOrder: (\d+)/g)].map(m => ({ i: m.index, name: m[1].replace(/\\'/g, "'"), order: +m[2] }));
  for (const m of t.matchAll(/wowItemId: (\d+)/g)) {
    const b = [...starts].reverse().find(s => s.i < m.index);
    if (b && !bossOf[m[1]]) bossOf[m[1]] = { boss: b.name, raid, order: b.order };
  }
}

const STAT = { strength: "Str", agility: "Agi", stamina: "Sta", attackPower: "AP", hitRating: "Hit", critRating: "Crit", hasteRating: "Haste", expertiseRating: "Expertise", armorPenetration: "ArP", armorPenetrationRating: "ArP", intellect: "Int", spirit: "Spi", defenseRating: "Def" };
const stats = s => Object.entries(s || {}).filter(([k]) => STAT[k]).map(([k, v]) => [STAT[k], v]);

const SLOTS = [
  ["Head", "HD", "Head", "left"], ["Neck", "NK", "Neck", "left"], ["Shoulders", "SH", "Shoulders", "left"], ["Back", "BK", "Back", "left"],
  ["Chest", "CH", "Chest", "left"], ["Wrists", "WR", "Wrists", "left"], ["Hands", "HN", "Hands", "right"], ["Waist", "WA", "Waist", "right"],
  ["Legs", "LG", "Legs", "right"], ["Feet", "FT", "Feet", "right"], ["Finger 1", "F1", "Finger 1", "right"], ["Finger 2", "F2", "Finger 1", "right"],
  ["Trinket 1", "T1", "Trinket 1", "right"], ["Trinket 2", "T2", "Trinket 1", "right"], ["Main Hand", "MH", "Main Hand", "bottom"],
  ["Off Hand", "OH", "Off Hand", "bottom"], ["Ranged", "RG", "Ranged", "bottom"]];

const outItems = {}, lists = {};
/* Tier 5 pieces come from tokens, which the loot tables list as tokens rather than by the piece's id (the prototype
   brief's corrected token bosses); Pendant of the Perilous is Serpentshrine Cavern trash (also a brief correction). */
const TOKEN = { 30120: ["Lady Vashj", "Serpentshrine Cavern", 6], 30122: ["Void Reaver", "Tempest Keep", 2], 30118: ["Kael'thas Sunstrider", "Tempest Keep", 4],
  30119: ["Leotheras the Blind", "Serpentshrine Cavern", 3], 30121: ["Fathom-Lord Karathress", "Serpentshrine Cavern", 4] };
const RAIDS = { "serpentshrine cavern": "Serpentshrine Cavern", "tempest keep": "Tempest Keep", "karazhan": "Karazhan", "gruul's lair": "Gruul's Lair", "magtheridon's lair": "Magtheridon's Lair" };
const cleanSource = (src, w) => {
  if (TOKEN[w]) { const [boss, raid, order] = TOKEN[w]; return { text: `T5 token · ${boss}, ${raid}`, boss, raid, order, token: true }; }
  if (w === 30022) return { text: "Trash drop, Serpentshrine Cavern", boss: null, raid: "Serpentshrine Cavern" };
  const b = bossOf[w];
  if (b) return { text: `${b.boss}, ${b.raid}`, boss: b.boss, raid: b.raid, order: b.order };
  let s = String(src || "").replace(/\s+/g, " ").trim();
  const raidIn = Object.keys(RAIDS).find(r => s.toLowerCase().includes(r));
  s = s.replace(/^Drop: \(World Boss\)$/, "World boss drop").replace(/^Drop: Trash Mobs$/, "Trash drop")
    .replace(/^Drop: Zone Drop \((.*)\)$/, "Trash drop, $1").replace(/^Drop: from \((.*)\)$/, "Drop, $1").replace(/^Drop: \((.*)\)$/, "Drop, $1")
    .replace(/^Vendor: \((.*)\)$/, "Vendor, $1").replace(/^PvP: (\d+)$/, "PvP, $1 rating").replace(/^Quest:?$/, "Quest").replace(/^Profession: /, "");
  if (raidIn) s = s.replace(new RegExp(raidIn, "i"), RAIDS[raidIn]);
  return { text: s || "Unknown source", boss: null, raid: raidIn ? RAIDS[raidIn] : null };
};
for (const [key, list] of Object.entries(ranks.slots)) {
  lists[key] = list.map(e => {
    const it = byW.get(e.wowItemId);
    if (!it) throw new Error("no catalogue item " + e.wowItemId);
    outItems[it.id] = outItems[it.id] || {
      id: it.id, w: it.wowItemId, name: it.name, q: it.quality, ilvl: it.itemLevel, icon: iconOf(it.wowItemId), phase: it.phase,
      stats: stats(it.stats), sockets: it.sockets || [], bonus: stats(it.socketBonus), set: it.setId || null, unique: !!it.unique,
      ...(it.weaponType ? { weapon: `${it.handType || ""} ${it.weaponType}`.trim(), speed: it.weaponSpeed, dmg: [it.weaponDamageMin, it.weaponDamageMax] } : {}),
      src: cleanSource(e.source, e.wowItemId)
    };
    return { id: it.id, rank: e.rank, note: e.note };
  });
}

/* enchants: Wowhead's pick per slot first, then the other options the catalogue allows there (warrior-usable, stat-bearing or proc) */
/* only enchants a physical damage dealer would use: melee stats, or a weapon proc like Mongoose */
const PHYS = ["strength", "agility", "attackPower", "hitRating", "critRating", "hasteRating", "expertiseRating", "armorPenetration"];
const enchFor = slot => ench.filter(e => (e.slot === slot || (e.allowedSlots || []).includes(slot)) && (!e.allowedClasses || e.allowedClasses.includes("Warrior")) && !e.requiresShield
  && (Object.keys(e.stats || {}).some(k => PHYS.includes(k) && e.stats[k] > 0) || (e.notModelled && /Main Hand|Off Hand/.test(slot))));
const outEnch = {}, enchOpts = {};
for (const [slot] of SLOTS) {
  const key = slot === "Finger 2" ? "Finger 1" : slot;
  const opts = enchFor(key);
  const best = rec.enchants[key];
  /* Wowhead's pick always stays, even when its effect isn't a stat the filter knows (a scope's ranged damage) */
  const bestE = best && enchById.get(best);
  if (bestE && !opts.includes(bestE)) opts.unshift(bestE);
  if (!opts.length) continue;
  const ordered = [...opts].sort((a, b) => (b.id === best) - (a.id === best));
  enchOpts[slot] = { best: best || null, ids: ordered.slice(0, 5).map(e => e.id) };
  for (const e of ordered.slice(0, 5)) outEnch[e.id] = { id: e.id, name: e.name.replace(/^(Enchant \w+|Weapon|Bracer|Gloves|Chest|Ring|Cloak|Boots) - /, ""), stats: stats(e.stats), note: e.notModelled ? "proc" : "" };
}

/* gems: the recommended four, plus the common physical-DPS alternatives that exist in the catalogue */
const GEMS = [rec.gems.Meta, rec.gems.Red, rec.gems.Yellow, rec.gems.Blue, "delicate-living-ruby", "bright-living-ruby", "rigid-dawnstone", "smooth-dawnstone", "glinting-noble-topaz", "jagged-talasite"].filter(Boolean);
const outGems = {};
for (const id of GEMS) { const g = gemById.get(id); if (!g) continue; outGems[id] = { id, name: g.name, color: g.color, q: g.quality, icon: iconOf(g.wowItemId), stats: stats(g.stats) }; }
const gemFor = { Meta: rec.gems.Meta, Red: rec.gems.Red, Yellow: rec.gems.Yellow, Blue: rec.gems.Blue };

/* the recommended set: rank 1 per slot; the second ring and trinket take the next one down (unique-equipped) */
const equip = {}, used = new Set();
for (const [slot, , listKey] of SLOTS) {
  const pick = lists[listKey].find(e => !(outItems[e.id].unique && used.has(e.id)) && !(slot.endsWith("2") && used.has(e.id)));
  used.add(pick.id);
  const it = outItems[pick.id];
  const enc = enchOpts[slot] && enchOpts[slot].best && !slot.startsWith("Finger") ? enchOpts[slot].best : null; /* ring enchants need Enchanting */
  equip[slot] = { item: pick.id, enchant: enc, gems: it.sockets.map(c => gemFor[c] || rec.gems.Red) };
}

const SET = { "destroyer-battlegear": { name: "Destroyer Battlegear", pieces: 5, bonuses: [[2, "Your Overpower ability now grants you 100 attack power for 5 sec."], [4, "Your Bloodthirst and Mortal Strike abilities cost 5 less rage."]] } };

/* hit rating from gear, gems and enchants for the recommended set (to compare against the planner's 140) */
let hit = 0;
for (const [slot, e] of Object.entries(equip)) {
  const it = outItems[e.item];
  hit += (it.stats.find(s => s[0] === "Hit") || [0, 0])[1];
  if (e.enchant) hit += (outEnch[e.enchant].stats.find(s => s[0] === "Hit") || [0, 0])[1];
  e.gems.forEach(g => { hit += ((outGems[g] || { stats: [] }).stats.find(s => s[0] === "Hit") || [0, 0])[1]; });
}

const data = { source: { ranks: ranks.sourceName || "Wowhead Fury Warrior Phase 2 BiS guide", url: ranks.sourceUrl, recUrl: rec.sourceUrl },
  slots: SLOTS.map(([key, glyph, list, side]) => ({ key, glyph, list, side })), lists, items: outItems, enchants: outEnch, enchOpts, gems: outGems, gemFor, equip, sets: SET };
const out = `/* gear-data.js — real data for the three Gear sub-tab designs (generated ${new Date().toISOString().slice(0, 10)}).
   From src/domain: bis/bisRankings.json (Warrior|Fury, Phase 2), bis/bisRecommendations.json, gear/itemCatalogue.json,
   enchants/enchantCatalogue.json, gems/gemCatalogue.json, icons/icons.json and the raid boss loot tables.
   Icons are the files the live app ships in public/icons. Regenerate rather than hand-editing. */
window.GEAR_DATA=${JSON.stringify(data)};
`;
fs.writeFileSync("docs/design/prototypes/tabs/gear-data.js", out);
console.log("wrote", out.length, "bytes;", Object.keys(outItems).length, "items,", Object.keys(outEnch).length, "enchants,", Object.keys(outGems).length, "gems; gear hit rating", hit);
console.log("equipped:", Object.entries(equip).map(([s, e]) => s + "=" + outItems[e.item].name + (e.enchant ? " +" + outEnch[e.enchant].name : "") + (e.gems.length ? " [" + e.gems.join(",") + "]" : "")).join("\n  "));
console.log("missing icons:", Object.values(outItems).filter(i => !i.icon).map(i => i.name), Object.values(outGems).filter(g => !g.icon).map(g => g.name));
console.log("no boss:", Object.values(outItems).filter(i => !i.src.boss).map(i => i.name + " ← " + i.src.text).join("\n  "));
