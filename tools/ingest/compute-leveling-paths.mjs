// Computes a levelling path per profession from the ingested recipe facts.
//
// **This is the derivation, and it is the whole reason the ingest exists.** Wowhead publishes what a
// recipe consumes and where it turns orange, yellow, green and grey. It does not publish "craft 102
// of these" — every guide that quotes a number worked it out, and so does this. Taking their number
// would be taking their work; taking the colour breakpoints and doing the arithmetic is not.
//
// The skill-up model
// ------------------
// A craft raises skill with a probability that falls linearly from certain to zero as the recipe
// fades from orange through yellow and green to grey:
//
//     chance(skill) = 1                                    while skill < yellow
//                   = (grey - skill) / (grey - yellow)     while yellow <= skill < grey
//                   = 0                                    at grey and above
//
// **That is the community's model rather than Blizzard's published one**, which has never been
// released, and the output says so on screen. It is the standard formula every crafting calculator
// uses, it is exactly right at both ends, and the expected craft count is its reciprocal summed over
// the skill points being crossed.
//
// Choosing the recipe
// -------------------
// At each skill point the cheapest recipe wins, where cheapest means **fewest reagent items per
// point of skill** — expected crafts multiplied by reagents per craft. It counts items, not gold,
// because this repo has no price data and inventing one would be inventing the answer. That is a
// real limitation and it is recorded next to the number: a path that saves ten Netherweave Cloth by
// spending two Primal Might is worse than it looks here.
//
// Trainer-taught recipes are preferred where they compete, since a path built on world drops is not
// a path a leveller can follow.
//
// Run: node tools/ingest/compute-leveling-paths.mjs
// Writes: src/domain/professions/craftingPaths.json

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const IN_PATH = resolve(HERE, 'data/professionRecipes.json')
const OUT_PATH = resolve(REPO, 'src/domain/professions/craftingPaths.json')

const SKILL_CAP = 375
/** Wowhead's source code for "taught by a trainer". */
const TRAINER = 2

const { professions } = JSON.parse(readFileSync(IN_PATH, 'utf8'))

/** Probability that one craft at `skill` raises it. See the model note above. */
function skillUpChance(recipe, skill) {
  const [, yellow, , grey] = recipe.colors
  if (skill >= grey) return 0
  if (skill < yellow) return 1
  // A recipe whose yellow and grey coincide is a single-point craft; treat it as certain, not NaN.
  if (grey <= yellow) return 1
  return (grey - skill) / (grey - yellow)
}

/**
 * Item name -> the recipe of this profession that produces it.
 *
 * Lowest-yield recipe wins a tie, so an expansion quotes what you must gather rather than the best
 * case. A recipe that consumes what it makes is skipped: Alchemy's transmutes form real cycles
 * (Primal Air to Fire, Primal Fire to Air) and one of them would otherwise expand forever.
 */
function outputIndex(recipes) {
  const byOutput = new Map()
  for (const recipe of recipes) {
    if (!recipe.creates) continue
    if (recipe.reagents.some((reagent) => reagent.itemId === recipe.creates.itemId)) continue

    /*
     * **A transmute is a lateral swap, not an intermediate craft, so it never sources an expansion.**
     * Dropping self-referential chains was not enough: with Earth-to-Life blocked, the next recipe in
     * the ring answered instead, and the shopping list read "23 Essence of Earth <- 23 Essence of
     * Water". That is true and useless — both are world drops of the same tier, equally hard to get,
     * so the expansion reduces nothing. There are 25 of these and Blizzard names every one of them
     * "Transmute: X to Y", which is the discriminator rather than a guess about item tiers.
     */
    if (/^Transmute:/.test(recipe.name)) continue
    const existing = byOutput.get(recipe.creates.name)
    if (!existing || (recipe.creates.min || 1) < (existing.creates.min || 1)) {
      byOutput.set(recipe.creates.name, recipe)
    }
  }
  return byOutput
}

/**
 * What a material costs if you make it rather than buy it, flattened to things you cannot craft.
 *
 * **Offered rather than prescribed, which is why it does not replace the material.** A step asking
 * for 39 Bolt of Linen Cloth is a step asking for 78 Linen Cloth, since nobody farms bolts — but
 * "31 Primal Air" is a world drop that merely happens to be transmutable, and telling a player to
 * transmute it would be worse advice than saying nothing. Only the player knows which they have.
 * Both numbers are shown and the wording says "if you craft it".
 *
 * Flattened to base materials rather than shown as a tree: Bolt of Imbued Netherweave is bolts and
 * dust, and the bolts are cloth. What a player takes to the auction house is the leaves.
 */
