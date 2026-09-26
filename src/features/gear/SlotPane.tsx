import { useEffect, useMemo, useRef, useState } from 'react'
import { getEnchantsForSlot, professionsGatingEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemById, getGemsForSocket, socketBonusIsActive } from '../../domain/gems/sampleGems'
import { metaGemIsActive } from '../../domain/gems/gemTypes'
import { effectUptime } from '../../domain/simulation/combatConstants'
import { describeStats } from '../../domain/stats/describeStats'
import { getBisListForSpec } from '../../domain/bis'
import { emptyItemForSlot, getPairedGearSlots, twoHanderOccupiesOffHand } from '../../domain/gear/slotCompatibility'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, GearItem, GearSlot } from './gearTypes'

type SlotPaneProps = {
  slot: GearSlot
  character: CharacterProfile
  gear: EquippedGear
  onChangeItem: (item: GearItem) => void
  onChangeEnchant: (enchantId: string) => void
  onChangeGem: (index: number, gemId: string) => void
  onClose: () => void
}

/**
 * Item, enchant and gem selection, beside the gear list rather than over it.
 *
 * **This was a modal, and two of the owner's five heuristic findings were about that.** Opening a
 * slot gave you "a window with a lot of information, nothing of which guides them in a direction
 * they should go", and choosing an item had no confirmation: "the only way for them to know is to
 * click the × or click outside the window, which closes the window and shows the item has been
 * selected".
 *
 * A pane answers both by construction. The list stays visible, so the row updating *is* the
 * confirmation — there is nothing to confirm and nothing covering what you would check. What is
 * left is saying what to do, which the prompt does.
 *
 * Editing still does not happen in the list itself: expanding a row inline would push every other
 * slot down and make the thing you are scanning unreadable. The pane keeps the same aria-labels the
 * old overlay had, so a slot is still reachable as `getByLabel('Head')` once it is open.
 */
