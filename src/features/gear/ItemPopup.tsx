import { useEffect, useMemo, useRef, useState } from 'react'
import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemById, getGemsForSocket, socketBonusIsActive } from '../../domain/gems/sampleGems'
import { metaGemIsActive } from '../../domain/gems/gemTypes'
import { effectUptime } from '../../domain/simulation/combatConstants'
import { describeStats } from '../../domain/stats/describeStats'
import { getBisListForSpec } from '../../domain/bis'
import { getPairedGearSlots, twoHanderOccupiesOffHand } from '../../domain/gear/slotCompatibility'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, GearItem, GearSlot } from './gearTypes'

type ItemPopupProps = {
  slot: GearSlot
  character: CharacterProfile
  gear: EquippedGear
  onChangeItem: (item: GearItem) => void
  onChangeEnchant: (enchantId: string) => void
  onChangeGem: (index: number, gemId: string) => void
  onClose: () => void
}

/**
 * Item, enchant and gem selection in an overlay rather than inline.
 *
 * The gear list is the one screen a player scans constantly, so the editing controls are not allowed
 * to grow it — expanding a slot inline pushed every other slot down and made the list impossible to
 * read at a glance. Everything editable lives here instead, over the top.
 *
 * The selects keep the same aria-labels the inline controls had, so a slot is still reachable as
 * `getByLabel('Head')` once the popup is open.
 */
