import { getClassColor } from '../../domain/character/classColors'
import { PARTY_SIZE, getRaidBuild, raidBuildsByClass } from '../../domain/raidcomp'
import type { Roster, RosterSlot } from '../../domain/raidcomp'

/**
 * Renders a roster to a PNG a raid leader can paste into Discord.
 *
 * **Buff coverage is deliberately absent from the image.** On screen the per-group buff lists are the
 * working surface — they are how you decide where the Shaman sits. Once that is decided, the thing
 * worth sharing is the seating chart itself: a raid reads "am I in group 3" off it in a second, and
 * forty lines of buff annotation would bury that. The analysis is for the planner; the image is for
 * the raid.
 *
 * Drawn on a canvas rather than rasterised from the DOM, because the alternatives all cost more than
 * this: `html2canvas` is a dependency and a runtime network risk, and the SVG `foreignObject` route
 * is defeated by the app's own stylesheet not being inlined. Canvas also means the export looks the
 * same on every machine, which a screenshot does not.
 */

/** Matches the app's own surfaces, so a pasted image still reads as coming from this tool. */
const INK = {
  background: '#0a0a0a',
  panel: '#121212',
  line: '#2a2a2a',
  text: '#ededed',
  dim: '#a3a3a3',
  faint: '#858585',
}

const SCALE = 2 // Drawn at 2x so the PNG stays sharp when Discord scales it down.
const COLUMN_WIDTH = 240
const ROW_HEIGHT = 34
const ICON_SIZE = 22
const GROUP_HEADER = 30
const PADDING = 24
const GAP = 12

/**
 * Header height depends on how much the raid leader filled in, so it is measured rather than fixed.
 *
 * The type scale is deliberate and was specified: **title largest, then date and start time, then
 * description**. A raid glancing at this in Discord reads "which raid" first, "when" second, and the
 * detail last — so the sizes follow that order rather than a generic heading ramp.
 */
/**
 * `2026-08-25` as `Tue 25 Aug 2026`.
 *
 * The date is stored ISO because that is what a date input produces and what sorts; it is displayed
 * long because the chart is read by people, and nobody says "the raid is on 2026-08-25".
 *
 * Parsed as UTC and formatted as UTC on purpose. A bare `new Date('2026-08-25')` is midnight UTC,
 * which in any negative-offset zone formats as the day *before* — the raid would be advertised a day
 * early for every reader west of Greenwich.
 *
 * Anything that is not an ISO date is passed through untouched, so a roster saved before the picker
 * existed still shows whatever free text it held rather than losing it.
 */
/** The spec's artwork, the same icon the seat shows on screen. */
function iconNameFor(slot: RosterSlot): string | undefined {
  const build = slot.buildId ? getRaidBuild(slot.buildId) : undefined
  if (build) return build.icon
  return raidBuildsByClass
    .find((entry) => entry.className === slot.className)
    ?.builds.find((candidate) => candidate.spec === slot.spec)?.icon
}

/**
 * Loads every icon the chart needs, before a single pixel is drawn.
 *
 * `drawImage` silently draws nothing for an image that has not finished loading, so this cannot be
 * done lazily inside the seat loop — the export would come out with icons or without them depending
 * on what the browser happened to have cached, which is the worst of both.
 *
 * A failed load resolves to `undefined` rather than rejecting: one missing icon should cost that
 * seat its artwork, not cost the raid leader their chart.
 */
async function loadSeatIcons(roster: Roster): Promise<Map<string, HTMLImageElement>> {
  const names = new Set<string>()
  for (const group of roster.groups) {
    for (const slot of group) {
      const name = slot ? iconNameFor(slot) : undefined
      if (name) names.add(name)
    }
  }

  const loaded = new Map<string, HTMLImageElement>()
  await Promise.all(
    [...names].map(
      (name) =>
        new Promise<void>((resolve) => {
          const image = new Image()
          image.onload = () => {
            loaded.set(name, image)
            resolve()
          }
          image.onerror = () => resolve()
          image.src = `${import.meta.env.BASE_URL}icons/${name}.jpg`
        }),
    ),
  )
  return loaded
}

export function formatRaidDate(date: string | undefined): string | undefined {
  if (!date) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date

  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}

function headerHeight(roster: Roster): number {
  const meta = roster.meta ?? {}
  let height = PADDING + 26 /* title line */ + 20 /* seat count */
  if (meta.date || meta.startTime) height += 22
  if (meta.description) height += 20
  return height + 14
}

