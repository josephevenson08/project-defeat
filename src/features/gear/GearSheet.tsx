import { useEffect, type CSSProperties } from 'react'
import { FloatingTip } from '../../components/ui/FloatingTip'
import { ItemTooltip } from '../../components/ui/ItemTooltip'
import { useHoverTip } from '../../components/ui/useHoverTip'
import { whereFrom, whereText, type ChecklistTotals, type SlotCheck } from '../../domain/bis'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getEnchantById } from '../../domain/enchants/sampleEnchants'
import type { ActiveSet } from '../../domain/gear/itemSets'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { hitCapWords, hitStanding, type HitCap } from '../../domain/simulation/hitCap'
import { relevantStats } from '../../domain/stats/statRelevance'
import { statLabels, type StatBlock } from '../../domain/stats/statTypes'
import type { CharacterProfile } from '../character/characterTypes'
import { enchantLine, fittedItemTip } from './fittedItemTip'
import { getGearSlotDisplayName, getItemsForSlotAndCharacter } from './gearData'
import type { EquippedGear, GearSlot } from './gearTypes'
import { ItemIcon } from './ItemIcon'
import { slotGlyph } from './slotGlyphs'
import { cue } from '../../lib/motion'

type GearSheetProps = {
  character: CharacterProfile
  role: CharacterRole
  gear: EquippedGear
  checks: readonly SlotCheck[]
  totals: ChecklistTotals
  fromGear: StatBlock
  hitCap?: HitCap
  activeSets: readonly ActiveSet[]
  openSlot?: GearSlot
  onOpen: (slot: GearSlot) => void
  /** Each slot's button, so closing the pane can hand focus back to it. */
  slotRef: (slot: GearSlot, node: HTMLButtonElement | null) => void
  /** A count was pressed: show "What's left", filtered to what is left. */
  onShowLeft: () => void
}

/*
 * The game's character window: armour down the left with the shirt and tabard where the game draws
 * them, jewellery and the rest down the right, weapons along the bottom. A spec's own slots fill it
 * (a Rogue has no relic, a Shaman's is a Totem), and the two cosmetic slots are drawn but do nothing.
 */
const LEFT: readonly (GearSlot | 'Shirt' | 'Tabard')[] = ['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Shirt', 'Tabard', 'Wrists']
const RIGHT: readonly GearSlot[] = ['Hands', 'Waist', 'Legs', 'Feet', 'Finger 1', 'Finger 2', 'Trinket 1', 'Trinket 2']
const BOTTOM: readonly GearSlot[] = ['Main Hand', 'Off Hand', 'Ranged', 'Relic']

/** What "From this gear" lists for each role, filtered per spec by the stat bar's relevance rules. */
const SHEET_STATS: Record<CharacterRole, readonly (keyof StatBlock)[]> = {
  'Physical DPS': ['strength', 'agility', 'attackPower', 'rangedAttackPower', 'feralAttackPower', 'hitRating', 'critRating', 'hasteRating', 'expertiseRating', 'armorPenetration'],
  'Caster DPS': ['intellect', 'spellPower', 'spellHitRating', 'spellCritRating', 'spellHasteRating', 'mp5'],
  Healer: ['intellect', 'spirit', 'healingPower', 'spellCritRating', 'spellHasteRating', 'mp5'],
  Tank: ['stamina', 'armor', 'defenseRating', 'dodgeRating', 'parryRating', 'blockRating', 'blockValue', 'hitRating', 'expertiseRating'],
}

const LABEL = new Map(statLabels)

/** Our own crest, not a Blizzard emblem: a crystal over a ring, in the tab's colour. */
function Crest() {
  return (
    <svg className="gear-sheet-crest" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="gear-crest-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="1" stopColor="var(--glow)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="56" r="34" fill="none" stroke="var(--glow)" strokeOpacity="0.45" strokeWidth="1.5" />
      <circle cx="50" cy="56" r="27" fill="none" stroke="var(--glow)" strokeOpacity="0.25" strokeDasharray="3 4" />
      <path d="M50 8 L66 46 L50 92 L34 46 Z" fill="url(#gear-crest-fill)" opacity="0.9" />
      <path d="M50 8 L66 46 L50 50 Z" fill="#ffffff" opacity="0.35" />
    </svg>
  )
}

