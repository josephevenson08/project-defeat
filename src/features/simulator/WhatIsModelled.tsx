import { Panel } from '../../components/layout/Panel'
import { getRotationAbilities } from '../../domain/abilities'
import { tbcClasses } from '../../domain/character/tbcClasses'
import { specTrust, trustRange } from './bestCase'

/**
 * How many specs have a real multi-ability rotation, **computed rather than written down**.
 *
 * The old panel's sentence said "two specs" while the answer was five, and had been wrong since the
 * day Affliction, Shadow and Destruction gained their rotations: prose describing code, updated by
 * hand, on a surface a player reads. Derived from the ability catalogue, so adding a rotation moves
 * the number on screen in the same commit.
 */
const rotationCoverage = tbcClasses
  .flatMap((entry) => entry.specs.map((spec) => getRotationAbilities(entry.className, spec).length))
  .reduce(
    (totals, count) => (count > 1 ? { ...totals, multi: totals.multi + 1 } : { ...totals, single: totals.single + 1 }),
    { multi: 0, single: 0 },
  )

/**
 * What the model does and does not cover, from `featureFlags.ts` and `docs/known-limitations.md`.
 *
 * Every figure here is computed (the rotation count from the ability catalogue, the range and the
 * worst spec from the same best cases as the trust panel), because this repo's limitation prose has
 * gone stale every time it carried a number by hand. The rest is written so that adding the feature
 * makes the sentence plainly false to whoever adds it.
 */
export function WhatIsModelled() {
  const { low, high, worst } = trustRange()
  const specs = rotationCoverage.multi + rotationCoverage.single

  return (
    <Panel title="What is and isn't modelled" eyebrow="featureFlags.ts · docs/known-limitations.md" className="sim-modelled">
      <div className="sim-model">
        <div className="sim-model-yes">
          <h3>Modelled</h3>
          <ul>
            <li>
              White damage plus one signature special per spec where its sustained rate is defensible: a cooldown, an energy cost
              against 10 a second, or a hunter&apos;s shot weave.
            </li>
            <li data-testid="simulation-rotation-coverage">
              <strong>
                Multi-ability rotations cover {rotationCoverage.multi} specs of {specs}:
              </strong>{' '}
              Arms and Fury press three buttons each; Affliction keeps four DoTs under a Shadow Bolt filler; Shadow keeps two DoTs up with
              Mind Blast and Mind Flay; Destruction keeps Immolate and fills with Incinerate.
            </li>
            <li>Retribution&apos;s Holy damage, faction-split: Seal of Blood is Horde-only in Phase 2. Holy damage is not reduced by armor.</li>
            <li>Windfury Weapon for Enhancement, as a proc on the main-hand swing (the main hand is assumed to carry the imbue).</li>
            <li>A hunter&apos;s pet: auto attack, Bite, Claw and Kill Command. A Demonology warlock&apos;s Felguard.</li>
            <li>Feral&apos;s Rake and Rip bleeds (their ticks ignore armor), and Feral Attack Power on the weapons that carry it.</li>
            <li>Slice and Dice for every rogue, Combat Potency, and Instant and Deadly poisons on the spell table.</li>
            <li>Talents reach all {specs} specs; spells record a damage school, so Demonic Sacrifice applies per spell.</li>
          </ul>
        </div>
        <div className="sim-model-no">
          <h3>Not modelled, or only approximated</h3>
          <ul>
            <li>
              <strong>The other {rotationCoverage.single} specs are a single-ability approximation</strong>, which understates any spec
              whose damage is spread across several buttons.
            </li>
            <li>
              Rage-costed abilities with no cooldown are excluded: Heroic Strike is carried in the data and contributes nothing. Rage from
              damage taken is pinned at 0.
            </li>
            <li>
              No mana-costed ability is capped by mana; the breakdown reports the mana a second it spends instead. Aspect of the Viper,
              Judgement of Wisdom, Shamanistic Rage and potions are unmodelled.
            </li>
            <li>Caster estimates model their signature spells only: no cooldowns, procs, downranking or multi-spell priority.</li>
            <li>
              A named list of talent groups is still refused; per-spell effects such as Ignite, Shadow Weaving and Ruin lead it. Expect a
              talented estimate to read low, casters most.
            </li>
            <li>No multi-iteration variance and no result charts, so every number is a point estimate.</li>
            <li>Bestial Wrath and Mangle are still missing; Flametongue and Elemental Weapons are not applied.</li>
          </ul>
        </div>
      </div>
      <p className="sim-quote" data-testid="simulation-range">
        Measured against archon.gg&apos;s observed Phase 2 averages for all {specTrust().length} DPS specs, the model reads <b>{low.toFixed(2)}×</b> to{' '}
        <b>{high.toFixed(2)}×</b> low, and no spec may read above its reference. Lowest today: {worst.spec} {worst.className}.
      </p>
      <p className="sim-small">
        The tab is shown for the DPS specs (Physical DPS and Caster DPS) by the owner&apos;s call on 2026-08-21. Healer and Tank math is
        still computed and tested, but not shown as a headline.
      </p>
    </Panel>
  )
}
