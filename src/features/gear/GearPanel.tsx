import { useEffect, useMemo, useRef, useState } from 'react'
import { ViewSwitch } from '../../components/ui/ViewSwitch'
import { checklistTotals, gearChecklist, getBisListForSpec, rankedListsFor } from '../../domain/bis'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { sumGearStats } from '../../domain/gear/gearStats'
import { getActiveSets } from '../../domain/gear/itemSets'
import type { HitCap } from '../../domain/simulation/hitCap'
import type { CharacterProfile } from '../character/characterTypes'
import { GearSheet } from './GearSheet'
import type { GearSession, GearView } from './gearSession'
import { SetBonuses } from './SetBonuses'
import { getGearSlotDisplayName, getVisibleGearSlotsForSpec, isEmptySlotItem, isItemBlockedByUniqueInGear } from './gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from './gearTypes'
import type { RecommendedSet } from './equipRecommendedSet'
import { SlotPane } from './SlotPane'
import { WhatsLeft } from './WhatsLeft'

type GearPanelProps = {
  character: CharacterProfile
  role: CharacterRole
  gear: EquippedGear
  onChange: (slot: GearSlot, equippedSlot: EquippedSlot) => void
  /** Fills every slot from this spec's ranked list; see `equipRecommendedSet`. */
  onEquipRecommended: () => RecommendedSet | undefined
  /** Takes everything off. */
  onEmpty: () => void
  /** Opens the Build tab, where a character is imported. */
  onImport: () => void
  /** The hit rating the gear has to bring, from the simulator's tables; nothing for a healer. */
  hitCap?: HitCap
  session: GearSession
  onSession: (session: GearSession) => void
}

/** The order the game's character window lists slots in, for "What's left" and the count. */
const SLOT_ORDER: readonly GearSlot[] = [
  'Head',
  'Neck',
  'Shoulders',
  'Back',
  'Chest',
  'Wrists',
  'Hands',
  'Waist',
  'Legs',
  'Feet',
  'Finger 1',
  'Finger 2',
  'Trinket 1',
  'Trinket 2',
  'Main Hand',
  'Off Hand',
  'Ranged',
  'Relic',
]

const RECOMMENDED_MESSAGE =
  "Equipped the recommended set: Wowhead's rank 1 in every slot (the second ring and trinket take the next one down), with the guide's enchants and gems."

/**
 * The Character Planner's Gear tab (port step 6, 2026-10-19): design B's character sheet, with design
 * C's checklist behind a switch as "What's left", whose count is the slots with something left to do.
 * Both read the spec's own Wowhead list and its gem and enchant guide; pressing a slot (or Change in
 * the checklist) opens the slot pane beside them, which keeps every legal item, the profession-gated
 * enchants and the gem pickers.
 *
 * **The pane is the app's, not the prototype's flyout** (the owner's call, 2026-10-19): the flyout
 * offered only the guide's ranked items, where the pane offers every item the slot takes.
 */