/**
 * The Gear tab's character sheet (design B): every slot as the game's icon frame with what it holds,
 * its gems as dots and its enchant, a game-style tooltip on hover or focus, and the middle column
 * with the gear's own stats, the hit cap in plain words and the four counts that open "What's left".
 * Pressing a slot opens the slot pane beside the sheet.
 */
export function GearSheet({
  character,
  role,
  gear,
  checks,
  totals,
  fromGear,
  hitCap,
  activeSets,
  openSlot,
  onOpen,
  slotRef,
  onShowLeft,
}: GearSheetProps) {
  const tip = useHoverTip<GearSlot>()
  const bySlot = new Map(checks.map((check) => [check.slot, check]))
  const display = (slot: GearSlot) => getGearSlotDisplayName(slot, character.className, character.spec)

  const slotButton = (slot: GearSlot, place: 'left' | 'right' | 'bottom') => {
    const check = bySlot.get(slot)
    if (!check) return null
    const item = check.item
    const equipped = gear[slot]
    const enchant = getEnchantById(equipped.enchantId)
    const name = display(slot)
    // An item the spec cannot use, kept from before a spec change: said, not silently dropped.
    const stale = !!item && !getItemsForSlotAndCharacter(slot, character.className, character.spec).some((option) => option.id === item.id)
    return (
      <li key={slot}>
        <button
          type="button"
          className={`gear-row gear-slot is-${place}${openSlot === slot ? ' gear-row-open' : ''}`}
          ref={(node) => slotRef(slot, node)}
          aria-label={`${name} slot`}
          aria-describedby={`gear-slot-${slotGlyph(slot)}`}
          aria-expanded={openSlot === slot}
          data-slot={slot}
          onClick={() => onOpen(slot)}
          {...(item ? tip.bind(slot) : {})}
        >
          <span
            className={`gear-row-icon gear-slot-icon${item ? '' : ' is-empty'}`}
            style={item ? ({ '--q': getQualityColor(item.quality) } as CSSProperties) : undefined}
            aria-hidden="true"
          >
            <ItemIcon wowItemId={item?.wowItemId} fallback={slotGlyph(slot)} />
            {item?.itemLevel ? <i className="gear-slot-ilvl">{item.itemLevel}</i> : null}
          </span>
          <span className="gear-slot-text" id={`gear-slot-${slotGlyph(slot)}`}>
            <span className="gear-row-slot">{name}</span>
            <span className={`gear-row-item${item ? '' : ' gear-row-empty'}`} style={item ? { color: getQualityColor(item.quality) } : undefined}>
              {item ? item.name : 'empty'}
            </span>
            {item && (
              <small className="gear-slot-sub">
                {item.sockets?.length ? (
                  <span className="gear-gems" aria-hidden="true">
                    {item.sockets.map((socket, index) => (
                      <i
                        key={`${socket}-${index}`}
                        className={`socket-dot socket-${socket.toLowerCase()}${equipped.gemIds[index] ? ' socket-filled' : ''}`}
                      />
                    ))}
                  </span>
                ) : null}
                {enchant ? (
                  <span className="gear-row-enchant is-ok">✦ {enchantLine(enchant.name)}</span>
                ) : check.missingEnchant ? (
                  <span className="gear-row-enchant is-miss">✦ no enchant</span>
                ) : null}
                {stale && <span className="stale-slot-warning">Not valid for this spec</span>}
              </small>
            )}
          </span>
        </button>
      </li>
    )
  }

  const cosmetic = (name: 'Shirt' | 'Tabard') => (
    <li key={name} className="gear-slot-cosmetic" aria-hidden="true" title={`${name}: cosmetic, not planned here`}>
      <span className="gear-slot-icon is-empty">{name.slice(0, 2).toUpperCase()}</span>
      <span className="gear-slot-text">
        <span className="gear-row-slot">{name}</span>
        <small>cosmetic</small>
      </span>
    </li>
  )

  const tipped = tip.target ? bySlot.get(tip.target.data) : undefined
  const tippedItem = tipped?.item
  const shownStats = relevantStats(SHEET_STATS[role], role, character.className, character.spec)
  const hit = hitCap ? Math.round(fromGear[hitCap.stat]) : 0
  const standing = hitCap ? hitStanding(hit, hitCap) : undefined
  // Short of the cap, the hit number takes the prototypes' slow tint (port step 7); the words say so too.
  const under = standing?.state === 'under'
  useEffect(() => cue({ kind: 'taint', target: '[data-testid="gear-hit"]', on: under }), [under])

  const count = (testId: string, ok: boolean, text: string) => (
    <button type="button" className={`gear-sheet-count ${ok ? 'is-ok' : 'is-miss'}`} data-testid={testId} onClick={onShowLeft}>
      {text}
    </button>
  )

  return (
    <div className="gear-list gear-sheet" data-testid="gear-sheet">
      <ul className="gear-sheet-col is-left" aria-label="Armour">
        {LEFT.map((slot) => (slot === 'Shirt' || slot === 'Tabard' ? cosmetic(slot) : slotButton(slot, 'left')))}
      </ul>

      <div className="gear-sheet-mid">
        <Crest />
        <h3>
          {character.race} {character.spec} {character.className}
        </h3>
        {activeSets.map(({ set, equippedPieces }) => (
          <p className="gear-sheet-set" key={set.id}>
            <span className="gear-sheet-set-name">{set.name}</span>
            <span className="gear-sheet-pips" aria-hidden="true">
              {Array.from({ length: set.totalPieces }, (_, index) => (
                <i key={index} className={index < equippedPieces ? 'is-on' : undefined} />
              ))}
            </span>
            <span className="gear-sheet-set-n">
              {equippedPieces}/{set.totalPieces}
            </span>
          </p>
        ))}

        <h4 className="gear-sheet-sth">From this gear</h4>
        <dl className="gear-sheet-stats" aria-label="Stats from this gear">
          {shownStats.map((stat) => (
            <div key={stat} className={hitCap?.stat === stat ? `is-hit is-${standing?.state}` : undefined}>
              <dt>{LABEL.get(stat)}</dt>
              <dd data-testid={hitCap?.stat === stat ? 'gear-hit' : undefined}>
                {hitCap?.stat === stat ? `${hit} / ${hitCap.cap}` : Math.round(fromGear[stat]).toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
        {hitCap && standing && (
          <p className={`gear-sheet-hit is-${standing.state}`} data-testid="gear-hit-line">
            <b>
              Hit {hit} / {hitCap.cap}
            </b>
            , {standing.text}. <small>{hitCapWords(hitCap)}</small>
          </p>
        )}

        <div className="gear-sheet-counts" role="group" aria-label="What is left">
          {count('gear-count-best', totals.best === totals.ranked, `${totals.best} of ${totals.ranked} slots best on Wowhead's list`)}
          {count('gear-count-enchants', totals.enchanted === totals.enchantable, `${totals.enchanted} of ${totals.enchantable} enchants`)}
          {count('gear-count-sockets', totals.filled === totals.sockets, `${totals.filled} of ${totals.sockets} sockets filled`)}
          {count('gear-count-bonuses', totals.bonusesLeft === 0, `${totals.bonusesOn} of ${totals.withBonus} socket bonuses on`)}
        </div>
      </div>

      <ul className="gear-sheet-col is-right" aria-label="Hands, waist, legs, feet, rings and trinkets">
        {RIGHT.map((slot) => slotButton(slot, 'right'))}
      </ul>
      <ul className="gear-sheet-bottom" aria-label="Weapons">
        {BOTTOM.map((slot) => slotButton(slot, 'bottom'))}
      </ul>

      {tip.target && tipped && tippedItem && (
        <FloatingTip anchor={tip.target.anchor} placement="beside" className="item-tip-box" testId="gear-tip">
          <ItemTooltip
            tip={fittedItemTip(
              tippedItem,
              gear[tipped.slot],
              whereText(whereFrom(tipped.entry, tippedItem)),
              tipped.list?.entries.length
                ? tipped.entry
                  ? `Rank ${tipped.entry.rank} of ${tipped.list.entries.length} on Wowhead's ${character.spec} ${character.className} list`
                  : `Not on Wowhead's ${character.spec} ${character.className} list for this slot`
                : undefined,
            )}
          />
        </FloatingTip>
      )}
    </div>
  )
}
