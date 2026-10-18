import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { serializeBuild, type BuildState } from '../../domain/builds/buildSerialization'
import type { TbcSpec } from '../../domain/character/characterTypes'
import { encodeBuildForLink, shareUrlFor } from '../../domain/builds/shareLink'
import type { BuildImportIssue, SavedBuild } from '../../domain/builds/buildTypes'
import exampleExport from '../../../addon/verify/fixture-export.json' with { type: 'json' }
import { ItemIcon } from '../gear/ItemIcon'
import { getGearSlotDisplayName } from '../gear/gearData'
import {
  deleteNamedBuild,
  exportBuildText,
  listNamedBuilds,
  MAX_BUILD_NAME_LENGTH,
  saveNamedBuild,
  type NamedBuild,
} from './buildStorage'
import { readPaste, summarizeBuild, type BuildSummary, type PasteRead } from './buildSummary'

type BuildPanelProps = {
  state: BuildState
  role: CharacterRole
  onImport: (build: SavedBuild) => void
}

type Status =
  | { kind: 'idle' }
  | { kind: 'copied' }
  | { kind: 'link-copied' }
  | { kind: 'link-shown' }
  | { kind: 'imported'; issues: BuildImportIssue[]; filled?: number; of?: number }
  | { kind: 'error'; message: string }
  | { kind: 'saved'; name: string }

/**
 * The build as a string that changes only when the build does. `savedAt` is a fresh timestamp on every
 * serialisation, so it is left out — otherwise no two renders would ever match.
 */
function buildFingerprint(state: BuildState) {
  const { savedAt: _savedAt, ...stable } = serializeBuild(state)
  return JSON.stringify(stable)
}

const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

/** "16 of 17 slots · item level 132 · talents 17 / 44 / 0 · 3 buffs · 2 consumables". */
function factsOf(summary: BuildSummary) {
  return [
    `${summary.filled} of ${summary.slots.length} slots`,
    `item level ${summary.itemLevel ?? '–'}`,
    ...(summary.talentSplit ? [`talents ${summary.talentSplit.join(' / ')}`] : []),
    `${plural(summary.buffs, 'buff')} · ${plural(summary.consumables, 'consumable')}`,
    ...summary.sets.map((set) => `${set.name} ${set.pieces}/${set.of}`),
  ]
}

/**
 * The share card: the build you are about to share, first, as the decided design has it — who it is,
 * the facts, and the gear's icons in their quality frames.
 */
