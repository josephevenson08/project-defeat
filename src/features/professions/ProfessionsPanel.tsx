import { Panel } from '../../components/layout/Panel'
import { ViewSwitch } from '../../components/ui/ViewSwitch'
import { specListKey, specLists } from '../../domain/professions'
import type { Profession } from '../../domain/professions'
import { toggleProfession } from '../../domain/professions/characterProfessions'
import type { CharacterProfile } from '../character/characterTypes'
import { ProfessionWindow } from './ProfessionWindow'
import { DEFAULT_PROFESSION, type ProfessionsSession, type ProfessionsView } from './professionsSession'
import { WhichTwo } from './WhichTwo'

type ProfessionsPanelProps = {
  session: ProfessionsSession
  onSession: (session: ProfessionsSession) => void
  /**
   * Present only once a character exists. Arriving from the front page without one is a perfectly
   * good way to read the window; "Which two" then holds its pair for the visit.
   */
  character?: CharacterProfile
  onChangeCharacter?: (character: CharacterProfile) => void
}

const VIEWS = [
  { id: 'level', label: 'Level it', hint: 'the profession window' },
  { id: 'which', label: 'Which two', hint: 'what each is worth to you' },
] as const

/**
 * The Professions tab (port step 3, 2026-10-15): the profession window, with "Which two" behind a
 * switch — the owner's pick of the three Professions designs (`docs/design/prototypes/tabs/professions.html`).
 */
export function ProfessionsPanel({ session, onSession, character, onChangeCharacter }: ProfessionsPanelProps) {
  const profession = session.profession ?? character?.professions?.[0] ?? DEFAULT_PROFESSION
  const skill = session.skills[profession] ?? 1
  const yours = character ? specListKey(character) : undefined
  const spec =
    specLists.find((list) => list.key === session.spec) ??
    specLists.find((list) => list.key === yours) ??
    specLists.find((list) => list.key === 'Warrior|Fury') ??
    specLists[0]
  const heldBy = character && onChangeCharacter ? 'character' : 'visit'
  const pair = heldBy === 'character' ? (character?.professions ?? []) : session.pair

  function toggle(name: Profession) {
    if (character && onChangeCharacter) {
      onChangeCharacter({ ...character, professions: toggleProfession(character.professions, name) })
    } else {
      onSession({ ...session, pair: toggleProfession(session.pair, name) })
    }
  }

  return (
    <Panel title="Professions" eyebrow="Levelling & what each is worth" className="professions-panel-shell">
      <ViewSwitch<ProfessionsView>
        label="Show"
        options={VIEWS}
        value={session.view}
        onChange={(view) => onSession({ ...session, view })}
      />

      {session.view === 'level' ? (
        <ProfessionWindow
          profession={profession}
          skill={skill}
          pick={session.picks[profession]}
          onProfession={(name) => onSession({ ...session, profession: name })}
          onSkill={(value) =>
            onSession({
              ...session,
              profession,
              skills: { ...session.skills, [profession]: value },
              // A new skill puts the list back on the step you are on.
              picks: { ...session.picks, [profession]: undefined },
            })
          }
          onPick={(index) => onSession({ ...session, profession, picks: { ...session.picks, [profession]: index } })}
        />
      ) : (
        <WhichTwo
          spec={spec}
          onSpec={(key) => onSession({ ...session, spec: key })}
          pair={pair}
          onToggle={toggle}
          heldBy={heldBy}
        />
      )}
    </Panel>
  )
}
