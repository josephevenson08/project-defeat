import rawScopes from './buffScope.json' with { type: 'json' }

/**
 * How far a buff reaches, which in TBC is the question a raid composition turns on.
 *
 * - `Party` — the caster's group of five, and nobody else. **24 of the 33 raid buffs.** Every totem,
 *   every aura, both Warrior shouts, Arcane Brilliance, Prayer of Fortitude, Gift of the Wild.
 * - `Raid` — everyone. Only the five Greater Blessings, which is exactly what "Greater" buys.
 * - `Single` — one player, chosen at cast time: Innervate, Power Infusion, Thorns, Shadow Protection.
 *   Where the provider sits is irrelevant, so for coverage these behave like `Raid`.
 * - `Target` — the six debuffs. They land on the boss; one applier anywhere in the raid covers it.
 *
 * **This is the difference between a useful composition tool and a misleading one.** Treating every
 * buff as raid-wide tells a raid leader Battle Shout is covered when five of twenty-five players
 * have it. Group assignment *is* raid composition in TBC, and this field is what makes that
 * computable instead of guessed.
 */
export type BuffScope = 'Party' | 'Raid' | 'Single' | 'Target'

type RawScope = { name: string; spellId: number; scope: string; evidence: string; fromOverride?: boolean }

const byId = rawScopes.scopes as Record<string, RawScope>

/**
 * Undefined for anything the ingest could not resolve, which is currently nothing — every one of the
 * 39 entries is sourced. Kept optional rather than asserted non-null so that adding a buff without
 * re-running the ingest degrades to "scope unknown" rather than crashing a raid planner mid-session.
 */
export function getBuffScope(id: string): BuffScope | undefined {
  return byId[id]?.scope as BuffScope | undefined
}

/** The tooltip text the scope was read from, or the cited reason where the spell page carries none. */
export function getBuffScopeEvidence(id: string): string | undefined {
  return byId[id]?.evidence
}

/**
 * Whether a buff has to share a group to reach someone.
 *
 * The one predicate the composition tool actually branches on. An unresolved scope answers `false` —
 * it will be shown as raid-wide, which overstates reach rather than hiding the buff entirely, and
 * the ingest reports anything unresolved so it cannot sit there silently.
 */
export function isPartyScoped(id: string): boolean {
  return getBuffScope(id) === 'Party'
}

export const scopedBuffCount = Object.keys(byId).length