export function drawRoster(
  canvas: HTMLCanvasElement,
  roster: Roster,
  fallbackTitle: string,
  /**
   * Preloaded seat artwork. Defaulted to empty so the chart still draws without it — a caller that
   * forgets to await the icons gets a chart with no icons rather than no chart.
   */
  icons: Map<string, HTMLImageElement> = new Map(),
): void {
  const meta = roster.meta ?? {}
  const title = meta.title?.trim() || fallbackTitle

  const columns = roster.groups.length
  const headHeight = headerHeight(roster)
  const width = PADDING * 2 + columns * COLUMN_WIDTH + (columns - 1) * GAP
  const height = headHeight + GROUP_HEADER + PARTY_SIZE * ROW_HEIGHT + PADDING * 2

  canvas.width = width * SCALE
  canvas.height = height * SCALE

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = INK.background
  ctx.fillRect(0, 0, width, height)
  ctx.textBaseline = 'top'

  let cursor = PADDING

  // Title — the largest thing on the image.
  ctx.fillStyle = INK.text
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillText(title, PADDING, cursor)
  cursor += 28

  // Date and start time — below the title, above the description, and sized between them.
  const when = [formatRaidDate(meta.date), meta.startTime, meta.startTime ? meta.timezone : undefined].filter(Boolean).join(' · ')
  if (when) {
    ctx.fillStyle = INK.text
    ctx.font = '15px Inter, system-ui, sans-serif'
    ctx.fillText(when, PADDING, cursor)
    cursor += 22
  }

  // Description — the smallest, because it is the part you read only if you care.
  if (meta.description) {
    ctx.fillStyle = INK.dim
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.fillText(meta.description, PADDING, cursor)
    cursor += 20
  }

  const filled = roster.groups.flat().filter(Boolean).length
  ctx.fillStyle = INK.faint
  ctx.font = '11px ui-monospace, Consolas, monospace'
  ctx.fillText(`${filled} of ${roster.size} seats · TBC Phase 2`, PADDING, cursor)

  roster.groups.forEach((group, groupIndex) => {
    const x = PADDING + groupIndex * (COLUMN_WIDTH + GAP)
    const y = headHeight

    ctx.fillStyle = INK.panel
    ctx.fillRect(x, y, COLUMN_WIDTH, GROUP_HEADER + PARTY_SIZE * ROW_HEIGHT)
    ctx.strokeStyle = INK.line
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, COLUMN_WIDTH - 1, GROUP_HEADER + PARTY_SIZE * ROW_HEIGHT - 1)

    ctx.fillStyle = INK.faint
    ctx.font = '600 11px ui-monospace, Consolas, monospace'
    ctx.fillText(`GROUP ${groupIndex + 1}`, x + 12, y + 10)

    group.forEach((slot, seatIndex) => {
      const rowY = y + GROUP_HEADER + seatIndex * ROW_HEIGHT

      ctx.strokeStyle = INK.line
      ctx.beginPath()
      ctx.moveTo(x, rowY)
      ctx.lineTo(x + COLUMN_WIDTH, rowY)
      ctx.stroke()

      if (!slot) {
        ctx.fillStyle = INK.line
        ctx.font = '13px Inter, system-ui, sans-serif'
        ctx.fillText('—', x + 12, rowY + 10)
        return
      }

      drawSeat(ctx, slot, x, rowY, icons)
    })
  })
}

function drawSeat(
  ctx: CanvasRenderingContext2D,
  slot: RosterSlot,
  x: number,
  rowY: number,
  icons: Map<string, HTMLImageElement>,
): void {
  /*
   * The spec's own icon, and the name in its class colour.
   *
   * This replaced a 3px role stripe down the edge of the row. The stripe was legible but abstract —
   * it asked the reader to know that teal meant healer — where a class colour is the one convention
   * every WoW player already reads without being told, and the icon says the spec outright.
   */
  const iconName = iconNameFor(slot)
  const icon = iconName ? icons.get(iconName) : undefined
  if (icon) {
    ctx.drawImage(icon, x + 8, rowY + (ROW_HEIGHT - ICON_SIZE) / 2, ICON_SIZE, ICON_SIZE)
  }

  /*
   * A named seat leads with the name and demotes the spec to a second line, because the raid reading
   * this is looking for themselves first and their spec second. An unnamed seat keeps the spec on one
   * centred line rather than leaving an empty slot where a name would go.
   */
  const textX = x + 8 + ICON_SIZE + 8
  const classColour = getClassColor(slot.className)

  if (slot.playerName) {
    ctx.fillStyle = classColour
    ctx.font = '13px Inter, system-ui, sans-serif'
    ctx.fillText(slot.playerName, textX, rowY + 5)

    // The spec stays dim: the name is what the reader is scanning for, and two coloured lines would
    // make neither of them lead.
    ctx.fillStyle = INK.dim
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.fillText(`${slot.spec} ${slot.className}`, textX, rowY + 19)
    return
  }

  ctx.fillStyle = classColour
  ctx.font = '13px Inter, system-ui, sans-serif'
  ctx.fillText(`${slot.spec} ${slot.className}`, textX, rowY + 10)
}

/**
 * Downloads the chart.
 *
 * `toBlob` rather than a data URL because a 25-seat chart at 2x exceeds what some browsers accept in
 * an `href`, and a silently truncated download is worse than none.
 *
 * **Two bugs lived here, and both looked like "the export is stale".**
 *
 * The filename was always the same — `25-player-raid.png` for every roster ever exported — so the
 * browser saved each new one as `…(1).png`, `…(2).png`, and opening the un-suffixed file gave you the
 * *first* chart you had ever made. It now carries the title and date, so two different raids cannot
 * collide.
 *
 * And `revokeObjectURL` ran synchronously on the line after `click()`, which is a race: the browser
 * may not have started reading the blob yet, and revoking early can cancel the download outright.
 * Revoked on the next frame instead, once the click has been dispatched.
 */
export async function downloadRosterImage(roster: Roster, fallbackTitle: string): Promise<void> {
  // Awaited, because `drawImage` silently draws nothing for an image still loading — the chart would
  // come out with or without icons depending on what the browser had cached.
  const icons = await loadSeatIcons(roster)

  const canvas = document.createElement('canvas')
  drawRoster(canvas, roster, fallbackTitle, icons)

  const meta = roster.meta ?? {}
  const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const name = [slug(meta.title?.trim() || fallbackTitle), meta.date ? slug(meta.date) : '']
    .filter(Boolean)
    .join('-')

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${name || 'raid-composition'}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Deferred, not immediate — see the note above.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }, 'image/png')
}