function expandMaterial(name, quantity, byOutput, seen = new Set(), depth = 0) {
  const recipe = byOutput.get(name)
  if (!recipe || depth > 4 || seen.has(name)) return null

  const yieldPer = Math.max(1, recipe.creates?.min ?? 1)
  const crafts = Math.ceil(quantity / yieldPer)
  const nextSeen = new Set(seen).add(name)

  const flattened = new Map()
  for (const reagent of recipe.reagents) {
    const needed = reagent.quantity * crafts
    const deeper = expandMaterial(reagent.name, needed, byOutput, nextSeen, depth + 1)
    // `deeper` is a record, not a list — its `materials` are the leaves to fold in.
    const leaves = deeper?.materials ?? [{ name: reagent.name, quantity: needed, icon: reagent.icon }]
    for (const leaf of leaves) {
      const running = flattened.get(leaf.name)
      if (running) running.quantity += leaf.quantity
      else flattened.set(leaf.name, { ...leaf })
    }
  }

  /*
   * **A chain that loops back to its own starting material expands to nothing useful, so it expands
   * to nothing.** Alchemy's transmutes are a genuine cycle — Earth to Life and Life to Earth both
   * exist — and the `seen` guard stops the recursion but then emits the blocked material as a leaf.
   * The result reads "to make 31 Essence of Earth you need 31 Essence of Earth", which is worse than
   * silence. Dropping the expansion leaves the reagent standing on its own, which is correct: these
   * are world drops that merely happen to be transmutable.
   */
  const leaves = [...flattened.values()]
  if (leaves.some((leaf) => leaf.name === name || seen.has(leaf.name))) return null

  return { crafts, of: name, materials: leaves }
}

/** Reagent items consumed by one craft. Items, not gold — see the note above. */
function reagentCost(recipe) {
  return recipe.reagents.reduce((sum, reagent) => sum + reagent.quantity, 0)
}

/**
 * The cheapest recipe to press at this skill point.
 *
 * Ties break toward the trainer-taught option, then toward the one that stays useful longest, so a
 * path does not flap between two equal recipes and fragment into one-point steps.
 */
function bestAt(recipes, skill, staying) {
  let best = null
  let bestCost = Number.POSITIVE_INFINITY

  /*
   * **Stickiness, so the path does not flap.** Two recipes often trade places for two or three skill
   * points, which produces a correct path nobody would follow — "make 2 of these, 3 of those, then 30
   * of these again". A challenger has to be meaningfully cheaper to displace the recipe already in
   * use, which is also what a player does: you keep pressing the button until it stops paying.
   */
  const STAY_MARGIN = 1.15

  for (const recipe of recipes) {
    if (recipe.learnedAt > skill) continue
    const chance = skillUpChance(recipe, skill)
    if (chance <= 0) continue

    const raw = reagentCost(recipe) / chance / (recipe.skillUpsPerCraft || 1)
    const cost = staying && recipe.spellId === staying.spellId ? raw / STAY_MARGIN : raw
    const trainer = Array.isArray(recipe.source) && recipe.source.includes(TRAINER)
    const bestTrainer = best && Array.isArray(best.source) && best.source.includes(TRAINER)

    const better =
      cost < bestCost - 1e-9 ||
      (Math.abs(cost - bestCost) <= 1e-9 &&
        ((trainer && !bestTrainer) || (trainer === bestTrainer && best && recipe.colors[3] > best.colors[3])))

    if (better) {
      best = recipe
      bestCost = cost
    }
  }

  return best
}

/**
 * Walks the skill line and groups consecutive points using the same recipe into one step.
 *
 * Expected crafts accumulate per point rather than per step, because the chance changes as the
 * recipe fades — 1/chance summed across the range, not the range divided by one chance.
 */
