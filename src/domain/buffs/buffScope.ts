import rawScopes from './buffScope.json' with { type: 'json' }

/**
 * How far a buff reaches, which in TBC is the question a raid composition turns on.
 *
 * - `Party` — a group of five. Every totem, every aura and both Warrior shouts reach only the caster's
 *   own group. **Four reach any group:** Gift of the Wild, Prayer of Fortitude, Arcane Brilliance and
 *   Prayer of Spirit say "the target's party", so the caster picks the group and one caster covers
 *   every group with a cast each (`castOnAnyGroup`). Until 2026-10-09 they were treated as
 *   caster's-group-only, which told a raid it was missing Fortitude in four groups with a Priest in one.
 * - `Raid` — everyone. Only the five Greater Blessings, which is exactly what "Greater" buys.
 * - `Single` — one player, chosen at cast time: Innervate, Power Infusion, Thorns, Shadow Protection.
 *   Where the provider sits is irrelevant, so for coverage these behave like `Raid`.
 * - `Target` — the debuffs. They land on the boss; one applier anywhere in the raid covers it.
 *
 * The scope is what the tooltip says. **How far a buff reaches in a raid** can differ, and
 * `isPartyScoped` is the answer the composition tool uses: the four buffs above, and Heroism and
 * Bloodlust on Anniversary realms (`anniversaryRaidWide`), reach further than their scope says.
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
 * A party buff the caster casts on a group of their choosing: its tooltip says "the target's party".
 * One caster covers every group, a cast each. Read from the same tooltip text as the scope.
 */
export function castOnAnyGroup(id: string): boolean {
  return getBuffScope(id) === 'Party' && /target's party/.test(getBuffScopeEvidence(id) ?? '')
}

/**
 * Buffs that reach the whole raid on Anniversary realms although their tooltip says party, each with
 * its source. The app targets the Anniversary realms, so this is how they are counted.
 */
export const anniversaryRaidWide: Readonly<Record<string, string>> = {
  bloodlust:
    "Blizzard's patch 2.5.5 notes for the TBC Anniversary realms make Heroism and Bloodlust raid-wide, with the 10-minute debuff reset when a boss encounter ends. The original TBC tooltip, which the scope ingest read, says \"all party members\". Confirmed by the owner on 2026-10-09.",
}

/**
 * Whether a buff has to share a group to reach someone: party-scoped, not cast on a group of the
 * caster's choosing, and not made raid-wide on Anniversary realms.
 *
 * The one predicate the composition tool actually branches on. An unresolved scope answers `false` —
 * it will be shown as raid-wide, which overstates reach rather than hiding the buff entirely, and
 * the ingest reports anything unresolved so it cannot sit there silently.
 */
export function isPartyScoped(id: string): boolean {
  return getBuffScope(id) === 'Party' && !castOnAnyGroup(id) && !(id in anniversaryRaidWide)
}

export const scopedBuffCount = Object.keys(byId).length
