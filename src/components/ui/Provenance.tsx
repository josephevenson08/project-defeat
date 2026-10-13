export type ProvenanceSource = {
  /** Who published it, as a reader would name them: "Wowhead's Phase 2 PvE tier lists". */
  name: string
  href?: string
  /**
   * When the app read it, as an ISO date (`2026-08-12`). Only a date the data itself records, or one
   * written down when it was read; never the build date, which would make old data look new.
   */
  readOn?: string
  /** How it was read: "ingested" for a script, "read" for numbers copied by hand. */
  verb?: 'ingested' | 'read'
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** `2026-08-12` → "12 Aug 2026". Parsed as UTC so the day cannot shift with the reader's time zone. */
function formatReadOn(iso: string): string {
  return DATE_FORMAT.format(new Date(`${iso}T00:00:00Z`))
}

/**
 * Where the numbers on a screen come from, and when they were read, in one line.
 *
 * Every prototype printed this under its header, and the gaming-UI research found it the strongest
 * habit across the community tools closest to this app: phase, source and the age of the data, right
 * beside the numbers. The date is shown as a date rather than "3 weeks ago" so a screenshot shared
 * later still says something true.
 */
export function Provenance({ sources }: { sources: readonly ProvenanceSource[] }) {
  if (sources.length === 0) return null

  return (
    <p className="provenance" data-testid="provenance">
      Sources:{' '}
      {sources.map((source, index) => (
        <span key={source.name}>
          {index > 0 && ' · '}
          {source.href ? (
            <a href={source.href} target="_blank" rel="noreferrer noopener">
              {source.name}
            </a>
          ) : (
            source.name
          )}
          {source.readOn && ` (${source.verb ?? 'read'} ${formatReadOn(source.readOn)})`}
        </span>
      ))}
    </p>
  )
}