export function GearPanel({ character, role, gear, onChange, onEquipRecommended, onEmpty, onImport, hitCap, session, onSession }: GearPanelProps) {
  const [openSlot, setOpenSlot] = useState<GearSlot>()
  const [message, setMessage] = useState('')
  /*
   * What the last press of "Equip the recommended set" managed, kept so the panel can say when the
   * list came up short. Cleared when the set is emptied again, because a report about a set that is
   * no longer on the character is worse than none.
   */
  const [lastEquip, setLastEquip] = useState<RecommendedSet>()
  /*
   * The slot buttons and the checklist's Change buttons, so closing the pane can hand focus back to
   * the one that opened it. Without this the browser drops focus to the top of the document when the
   * pane's Close button stops existing.
   */
  const slotRefs = useRef<Partial<Record<GearSlot, HTMLButtonElement | null>>>({})
  const changeRefs = useRef<Partial<Record<GearSlot, HTMLButtonElement | null>>>({})
  const onlyRef = useRef<HTMLButtonElement | null>(null)
  const focusOnly = useRef(false)

  const shown = useMemo(() => {
    const slots = getVisibleGearSlotsForSpec(character.className, character.spec)
    return SLOT_ORDER.filter((slot) => slots.includes(slot))
  }, [character.className, character.spec])
  const bisList = getBisListForSpec(character.className, character.spec)
  const lists = useMemo(() => (bisList ? rankedListsFor(bisList) : []), [bisList])
  const checks = useMemo(() => gearChecklist(character, shown, gear, lists), [character, shown, gear, lists])
  const totals = checklistTotals(checks)
  const fromGear = useMemo(() => sumGearStats(gear), [gear])
  const activeSets = useMemo(() => getActiveSets(Object.values(gear).map((slot) => slot.item)), [gear])
  const nothingEquipped = shown.every((slot) => isEmptySlotItem(gear[slot].item))
  const display = (slot: GearSlot) => getGearSlotDisplayName(slot, character.className, character.spec)

  // A count on the sheet opens "What's left" and puts focus on its filter, as the prototype did.
  useEffect(() => {
    if (session.view === 'left' && focusOnly.current) {
      focusOnly.current = false
      onlyRef.current?.focus()
    }
  }, [session.view])

  function closePane() {
    const returning = openSlot
    setOpenSlot(undefined)
    if (returning) (session.view === 'sheet' ? slotRefs : changeRefs).current[returning]?.focus()
  }

  function updateItem(slot: GearSlot, item: GearItem) {
    if (isItemBlockedByUniqueInGear(item, slot, gear)) return
    onChange(slot, { item, gemIds: item.sockets?.map(() => '') ?? [] })
  }

  function equipRecommended() {
    const set = onEquipRecommended()
    setLastEquip(set)
    setOpenSlot(undefined)
    setMessage(set ? RECOMMENDED_MESSAGE : '')
  }

  function show(view: GearView) {
    setOpenSlot(undefined)
    onSession({ ...session, view })
  }

  return (
    /*
      No heading of its own. The section tab above already says Gear, and the character strip names
      whose gear it is — a third "Gear" in the same column is a heading spent on something nobody was
      going to ask.
    */
    <section className="panel gear-panel" aria-label="Gear">
      {/*
        **One thing to do on a screen that has nothing on it yet.**

        Five participants in the usability study ran the simulator on a character wearing nothing,
        and the owner's evaluation asked the same question at the gear popup: "how do I know what
        item to select". Seventeen empty slots do not answer it. The ranked list for the spec does,
        and equipping it is one press — after which this block is gone and the tools take its place.
      */}
      {nothingEquipped ? (
        <div className="gear-empty" data-testid="gear-empty">
          <h3>Nothing equipped yet</h3>
          <p>Start from the Phase 2 list for {character.spec} {character.className}, then change whatever you like.</p>
          <div className="gear-empty-actions">
            <button type="button" className="gear-empty-action" data-testid="equip-recommended" onClick={equipRecommended}>
              Equip the recommended set
            </button>
            <button type="button" className="gear-tool" data-testid="gear-import" onClick={onImport}>
              Import your character
            </button>
          </div>
          <p className="gear-empty-alt">or pick a slot below and choose for yourself</p>
        </div>
      ) : (
        <div className="gear-tools">
          <button type="button" className="gear-tool is-main" data-testid="equip-recommended" onClick={equipRecommended}>
            Equip the recommended set
          </button>
          <button
            type="button"
            className="gear-tool"
            data-testid="gear-empty-all"
            onClick={() => {
              onEmpty()
              setLastEquip(undefined)
              setOpenSlot(undefined)
              setMessage('Emptied every slot.')
            }}
          >
            Empty every slot
          </button>
          <button type="button" className="gear-tool" data-testid="gear-import" onClick={onImport}>
            Import your character
          </button>
        </div>
      )}

      <p className="gear-msg" role="status" data-testid="gear-message">
        {message}
      </p>

      {/*
        Said plainly when the list could not fill something, rather than leaving a gap to be noticed
        later: an item that has left the catalogue, or a second copy of something unique-equipped.
      */}
      {!nothingEquipped && lastEquip && lastEquip.skipped.length > 0 && (
        <p className="gear-equip-note" data-testid="equip-report">
          Equipped {lastEquip.filled} slots. {lastEquip.skipped.join(', ')} {lastEquip.skipped.length === 1 ? 'was' : 'were'} left
          empty — the list names something this catalogue cannot give you twice, or at all.
        </p>
      )}

      <ViewSwitch
        label="Gear view"
        value={session.view}
        onChange={show}
        options={[
          { id: 'sheet', label: 'Character sheet' },
          {
            id: 'left',
            label: "What's left",
            count: { n: totals.left, label: `${totals.left} slot${totals.left === 1 ? '' : 's'} with something left` },
          },
        ]}
      />

      {/*
        The gear and the slot you are working on, side by side: the sheet (or the checklist) stays
        readable while you choose, which is the whole reason this is not an overlay.
      */}
      <div className="gear-split" data-pane={openSlot ? '' : undefined}>
        {session.view === 'sheet' ? (
          <GearSheet
            character={character}
            role={role}
            gear={gear}
            checks={checks}
            totals={totals}
            fromGear={fromGear}
            hitCap={hitCap}
            activeSets={activeSets}
            openSlot={openSlot}
            onOpen={(slot) => setOpenSlot(openSlot === slot ? undefined : slot)}
            slotRef={(slot, node) => {
              slotRefs.current[slot] = node
            }}
            onShowLeft={() => {
              focusOnly.current = true
              setOpenSlot(undefined)
              onSession({ ...session, view: 'left', onlyLeft: true, group: 'slot' })
            }}
          />
        ) : (
          <WhatsLeft
            character={character}
            gear={gear}
            checks={checks}
            totals={totals}
            hitCap={hitCap}
            gearHit={hitCap ? Math.round(fromGear[hitCap.stat]) : 0}
            session={session}
            onSession={onSession}
            display={display}
            onFix={(slot, equipped, text) => {
              onChange(slot, equipped)
              setMessage(text)
              // The pressed fix leaves with its flag; focus stays on the row, or on the filter if the row went too.
              requestAnimationFrame(() => (changeRefs.current[slot] ?? onlyRef.current)?.focus())
            }}
            openSlot={openSlot}
            onOpen={(slot) => setOpenSlot(openSlot === slot ? undefined : slot)}
            changeRef={(slot, node) => {
              changeRefs.current[slot] = node
            }}
            onlyRef={(node) => {
              onlyRef.current = node
            }}
          />
        )}

        {openSlot && (
          <SlotPane
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
            onClose={closePane}
          />
        )}
      </div>

      <SetBonuses activeSets={activeSets} />
    </section>
  )
}
