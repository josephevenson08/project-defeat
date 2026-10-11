// Builds sim-engine.js and sim-data.js for the Simulation designs. Run from the repo root:
//   node docs/design/prototypes/tabs/gen-sim-engine.mjs
// sim-engine.js is the live app's own simulator, bundled from src/ with the rolldown Vite already ships (the way
// tools/brain/generate-brain.mjs bundles the domain): window.PDSim.run(build) takes the app's saved-build format
// (build-common.js writes it) and returns exactly what the app computes for it: stats, the DPS estimate with its damage
// sources, breakdown and caveats, and optionally stat weights and the upgrade finder. Nothing is reimplemented here.
// sim-data.js holds what doesn't change with the character: archon.gg's observed averages for the 20 DPS specs
// (src/domain/simulation/dpsReference.ts), and each spec's best case worked out by the same model, the way
// tests/planner.spec.ts's bestCaseSimulation does it (rank-1 BiS, every buff and consumable, the sourced talents).
// Regenerate after the simulator or its data change; never hand-edit either file.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const REPO = path.resolve(".");
const T = path.join(REPO, "docs/design/prototypes/tabs");
const { rolldown } = await import(pathToFileURL(path.join(REPO, "node_modules/rolldown/dist/index.mjs")).href);

const ENTRY = `
import { validateBuild, applySavedGear } from '../../src/domain/builds/buildSerialization'
import { emptyGear, normalizeGearForCharacter } from '../../src/features/gear/gearData'
import { getRoleForSpec } from '../../src/features/character/characterData'
import { deriveTalentModifiers } from '../../src/domain/talents/talentModifiers'
import { calculateStats } from '../../src/features/stats/calculateStats'
import { calculateSimulation } from '../../src/features/simulator/calculateSimulation'
import { calculateStatWeights } from '../../src/features/simulator/calculateStatWeights'
import { findUpgrades } from '../../src/features/simulator/findUpgrades'
import { getIconName } from '../../src/domain/icons/icons'
import { getItemById } from '../../src/domain/gear/itemCatalogue'
import { defaultGear } from '../../src/domain/gear/defaultGear'
import { getBisListForSpec } from '../../src/domain/bis/bisLists'
import { getTalentData } from '../../src/domain/talents/sampleTalents'
import { sampleBuffs } from '../../src/domain/buffs/sampleBuffs'
import { sampleConsumables } from '../../src/domain/consumables/sampleConsumables'
import { modelledTargetDebuffs } from '../../src/domain/buffs/sampleTargetDebuffs'
import { racesByClass } from '../../src/domain/character/races'
import { tbcClasses } from '../../src/domain/character/tbcClasses'
import { dpsReference, DPS_REFERENCE_SOURCE } from '../../src/domain/simulation/dpsReference'
import talentBuilds from '../../src/domain/talents/talentBuilds.json' with { type: 'json' }

/** What the app computes for a saved build, the way App.tsx does (gearFromBuild, then the three memos). */
export function run(raw, opts = {}) {
  const v = validateBuild(raw)
  if (!v.ok) return { ok: false, error: v.error }
  const b = v.build
  const base = normalizeGearForCharacter(emptyGear, b.character.className, b.character.spec)
  const gear = normalizeGearForCharacter(applySavedGear(base, b.gear), b.character.className, b.character.spec)
  const role = getRoleForSpec(b.character.className, b.character.spec)
  const tp = b.talentPoints ?? {}
  const stats = calculateStats(b.character, gear, b.activeBuffIds, b.activeConsumableIds, undefined, deriveTalentModifiers(tp))
  const simulation = calculateSimulation(b.character, gear, stats, role, b.activeTargetDebuffIds, b.target, tp, b.activeBuffIds)
  const weights = opts.weights ? calculateStatWeights(b.character, gear, role, b.activeBuffIds, b.activeConsumableIds, b.activeTargetDebuffIds, b.target, tp) : undefined
  const upgrades = opts.upgrades ? findUpgrades(b.character, gear, role, b.activeBuffIds, b.activeConsumableIds, b.activeTargetDebuffIds, b.target, tp) : undefined
  return { ok: true, issues: v.issues, role, stats, simulation, weights, upgrades }
}

/** tests/planner.spec.ts bestCaseSimulation, unchanged in substance. */
export function bestCase(className, spec) {
  const role = getRoleForSpec(className, spec)
  const character = { faction: 'Alliance', race: racesByClass[className][0], className, spec }
  let gear = normalizeGearForCharacter(defaultGear, className, spec)
  const list = getBisListForSpec(className, spec)
  const filled = new Set()
  const equip = (slot, entry) => {
    const item = getItemById(entry.itemId)
    if (!item) return false
    gear = { ...gear, [slot]: { ...gear[slot], item, gemIds: entry.recommendedGemIds ?? [], ...(entry.recommendedEnchantId ? { enchantId: entry.recommendedEnchantId } : {}) } }
    return true
  }
  for (const entry of list?.entries ?? []) {
    if (entry.rank !== 1 || filled.has(entry.slot)) continue
    if (equip(entry.slot, entry)) filled.add(entry.slot)
  }
  for (const [ranked, paired] of [['Finger 1', 'Finger 2'], ['Trinket 1', 'Trinket 2']]) {
    if (filled.has(paired)) continue
    const second = list?.entries.find((entry) => entry.slot === ranked && entry.rank === 2)
    if (second && equip(paired, second)) filled.add(paired)
  }
  const sourced = talentBuilds.builds.find((build) => build.className === className && build.spec === spec)
  const points = sourced ? { ...sourced.points } : {}
  if (!sourced) {
    const tree = getTalentData(className)?.trees.find((entry) => entry.spec === spec)
    let spent = 0
    for (const talent of tree?.talents ?? []) { if (spent >= 61) break; const rank = Math.min(talent.maxRank, 61 - spent); points[talent.id] = rank; spent += rank }
  }
  const buffIds = sampleBuffs.map((buff) => buff.id)
  const stats = calculateStats(character, gear, buffIds, sampleConsumables.map((c) => c.id), undefined, deriveTalentModifiers(points))
  const result = calculateSimulation(character, gear, stats, role, modelledTargetDebuffs.map((d) => d.id), undefined, points, buffIds)
  return { role, score: result.scoreExact }
}

export const dpsSpecs = () => tbcClasses.flatMap((c) => c.specs.map((spec) => ({ className: c.className, spec })))
  .filter((x) => { const r = getRoleForSpec(x.className, x.spec); return r === 'Physical DPS' || r === 'Caster DPS' })
export const icon = (wowItemId) => getIconName(wowItemId) ?? null
export { dpsReference, DPS_REFERENCE_SOURCE }
`;

