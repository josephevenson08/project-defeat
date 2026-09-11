import { useMemo, useState } from 'react'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import { getActiveSets } from '../../domain/gear/itemSets'
import { getQualityColor } from '../../domain/gear/qualityColors'
import type { CharacterProfile } from '../character/characterTypes'
import { SetBonuses } from './SetBonuses'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter, getVisibleGearSlotsForSpec, isEmptySlotItem, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
import { ItemPopup } from './ItemPopup'
import { slotGlyph } from './slotGlyphs'
import { GearStatSummary } from './GearStatSummary'
import type { StatBlock } from '../../domain/stats/statTypes'
import type { CharacterRole } from '../../domain/character/characterTypes'

type GearPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onChange: (slot: GearSlot, equippedSlot: EquippedSlot) => void
  /**
   * The same totals the rail shows, computed once in `App` and passed down.
   *
   * Passed rather than recomputed here: `calculateStats` already runs for the rail on every gear
   * change, and a second call would be a second answer to keep in agreement with the first.
   */
  stats: StatBlock
  role: CharacterRole
}

/**
 * The paperdoll arrangement, following the in-game character sheet: armour down the left, the rest
 * down the right, weapons across the bottom.
 *
 * This is spatial memory doing work a list cannot. A player who has spent any time in WoW already
 * knows Head is top-left and trinkets are bottom-right, so the layout itself becomes the label — a
 * flat 4-by-5 grid made you read every slot name to find the one you wanted.
 *
 * Every slot the app knows appears here exactly once; `getVisibleGearSlotsForSpec` then filters it
 * per spec, so a Rogue's Relic and a Druid's Ranged simply do not render.
 */
/**
 * Where each slot sits on the body.
 *
 * **This replaced two flat columns, and the arrangement is the label.** The old layout listed Head
 * through Wrists down the left and Hands through Trinket 2 down the right, which is how WoWSims does
 * it — but it means finding your boots is reading fourteen slot names, because nothing about a
 * slot's position tells you what it is. The game's own character sheet does not work that way, and
 * neither does anyone's mental model of armour.
 *
 * So: head at the top centre, feet at the bottom centre, and the body slots down either side in
 * roughly the order you would meet them going down a person. You find the boots by looking where
 * boots go.
 *
 * The names are CSS grid areas, which is what makes the layout declarative rather than a stack of
 * columns that have to be kept balanced by hand. A slot a spec cannot use is simply not rendered and
 * its area stays empty — no reflow, no re-balancing, and the rest of the body stays where it was.
 */
const SLOT_AREA: Partial<Record<GearSlot, string>> = {
  Head: 'head',
  Shoulders: 'shoulders',
  Chest: 'chest',
  Wrists: 'wrists',
  Waist: 'waist',
  Legs: 'legs',
  Neck: 'neck',
  Back: 'back',
  Hands: 'hands',
  'Finger 1': 'f1',
  'Finger 2': 'f2',
  Feet: 'feet',
  'Trinket 1': 't1',
  'Trinket 2': 't2',
  Relic: 'relic',
  'Main Hand': 'mh',
  'Off Hand': 'oh',
  Ranged: 'rg',
}

/**
 * Which side of the body a slot sits on.
 *
 * Only used for presentation: the right-hand slots are mirrored so their glyphs sit on the outside
 * edge pointing in at the figure, and the equipped item's quality hairline moves to whichever edge
 * is outermost. That was keyed off two wrapper elements before the paperdoll became a single grid,
 * and the mirroring is worth keeping — it is what makes the two sides read as flanking something
 * rather than as two lists.
 *
 * A visual reversal only. DOM order is unchanged, so tab order and screen-reader order still run
 * top to bottom down the body.
 */
const SLOT_SIDE: Partial<Record<GearSlot, 'left' | 'right'>> = {
  Shoulders: 'left',
  Chest: 'left',
  Wrists: 'left',
  Waist: 'left',
  Legs: 'left',
  Neck: 'right',
  Back: 'right',
  Hands: 'right',
  'Finger 1': 'right',
  'Finger 2': 'right',
}

const PAPERDOLL_SLOTS: readonly GearSlot[] = Object.keys(SLOT_AREA) as GearSlot[]

/**
 * The equipped-gear list, laid out like the WoWSims gear panel the user pointed at: two columns of
 * slots, each a glyph carrying its item level, the item name in quality colour, and the enchant named
 * underneath in smaller text. Gems read as coloured dots on the glyph.
 *
 * Nothing here edits in place. Clicking a slot opens `ItemPopup`, so the list keeps its height and
 * stays scannable no matter what is being changed.
 */
