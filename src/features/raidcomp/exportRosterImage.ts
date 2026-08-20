import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleForSpec } from '../../domain/character/tbcClasses'
import { PARTY_SIZE } from '../../domain/raidcomp'
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

const ROLE_COLOURS: Record<CharacterRole, string> = {
  Tank: '#6a7fa8',
  Healer: '#6f8f6a',
  'Physical DPS': '#9c7346',
  'Caster DPS': '#856a9c',
}

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
function headerHeight(roster: Roster): number {
  const meta = roster.meta ?? {}
  let height = PADDING + 26 /* title line */ + 20 /* seat count */
  if (meta.date || meta.startTime) height += 22
  if (meta.description) height += 20
  return height + 14
}

export function drawRoster(canvas: HTMLCanvasElement, roster: Roster, fallbackTitle: string): void {
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
  const when = [meta.date, meta.startTime].filter(Boolean).join(' · ')
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

      drawSeat(ctx, slot, x, rowY)
    })
  })
}

function drawSeat(ctx: CanvasRenderingContext2D, slot: RosterSlot, x: number, rowY: number): void {
  const role = getRoleForSpec(slot.className, slot.spec)

  // A role stripe rather than coloured text: the label stays high-contrast while the colour still
  // lets a raid leader scan tank and healer distribution down a column at a glance.
  ctx.fillStyle = ROLE_COLOURS[role]
  ctx.fillRect(x + 1, rowY + 1, 3, ROW_HEIGHT - 2)

  /*
   * A named seat leads with the name and demotes the spec to a second line, because the raid reading
   * this is looking for themselves first and their spec second. An unnamed seat keeps the spec on one
   * centred line rather than leaving an empty slot where a name would go.
   */
  if (slot.playerName) {
    ctx.fillStyle = INK.text
    ctx.font = '13px Inter, system-ui, sans-serif'
    ctx.fillText(slot.playerName, x + 14, rowY + 5)

    ctx.fillStyle = INK.dim
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.fillText(`${slot.spec} ${slot.className}`, x + 14, rowY + 19)
    return
  }

  ctx.fillStyle = INK.text
  ctx.font = '13px Inter, system-ui, sans-serif'
  ctx.fillText(`${slot.spec} ${slot.className}`, x + 14, rowY + 10)
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
export function downloadRosterImage(roster: Roster, fallbackTitle: string): void {
  const canvas = document.createElement('canvas')
  drawRoster(canvas, roster, fallbackTitle)

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
