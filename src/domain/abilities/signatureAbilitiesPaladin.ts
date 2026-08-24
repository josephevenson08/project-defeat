import type { SignatureAbility } from './abilityTypes'

export const paladinSignatureAbilities: readonly SignatureAbility[] = [
  {
    className: 'Paladin',
    spec: 'Holy',
    name: 'Holy Light',
    spellId: 27136,
    rank: 11,
    requiredLevel: 70,
    effectType: 'Direct Heal',
    castTimeSeconds: 2.5,
    gcdSeconds: 1.5,
    resource: { type: 'Mana', cost: 840 },
    baseAmount: { min: 2196, max: 2446 },
    scaling: {
      basis: 'castTime/3.5',
      spellPowerCoefficient: 0.7143,
      coefficientNotes:
        '2.5s cast / 3.5 = 0.7143, the plain formula with no exception. Illumination and Light\'s Grace change throughput and cast time but not the coefficient.',
    },
    notes:
      'Holy Paladin is the purest single-spell healer in TBC: the Phase 1/2 playstyle really is Holy Light spam on a tank, backed by Illumination mana returns and Light\'s Grace shortening the cast to 2.0s after the first heal. Flash of Light (rank 7, spell 27137, 180 mana, 1.5s cast, 458-513, coefficient 0.4286) is the efficient alternative used for raid healing and rolling Holy Light\'s Grace. Of all 27 specs this is the one a single-ability model represents most faithfully.',
  },
  {
    className: 'Paladin',
    spec: 'Protection',
    name: 'Consecration',
    spellId: 27173,
    rank: 6,
    requiredLevel: 70,
    effectType: 'DoT',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 8,
    resource: { type: 'Mana', cost: 660 },
    periodic: {
      durationSeconds: 8,
      tickIntervalSeconds: 1,
      ticks: 8,
      totalBaseAmount: 512,
      perTickBaseAmount: 64,
    },
    scaling: {
      basis: 'hardcoded exception',
      spellPowerCoefficient: 0.952,
      spellPowerCoefficientPerTick: 0.119,
      coefficientNotes:
        'Hardcoded exception; the generic duration/15 rule would give 8/15 = 0.5333 before the area-effect halving, so this is far higher than the formula predicts. SOURCE CONFLICT: wowsims uses 0.119 per tick (0.952 total) and community theorycraft cites ~0.95, while TBC server-side spell data (cmangos) uses 0.125 per tick (1.0 total). The wowsims/community value is used here; the disagreement is ~5%.',
    },
    needsVerification: true,
    notes:
      'Protection Paladin threat is a fixed-priority loop of three short cooldowns rather than a filler: Holy Shield (rank 4, spell 27179, 280 mana, 10s, 155 holy damage per block at a 0.05 coefficient, +35% threat) for mitigation and block damage, Judgement on its 10s cooldown for snap threat and seal debuffs, and Consecration on its 8s cooldown as the largest sustained threat and damage source. Consecration is picked as the signature because it is the biggest steady contributor, but note it is a ground effect on a cooldown, not something cast every GCD — a model that spams it every 1.5s will overstate Prot Paladin threat by roughly 5x.',
  },
  {
    className: 'Paladin',
    spec: 'Retribution',
    name: 'Crusader Strike',
    spellId: 35395,
    effectType: 'Melee Special',
    castTimeSeconds: 0,
    gcdSeconds: 1.5,
    cooldownSeconds: 6,
    resource: { type: 'Mana', cost: 236, note: '8% of base mana' },
    scaling: {
      basis: 'weapon damage',
      weaponDamageMultiplier: 1.1,
      normalizedWeaponDamage: false,
      coefficientNotes:
        '110% of un-normalized main-hand weapon damage, so unlike most melee specials a slow two-hander is directly rewarded. No spell power or attack power coefficient of its own; attack power feeds in only through the weapon damage roll.',
    },
    notes:
      'Crusader Strike has no intrinsic level requirement — it is gated purely by spending 41 points in Retribution, so `requiredLevel` is omitted. It is the spec\'s only real rotational button, but it is a 6s cooldown rather than a filler — Retribution\'s actual damage is dominated by auto attacks with Seal of Blood (Horde) or Seal of Command (Alliance) proccing on them, plus Judgement on cooldown, with Crusader Strike woven in and used to refresh Judgement debuffs. Because the simulator now layers computable specials on top of white damage, Crusader Strike\'s numbers are consumed — and note that Ret is the physical spec where the special-attack share of damage is smallest — which was true and misleading, because the share that was missing is not special-attack damage at all, it is Holy. A sourcing pass established what else Ret presses and why none of it is modelled: the Seals are NOT rotational buttons but 30s self-buff auras whose damage rides passively on auto-attacks (Seal of Blood procs on every white hit, Seal of Command at 7 PPM with a 1s internal cooldown), so they do not fit this schema at all. **They are modelled anyway, since 2026-08-23** — in `domain/simulation/paladinSeals.ts` rather than here, because the simulator is not this schema. Together with the judgement they are worth 112.5 DPS to a Horde Ret and 70.6 to an Alliance one, which is more than half of what the spec does. Exorcism is hard-gated to Undead and Demon targets, which most Tier 5 bosses are not. Consecration is the same ability and rank as the Protection entry, but Ret uses it sparingly for mana reasons rather than on cooldown. Judgement is the other half, and it is faction-split in a way this note used to gloss: Judgement of Blood (spell 31898) deals **295-325** Holy, while Alliance runs Seal of Command whose judgement deals **68-73** (spell 20375). That gap is why Horde Retribution led early TBC, and modelling one for both would have been wrong by roughly a factor of four. Both are on the 10s cooldown of the Judgement button (spell 20271). **Two claims here were wrong and are corrected:** the judgement does trigger the GCD — upstream gives it `GCDDefault` — and "adding it today would be data nothing consumes" stopped being true when the seals got a home. It is Holy damage rolling crit off the melee table, and Holy means **armor does not reduce it**, which is the first unmitigated damage on the physical path.',
  },
]