export function ItemPopup({ slot, character, gear, onChangeItem, onChangeEnchant, onChangeGem, onClose }: ItemPopupProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const [filter, setFilter] = useState('')

  const equipped = gear[slot]
  const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
  // The same function calculateStats uses, so the panel can never claim a bonus the totals withheld.
  const socketBonusMet = socketBonusIsActive(equipped.item.sockets, equipped.gemIds)

  /** Where the current item sits in this spec's ranked list for this slot, if it is on it at all. */
  const rankedHere = useMemo(() => {
    const list = getBisListForSpec(character.className, character.spec)
    return list?.entries.find((entry) => entry.itemId === equipped.item.id && getPairedGearSlots(entry.slot).includes(slot))
  }, [character.className, character.spec, equipped.item.id, slot])
  const enchants = getEnchantsForSlot(slot, character, equipped.item)

  /**
   * Highest item level first, then alphabetical.
   *
   * The catalogue's own order is by item id, which is close to release order and means the first
   * thing a player sees in a 400-option list is a Classic-era green. Item level is not a ranking —
   * sockets, set bonuses and stat weights all matter more — but it is a far better opening guess than
   * whatever Blizzard happened to number first.
   */
  /**
   * A two-hander occupies both hands, so the off hand has nothing to offer while one is equipped.
   *
   * Offering the list anyway would be worse than useless: `applyWeaponSlotRules` empties the off hand
   * again the moment a two-hander is in the main hand, so every pick would silently revert.
   */
  const offHandBlockedByTwoHander = slot === 'Off Hand' && twoHanderOccupiesOffHand(gear['Main Hand']?.item)

  /** Every gem across the whole set — a meta's condition counts gems in other items, not this one. */
  const allSocketedGems = useMemo(
    () =>
      Object.values(gear)
        .flatMap((equipped) => equipped.gemIds.map((gemId) => getGemById(gemId)))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== undefined),
    [gear],
  )

  const allOptions = useMemo(
    () =>
      offHandBlockedByTwoHander
        ? []
        : [...getItemsForSlotAndCharacter(slot, character.className, character.spec)].sort(
            (a, b) => (b.itemLevel ?? 0) - (a.itemLevel ?? 0) || a.name.localeCompare(b.name),
          ),
    [slot, character.className, character.spec, offHandBlockedByTwoHander],
  )

  // The equipped item always stays in the list, so filtering can never leave the select showing a
  // value with no matching option — which browsers render as blank.
  const options = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return allOptions
    return allOptions.filter((item) => item.name.toLowerCase().includes(needle) || item.id === equipped.item.id)
  }, [allOptions, filter, equipped.item.id])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="popup-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="popup" role="dialog" aria-modal="true" aria-label={`${displayName} options`} ref={dialogRef}>
        <header className="popup-header">
          <div>
            <p className="eyebrow">{displayName}</p>
            <h2 style={{ color: getQualityColor(equipped.item.quality) }}>{equipped.item.name}</h2>
          </div>
          <button type="button" className="popup-close" aria-label="Close" ref={closeRef} onClick={onClose}>
            ×
          </button>
        </header>

        {/*
          Two panes: the list you are choosing from on the left, everything about the current choice
          on the right. Stacked, the detail sat below the list and you scrolled past the thing you
          were picking to read about it — so comparing two items meant scrolling between them.
        */}
        <div className="popup-body popup-body-split">
          <div className="popup-pane popup-pane-list">
          <label className="popup-field">
            <span className="popup-field-label">
              Item
              <span className="popup-field-count">
                {options.length === allOptions.length
                  ? `${allOptions.length}`
                  : `${options.length} of ${allOptions.length}`}
              </span>
            </span>
            <input
              type="search"
              className="popup-filter"
              aria-label={`Filter ${displayName} items`}
              placeholder="Filter by name"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
            <select
              aria-label={displayName}
              // A list box rather than a drop-down: the point of this popup is browsing a few hundred
              // items, and a collapsed select shows one at a time.
              size={10}
              value={equipped.item.id}
              disabled={allOptions.length === 0}
              onChange={(event) => {
                const next = options.find((item) => item.id === event.target.value)
                if (next) onChangeItem(next)
              }}
            >
              {options.length > 0 ? (
                options.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={isItemBlockedByUniqueInGear(item, slot, gear)}
                    style={{ color: getQualityColor(item.quality) }}
                  >
                    {item.itemLevel ? `[${item.itemLevel}] ` : ''}
                    {item.name}
                  </option>
                ))
              ) : (
                <option>
                  {offHandBlockedByTwoHander
                    ? `${gear['Main Hand'].item.name} is two-handed and occupies this slot`
                    : 'No relevant item options'}
                </option>
              )}
            </select>
          </label>
          </div>

          <div className="popup-pane popup-pane-detail">
          {/* What the current choice actually gives you, ahead of where it drops from. */}
          <div className="popup-item-stats">
            <p className="popup-pane-title">{equipped.item.name}</p>
            <p className="popup-item-statline">{describeStats(equipped.item.stats) || 'No stats recorded for this item.'}</p>

            {/*
              The ranked list, summarised for this one item instead of laid out in full below the
              picker. Whether the thing you are looking at is actually recommended for your spec is
              the question the guide list exists to answer, and it is answerable in a line.
            */}
            {rankedHere ? (
              <p className="popup-rank popup-rank-listed" data-testid="popup-rank">
                <strong>#{rankedHere.rank}</strong> for {character.spec} {character.className} in this slot
                {rankedHere.notes ? ` — ${rankedHere.notes}` : ''}
              </p>
            ) : (
              <p className="popup-rank" data-testid="popup-rank">
                Not in the {character.spec} {character.className} ranked list for this slot.
              </p>
            )}
          </div>

          {enchants.length > 0 && (
            <label className="popup-field">
              <span className="popup-field-label">Enchant</span>
              <select aria-label={`${displayName} enchant`} value={equipped.enchantId ?? ''} onChange={(event) => onChangeEnchant(event.target.value)}>
                <option value="">No enchant</option>
                {enchants.map((enchant) => (
                  <option key={enchant.id} value={enchant.id}>
                    {enchant.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {equipped.item.sockets?.length ? (
            <div className="popup-sockets" aria-label={`${displayName} sockets`}>
              {equipped.item.sockets.map((socket, index) => {
                const gem = getGemById(equipped.gemIds[index])
                return (
                  <div className="popup-socket" key={`${slot}-${socket}-${index}`}>
                    <label className="popup-field">
                      <span className="popup-field-label">
                        <i className={`socket-dot socket-${socket.toLowerCase()}`} aria-hidden="true" />
                        {socket} Socket
                      </span>
                      <select
                        aria-label={`${displayName} ${socket} socket`}
                        value={equipped.gemIds[index] ?? ''}
                        onChange={(event) => onChangeGem(index, event.target.value)}
                      >
                        <option value="">No gem</option>
                        {/* Only gems that fit this socket, hybrids included — an Orange gem is legal in
                            a red socket and satisfies its bonus, so filtering to exact colour would hide
                            more than half the catalogue. */}
                        {getGemsForSocket(socket).map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* The socketed gem, as a frame plus what it actually gives you. A dropdown alone
                        names the gem but hides the reason you picked it. */}
                    {gem ? (
                      <div className="gem-chip" data-testid={`gem-chip-${slot}-${index}`}>
                        <span className={`gem-frame gem-frame-${gem.color.toLowerCase()}`} aria-hidden="true" />
                        <span className="gem-chip-text">
                          <span className="gem-chip-name" style={{ color: getQualityColor(gem.quality) }}>
                            {gem.name}
                          </span>
                          {/*
                            Some gems carry only resistances or spell penetration, which StatBlock
                            has no fields for — they live in `extraStats` and reach no total. Saying
                            so beats an empty line, which reads as a rendering fault rather than as
                            the gem genuinely giving this app nothing to work with.
                          */}
                          <span className="gem-chip-stats">
                            {describeStats(gem.stats) ||
                              // A pure-proc meta has no flat stats, and the effect line below is what
                              // says so — falling through to "No stats this app models" here would
                              // contradict it on the very next line.
                              (gem.effect
                                ? ''
                                : gem.extraStats
                                  ? `${Object.entries(gem.extraStats)
                                      .map(([key, value]) => `+${value} ${key.replace(/([a-z])([A-Z])/g, '$1 $2')}`)
                                      .join(', ')} — not counted in your totals`
                                  : 'No stats this app models')}
                          </span>
                          {/*
                            The proc, stated with its uptime rather than at face value. Mystical
                            Skyfire and Thundering Skyfire are *entirely* this — they carry no flat
                            stats at all — so without it the panel described two real gems as giving
                            nothing. The averaged figure is what actually reaches your totals, and
                            showing the full value alone would overstate them by roughly 7x.
                          */}
                          {gem.effect ? (
                            <span className="gem-chip-effect" data-testid={`gem-effect-${slot}-${index}`}>
                              {describeStats(gem.effect.statBonus)} for {gem.effect.durationSeconds}s every{' '}
                              {gem.effect.cooldownSeconds}s — counted at{' '}
                              {Math.round(effectUptime(gem.effect.durationSeconds, gem.effect.cooldownSeconds) * 100)}% uptime
                            </span>
                          ) : null}
                          {/*
                            An unmet meta condition, said out loud. This project has already been
                            bitten once by a gem check that failed silently — a hybrid in a matching
                            socket losing its socket bonus with no explanation — and a meta gem
                            contributing nothing because of gems in *other* items is even harder to
                            work out from a stat total that simply reads lower than expected.
                          */}
                          {gem.color === 'Meta' && !metaGemIsActive(gem, allSocketedGems) ? (
                            <span className="gem-chip-inactive" data-testid={`gem-meta-inactive-${slot}-${index}`}>
                              Inactive — {gem.metaRequirement?.text ?? 'its colour condition is not met'}. It grants nothing until it is.
                            </span>
                          ) : null}
                        </span>
                      </div>
                    ) : (
                      <p className="gem-chip gem-chip-empty">Empty — this socket contributes nothing.</p>
                    )}
                  </div>
                )
              })}

              {equipped.item.socketBonus && (
                /*
                 * Whether the bonus is *currently* earned, not just what would earn it. The old copy
                 * ("applies when gem colours match") left you to work out whether yours did.
                 */
                <p className={`popup-socket-bonus ${socketBonusMet ? 'popup-socket-bonus-active' : ''}`.trim()} data-testid="socket-bonus-status">
                  <strong>Socket bonus</strong> {describeStats(equipped.item.socketBonus)} —{' '}
                  {socketBonusMet ? 'active' : 'not earned: every socket needs a gem whose colour matches it'}
                </p>
              )}
            </div>
          ) : null}

          <ItemFacts item={equipped.item} slotLabel={displayName} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Provenance and crafting, which come from the curated layer and are absent on most ingested items. */
function ItemFacts({ item, slotLabel }: { item: GearItem; slotLabel: string }) {
  const location = [item.source, item.zone, item.instance, item.boss, item.vendor, item.reputation].filter(Boolean).join(' · ')

  return (
    <div className="popup-facts">
      <dl>
        {item.itemLevel ? (
          <div>
            <dt>Item level</dt>
            <dd>{item.itemLevel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Quality</dt>
          <dd style={{ color: getQualityColor(item.quality) }}>{item.quality}</dd>
        </div>
        {item.phase ? (
          <div>
            <dt>Phase</dt>
            <dd>{item.phase}</dd>
          </div>
        ) : null}
        {location ? (
          <div>
            <dt>Source</dt>
            <dd>{location}</dd>
          </div>
        ) : null}
      </dl>
      {item.crafting && (
        <div className="crafting-details" aria-label={`${slotLabel} crafting details`}>
          <p className="crafting-headline">
            {item.craftedBy}
            {item.crafting.requiredSkill ? ` (${item.crafting.requiredSkill} skill)` : ''}
            {item.crafting.specialization ? ` · ${item.crafting.specialization}` : ''}
          </p>
          <p className="crafting-recipe-source">Recipe: {item.crafting.recipeSource}</p>
          <ul className="crafting-materials">
            {item.crafting.materials.map((material) => (
              <li key={material.name}>
                <strong>
                  {material.quantity}x {material.name}
                </strong>
                <span> — {material.farmSource}</span>
              </li>
            ))}
          </ul>
          {item.crafting.needsVerification && <small className="needs-verification">Recipe/materials need source verification.</small>}
        </div>
      )}
      {/*
        Two different admissions, and they were one for too long. `needsVerification` is about where
        the item comes from; `statsEstimated` is about whether the numbers above it were ever checked.
        An item can have perfectly sourced stats and unconfirmed drop information, and 141 in this
        catalogue do — so saying "needs verification" over sourced stats trains a reader to ignore it.
      */}
      {item.statsEstimated && (
        <small className="needs-verification">
          These stats are unverified — this entry has no counterpart in the ingested database.
        </small>
      )}
      {item.needsVerification && <small className="needs-verification">Drop source/rank needs verification.</small>}
    </div>
  )
}
