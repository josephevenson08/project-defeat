// Generates docs/design/prototypes/tabs/buff-data.js for the three Buffs designs, from the app's real data:
// sampleBuffs.ts and sampleTargetDebuffs.ts (what each buff and debuff does, who brings it, what isn't counted),
// buffScope.json (how far each reaches, read from Wowhead tooltips), buffExclusivity.ts (one Blessing per Paladin, one
// air totem per Shaman), consumableCatalogue.json via sampleConsumables.ts, raidcompIcons.json (the buff icons the live
// app ships), raidBuilds.ts (who a raid seat can be), attributeConversions.ts (Warrior) and sampleEncounters.ts (the
// boss's armor). Run from the repo root:
//   node docs/design/prototypes/tabs/gen-buff-data.mjs
import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
/* the app's TypeScript imports its siblings without an extension; let node find the .ts files (node strips types) */
register("data:text/javascript," + encodeURIComponent(`export async function resolve(s,c,n){
  if((s.startsWith(".")||s.startsWith("/"))&&!/\\.[cm]?[jt]sx?$|\\.json$/.test(s)){for(const e of [".ts",".tsx"]){try{return await n(s+e,c);}catch{}}}
  return n(s,c);}`));
const D = "src/domain/";
const ts = p => import(pathToFileURL(path.resolve(D + p)).href);
const J = p => JSON.parse(fs.readFileSync(D + p, "utf8"));
const { modelledBuffs, unmodelledBuffs } = await ts("buffs/sampleBuffs.ts");
const { modelledTargetDebuffs, unmodelledTargetDebuffs } = await ts("buffs/sampleTargetDebuffs.ts");
const { exclusiveGroups } = await ts("buffs/buffExclusivity.ts");
const { sampleConsumables } = await ts("consumables/sampleConsumables.ts");
const { raidBuilds } = await ts("raidcomp/raidBuilds.ts");
const { getAttributeConversions } = await ts("character/attributeConversions.ts");
const { sampleEncounters } = await ts("simulation/sampleEncounters.ts");
const scopes = J("buffs/buffScope.json").scopes;
const icons = J("raidcomp/raidcompIcons.json").spellIcons;

const ROLE = "Physical DPS"; /* the planner's character is a Fury Warrior */
const fits = x => !x.roles || x.roles.includes(ROLE);
const KEY = { strength: "Str", agility: "Agi", stamina: "Sta", intellect: "Int", spirit: "Spi", attackPower: "AP", critRating: "Crit",
  hitRating: "Hit", hasteRating: "Haste", armor: "Armor", expertiseRating: "Expertise", armorPenetration: "ArP", defenseRating: "Defense" };
/* ranged attack power, spell and mana stats do nothing for a Warrior: dropped from what the designs show */
const pairs = o => Object.entries(o || {}).filter(([k, v]) => KEY[k] && v).map(([k, v]) => [KEY[k], Math.round(v * 1e4) / 1e4]);
/* how far a buff reaches. buffScope.json reads "Party" from each tooltip, but four of those tooltips say "the target's
   party": the caster picks the group, so one caster covers every group (one cast each). The rest reach only the
   caster's own group. */
function reach(id) {
  const s = scopes[id]; if (!s) return "unknown";
  if (s.scope === "Party") return /target's party/.test(s.evidence) ? "any group" : "your group";
  return { Raid: "whole raid", Single: "one player", Target: "on the boss" }[s.scope] || "unknown";
}
/* Anniversary realms: Blizzard's patch 2.5.5 notes make Heroism/Bloodlust raid-wide (the original TBC tooltip, which
   buffScope.json read, says "all party members"). The owner confirmed it on 2026-10-09. */
const REACH_OVERRIDE = { bloodlust: "whole raid" };
/* which Shaman spec drops which totem, as raids run them (the owner's call, 2026-10-09): Enhancement in a melee group
   brings Strength of Earth, Grace of Air and Windfury (twisting the two air totems), Elemental brings Totem of Wrath and
   Wrath of Air, Restoration Mana Spring and Mana Tide. Tranquil Air is left out: no spec brings it. */
const TOTEM_SPECS = { "strength-of-earth-totem": ["Enhancement"], "grace-of-air-totem": ["Enhancement"], "windfury-totem": ["Enhancement"],
  "totem-of-wrath": ["Elemental"], "wrath-of-air-totem": ["Elemental"], "mana-spring-totem": ["Restoration"], "mana-tide-totem": ["Restoration"] };
const DROP = new Set(["tranquil-air-totem"]);
/* the uptimes behind the three averaged buffs, as the comments in sampleBuffs.ts record them (the reference Hydross
   parse); value = full effect x uptime */
const UPTIME = { bloodlust: 0.3451, "unleashed-rage": 0.9418, "ferocious-inspiration": 0.9771 };
const common = b => {
  const x = { id: b.id, name: b.name, cls: b.providedByClass, spec: b.providedBySpec || null, reach: REACH_OVERRIDE[b.id] || reach(b.id), icon: (icons[b.id] || {}).icon || null };
  const specs = TOTEM_SPECS[b.id] || (b.providedBySpec ? [b.providedBySpec] : null);
  if (specs) x.specs = specs;
  if (REACH_OVERRIDE[b.id]) x.anniversary = true;
  return x;
};

