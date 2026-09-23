import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { LoadingIntro } from './components/layout/LoadingIntro'
import { SectionPicker } from './components/layout/SectionPicker'
import { BisPanel } from './features/bis/BisPanel'
import { BuildPanel } from './features/builds/BuildPanel'
import { applySavedGear, type BuildState } from './domain/builds/buildSerialization'
import { decodeBuildFromLink, readShareValue } from './domain/builds/shareLink'
import { ShareNotice, type ShareNoticeState } from './features/builds/ShareNotice'
import type { SavedBuild } from './domain/builds/buildTypes'
import { CharacterCreator } from './features/character/CharacterCreator'
import { CharacterRail } from './features/character/CharacterRail'
import { TalentsPanel } from './features/talents/TalentsPanel'
import type { TalentPoints } from './domain/talents/talentTypes'
import { deriveTalentModifiers } from './domain/talents/talentModifiers'
import { getRoleForSpec } from './features/character/characterData'
import type { CharacterProfile } from './features/character/characterTypes'
import { applyWeaponSlotRules, emptyGear, normalizeGearForCharacter } from './features/gear/gearData'
import { dropIllegalEnchants } from './domain/enchants/sampleEnchants'
import { ComparePanel } from './features/gear/ComparePanel'
import { GearPanel } from './features/gear/GearPanel'
import type { EquippedGear, EquippedSlot, GearSlot } from './features/gear/gearTypes'
import { calculateSimulation } from './features/simulator/calculateSimulation'
import { isSimulationEnabled } from './featureFlags'
import { calculateStatWeights } from './features/simulator/calculateStatWeights'
import { findUpgrades } from './features/simulator/findUpgrades'
import { SimulatorPanel } from './features/simulator/SimulatorPanel'
import { StatWeightsPanel } from './features/simulator/StatWeightsPanel'
import { UpgradesPanel } from './features/simulator/UpgradesPanel'
import type { SimulationResult } from './features/simulator/simulationTypes'
import { defaultSimulationTarget } from './domain/simulation/sampleEncounters'
import { calculateStats } from './features/stats/calculateStats'
import { StatsRail } from './features/stats/StatsRail'
import { ProfessionsPanel } from './features/professions/ProfessionsPanel'
import { RaidCompositionPanel } from './features/raidcomp/RaidCompositionPanel'
import { TierListsPanel } from './features/tierlists/TierListsPanel'
import { RaidsPanel } from './features/raids/RaidsPanel'
import { RaidPicker } from './features/raids/RaidPicker'
import { RaidRail } from './features/raids/RaidRail'
import { TabNav, type TabDefinition } from './components/layout/TabNav'
import { BuffsPanel } from './features/buffs/BuffsPanel'

/**
 * The faction theme is stamped on `<html>`, not on a wrapper inside the app.
 *
 * **It has to be the root element or the page's own ground is the wrong colour.** `:root` paints the
 * body background, and a Horde character on an Alliance-blue ground would show a warm panel sitting
 * on a cool page — visible in exactly the gap the app does not control. Stamping the document
 * element means the background, the scrollbar and every panel change together.
 *
 * Driven from the character rather than from a separate control, because the app already asks which
 * faction you are before anything else, and a second switch for the same fact is a second thing to
 * keep in sync.
 */
function useFactionTheme(faction: CharacterProfile['faction']) {
  useEffect(() => {
    document.documentElement.dataset.faction = faction.toLowerCase()
  }, [faction])
}

const initialCharacter: CharacterProfile = {
  faction: 'Alliance',
  race: 'Human',
  className: 'Warrior',
  spec: 'Fury',
}

type AppTab = 'planner' | 'simulation' | 'raidcomp' | 'tierlists' | 'raids' | 'professions'