export function GearPanel({ character, gear, onChange, stats, role }: GearPanelProps) {
  const [openSlot, setOpenSlot] = useState<GearSlot>()

  function updateItem(slot: GearSlot, item: GearItem) {
    if (isItemBlockedByUniqueInGear(item, slot, gear)) return
    onChange(slot, { item, gemIds: item.sockets?.map(() => '') ?? [] })
  }

  const slots = getVisibleGearSlotsForSpec(character.className, character.spec)
  const activeSets = useMemo(() => getActiveSets(Object.values(gear).map((slot) => slot.item)), [gear])

  /** Slots this spec actually wears — Rogues have no Relic, Druids no Ranged, and so on. */
  const visible = (slot: GearSlot) => slots.includes(slot)

  function renderSlot(slot: GearSlot) {
    const equipped = gear[slot]
    const displayName = getGearSlotDisplayName(slot, character.className, character.spec)
    const options = getItemsForSlotAndCharacter(slot, character.className, character.spec)
    // An empty slot is neither valid nor invalid — it is empty, and saying "Not valid for this spec"
    // about a slot nobody has filled reads as a fault in a character that was just created.
    const isValid = isEmptySlotItem(equipped.item) || options.some((option) => option.id === equipped.item.id)
    const enchant = equipped.enchantId ? getEnchantById(equipped.enchantId) : undefined

    return (
      <button
        type="button"
        className="gear-cell"
        key={slot}
        data-side={SLOT_SIDE[slot]}
        aria-label={`${displayName} slot`}
        onClick={() => setOpenSlot(slot)}
        /*
         * Two things in one style object, and they have to be one: JSX takes the *last* `style` prop
         * and silently drops any earlier one. This was two props for one render cycle and the grid
         * placement vanished without a type error or a lint warning — `react/jsx-no-duplicate-props`
         * is switched on now so the next one fails the build instead of the layout.
         *
         * `gridArea` puts the slot where that body part is. `--slot-quality` is the equipped item's
         * quality as a hairline down the slot's outer edge: quality is already the one colour this
         * interface lets carry meaning, and repeating it on the frame means which slots hold epics is
         * answerable without reading a name.
         */
        style={
          {
            gridArea: SLOT_AREA[slot],
            '--slot-quality': getQualityColor(equipped.item.quality),
          } as React.CSSProperties
        }
      >
        <span className="gear-glyph" aria-hidden="true">
          <ItemIcon wowItemId={equipped.item.wowItemId} fallback={slotGlyph(slot)} />
          {equipped.item.itemLevel ? <span className="gear-ilvl">{equipped.item.itemLevel}</span> : null}
        </span>

        <span className="gear-cell-text">
          <span className="gear-slot-name">{displayName}</span>
          <span className="gear-item-name" style={{ color: getQualityColor(equipped.item.quality) }}>
            {equipped.item.name}
          </span>
          {enchant ? <span className="gear-enchant">{enchant.name}</span> : <span className="gear-enchant gear-enchant-empty">No enchant</span>}
          {/*
            Sockets sit under the name rather than on top of the icon. They used to be 7px dots
            overlaying the artwork, where they competed with it and were too small to read a colour
            from — which is the whole job of a socket dot. Off the icon they can be twice the size
            and still cost less attention.
          */}
          {equipped.item.sockets?.length ? (
            <span className="gear-gems" aria-hidden="true">
              {equipped.item.sockets.map((socket, index) => (
                <i
                  key={`${slot}-${socket}-${index}`}
                  className={`socket-dot socket-${socket.toLowerCase()} ${equipped.gemIds[index] ? 'socket-filled' : ''}`.trim()}
                />
              ))}
            </span>
          ) : null}
          {!isValid && <span className="stale-slot-warning">Not valid for this spec</span>}
        </span>
      </button>
    )
  }

  return (
    <section className="panel gear-panel" aria-label="Gear">
      <header className="panel-head">
        <p className="eyebrow">Equipped</p>
        <h2>Gear</h2>
      </header>

      <div className="gear-paperdoll">
        {/*
          **The middle of the body holds the totals, not a drawing.**

          A silhouette was here first and it did one useful thing — it made the arrangement read as a
          body rather than as three uneven columns. But the job on this page is moving a number, and
          the number was in the rail on the other side of the screen. Six totals between the two
          columns of slots puts the effect of a swap next to its cause, which is worth more than the
          picture was. The anatomy still reads: head is still at the top, feet still at the bottom.
        */}
        <GearStatSummary stats={stats} role={role} className={character.className} spec={character.spec} />
        {PAPERDOLL_SLOTS.filter(visible).map(renderSlot)}
      </div>

      <SetBonuses activeSets={activeSets} />

      {openSlot && (
        <ItemPopup
          slot={openSlot}
          character={character}
          gear={gear}
          onChangeItem={(item) => updateItem(openSlot, item)}
          onChangeEnchant={(enchantId) => onChange(openSlot, { ...gear[openSlot], enchantId: enchantId || undefined })}
          onChangeGem={(index, gemId) => {
            const gemIds = [...gear[openSlot].gemIds]
            gemIds[index] = gemId
            onChange(openSlot, { ...gear[openSlot], gemIds })
          }}
          onClose={() => setOpenSlot(undefined)}
        />
      )}
    </section>
  )
}