const inside = path.join(REPO, "node_modules", ".sim-engine");
fs.mkdirSync(inside, { recursive: true });
const entry = path.join(inside, "entry.ts");
fs.writeFileSync(entry, ENTRY);
const bundle = await rolldown({ input: entry, platform: "browser", logLevel: "warn" });
const { output } = await bundle.generate({ format: "iife", name: "PDSim", minify: true });
await bundle.close?.();
fs.rmSync(inside, { recursive: true, force: true });
const day = new Date().toISOString().slice(0, 10);
const engine = `/* sim-engine.js — GENERATED by gen-sim-engine.mjs on ${day} (do not edit by hand). The live app's simulator, bundled
   from src/ (calculateStats, calculateSimulation, calculateStatWeights, findUpgrades and the data they read):
   window.PDSim.run(savedBuild, {weights, upgrades}). */
${output[0].code}`;
fs.writeFileSync(path.join(T, "sim-engine.js"), engine);

/* the fixed data: references, and each DPS spec's best case by this same model */
const ctx = {}; vm.createContext(ctx); vm.runInContext(output[0].code, ctx);
const P = ctx.PDSim;
const specs = P.dpsSpecs().map(({ className, spec }) => {
  const ref = P.dpsReference.find((r) => r.className === className && r.spec === spec);
  const best = P.bestCase(className, spec);
  return { className, spec, role: best.role, best: Math.round(best.score * 10) / 10, observed: ref ? ref.dps : null, tier: ref ? ref.tier : null };
}).sort((a, b) => (b.observed || 0) - (a.observed || 0));
const data = { source: P.DPS_REFERENCE_SOURCE, specs };
fs.writeFileSync(path.join(T, "sim-data.js"), `/* sim-data.js — GENERATED by gen-sim-engine.mjs on ${day} (do not edit by hand). archon.gg's observed averages for the
   20 DPS specs (src/domain/simulation/dpsReference.ts), and each spec's best case by the live app's own model: rank-1 BiS,
   every buff and consumable, the sourced talents (tests/planner.spec.ts bestCaseSimulation). */
window.SIM_DATA=${JSON.stringify(data)};
`);
console.log(`sim-engine.js ${Math.round(engine.length / 1024)} KB; ${specs.length} DPS specs:`);
for (const s of specs) console.log(`  ${(s.spec + " " + s.className).padEnd(26)} best ${String(s.best).padStart(7)}  observed ${s.observed}  ${s.observed ? (s.observed / s.best).toFixed(2) + "x" : ""}`);