/**
 * Simulation is its own tab rather than more panels under the planner.
 *
 * It is a different activity from gearing — you gear for a while, then ask what the gear is worth —
 * and the planner tab already carries five panels. Splitting them is what the persistent rail makes
 * affordable: the stat totals stay on screen while you simulate, so moving between the two does not
 * cost you the numbers you were reading.
 *
 * Everything the simulator computes lives here together: the encounter it runs against, the result,
 * the stat weights derived from re-running it, and the upgrade finder built on those.
 */
const APP_TABS: readonly TabDefinition<AppTab>[] = [
  { id: 'planner', label: 'Character Planner' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'raidcomp', label: 'Raid Composition' },
  { id: 'tierlists', label: 'Spec Tier Lists' },
  { id: 'raids', label: 'Raids' },
  { id: 'professions', label: 'Professions' },
]

/**
 * Simulation is currently hidden — see `isSimulationEnabled` for why. Filtered here rather than
 * removed from `APP_TABS` so the tab's definition, and this comment, stay next to the others.
 */
function visibleTabs(simulationEnabled: boolean) {
  return APP_TABS.filter((tab) => tab.id !== 'simulation' || simulationEnabled)
}

type PlannerView = 'gear' | 'compare' | 'talents' | 'buffs' | 'bis' | 'build'

/**
 * The planner's four panels, as a second level of tabs rather than one column.
 *
 * Stacked, they came to about 15 screen-heights, and two of them were 85% of it: the ranked-gear
 * list at 59% and the talent trees at 26%. Reaching Build meant scrolling past 19 gear slots and 27
 * talent trees. The rail already solved "don't lose your numbers when you move between tabs", which
 * is what makes splitting these affordable — the stat totals stay on screen throughout, so this
 * costs nothing that the single column was providing.
 *
 * Sub-tabs rather than collapsible panels because these are different activities, not several views
 * of one thing: you gear, then you spend talent points, then you check a ranking. Collapsing would
 * have kept the scroll and added a second thing to manage.
 *
 * Buffs & Consumables is back as the fifth. It was hidden along with the Simulation tab, but for a
 * different reason and with a worse consequence: its data is real and sourced — 33 raid buffs each
 * cited to the spell rank its numbers were read from, 31 consumables, 6 target debuffs — and
 * `calculateStats` has been applying it the whole time. With nothing rendering the toggles, every
 * one of those defaulted off and could not be turned on, so a sourced dataset reached no number in
 * the app. It sits next to Talents because both are "what you bring", ahead of the rankings you
 * check against.
 *
 * **Compare sits directly after Gear because it is part of gearing**, not a separate activity the way
 * talents and rankings are — you equip something, then ask whether the other drop was better. It is
 * deliberately not folded into the Gear panel itself: the paperdoll is about what you are wearing,
 * and a comparison is about two things you are not.
 */
const PLANNER_VIEWS: readonly TabDefinition<PlannerView>[] = [
  { id: 'gear', label: 'Gear' },
  { id: 'compare', label: 'Compare' },
  { id: 'talents', label: 'Talents' },
  { id: 'buffs', label: 'Buffs' },
  { id: 'bis', label: 'Ranked Gear' },
  { id: 'build', label: 'Build' },
]

/**
 * Rebuilds a full gear set from a saved build, normalized against the character it was saved for.
 *
 * **The baseline is empty gear, not the default set.** A slot missing from a saved build is one the
 * import dropped — its item left the catalogue, or is not legal for this character — and the report
 * says so. Refilling it from `defaultGear` put an item there the player never chose and the report
 * never mentioned. The app starts every character empty, so a dropped slot returns to that.
 */
function gearFromBuild(build: SavedBuild): EquippedGear {
  const baseline = normalizeGearForCharacter(emptyGear, build.character.className, build.character.spec)
  const normalized = normalizeGearForCharacter(applySavedGear(baseline, build.gear), build.character.className, build.character.spec)
  // A saved `enchantId` is carried across on a type check alone, so a build from before professions
  // existed can arrive holding a ring enchant its character is not entitled to.
  return dropIllegalEnchants(normalized, build.character)
}

