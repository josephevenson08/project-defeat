import {
  ARMOR_MITIGATION_CAP,
  AP_PER_DPS,
  DOT_COEFFICIENT_BASE_DURATION,
  SPELL_COEFFICIENT_BASE_CAST_TIME,
  SPELL_COEFFICIENT_INSTANT_BASELINE,
  armorMitigationConstant,
} from './combatConstants'

export function computeArmorMitigation(targetArmor: number, attackerLevel: number) {
  const k = armorMitigationConstant(attackerLevel)
  const mitigation = targetArmor / (targetArmor + k)
  return Math.min(ARMOR_MITIGATION_CAP, Math.max(0, mitigation))
}

/**
 * White-damage AP contribution is speed-independent: damage-per-swing scales with weapon speed,
 * but swings-per-second scales inversely with it, so the two cancel. This intentionally omits the
 * weapon's own damage dice, which aren't modeled on GearItem yet (see ROADMAP known limitations) —
 * so this is an attack-power-driven floor on white DPS, not a complete white-damage number.
 */
export function attackPowerToWhiteDps(attackPower: number) {
  return attackPower / AP_PER_DPS
}

export function directSpellCoefficient(castTimeSeconds: number) {
  const effectiveCastTime = castTimeSeconds <= 0 ? SPELL_COEFFICIENT_INSTANT_BASELINE : castTimeSeconds
  return effectiveCastTime / SPELL_COEFFICIENT_BASE_CAST_TIME
}

export function dotSpellCoefficient(durationSeconds: number) {
  return durationSeconds / DOT_COEFFICIENT_BASE_DURATION
}