function computePath(recipes) {
  const byOutput = outputIndex(recipes)
  const steps = []
  let current = null

  for (let skill = 1; skill < SKILL_CAP; skill += 1) {
    const recipe = bestAt(recipes, skill, current)
    if (!recipe) {
      // No craftable recipe raises skill here: a real gap, usually waiting on a trainer rank.
      if (current) {
        steps.push(current)
        current = null
      }
      continue
    }

    if (!current || current.spellId !== recipe.spellId) {
      if (current) steps.push(current)
      current = {
        spellId: recipe.spellId,
        name: recipe.name,
        from: skill,
        to: skill,
        expectedCrafts: 0,
        reagents: recipe.reagents,
        creates: recipe.creates,
        source: recipe.source,
      }
    }

    current.to = skill + 1
    current.expectedCrafts += 1 / skillUpChance(recipe, skill) / (recipe.skillUpsPerCraft || 1)
  }
  if (current) steps.push(current)

  return steps.map((step) => {
    const crafts = Math.ceil(step.expectedCrafts)
    return {
      spellId: step.spellId,
      name: step.name,
      skillRange: [step.from, step.to],
      crafts,
      /** Total reagents for the whole step, which is the shopping list. */
      materials: step.reagents.map((reagent) => {
        const quantity = reagent.quantity * crafts
        const expansion = expandMaterial(reagent.name, quantity, byOutput)
        return {
          name: reagent.name,
          quantity,
          ...(reagent.icon ? { icon: reagent.icon } : {}),
          // What it costs if you make it yourself. Offered, not prescribed — see expandMaterial.
          ...(expansion ? { craftedFrom: expansion.materials } : {}),
        }
      }),
      ...(step.creates ? { creates: step.creates.name, createsIcon: step.creates.icon } : {}),
      trainerTaught: Array.isArray(step.source) && step.source.includes(TRAINER),
    }
  })
}

/**
 * Joins adjacent steps that use the same recipe. **It never drops one.**
 *
 * The first version of this also discarded any step shorter than five skill points, on the theory
 * that they were noise. They were not: dropping them punched holes in the path — Tailoring claimed to
 * run 1 to 375 while silently skipping 74-75, 121-125 and 135, skill points where recipes were
 * demonstrably available. A path with a hole is worse than a fragmented one, because a fragmented
 * path looks fragmented and a holed one looks finished.
 *
 * Fragmentation is handled where it belongs instead — `bestAt` is sticky, so a recipe has to be
 * beaten by a real margin rather than a rounding error.
 */
function coalesce(steps) {
  const kept = []
  for (const step of steps) {
    const previous = kept[kept.length - 1]
    if (previous && previous.spellId === step.spellId && previous.skillRange[1] === step.skillRange[0]) {
      previous.skillRange[1] = step.skillRange[1]
      previous.crafts += step.crafts
      continue
    }
    kept.push(step)
  }
  return kept
}

/**
 * A path must cover every skill point it claims, with no hole between consecutive steps.
 *
 * This exists because the bug above shipped once already and looked completely plausible in the
 * output. A hole is invisible in a rendered list; it is obvious to an assertion.
 */
function assertContiguous(profession, steps) {
  const holes = []
  for (let i = 1; i < steps.length; i += 1) {
    if (steps[i].skillRange[0] !== steps[i - 1].skillRange[1]) {
      holes.push(`${steps[i - 1].skillRange[1]} -> ${steps[i].skillRange[0]}`)
    }
  }
  if (holes.length > 0) {
    console.error(`REFUSING TO WRITE — ${profession} path has holes at ${holes.join(', ')}`)
    process.exit(1)
  }
}

const paths = {}
for (const [profession, recipes] of Object.entries(professions)) {
  const steps = coalesce(computePath(recipes))
  assertContiguous(profession, steps)
  paths[profession] = steps
  const reach = steps.length > 0 ? steps[steps.length - 1].skillRange[1] : 0
  console.log(`  ${profession.padEnd(15)} ${String(steps.length).padStart(2)} steps, reaches skill ${reach}`)
}

writeFileSync(
  OUT_PATH,
  `${JSON.stringify(
    {
      note: 'Generated by tools/ingest/compute-leveling-paths.mjs from tools/ingest/data/professionRecipes.json. Do not edit by hand.',
      model:
        'Craft counts are computed, not sourced: chance = (grey - skill) / (grey - yellow) between yellow and grey, 1 below yellow. Expected crafts is the reciprocal summed across the range, rounded up. Recipe choice minimises reagent items per skill point, which counts items rather than gold.',
      paths,
    },
    null,
    2,
  )}\n`,
)

console.log(`crafting paths -> ${OUT_PATH.replace(REPO, '.')}`)
