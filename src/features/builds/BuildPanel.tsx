import { useCallback, useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { parseBuild, serializeBuild, type BuildState } from '../../domain/builds/buildSerialization'
import { ADDON_EXPORT_FORMAT, parseAddonExport } from '../../domain/builds/addonImport'
import type { TbcSpec } from '../../domain/character/characterTypes'
import { encodeBuildForLink, shareUrlFor } from '../../domain/builds/shareLink'
import type { BuildImportIssue, SavedBuild } from '../../domain/builds/buildTypes'
import {
  deleteNamedBuild,
  exportBuildText,
  listNamedBuilds,
  MAX_BUILD_NAME_LENGTH,
  saveNamedBuild,
  type NamedBuild,
} from './buildStorage'

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
  | {
      kind: 'imported'
      issues: BuildImportIssue[]
      /**
       * Set only for an in-game export whose talents do not name a spec — an even split, or a
       * character with no points spent. The build is already loaded on the first tree; this is the
       * question that lets the player correct it in one press.
       */
      specChoice?: { reason: 'tie' | 'no-points'; candidates: readonly TbcSpec[] }
      build?: SavedBuild
    }
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

export function BuildPanel({ state, role, onImport }: BuildPanelProps) {
  const [draft, setDraft] = useState('')
  /*
   * The last link made, and the build it was made from. The link is only shown while the build still
   * matches: change a gem after pressing the button and the link on screen would describe the build as
   * it was, which is exactly the kind of quiet disagreement this app avoids.
   */
  const [sharedLink, setSharedLink] = useState<{ fingerprint: string; url: string }>()
  const fingerprint = buildFingerprint(state)
  const visibleLink = sharedLink?.fingerprint === fingerprint ? sharedLink.url : undefined
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [slotName, setSlotName] = useState('')
  const [savedBuilds, setSavedBuilds] = useState<readonly NamedBuild[]>(listNamedBuilds)

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
      setStatus({ kind: 'error', message: 'The browser blocked clipboard access. Select the text below and copy manually.' })
    }
  }

  async function makeLink() {
    const url = shareUrlFor(await encodeBuildForLink(serializeBuild(state)), window.location)
    setSharedLink({ fingerprint, url })
    return url
  }

  async function handleCopyLink() {
    const url = await makeLink()
    try {
      await navigator.clipboard.writeText(url)
      setStatus({ kind: 'link-copied' })
    } catch {
      // The link is on screen regardless, so a blocked clipboard costs a manual copy, not the link.
      setStatus({ kind: 'link-shown' })
    }
  }

  async function handleNativeShare() {
    const url = await makeLink()
    try {
      await navigator.share({ title: 'Project Defeat build', url })
    } catch (error) {
      // Closing the share sheet rejects too, and that is not a failure worth reporting.
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus({ kind: 'link-shown' })
    }
  }

  /**
   * One box, two formats.
   *
   * A build this app exported, and the string the in-game addon writes, are both things a player
   * pastes to load a character — so they go in the same box and the discriminator decides, rather
   * than asking somebody to know which of two boxes their clipboard belongs in. The addon's format
   * field is the tell; anything else is treated as a saved build and gets that parser's errors.
   */
  function handleImport() {
    // Split rather than merged, so each parser's result keeps its own type and the spec question —
    // which only an in-game export can raise — cannot be lost to a widened union.
    if (draft.includes(ADDON_EXPORT_FORMAT)) {
      const result = parseAddonExport(draft)
      if (!result.ok) {
        setStatus({ kind: 'error', message: result.error })
        return
      }
      onImport(result.build)
      setStatus({
        kind: 'imported',
        issues: result.issues,
        ...(result.specChoice ? { specChoice: result.specChoice, build: result.build } : {}),
      })
      setDraft('')
      return
    }

    const result = parseBuild(draft)
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error })
      return
    }
    onImport(result.build)
    setStatus({ kind: 'imported', issues: result.issues })
    setDraft('')
  }

  /** Re-applies the imported build under the spec the player picked. */
  function chooseSpec(build: SavedBuild, spec: TbcSpec) {
    onImport({ ...build, character: { ...build.character, spec } })
    setStatus({ kind: 'imported', issues: [] })
  }

  return (
    <Panel title="Build" eyebrow="Save, export, import" accentColor={getRoleAccentColor(role)} className="build-panel-shell">
      {/*
        This used to say the build was "saved to this browser automatically and restored next visit",
        with "encounter settings". Neither has been true since a load started clean and the encounter
        became fixed — there is no autosave anywhere in the app — so the panel was promising to keep
        work it would throw away on the next reload.
      */}
      <p className="panel-copy" data-testid="build-panel-copy">
        Nothing is saved automatically — a reload starts with a new character. To keep a build, save it under a name in
        this browser, or share it as a link: the link carries the whole build — character, professions, gear, gems,
        enchants, talents, buffs and consumables — and opens it on any device.
      </p>

      <section className="build-share" aria-label="Share this build">
        <h3>Share</h3>
        <div className="build-actions">
          <Button data-testid="build-share-copy" onClick={handleCopyLink}>
            Copy share link
          </Button>
          {canNativeShare && (
            <Button data-testid="build-share-native" onClick={handleNativeShare}>
              Share…
            </Button>
          )}
          <Button onClick={handleCopy}>Copy build text</Button>
        </div>
        {visibleLink && (
          <label className="field build-share-link">
            <span>Link to this build</span>
            <input
              aria-label="Link to this build"
              data-testid="build-share-link"
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              type="text"
              value={visibleLink}
            />
          </label>
        )}
      </section>

      <section className="build-slots" aria-label="Saved builds">
        <h3>Saved builds</h3>
        <p className="build-slots-hint">
          Saved builds stay in this browser. To take one to another device, load it and share it as a link.
        </p>

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
            Save
          </Button>
        </div>

        {savedBuilds.length === 0 ? (
          <p className="build-slots-empty" data-testid="build-slots-empty">
            Nothing saved yet.
          </p>
        ) : (
          <ul className="build-slot-list" data-testid="build-slot-list">
            {savedBuilds.map((saved) => (
              <li key={saved.name}>
                <div className="build-slot-main">
                  <strong>{saved.name}</strong>
                  <small>
                    {saved.build.character.race} {saved.build.character.spec} {saved.build.character.className}
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
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <label className="field build-import-field">
        <span>Import a build</span>
        <textarea
          aria-label="Import a build"
          data-testid="build-import-input"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Paste an exported build, or the string from the addon's /pdexport"
          rows={4}
          value={draft}
        />
      </label>

      <div className="build-actions">
        <Button data-testid="build-import-button" disabled={draft.trim().length === 0} onClick={handleImport}>
          Load pasted build
        </Button>
      </div>

      {status.kind === 'saved' && (
        <div className="summary-card build-status" data-testid="build-status">
          <span>Saved</span>
          <strong>Saved as &ldquo;{status.name}&rdquo;</strong>
        </div>
      )}

      {status.kind === 'copied' && (
        <div className="summary-card build-status" data-testid="build-status">
          <span>Copied</span>
          <strong>Build copied to clipboard</strong>
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
          <span>Import failed</span>
          <strong>Nothing was changed</strong>
          <p>{status.message}</p>
        </div>
      )}

      {status.kind === 'imported' && (
        <div className="summary-card build-status" data-testid="build-status">
          <span>Imported</span>
          <strong>Build loaded</strong>
          {status.specChoice && status.build && (
            /*
             * TBC has no spec, only three trees and where the points went — so an even split, or a
             * character who has spent nothing, genuinely has no answer to infer. Asked rather than
             * guessed at, because a silently wrong spec drives every ranking on every other screen.
             */
            <div className="build-spec-choice" data-testid="build-spec-choice">
              <p>
                {status.specChoice.reason === 'no-points'
                  ? 'This character has spent no talent points, so the export cannot say which spec it is.'
                  : 'The talent points are evenly split, so the export cannot say which spec this is.'}{' '}
                Which is it?
              </p>
              <div className="build-spec-choice-options">
                {status.specChoice.candidates.map((candidate) => (
                  <Button
                    key={candidate}
                    data-testid={`build-spec-${candidate.toLowerCase().replaceAll(' ', '-')}`}
                    onClick={() => chooseSpec(status.build as SavedBuild, candidate)}
                  >
                    {candidate}
                  </Button>
                ))}
              </div>
            </div>
          )}

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

      <details className="build-export-details">
        <summary>Show build text</summary>
        <textarea aria-label="Exported build" data-testid="build-export-output" readOnly rows={8} value={exportBuildText(state)} />
      </details>
    </Panel>
  )
}