export function SlotPane({ slot, character, gear, onChangeItem, onChangeEnchant, onChangeGem, onClose }: SlotPaneProps) {
  const paneRef = useRef<HTMLElement>(null)

  const [filter, setFilter] = useState('')

  const equipped = gear[slot]
  const emptyItem = emptyItemForSlot(slot)
  const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
  // The same function calculateStats uses, so the panel can never claim a bonus the totals withheld.
  const socketBonusMet = socketBonusIsActive(equipped.item.sockets, equipped.gemIds)

  /** Where the current item sits in this spec's ranked list for this slot, if it is on it at all. */
  const rankedHere = useMemo(() => {
    const list = getBisListForSpec(character.className, character.spec)
    return list?.entries.find((entry) => entry.itemId === equipped.item.id && getPairedGearSlots(entry.slot).includes(slot))
  }, [character.className, character.spec, equipped.item.id, slot])
  const enchants = getEnchantsForSlot(slot, character, equipped.item)
  const gatingProfessions = professionsGatingEnchantsForSlot(slot, character, equipped.item)

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

  // The equipped item always stays in the list, so filtering can never leave the select holding a
  // value with no matching option. React does not render that as blank: it selects the first enabled
  // option instead, so the list would show one item highlighted while another is equipped. The empty
  // slot needs the same guarantee, which is what the "— Empty —" option below provides.
  const options = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return allOptions
    return allOptions.filter((item) => item.name.toLowerCase().includes(needle) || item.id === equipped.item.id)
  }, [allOptions, filter, equipped.item.id])

  /*
   * Focus follows the slot into the pane.
   *
   * A dialog had one real advantage — a keyboard user knew where they had arrived — and giving that
   * up along with the overlay would trade one finding for another. `preventScroll` because the pane
   * decides its own scrolling on the next line: beside the list there is nothing to scroll to, and
   * below it on a phone there is.
   */
  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    pane.focus({ preventScroll: true })

    /*
     * Scrolled to only when it is not already on screen — which on a desktop it is, because it opens
     * at the top of the split beside the list. `scrollIntoView({ block: 'nearest' })` on its own
     * moved the page every time, since the pane is taller than the viewport and the browser
     * obligingly showed its bottom: the list you had just clicked in jumped under your hand. On a
     * phone the pane is below the list and genuinely needs finding.
     *
     * **And it has to stop short of the stat bar, which is sticky.** Scrolled flush to the top, the
     * pane's header — its item name and its close button — slid underneath it: a tap 20px above the
     * × landed on the bar. Measured rather than guessed at, because the bar is one line on a desktop
     * and three on a phone.
     */
    const box = pane.getBoundingClientRect()
    const offScreen = box.top < 0 || box.top > window.innerHeight - 120
    if (offScreen) {
      const stuck = document.querySelector('.stat-bar')?.getBoundingClientRect().height ?? 0
      window.scrollTo({ top: window.scrollY + box.top - stuck - 8 })
    }
  }, [slot])

  /*
   * Escape still dismisses it, though nothing is trapped here any more.
   *
   * Not modal behaviour — it is the habit a keyboard user brings from every other panel that opens,
   * and the cost of honouring it is three lines. The pane only exists on the gear view, so this
   * cannot fight another section's Escape.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <section className="slot-pane" aria-label={`${displayName} options`} ref={paneRef} tabIndex={-1}>
      <header className="pane-header">
        <div>
          <p className="eyebrow">{displayName}</p>
          <h2 style={{ color: getQualityColor(equipped.item.quality) }}>{equipped.item.name}</h2>
        </div>
        <button type="button" className="pane-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </header>

      {/*
        What to do here, which the owner's heuristic evaluation found nothing on this surface said:
        "Once a user selects a gear slot to pick an item, they are brought to a window with a lot of
        information, nothing of which guides them in a direction they should go."
      */}
      <p className="pane-prompt">Pick an item, then its enchant and gems. Each choice applies as you make it — the list updates beside you.</p>

        {/*
          Two panes: the list you are choosing from on the left, everything about the current choice
          on the right. Stacked, the detail sat below the list and you scrolled past the thing you
          were picking to read about it — so comparing two items meant scrolling between them.
        */}
        <div className="pane-body pane-body-split">
          <div className="pane-pane pane-pane-list">
          <label className="pane-field">
            <span className="pane-field-label">
              Item
              <span className="pane-field-count">
                {options.length === allOptions.length
                  ? `${allOptions.length}`
                  : `${options.length} of ${allOptions.length}`}
              </span>
            </span>
            <input
              type="search"
              className="pane-filter"
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
                if (event.target.value === emptyItem.id) return onChangeItem(emptyItem)
                const next = options.find((item) => item.id === event.target.value)
                if (next) onChangeItem(next)
              }}
            >
              {/*
                The empty slot is an option, and it has to be.

                Without it, an empty slot's value matched no option, and React answers that by
                selecting the first enabled one, so the top item sat highlighted while the slot said
                Empty. Clicking it changed nothing, fired no change event, and equipped nothing.
                Every new character starts with every slot empty, so the highest item level in every
                list could not be picked; two of twelve participants in the usability study hit it
                on their first try. Choosing this option also unequips the slot, which nothing
                offered before.
              */}
              {options.length > 0 && <option value={emptyItem.id}>— Empty —</option>}
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

          <div className="pane-pane pane-pane-detail">
          {/* What the current choice actually gives you, ahead of where it drops from. */}
          <div className="pane-item-stats">
            <p className="pane-pane-title">{equipped.item.name}</p>
            <p className="pane-item-statline">{describeStats(equipped.item.stats) || 'No stats recorded for this item.'}</p>

            {/*
              The ranked list, summarised for this one item instead of laid out in full below the
              picker. Whether the thing you are looking at is actually recommended for your spec is
              the question the guide list exists to answer, and it is answerable in a line.
            */}
            {rankedHere ? (
              <p className="pane-rank pane-rank-listed" data-testid="pane-rank">
                <strong>#{rankedHere.rank}</strong> for {character.spec} {character.className} in this slot
                {rankedHere.notes ? ` — ${rankedHere.notes}` : ''}
              </p>
            ) : (
              <p className="pane-rank" data-testid="pane-rank">
                Not in the {character.spec} {character.className} ranked list for this slot.
              </p>
            )}
          </div>

          {/*
            Names the profession rather than leaving the slot silently without a control. An absent
            enchant picker is indistinguishable from "this app does not model ring enchants", which is
            the same silence that let them be handed to every character for months.
          */}
          {gatingProfessions.length > 0 && (
            <p className="pane-enchant-locked" data-testid="pane-enchant-locked">
              {gatingProfessions.join(' or ')} unlocks {enchants.length > 0 ? 'more enchants for this slot' : 'this slot’s enchants'} — take it
              on the Professions tab.
            </p>
          )}

          {enchants.length > 0 && (
            <label className="pane-field">
              <span className="pane-field-label">Enchant</span>
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
            <div className="pane-sockets" aria-label={`${displayName} sockets`}>
              {equipped.item.sockets.map((socket, index) => {
                const gem = getGemById(equipped.gemIds[index])
                return (
                  <div className="pane-socket" key={`${slot}-${socket}-${index}`}>
                    <label className="pane-field">
                      <span className="pane-field-label">
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
                <p className={`pane-socket-bonus ${socketBonusMet ? 'pane-socket-bonus-active' : ''}`.trim()} data-testid="socket-bonus-status">
                  <strong>Socket bonus</strong> {describeStats(equipped.item.socketBonus)} —{' '}
                  {socketBonusMet ? 'active' : 'not earned: every socket needs a gem whose colour matches it'}
                </p>
              )}
            </div>
          ) : null}

          <ItemFacts item={equipped.item} slotLabel={displayName} />
          </div>
      </div>
    </section>
  )
}

/** Provenance and crafting, which come from the curated layer and are absent on most ingested items. */
function ItemFacts({ item, slotLabel }: { item: GearItem; slotLabel: string }) {
  const location = [item.source, item.zone, item.instance, item.boss, item.vendor, item.reputation].filter(Boolean).join(' · ')

  return (
    <div className="pane-facts">
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
