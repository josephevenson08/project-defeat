import { useRef, type CSSProperties } from 'react'
import { ItemTooltip } from '../../components/ui/ItemTooltip'
import {
  equipBlock,
  guideFitting,
  listForSlot,
  slotsWearing,
  whereFrom,
  whereText,
  wornItem,
  type RankedGearEntry,
  type RankedList,
} from '../../domain/bis'
import { describeCost, getAcquisitionCost } from '../../domain/gear/acquisitionCost'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { CharacterProfile } from '../character/characterTypes'
import { getGearSlotDisplayName, getItemById, getVisibleGearSlotsForSpec } from '../gear/gearData'
import type { EquippedGear, GearItem, GearSlot } from '../gear/gearTypes'
import { ItemIcon } from '../gear/ItemIcon'
import { slotGlyph } from '../gear/slotGlyphs'
import { rankedTip } from './rankedTip'

type SlotBySlotProps = {
  character: CharacterProfile
  gear: EquippedGear
  lists: readonly RankedList[]
  slot: GearSlot
  onSlot: (slot: GearSlot) => void
  onEquip: (slot: GearSlot, item: GearItem) => void
}

const qualityFrame = (item: GearItem | undefined) => (item ? ({ '--q': getQualityColor(item.quality) } as CSSProperties) : undefined)

/**
 * "Slot by slot" (design A): Wowhead's order for one slot at a time, each item as the game's tooltip
 * fitted out the guide's way, with the guide's note, what you wear marked, and Equip. If what you
 * wear isn't on the list it is shown first, so the ranking always reads against something. Rings and
 * trinkets share one list for both slots, and a unique one can't go in both.
 */
export function SlotBySlot({ character, gear, lists, slot, onSlot, onEquip }: SlotBySlotProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const visible = getVisibleGearSlotsForSpec(character.className, character.spec)
  const current = visible.includes(slot) ? slot : visible[0]
  const list = listForSlot(lists, current)
  const display = (key: GearSlot) => getGearSlotDisplayName(key, character.className, character.spec)
  const worn = wornItem(gear, current)
  const wornEntry = worn ? list?.entries.find((entry) => entry.itemId === worn.id) : undefined
  const entries = list?.entries ?? []

  const wearLine = !worn ? 'this slot is empty' : wornEntry ? `you wear #${wornEntry.rank}` : "what you wear isn't on the list"
  const pairLine = list && list.slots.length > 1 ? ` · one list for both ${list.label.toLowerCase()} slots` : ''
  // Said when the guide ranks nothing here, and why when the data shows it: every main-hand pick two-handed.
  const mainHand = listForSlot(lists, 'Main Hand')
  const twoHanded = current === 'Off Hand' && !!mainHand?.entries.length && mainHand.entries.every(isTwoHander)

  // After Equip the pressed button turns into "Equipped" and loses focus; the slot keeps it.
  const equip = (item: GearItem) => {
    onEquip(current, item)
    stripRef.current?.querySelector<HTMLButtonElement>(`[data-slot="${current}"]`)?.focus()
  }

  return (
    <div className="ranked-slot-view">
      <p className="ranked-lead">
        Wowhead's {character.spec} {character.className} Phase 2 order for each slot, best first. Pick a slot from your gear. Each item is
        shown with the guide's enchant for the slot and its gem for each socket colour; Equip puts it on, and the Gear tab shows it too.
      </p>
      <div className="ranked-slots" role="group" aria-label="Slot" ref={stripRef}>
        {visible.map((key) => {
          const item = wornItem(gear, key)
          const name = display(key)
          return (
            <button
              key={key}
              type="button"
              className="ranked-slot"
              aria-pressed={key === current}
              aria-label={item ? `${name}: ${item.name}` : `${name}, empty`}
              title={item ? `${name}: ${item.name}` : name}
              data-slot={key}
              data-testid={`ranked-slot-${key}`}
              onClick={() => onSlot(key)}
            >
              <span className={`ranked-slot-icon${item ? '' : ' is-empty'}`} style={qualityFrame(item)} aria-hidden="true">
                <ItemIcon wowItemId={item?.wowItemId} fallback={slotGlyph(key)} />
              </span>
              <small aria-hidden="true">{slotGlyph(key)}</small>
            </button>
          )
        })}
      </div>

      <div className="ranked-head">
        <h4>{display(current)}</h4>
        <small>
          {entries.length} ranked · {wearLine}
          {pairLine}
        </small>
      </div>

      {entries.length === 0 ? (
        <p className="ranked-none" data-testid="ranked-none">
          Wowhead's {character.spec} {character.className} list ranks nothing for {display(current)}.
          {twoHanded && ' Its main-hand picks are all two-handed.'}
        </p>
      ) : (
        <ol className="ranked-cards" aria-label={`${display(current)}, ranked`}>
          {worn && !wornEntry && list && (
            <RankedCard character={character} gear={gear} slot={current} list={list} item={worn} display={display} onEquip={equip} />
          )}
          {list &&
            entries.map((entry) => (
              <RankedCard
                key={`${entry.itemId}-${entry.rank}`}
                character={character}
                gear={gear}
                slot={current}
                list={list}
                item={itemFor(entry)}
                entry={entry}
                display={display}
                onEquip={equip}
              />
            ))}
        </ol>
      )}
    </div>
  )
}

