import { useEffect, useMemo, useRef, useState } from 'react'
import { getEnchantsForSlot } from '../../domain/enchants/sampleEnchants'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getGemsForSocket } from '../../domain/gems/sampleGems'
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
  const enchants = getEnchantsForSlot(slot, character, equipped.item)

  /**
   * Highest item level first, then alphabetical.
   *
   * The catalogue's own order is by item id, which is close to release order and means the first
   * thing a player sees in a 400-option list is a Classic-era green. Item level is not a ranking —
   * sockets, set bonuses and stat weights all matter more — but it is a far better opening guess than
   * whatever Blizzard happened to number first.
   */
  const allOptions = useMemo(
    () =>
      [...getItemsForSlotAndCharacter(slot, character.className, character.spec)].sort(
        (a, b) => (b.itemLevel ?? 0) - (a.itemLevel ?? 0) || a.name.localeCompare(b.name),
      ),
    [slot, character.className, character.spec],
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

        <div className="popup-body">
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
                <option>No relevant item options</option>
              )}
            </select>
          </label>

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
              {equipped.item.sockets.map((socket, index) => (
                <label className="popup-field" key={`${slot}-${socket}-${index}`}>
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
                    {getGemsForSocket(socket).map((gem) => (
                      <option key={gem.id} value={gem.id}>
                        {gem.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              {equipped.item.socketBonus && <p className="popup-note">Socket bonus applies when gem colours match.</p>}
            </div>
          ) : null}

          <ItemFacts item={equipped.item} slotLabel={displayName} />
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
      {item.needsVerification && <small className="needs-verification">Needs source/rank verification.</small>}
    </div>
  )
}