function App() {
  /*
   * **A load starts clean, deliberately.** The app used to restore the autosaved build at mount, so
   * it opened as whoever you were last time, already wearing the highest-item-level item in every
   * slot and holding whatever talents you had spent.
   *
   * Three things were wrong with that. Creation is where you say who you are, and skipping it made
   * the character feel assumed rather than chosen. A full set of gear nobody picked makes every
   * number on the stat rail describe someone else. And talents carried across a reload without
   * anyone asking for them.
   *
   * Builds still persist — through **named saves and export/import in the Build panel**, which is
   * explicit. What was removed is the implicit restore, not the ability to keep a build.
   */
  const [introComplete, setIntroComplete] = useState(false)
  const [sectionChosen, setSectionChosen] = useState(false)
  /** Whether the character has been chosen this session. Always false at mount — creation runs first. */
  const [characterChosen, setCharacterChosen] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('planner')
  // Session state, like `activeTab`. Which panel you were last reading is not part of the build.
  const [plannerView, setPlannerView] = useState<PlannerView>('gear')
  const [character, setCharacter] = useState<CharacterProfile>(initialCharacter)
  useFactionTheme(character.faction)

  const [gear, setGear] = useState<EquippedGear>(emptyGear)
  const [activeBuffIds, setActiveBuffIds] = useState<readonly string[]>([])
  const [activeConsumableIds, setActiveConsumableIds] = useState<readonly string[]>([])
  const [activeTargetDebuffIds, setActiveTargetDebuffIds] = useState<readonly string[]>([])
  const [talentPoints, setTalentPoints] = useState<TalentPoints>({})
  /*
   * Which raid's loot is being read. Undefined means the picker: five loot tables stacked on one page
   * is several hundred rows, and nobody arrives wanting all five — they arrive wanting one.
   */
  const [selectedRaidId, setSelectedRaidId] = useState<string>()
  /*
   * The encounter is fixed, so this is a constant rather than state.
   *
   * It used to restore `restoredBuild?.target`, which quietly outlived the controls that set it: a
   * build saved while the armor presets existed would come back carrying 3,500 armor, and the panel
   * would announce "one fixed target — level 73 with 3,500 armor" while telling the reader there was
   * nothing to configure. Every number would differ from another player's for a reason neither could
   * see or change. A fixed target has to be fixed for restored builds too.
   *
   * `target` stays in the saved payload, so old builds still parse and new ones still round-trip. It
   * is simply no longer read back.
   */
  const target = defaultSimulationTarget
  const [simulationResult, setSimulationResult] = useState<SimulationResult>()

  const buildState: BuildState = { character, gear, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, talentPoints, target }

  // Stable, because the shared-link loader below depends on it and every call inside is a setter.
  const importBuild = useCallback((build: SavedBuild) => {
    setCharacter(build.character)
    setGear(gearFromBuild(build))
    setActiveBuffIds(build.activeBuffIds)
    setActiveConsumableIds(build.activeConsumableIds)
    setActiveTargetDebuffIds(build.activeTargetDebuffIds)
    setTalentPoints(build.talentPoints ?? {})
    setSimulationResult(undefined)
  }, [])

  /*
   * **A build link opens straight into the planner, wearing the build.** Whoever sent it has already
   * chosen the character, so the section picker and character creation are skipped — the same thing
   * loading a named save does, arrived at from outside.
   *
   * The intro stays on screen until the link is decoded, which takes milliseconds against the intro's
   * seconds; without that hold the section picker could flash before the planner replaced it.
   *
   * The fragment is removed once read, whatever the outcome. Left in place, a reload would re-import it
   * over anything changed since — and this app deliberately forgets on reload, so the link would be
   * the one thing that did not. `hashchange` is handled too, for a link pasted into a tab that is
   * already open. The `cancelled` guard is for StrictMode's double-run in development, which would
   * otherwise apply one link twice.
   */
  const [sharePending, setSharePending] = useState(
    () => typeof window !== 'undefined' && readShareValue(window.location.hash) !== undefined,
  )
  const [shareNotice, setShareNotice] = useState<ShareNoticeState>()

  useEffect(() => {
    let cancelled = false

    async function applySharedBuild(value: string) {
      const result = await decodeBuildFromLink(value)
      if (cancelled) return

      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      if (result.ok) {
        importBuild(result.build)
        setActiveTab('planner')
        setPlannerView('gear')
        setSectionChosen(true)
        setCharacterChosen(true)
        setShareNotice({ kind: 'loaded', issues: result.issues })
      } else {
        setShareNotice({ kind: 'error', message: result.error })
      }
      setSharePending(false)
    }

    const initial = readShareValue(window.location.hash)
    if (initial !== undefined) void applySharedBuild(initial)

    // No loading hold here: the player is already in the app, and bringing the intro back mid-session
    // for a few milliseconds of decoding would be a flash of the wrong screen.
    function onHashChange() {
      const value = readShareValue(window.location.hash)
      if (value !== undefined) void applySharedBuild(value)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => {
      cancelled = true
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [importBuild])

  const dismissShareNotice = useCallback(() => setShareNotice(undefined), [])
  const shareNoticeBanner = shareNotice ? <ShareNotice notice={shareNotice} onDismiss={dismissShareNotice} /> : null

  const role = getRoleForSpec(character.className, character.spec)

  /*
   * Recomputed per render rather than read once at mount, because it now depends on the character:
   * the Simulation tab is a DPS surface, so changing spec from Fury to Protection takes it away.
   *
   * `currentTab` is **derived** rather than corrected afterwards. Storing `'simulation'` and fixing
   * it up in an effect would leave one render where the tab bar and the pane disagree, and would put
   * a `setState` inside an effect for something that is already a pure function of state.
   *
   * It is a guard rather than a path a player can walk today: the character selects live on the
   * planner's rail, and the Simulation tab has no rail, so the spec cannot change while that tab is
   * the one on screen. Saying so is the point — `activeTab` is session state that could be
   * persisted later, and this is what stops that becoming a blank pane.
   */
  const simulationEnabled = isSimulationEnabled(role)
  const currentTab: AppTab = activeTab === 'simulation' && !simulationEnabled ? 'planner' : activeTab

  /**
   * Moving between sections, from the tab bar.
   *
   * **A section opens at its top.** The address never changes, so the browser kept the last page's
   * scroll offset: in the 2026-09-21 usability study three participants landed at the bottom of the
   * next section with no heading in sight, one on Raids at 522 of 522px.
   *
   * **Choosing the section you are already in takes you to its start.** A participant deep in the
   * Herbalism guide tapped Professions expecting the profession list, stayed exactly where she was,
   * and thought she had broken something. Professions keeps its choice inside the panel, so bumping
   * `sectionVisit` remounts it on the grid. Raids keeps its choice here.
   */
  const [sectionVisit, setSectionVisit] = useState(0)
  function changeSection(tab: AppTab) {
    if (tab === currentTab) {
      setSectionVisit((visit) => visit + 1)
      if (tab === 'raids') setSelectedRaidId(undefined)
    } else {
      setActiveTab(tab)
    }
    window.scrollTo(0, 0)
  }

  /*
   * Talents now reach the stat rail, the gear rankings and the upgrade finder, not the hidden
   * simulator alone. An empty tree is the identity, so an untalented character reads exactly as it
   * did before — which is the invariant that made widening this safe to do at all.
   */
  const talentModifiers = useMemo(() => deriveTalentModifiers(talentPoints), [talentPoints])

  const stats = useMemo(
    () => calculateStats(character, gear, activeBuffIds, activeConsumableIds, undefined, talentModifiers),
    [character, gear, activeBuffIds, activeConsumableIds, talentModifiers],
  )
  // Cheap enough to keep live (a handful of pure re-runs of the sim), and stat priority is reference
  // information you want visible while gearing rather than something to press a button for.
  const statWeights = useMemo(
    () => calculateStatWeights(character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints],
  )

  function updateGear(slot: GearSlot, equippedSlot: EquippedSlot) {
    // Equipping a two-hander has to empty the off hand, the same way switching spec into one does.
    // Without this the rule would hold only until the first manual weapon change.
    setGear((current) => applyWeaponSlotRules({ ...current, [slot]: equippedSlot }))
    setSimulationResult(undefined)
  }

  function updateCharacter(nextCharacter: CharacterProfile) {
    // Talents belong to a class. Keeping them across a class change would leave points sitting on
    // talent ids that the new class's trees do not contain.
    if (nextCharacter.className !== character.className) setTalentPoints({})
    setCharacter(nextCharacter)
    setGear((current) =>
      // Enchants as well as items: dropping Enchanting has to take the ring enchant with it, or the
      // picker stops offering something the stat rail is still counting.
      dropIllegalEnchants(normalizeGearForCharacter(current, nextCharacter.className, nextCharacter.spec), nextCharacter),
    )
    setSimulationResult(undefined)
  }

  /*
   * The three id lists feed `calculateStats`, `findUpgrades` and the saved-build format, and these
   * toggles are what let a player change them again. They were removed when the Buffs & Consumables
   * panel was hidden, which left the lists permanently empty — the sourced buff data was still being
   * applied, it just had nothing to apply.
   *
   * One shared helper rather than three near-identical ones: the operation is the same set-toggle in
   * every case, and the only thing that differs is which piece of state it writes.
   */
  const toggleId = useCallback(
    (setIds: Dispatch<SetStateAction<readonly string[]>>) => (id: string) =>
      setIds((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id])),
    [],
  )

  const toggleBuff = useMemo(() => toggleId(setActiveBuffIds), [toggleId])
  const toggleConsumable = useMemo(() => toggleId(setActiveConsumableIds), [toggleId])
  const toggleTargetDebuff = useMemo(() => toggleId(setActiveTargetDebuffIds), [toggleId])

  const upgradeReport = useMemo(
    () => findUpgrades(character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints),
    [character, gear, role, activeBuffIds, activeConsumableIds, activeTargetDebuffIds, target, talentPoints],
  )

  function runSimulation() {
    // `stats` already carries the talent build, so the estimate and the rail agree by construction
    // rather than by coincidence. They disagreed by design until 2026-08-20.
    setSimulationResult(calculateSimulation(character, gear, stats, role, activeTargetDebuffIds, target, talentPoints, activeBuffIds))
  }

  const completeIntro = useCallback(() => {
    setIntroComplete(true)
  }, [])

  if (!introComplete || sharePending) return <LoadingIntro onComplete={completeIntro} />

  // The way in. Choosing a section is a real decision — gearing a character, reading a loot table and
  // levelling a profession have nothing to do with each other — so it is made once, deliberately,
  // rather than by landing in whichever tab happened to be first. The tab bar still moves you
  // between them afterwards.
  if (!sectionChosen) {
    return (
      <>
        {shareNoticeBanner}
        <SectionPicker
          onSelect={(section) => {
            setActiveTab(section)
            setSectionChosen(true)
            // The front page can be scrolled on a phone; the section starts at its top all the same.
            window.scrollTo(0, 0)
          }}
        />
      </>
    )
  }

  // Creation runs before the planner rather than inside it: the whole tab is about a character, so
  // there is nothing worth showing until there is one. Reachable again from the rail's "Start over".
  if (currentTab === 'planner' && !characterChosen) {
    return (
      <CharacterCreator
        initial={character}
        onComplete={(chosen) => {
          updateCharacter(chosen)
          setCharacterChosen(true)
          // The planner starts at its top, like any other screen. Creation is a full-screen step of its
          // own, and on a phone it left the page scrolled wherever its last step had reached — far
          // enough down that the rail's own heading and "Start over" sat above the screen.
          window.scrollTo(0, 0)
        }}
        onCancel={() => setSectionChosen(false)}
      />
    )
  }

  return (
    <AppShell
      // Stats belong to a character, and only the planner has one in play. A rail of numbers next to
      // a raid's loot table would be describing something that is not on screen.
      rail={
        currentTab === 'planner' ? (
          <>
            <CharacterRail character={character} onChange={updateCharacter} onRestart={() => setCharacterChosen(false)} />
            <StatsRail stats={stats} role={role} className={character.className} spec={character.spec} />
          </>
        ) : currentTab === 'raids' && selectedRaidId ? (
          // Same argument as the planner's stat rail: the rail holds the thing you keep returning to
          // while reading the main pane. Here that is the list of other raids.
          <RaidRail selectedRaidId={selectedRaidId} onSelect={setSelectedRaidId} onBackToPicker={() => setSelectedRaidId(undefined)} />
        ) : undefined
      }
      tabs={visibleTabs(simulationEnabled)}
      activeTab={currentTab}
      onTabChange={changeSection}
    >
      {shareNoticeBanner}
      {currentTab === 'planner' && (
        <>
          {/* The character selects live in the rail now — see CharacterRail. This tab is what you
              are doing, not who you are. */}
          <TabNav
            tabs={PLANNER_VIEWS}
            activeTab={plannerView}
            onChange={setPlannerView}
            ariaLabel="Planner sections"
            className="tab-nav tab-nav-sub"
          />
          {plannerView === 'gear' && (
            <GearPanel character={character} gear={gear} onChange={updateGear} stats={stats} role={role} />
          )}
          {plannerView === 'compare' && (
            <ComparePanel
              character={character}
              gear={gear}
              role={role}
              activeBuffIds={activeBuffIds}
              activeConsumableIds={activeConsumableIds}
              activeTargetDebuffIds={activeTargetDebuffIds}
              target={target}
              talentPoints={talentPoints}
            />
          )}
          {plannerView === 'talents' && <TalentsPanel character={character} points={talentPoints} onChange={setTalentPoints} />}
          {plannerView === 'buffs' && (
            <BuffsPanel
              character={character}
              activeBuffIds={activeBuffIds}
              activeConsumableIds={activeConsumableIds}
              activeTargetDebuffIds={activeTargetDebuffIds}
              onToggleBuff={toggleBuff}
              onToggleConsumable={toggleConsumable}
              onToggleTargetDebuff={toggleTargetDebuff}
            />
          )}
          {plannerView === 'bis' && <BisPanel character={character} gear={gear} onEquip={updateGear} />}
          {plannerView === 'build' && <BuildPanel state={buildState} role={role} onImport={importBuild} />}
        </>
      )}
      {currentTab === 'simulation' && simulationEnabled && (
        <>
          <SimulatorPanel result={simulationResult} role={role} onRun={runSimulation} />
          <StatWeightsPanel weights={statWeights} role={role} />
          <UpgradesPanel character={character} report={upgradeReport} role={role} onEquip={updateGear} />
        </>
      )}
      {/* The character is passed only once it has been chosen deliberately. Marking the default Fury
          Warrior on the lists for someone who never picked it would answer "where do I stand" with a
          spec they never named. */}
      {currentTab === 'raidcomp' && <RaidCompositionPanel />}
      {currentTab === 'tierlists' && <TierListsPanel highlight={characterChosen ? character : undefined} />}
      {currentTab === 'raids' &&
        (selectedRaidId ? <RaidsPanel raidId={selectedRaidId} /> : <RaidPicker onSelect={setSelectedRaidId} />)}
      {currentTab === 'professions' && <ProfessionsPanel key={sectionVisit} />}
    </AppShell>
  )
}

export default App