/** Every ranked entry resolves to a catalogue item: `bisLists` drops the ones that don't. */
const itemFor = (entry: RankedGearEntry) => getItemById(entry.itemId) as GearItem
const isTwoHander = (entry: RankedGearEntry) => getItemById(entry.itemId)?.handType === 'Two Hand'

type RankedCardProps = {
  character: CharacterProfile
  gear: EquippedGear
  slot: GearSlot
  list: RankedList
  item: GearItem
  /** Absent for what you wear when the list doesn't rank it. */
  entry?: RankedGearEntry
  display: (slot: GearSlot) => string
  onEquip: (item: GearItem) => void
}

function RankedCard({ character, gear, slot, list, item, entry, display, onEquip }: RankedCardProps) {
  const wearing = wornItem(gear, slot)?.id === item.id
  const elsewhere = wearing ? undefined : slotsWearing(list, item.id, gear)[0]
  const block = wearing ? undefined : equipBlock(item, slot, gear)
  const where = entry ? whereFrom(entry, item) : undefined
  const verify = entry?.source?.needsVerification || entry?.needsVerification || item.needsVerification

  return (
    <li className={`ranked-card${wearing ? ' is-worn' : ''}${entry ? '' : ' is-off'}`} data-testid={`ranked-card-${item.id}`}>
      <div className="ranked-card-top">
        {entry ? (
          <>
            <span className="ranked-rank">#{entry.rank}</span>
            {entry.label && <span className={`ranked-note${/^Best/i.test(entry.label) ? ' is-best' : ''}`}>{entry.label}</span>}
          </>
        ) : (
          <span className="ranked-note">Not on Wowhead's list</span>
        )}
        {wearing && <span className="ranked-tag is-worn">You wear this</span>}
        {elsewhere && <span className="ranked-tag is-worn">In your {display(elsewhere)}</span>}
      </div>

      <div className="ranked-card-tip">
        <span className="ranked-card-icon" style={qualityFrame(item)} aria-hidden="true">
          <ItemIcon wowItemId={item.wowItemId} fallback={slotGlyph(slot)} />
        </span>
        <ItemTooltip tip={rankedTip(item, guideFitting(character, slot, item, gear), where ? whereText(where) : '')} />
      </div>

      {entry && <CostLine entry={entry} item={item} />}
      {entry && verify && <p className="ranked-verify">Needs source/rank verification before treating as final.</p>}

      <div className="ranked-card-act">
        {wearing ? (
          <button type="button" className="ranked-equip" disabled>
            Equipped
          </button>
        ) : block ? (
          <button type="button" className="ranked-equip" disabled>
            {block.kind === 'unique' ? `Unique: already in ${display(block.slot)}` : 'Main Hand holds a two-hander'}
          </button>
        ) : (
          <button type="button" className="ranked-equip" aria-label={`Equip ${item.name} in ${display(slot)}`} onClick={() => onEquip(item)}>
            Equip in {display(slot)}
          </button>
        )}
      </div>
    </li>
  )
}

/**
 * What it costs, for an item you make or buy: the curated recipe with a farm spot per reagent where
 * one exists (it says more), otherwise the ingested reagents or price. Never both, which would print
 * the reagents twice.
 */
function CostLine({ entry, item }: { entry: RankedGearEntry; item: GearItem }) {
  if (item.crafting) {
    const { crafting } = item
    return (
      <details className="ranked-crafting">
        <summary>
          Made with {item.craftedBy}
          {crafting.requiredSkill ? ` ${crafting.requiredSkill}` : ''}
          {crafting.specialization ? ` · ${crafting.specialization}` : ''} · {crafting.materials.length} reagents
        </summary>
        {crafting.recipeSource && <p>Recipe: {crafting.recipeSource}</p>}
        <ul>
          {crafting.materials.map((material) => (
            <li key={material.name}>
              <b>
                {material.quantity}x {material.name}
              </b>{' '}
              — {material.farmSource}
            </li>
          ))}
        </ul>
      </details>
    )
  }
  const cost = getAcquisitionCost(entry.wowItemId ?? item.wowItemId)
  const described = describeCost(cost)
  if (!cost || !described) return null
  return (
    <p className="ranked-cost" data-testid={`bis-cost-${entry.itemId}`}>
      <b>{cost.type === 'Crafted' ? 'Costs' : 'Price'}</b>{' '}
      {cost.type === 'Crafted' && cost.profession ? `${cost.profession}${cost.requiredSkill ? ` ${cost.requiredSkill}` : ''}: ` : ''}
      {described}
      {cost.type === 'Vendor' && cost.vendor ? ` · from ${cost.vendor}` : ''}
    </p>
  )
}