const buffs = modelledBuffs.filter(b => fits(b) && !DROP.has(b.id)).map(b => {
  const x = Object.assign(common(b), { stats: pairs(b.stats), mult: pairs(b.statMultipliers), after: pairs(b.statMultipliersAfterConversion) });
  if (b.hastePercent) x.haste = b.hastePercent;
  if (b.damageMultiplier) x.dmg = b.damageMultiplier;
  if (UPTIME[b.id]) x.uptime = UPTIME[b.id];
  if (b.id === "bloodlust") x.alliance = "Heroism"; /* its note: "the Alliance equivalent is Heroism (spell 32182), identical in every value" */
  if (b.id === "battle-shout") x.talented = { talent: "Commanding Presence", ap: 382 }; /* its note: 5/5 raises it to 382 */
  return x;
});
const uncounted = unmodelledBuffs.filter(b => fits(b) && !DROP.has(b.id)).map(b => Object.assign(common(b), { why: b.notModelled }));
/* every Greater Blessing, for assigning Paladins: Kings and Might are counted, Salvation is listed above; Wisdom and
   Sanctuary do nothing the planner counts for a Fury Warrior, so they appear only as assignment choices */
const BLESS = ["blessing-of-kings", "blessing-of-might", "blessing-of-salvation", "blessing-of-wisdom", "blessing-of-sanctuary"];
const extraBlessings = [...modelledBuffs, ...unmodelledBuffs].filter(b => BLESS.includes(b.id) && !fits(b)).map(b => Object.assign(common(b), { why: b.notModelled || "" , stats: pairs(b.stats) }));
/* boss debuffs that touch physical damage: armor, physical crit and physical hit. Caster-only ones are left out. */
const debuffs = modelledTargetDebuffs.filter(d => d.armorReduction || d.physicalCritTakenBonus || d.physicalHitTakenBonus).map(d =>
  Object.assign(common(d), { armor: d.armorReduction || 0, crit: d.physicalCritTakenBonus || 0, hit: d.physicalHitTakenBonus || 0 }));
const uncountedDebuffs = unmodelledTargetDebuffs.filter(d => /attack power|melee|physical/i.test(d.notModelled || "")).map(d => Object.assign(common(d), { why: d.notModelled }));
const CAT = { Flask: "flask", "Battle Elixir": "battle", "Guardian Elixir": "guardian", Food: "food" };
const consumables = sampleConsumables.filter(fits).map(c => {
  const x = { id: c.id, name: c.name, cat: CAT[c.category], stats: pairs(c.stats) };
  const extra = Object.entries(c.extraStats || {}).map(([k, v]) => [k.replace(/([a-z])([A-Z])/g, "$1 $2"), v]);
  if (extra.length) x.extra = extra;
  if (c.notes) x.note = c.notes;
  return x;
});
const known = new Set([...buffs, ...uncounted].map(b => b.id));
/* Blessings are assigned Paladin by Paladin (see BLESS), and Enhancement twists both air totems, so those two groups go;
   one aura per Paladin and one shout per Warrior stay */
const groups = exclusiveGroups.filter(g => !["paladin-blessings", "shaman-air-totem"].includes(g.id))
  .map(g => ({ id: g.id, label: g.label, ids: g.buffIds.filter(id => known.has(id)), basis: g.basis, evidence: g.evidence })).filter(g => g.ids.length > 1);
const conv = Object.fromEntries(getAttributeConversions("Warrior").map(c => [c.from + ">" + c.to, c.perPoint]));
const builds = raidBuilds.map(b => ({ id: b.id, cls: b.className, spec: b.spec, label: b.label, role: b.role, icon: b.icon }));
const boss = sampleEncounters[0];

const out = { role: ROLE, buffs, uncounted, debuffs, uncountedDebuffs, consumables, groups, builds, blessings: BLESS, extraBlessings,
  conv: { strAP: conv["strength>attackPower"], agiCrit: conv["agility>critRating"], agiArmor: conv["agility>armor"],
    /* 33 Agility buys 1% crit (the upstream formula), so this is the crit rating per 1% */
    critPerPct: Math.round(conv["agility>critRating"] * 33 * 100) / 100 },
  boss: { name: boss.name, level: boss.targetLevel || 73, armor: boss.armor } };
const js = `/* buff-data.js — GENERATED by gen-buff-data.mjs from src/domain (do not edit by hand).
   Raid buffs, boss debuffs and consumables for a ${ROLE} character, with who brings each, how far it reaches, what the
   live app does not count and why, the exclusive groups, the raid builds, Warrior conversions and the boss's armor. */
window.BUFF_DATA=${JSON.stringify(out)};
`;
fs.writeFileSync("docs/design/prototypes/tabs/buff-data.js", js);
console.log(`buff-data.js written (${Math.round(js.length / 1024)} KB): ${buffs.length} counted buffs, ${uncounted.length} not counted, ${debuffs.length} debuffs (+${uncountedDebuffs.length} not counted), ${consumables.length} consumables, ${groups.length} exclusive groups, ${builds.length} builds; boss armor ${out.boss.armor}`);
