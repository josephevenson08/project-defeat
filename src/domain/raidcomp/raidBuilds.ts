import type { CharacterRole, TbcClass, TbcSpec } from '../character/characterTypes'
import { getRoleForSpec, tbcClasses } from '../character/tbcClasses'
import { getSpecIcon } from './raidcompIcons'

/**
 * What a player actually signs up as, which is not the same list as `TbcSpec`.
 *
 * **Why this exists instead of widening `TbcSpec`.** That union is keyed on by BiS rankings, talent
 * trees, tier lists and the simulator; adding "Feral Tank" there would mean inventing a BiS list and
 * a talent tree for something Blizzard never defined as a separate spec. A raid roster asks a
 * different question — *what are you bringing tonight* — and the answer distinguishes a bear from a
 * cat where a gear planner does not.
 *
 * Every build therefore maps back to a real `(className, spec)` pair, and **buff coverage matches on
 * that pair**, never on the build. A Feral tank and a Feral cat both bring Leader of the Pack,
 * because in the game they are the same talent tree wearing different forms.
 */
export type RaidBuild = {
  /** Stable id, stored in saved rosters. Changing one invalidates saved seats, so treat it as data. */
  id: string
  className: TbcClass
  /** The real spec this build is, for buff matching. Two builds may share one. */
  spec: TbcSpec
  /** What the picker shows. Distinct from the spec name where a spec carries two builds. */
  label: string
  role: CharacterRole
  icon: string
  /** Shown on hover. Present only where the build needs explaining. */
  note?: string
}

/**
 * Builds that differ from their spec, with the reason each one exists.
 *
 * Deliberately short. Every entry here is a claim that TBC raids treat one spec as two things, and
 * that claim should be earned rather than assumed — the default below is one build per spec.
 */
const OVERRIDES: readonly RaidBuild[] = [
  {
    id: 'druid-feral-tank',
    className: 'Druid',
    spec: 'Feral',
    label: 'Feral (Bear)',
    role: 'Tank',
    // The bear-paw icon, which is what the game uses for Dire Bear Form.
    icon: 'ability_racial_bearform',
    note: 'Feral tank. Same tree as the cat, so it brings Leader of the Pack either way.',
  },
  {
    id: 'druid-feral-cat',
    className: 'Druid',
    spec: 'Feral',
    label: 'Feral (Cat)',
    role: 'Physical DPS',
    icon: 'ability_druid_ferociousbite',
    note: 'Feral DPS. Same tree as the bear, so it brings Leader of the Pack either way.',
  },
  {
    id: 'druid-dreamstate',
    className: 'Druid',
    /*
     * Modelled as Restoration rather than Balance, and this is the load-bearing decision.
     *
     * Dreamstate is a **Balance** talent at row 6 — "Regenerate mana equal to 10% of your Intellect
     * every 5 sec, even while casting" — so the build spends ~25 points in Balance and the rest in
     * Restoration. It heals, and it heals with mana regen no pure Resto druid has.
     *
     * What it does **not** bring is Moonkin Aura. That aura only radiates while in Moonkin Form, and
     * a druid in Moonkin Form cannot cast healing spells at all in TBC — so a Dreamstate healer is
     * never in the form that would grant it. Listing it as a Balance build would have credited a
     * roster with an aura nobody in it is providing, which is exactly the class of error this whole
     * planner was rebuilt to stop making.
     */
    spec: 'Restoration',
    label: 'Dreamstate',
    role: 'Healer',
    icon: 'ability_druid_dreamstate',
    note: 'Balance/Restoration hybrid healer. Dreamstate is a Balance talent, but the build heals in caster form — so it does NOT provide Moonkin Aura, which needs Moonkin Form.',
  },
]

/**
 * Specs whose default build is *replaced* rather than added to.
 *
 * Feral is the only one: a druid is a bear or a cat, and offering a third undifferentiated "Feral"
 * would be a seat that means nothing. Dreamstate is deliberately **not** here — it sits alongside
 * plain Restoration rather than replacing it, because a raid can field both and they are different
 * players. An earlier version had Dreamstate as a replacement, which silently removed Restoration
 * Druid from the picker altogether.
 */
const REPLACED_SPECS = new Set(['Druid|Feral'])

/** One build per spec, plus the extra builds `OVERRIDES` adds and minus the specs it replaces. */
export const raidBuilds: readonly RaidBuild[] = tbcClasses.flatMap((definition) =>
  definition.specs.flatMap((spec) => {
    const key = `${definition.className}|${spec}`
    const extras = OVERRIDES.filter((build) => `${build.className}|${build.spec}` === key)

    if (REPLACED_SPECS.has(key)) return extras

    return [
      {
        id: `${definition.className}-${spec}`.toLowerCase().replace(/\s+/g, '-'),
        className: definition.className,
        spec,
        label: spec,
        role: getRoleForSpec(definition.className, spec),
        icon: getSpecIcon(definition.className, spec) ?? '',
      },
      ...extras,
    ]
  }),
)

const byId = new Map(raidBuilds.map((build) => [build.id, build]))

export function getRaidBuild(id: string): RaidBuild | undefined {
  return byId.get(id)
}

/** Builds grouped by class, in the class order the rest of the app uses. */
export const raidBuildsByClass: readonly { className: TbcClass; builds: readonly RaidBuild[] }[] = tbcClasses.map(
  (definition) => ({
    className: definition.className,
    builds: raidBuilds.filter((build) => build.className === definition.className),
  }),
)
