import { useMemo, useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import { ViewSwitch } from '../../components/ui/ViewSwitch'
import { getBisListForSpec, guideFitting, rankedItems, rankedListsFor, upgradesLeft } from '../../domain/bis'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import type { CharacterProfile } from '../character/characterTypes'
import { getRoleForSpec } from '../character/characterData'
import { getGearSlotDisplayName } from '../gear/gearData'
import type { EquippedGear, EquippedSlot, GearItem, GearSlot } from '../gear/gearTypes'
import type { RankedSession, RankedView } from './rankedSession'
import { SlotBySlot } from './SlotBySlot'
import { WhereItDrops } from './WhereItDrops'

type RankedGearPanelProps = {
  character: CharacterProfile
  gear: EquippedGear
  onEquip: (slot: GearSlot, equippedSlot: EquippedSlot) => void
  session: RankedSession
  onSession: (session: RankedSession) => void
}

/**
 * The Character Planner's Ranked Gear tab (port step 6, 2026-10-18): Wowhead's Phase 2 order for the
 * character's own spec, "Slot by slot" as game-style tooltips, with "Where it drops" behind a switch
 * whose count is the upgrades left. Both views read the gear the Gear tab holds, and Equip changes it.
 */
export function RankedGearPanel({ character, gear, onEquip, session, onSession }: RankedGearPanelProps) {
  const [message, setMessage] = useState('')
  const bisList = getBisListForSpec(character.className, character.spec)
  const lists = useMemo(() => (bisList ? rankedListsFor(bisList) : []), [bisList])
  const items = useMemo(() => rankedItems(lists, gear), [lists, gear])
  const left = upgradesLeft(items)
  const accent = getRoleAccentColor(getRoleForSpec(character.className, character.spec))

  if (!bisList) {
    return (
      <Panel title="Ranked Gear" eyebrow="Wowhead's Phase 2 lists" className="ranked-panel-shell" accentColor={accent}>
        <div className="bis-empty" data-testid="bis-empty-state">
          <strong>No ranked list yet for {character.spec} {character.className}.</strong>
          <p>Every class and spec has a Phase 2 ranked list. Later phases plug into this same tab as they are audited.</p>
        </div>
      </Panel>
    )
  }

  const display = (slot: GearSlot) => getGearSlotDisplayName(slot, character.className, character.spec)
  const equip = (slot: GearSlot, item: GearItem) => {
    onEquip(slot, guideFitting(character, slot, item, gear))
    setMessage(`${display(slot)}: equipped ${item.name}. The Gear tab shows it too.`)
  }
  const show = (view: RankedView) => {
    setMessage('')
    onSession({ ...session, view })
  }

  return (
    <Panel title="Ranked Gear" eyebrow={bisList.title} className="ranked-panel-shell" accentColor={accent}>
      <div className="ranked-panel" data-testid="bis-panel">
        <ViewSwitch
          label="Ranked Gear view"
          value={session.view}
          onChange={show}
          options={[
            { id: 'slot', label: 'Slot by slot' },
            { id: 'where', label: 'Where it drops', count: { n: left, label: `${left} upgrade${left === 1 ? '' : 's'} left` } },
          ]}
        />
        {session.view === 'slot' ? (
          <SlotBySlot
            character={character}
            gear={gear}
            lists={lists}
            slot={session.slot}
            onSlot={(slot) => {
              setMessage('')
              onSession({ ...session, slot })
            }}
            onEquip={equip}
          />
        ) : (
          <WhereItDrops
            character={character}
            gear={gear}
            items={items}
            onlyUpgrades={session.onlyUpgrades}
            onOnlyUpgrades={(onlyUpgrades) => onSession({ ...session, onlyUpgrades })}
            display={display}
            onEquip={equip}
          />
        )}
        <p className="ranked-msg" role="status" data-testid="ranked-message">
          {message}
        </p>
      </div>
    </Panel>
  )
}