function BuildCard({ summary, heading }: { summary: BuildSummary; heading?: string }) {
  return (
    <div className="build-card" data-testid="build-card">
      {summary.specIcon && (
        <img className="build-card-icon" src={`${import.meta.env.BASE_URL}icons/${summary.specIcon}.jpg`} alt="" width={44} height={44} />
      )}
      <h3>{heading ?? summary.title}</h3>
      <ul className="build-card-facts">
        {factsOf(summary).map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
      <div className="build-card-icons" aria-hidden="true">
        {summary.slots.map((slot) => {
          const item = summary.items[slot]
          return item ? (
            <span key={slot} className={`loot-icon loot-icon-${item.quality.toLowerCase()}`} style={{ '--loot-icon-size': '26px' } as CSSProperties}>
              <ItemIcon wowItemId={item.wowItemId} fallback="" />
            </span>
          ) : null
        })}
      </div>
    </div>
  )
}

const KIND_WORDS = { link: 'a build link', text: 'build text', addon: "the addon's export" } as const

/**
 * Design C's report, on the paste box: what came in, slot by slot (the item, or why the slot is
 * empty), the talents and the rest, before anything changes. A spec the talents cannot name is asked
 * here, and only "Load into the planner" puts the build on the other tabs.
 */
function PasteReport({
  read,
  spec,
  onSpec,
  onLoad,
  onClear,
}: {
  read: Extract<PasteRead, { ok: true }>
  spec?: TbcSpec
  onSpec: (spec: TbcSpec) => void
  onLoad: () => void
  onClear: () => void
}) {
  const build = spec ? { ...read.build, character: { ...read.build.character, spec } } : read.build
  const summary = summarizeBuild(build)
  const slotIssue = (slot: string) => read.issues.find((issue) => issue.slot === slot)?.message
  const otherIssues = read.issues.filter((issue) => !issue.slot || !summary.slots.includes(issue.slot))
  const asking = read.specChoice && !spec

  return (
    <div className="build-report" data-testid="build-report" aria-live="polite">
      <h4>What came in</h4>
      <p>
        Read from {KIND_WORDS[read.kind]}: <b>{summary.title}</b>, {summary.filled} of {summary.slots.length} slots worn
        {summary.talentSplit ? `, talents ${summary.talentSplit.join(' / ')}` : ''}
        {read.kind === 'addon' ? '' : `, ${summary.buffs} buffs and ${summary.consumables} consumables`}.{' '}
        {read.issues.length ? `${read.issues.length} ${read.issues.length === 1 ? 'note' : 'notes'}.` : 'Everything resolved cleanly.'} Nothing has
        changed yet.
      </p>

      {read.specChoice && (
        /*
         * TBC has no spec, only three trees and where the points went — so an even split, or a
         * character who has spent nothing, genuinely has no answer to infer. Asked before loading,
         * because a silently wrong spec drives every ranking on every other screen.
         */
        <div className="build-spec-choice" data-testid="build-spec-choice">
          <p>
            {read.specChoice.reason === 'no-points'
              ? 'This character has spent no talent points, so the export cannot say which spec it is.'
              : 'The talent points are evenly split, so the export cannot say which spec this is.'}{' '}
            Which is it?
          </p>
          <div className="build-spec-choice-options">
            {read.specChoice.candidates.map((candidate) => (
              <button
                key={candidate}
                type="button"
                className="build-pill"
                aria-pressed={spec === candidate}
                data-testid={`build-spec-${candidate.toLowerCase().replaceAll(' ', '-')}`}
                onClick={() => onSpec(candidate)}
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="build-report-slots" aria-label="Gear that came in">
        {summary.slots.map((slot) => {
          const item = summary.items[slot]
          const why = slotIssue(slot)
          const name = getGearSlotDisplayName(slot, build.character.className, build.character.spec)
          return (
            <li key={slot}>
              {item ? (
                <>
                  <span className={`loot-icon loot-icon-${item.quality.toLowerCase()}`} style={{ '--loot-icon-size': '24px' } as CSSProperties} aria-hidden="true">
                    <ItemIcon wowItemId={item.wowItemId} fallback="" />
                  </span>
                  <span>
                    <small>{name}</small> {item.name}
                  </span>
                </>
              ) : (
                <>
                  <span className="build-report-empty-icon" aria-hidden="true" />
                  <span className="build-report-empty">
                    {name}: empty{why && <span className="build-report-why">{why}</span>}
                  </span>
                </>
              )}
            </li>
          )
        })}
      </ul>
      {otherIssues.length > 0 && (
        <ul className="build-issue-list">
          {otherIssues.map((issue) => (
            <li key={`${issue.slot ?? 'general'}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      )}
      {read.kind === 'addon' && (
        <p className="build-small">The addon reads what you wear and your talents, not your raid&apos;s buffs, so the Buffs tab keeps its own.</p>
      )}
      <div className="build-actions">
        <Button data-testid="build-import-load" disabled={asking} onClick={onLoad}>
          Load into the planner
        </Button>
        <button type="button" className="build-pill" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  )
}

/**
 * The Build tab, as decided on 2026-10-10 and ported in step 6 of docs/design/PORT-PLAN.md: design A,
 * the share card, with design C's "What came in" report on its paste box
 * (`docs/design/prototypes/tabs/planner.html`, Build).
 */
export function BuildPanel({ state, role, onImport }: BuildPanelProps) {
  const [draft, setDraft] = useState('')
  /*
   * The link to the build on screen, made again whenever the build changes, so the field can never
   * describe a build that no longer exists. Kept with the fingerprint it was made from: while a new one
   * is being encoded the old one is not shown.
   */
  const [link, setLink] = useState<{ fingerprint: string; url: string }>()
  const fingerprint = buildFingerprint(state)
  const visibleLink = link?.fingerprint === fingerprint ? link.url : undefined
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [slotName, setSlotName] = useState('')
  const [savedBuilds, setSavedBuilds] = useState<readonly NamedBuild[]>(listNamedBuilds)
  const [read, setRead] = useState<Extract<PasteRead, { ok: true }>>()
  const [spec, setSpec] = useState<TbcSpec>()

  const current = serializeBuild(state)
  const summary = summarizeBuild(current)

  useEffect(() => {
    let cancelled = false
    void encodeBuildForLink(JSON.parse(fingerprint) as SavedBuild).then((value) => {
      if (!cancelled) setLink({ fingerprint, url: shareUrlFor(value, window.location) })
    })
    return () => {
      cancelled = true
    }
  }, [fingerprint])

  const refreshSaved = useCallback(() => setSavedBuilds(listNamedBuilds()), [])

  function handleSaveSlot() {
    const name = slotName.trim()
    if (!name) return
    if (!saveNamedBuild(name, state)) {
      setStatus({ kind: 'error', message: 'The browser refused to store the build — most likely out of storage space.' })
      return
    }
    setSlotName('')
    refreshSaved()
    setStatus({ kind: 'saved', name })
  }

  function handleLoadSlot(saved: NamedBuild) {
    onImport(saved.build)
    setStatus({ kind: 'imported', issues: [] })
  }

  function handleDeleteSlot(name: string) {
    deleteNamedBuild(name)
    refreshSaved()
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportBuildText(state))
      setStatus({ kind: 'copied' })
    } catch {
      setStatus({ kind: 'error', message: 'The browser blocked clipboard access. Open "Show build text" and copy it by hand.' })
    }
  }

  async function currentLink() {
    return visibleLink ?? shareUrlFor(await encodeBuildForLink(serializeBuild(state)), window.location)
  }

  async function handleCopyLink() {
    const url = await currentLink()
    try {
      await navigator.clipboard.writeText(url)
      setStatus({ kind: 'link-copied' })
    } catch {
      // The link is on screen regardless, so a blocked clipboard costs a manual copy, not the link.
      setStatus({ kind: 'link-shown' })
    }
  }

  async function handleNativeShare() {
    const url = await currentLink()
    try {
      await navigator.share({ title: 'Project Defeat build', url })
    } catch (error) {
      // Closing the share sheet rejects too, and that is not a failure worth reporting.
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus({ kind: 'link-shown' })
    }
  }

  /** Reads the paste and shows what came in. Changes nothing. */
  async function handleRead() {
    const result = await readPaste(draft)
    setSpec(undefined)
    if (!result.ok) {
      setRead(undefined)
      setStatus({ kind: 'error', message: result.error })
      return
    }
    setRead(result)
    setStatus({ kind: 'idle' })
  }

  /** Puts the read build on the planner, under the spec the player picked when the export could not say. */
  function handleLoadRead() {
    if (!read || (read.specChoice && !spec)) return
    const chosen = spec ? { ...read.build, character: { ...read.build.character, spec } } : read.build
    /*
     * The addon reads what a character wears and their talents, not the raid around them, so an export
     * keeps the buffs, consumables and target debuffs already set here, as the report promises. It
     * used to load them as empty, wiping the Buffs tab.
     */
    const build =
      read.kind === 'addon'
        ? {
            ...chosen,
            activeBuffIds: current.activeBuffIds,
            activeConsumableIds: current.activeConsumableIds,
            activeTargetDebuffIds: current.activeTargetDebuffIds,
          }
        : chosen
    const loaded = summarizeBuild(build)
    onImport(build)
    setStatus({ kind: 'imported', issues: read.issues, filled: loaded.filled, of: loaded.slots.length })
    setRead(undefined)
    setSpec(undefined)
    setDraft('')
  }

  return (
    <Panel title="Build" eyebrow="Share, save, bring one in" accentColor={getRoleAccentColor(role)} className="build-panel-shell">
      {/*
        This used to say the build was "saved to this browser automatically and restored next visit".
        Neither has been true since a load started clean — there is no autosave anywhere in the app.
      */}
      <p className="panel-copy" data-testid="build-panel-copy">
        Nothing is saved automatically — a reload starts with a new character. Share this build as a link: it opens the same character
        on any device, and nothing is uploaded, since the whole build (character, professions, gear, gems, enchants, talents, buffs and
        consumables) is in the link. Or save it under a name in this browser.
      </p>

      <BuildCard summary={summary} />

      <section className="build-share" aria-label="Share this build">
        <div className="build-actions">
          <Button data-testid="build-share-copy" onClick={handleCopyLink}>
            Copy share link
          </Button>
          {canNativeShare && (
            <Button data-testid="build-share-native" onClick={handleNativeShare}>
              Share…
            </Button>
          )}
          <button type="button" className="build-pill" onClick={handleCopy}>
            Copy build text
          </button>
        </div>
        <label className="field build-share-link">
          <span>Link to this build</span>
          <input
            aria-label="Link to this build"
            data-testid="build-share-link"
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            type="text"
            value={visibleLink ?? ''}
            placeholder="Making the link…"
          />
        </label>
      </section>

      <section className="build-slots" aria-label="Saved builds">
        <h3>Saved builds</h3>
        <p className="build-slots-hint">Saved builds stay in this browser. To take one to another device, load it and share it as a link.</p>

        <div className="build-slot-save">
          <label className="field">
            <span>Name this build</span>
            <input
              aria-label="Name this build"
              data-testid="build-slot-name"
              maxLength={MAX_BUILD_NAME_LENGTH}
              onChange={(event) => setSlotName(event.target.value)}
              placeholder="e.g. Fury BiS, Prot offspec"
              type="text"
              value={slotName}
            />
          </label>
          <Button data-testid="build-slot-save" disabled={slotName.trim().length === 0} onClick={handleSaveSlot}>
            Save in this browser
          </Button>
        </div>

        {savedBuilds.length === 0 ? (
          <p className="build-slots-empty" data-testid="build-slots-empty">
            Nothing saved yet.
          </p>
        ) : (
          <ul className="build-slot-list" data-testid="build-slot-list">
            {savedBuilds.map((saved) => {
              const facts = factsOf(summarizeBuild(saved.build)).slice(0, 3).join(' · ')
              return (
                <li key={saved.name}>
                  <div className="build-slot-main">
                    <strong>{saved.name}</strong>
                    <small>
                      {saved.build.character.race} {saved.build.character.spec} {saved.build.character.className} · {facts}
                    </small>
                  </div>
                  <Button data-testid={`build-slot-load-${saved.name}`} onClick={() => handleLoadSlot(saved)}>
                    Load
                  </Button>
                  <button
                    className="build-slot-delete"
                    data-testid={`build-slot-delete-${saved.name}`}
                    onClick={() => handleDeleteSlot(saved.name)}
                    type="button"
                    aria-label={`Delete ${saved.name}`}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="build-load" aria-label="Load a build">
        <h3>Load a build</h3>
        <p className="build-small">Reading it changes nothing: you see what came in first, then load it.</p>
        <label className="field build-import-field">
          <span>Paste a link, build text or the addon&apos;s export</span>
          <textarea
            aria-label="Import a build"
            data-testid="build-import-input"
            onChange={(event) => {
              setDraft(event.target.value)
              setRead(undefined)
            }}
            placeholder="Paste a build link, the build text, or the string from the addon's /pdexport"
            rows={4}
            value={draft}
          />
        </label>
        <div className="build-actions">
          <Button data-testid="build-import-button" disabled={draft.trim().length === 0} onClick={() => void handleRead()}>
            Read it
          </Button>
          <button
            type="button"
            className="build-pill"
            data-testid="build-import-example"
            onClick={() => {
              setDraft(JSON.stringify(exampleExport))
              setRead(undefined)
              setStatus({ kind: 'idle' })
            }}
          >
            Paste an example /pdexport
          </button>
          <span className="build-example-tag">example</span>
        </div>

        {read && (
          <PasteReport
            read={read}
            spec={spec}
            onSpec={setSpec}
            onLoad={handleLoadRead}
            onClear={() => {
              setRead(undefined)
              setSpec(undefined)
              setDraft('')
            }}
          />
        )}

        {status.kind === 'saved' && (
          <div className="summary-card build-status" data-testid="build-status">
            <span>Saved</span>
            <strong>Saved as &ldquo;{status.name}&rdquo; in this browser</strong>
          </div>
        )}

        {status.kind === 'copied' && (
          <div className="summary-card build-status" data-testid="build-status">
            <span>Copied</span>
            <strong>Build text copied to the clipboard</strong>
          </div>
        )}

        {status.kind === 'link-copied' && (
          <div className="summary-card build-status" data-testid="build-status">
            <span>Copied</span>
            <strong>Share link copied</strong>
            <p>Anyone who opens it gets this build in their planner. Nothing is uploaded — the build is in the link.</p>
          </div>
        )}

        {status.kind === 'link-shown' && (
          <div className="summary-card build-status" data-testid="build-status">
            <span>Link ready</span>
            <strong>Copy the link above</strong>
            <p>The browser would not put it on the clipboard, so it is shown for you to copy by hand.</p>
          </div>
        )}

        {status.kind === 'error' && (
          <div className="summary-card build-status build-status-error" data-testid="build-status">
            <span>Not read</span>
            <strong>Nothing was changed</strong>
            <p>{status.message}</p>
          </div>
        )}

        {status.kind === 'imported' && (
          <div className="summary-card build-status" data-testid="build-status">
            <span>Loaded</span>
            <strong>
              Build loaded{status.filled !== undefined ? `: ${status.filled} of ${status.of} slots and the talents` : ''}
            </strong>
            <p>The Gear, Talents and Buffs tabs show it.</p>
            {status.issues.length > 0 ? (
              <>
                <p>
                  Loaded, with {status.issues.length} {status.issues.length === 1 ? 'note' : 'notes'}:
                </p>
                <ul className="build-issue-list">
                  {status.issues.map((issue) => (
                    <li key={`${issue.slot ?? 'general'}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Every slot resolved cleanly.</p>
            )}
          </div>
        )}
      </section>

      <details className="build-export-details">
        <summary>Show build text</summary>
        <textarea aria-label="Exported build" data-testid="build-export-output" readOnly rows={8} value={exportBuildText(state)} />
      </details>
    </Panel>
  )
}
