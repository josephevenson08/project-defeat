import { useCallback, useState } from 'react'
import { Panel } from '../../components/layout/Panel'
import { Button } from '../../components/ui/Button'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { parseBuild, type BuildState } from '../../domain/builds/buildSerialization'
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
  | { kind: 'imported'; issues: BuildImportIssue[] }
  | { kind: 'error'; message: string }
  | { kind: 'saved'; name: string }

export function BuildPanel({ state, role, onImport }: BuildPanelProps) {
  const [draft, setDraft] = useState('')
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

  function handleImport() {
    const result = parseBuild(draft)
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error })
      return
    }
    onImport(result.build)
    setStatus({ kind: 'imported', issues: result.issues })
    setDraft('')
  }

  return (
    <Panel title="Build" eyebrow="Save, export, import" accentColor={getRoleAccentColor(role)} className="build-panel-shell">
      <p className="panel-copy">
        Your character, gear, gems, enchants, buffs, consumables, target debuffs and encounter settings are saved to this
        browser automatically and restored next visit. Export produces a portable snapshot you can keep or hand to
        someone else.
      </p>

      <div className="build-actions">
        <Button onClick={handleCopy}>Copy build to clipboard</Button>
      </div>

      <section className="build-slots" aria-label="Saved builds">
        <h3>Saved builds</h3>
        <p className="build-slots-hint">
          The build above autosaves on its own, but there is only one of it — switching character overwrites it. Save a
          named copy to keep more than one setup.
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
          placeholder="Paste an exported build here"
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
          {status.issues.length > 0 ? (
            <>
              <p>
                Loaded, but {status.issues.length} {status.issues.length === 1 ? 'slot was' : 'slots were'} dropped —
                the rest of the build came through:
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
