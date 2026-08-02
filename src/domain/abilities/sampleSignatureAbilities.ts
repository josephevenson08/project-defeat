import type { TbcClass, TbcSpec } from '../character/characterTypes'
import type { SignatureAbility } from './abilityTypes'
import { druidSignatureAbilities } from './signatureAbilitiesDruid'
import { hunterSignatureAbilities } from './signatureAbilitiesHunter'
import { mageSignatureAbilities } from './signatureAbilitiesMage'
import { paladinSignatureAbilities } from './signatureAbilitiesPaladin'
import { priestSignatureAbilities } from './signatureAbilitiesPriest'
import { rogueSignatureAbilities } from './signatureAbilitiesRogue'
import { shamanSignatureAbilities } from './signatureAbilitiesShaman'
import { warlockSignatureAbilities } from './signatureAbilitiesWarlock'
import { warriorSignatureAbilities } from './signatureAbilitiesWarrior'

/**
 * One signature ability for every one of the 27 class/spec combinations in TBC.
 *
 * Note that `TbcSpec` names are not unique across classes — 'Holy', 'Protection' and 'Restoration'
 * are each shared by two classes — so every lookup here is keyed by class AND spec.
 */
export const sampleSignatureAbilities: readonly SignatureAbility[] = [
  ...druidSignatureAbilities,
  ...hunterSignatureAbilities,
  ...mageSignatureAbilities,
  ...paladinSignatureAbilities,
  ...priestSignatureAbilities,
  ...rogueSignatureAbilities,
  ...shamanSignatureAbilities,
  ...warlockSignatureAbilities,
  ...warriorSignatureAbilities,
]

/**
 * The signature ability for a class/spec pair, or `undefined` for a combination that does not
 * exist (e.g. a Warrior 'Balance'). Callers should treat `undefined` as "fall back to the generic
 * placeholder" rather than as an error.
 */
export function getSignatureAbility(
  className: TbcClass,
  spec: TbcSpec,
): SignatureAbility | undefined {
  return sampleSignatureAbilities.find(
    (ability) => ability.className === className && ability.spec === spec,
  )
}

/**
 * Every ability a spec presses that this project has data for, in rotation priority order — the
 * signature ability first, then anything else recorded for that spec.
 *
 * Most specs still return exactly one entry. Where a spec has more, the simulator sums the ones whose
 * sustained rate is actually computable and names the rest as excluded, rather than guessing a rate.
 * Ordering is file order, so an ability added to a spec must go *after* that spec's signature entry
 * or `getSignatureAbility` starts returning something different.
 */
export function getRotationAbilities(className: TbcClass, spec: TbcSpec): readonly SignatureAbility[] {
  return sampleSignatureAbilities.filter((ability) => ability.className === className && ability.spec === spec)
}

/** Every signature ability belonging to a class, in spec order. */
export function getSignatureAbilitiesForClass(className: TbcClass): readonly SignatureAbility[] {
  return sampleSignatureAbilities.filter((ability) => ability.className === className)
}

/** Look an ability up by its in-game spell ID. */
export function getSignatureAbilityBySpellId(spellId: number): SignatureAbility | undefined {
  return sampleSignatureAbilities.find((ability) => ability.spellId === spellId)
}
