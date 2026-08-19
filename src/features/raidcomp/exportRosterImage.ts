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
const HEADER_HEIGHT = 74
const GROUP_HEADER = 30
const PADDING = 24
const GAP = 12

export function drawRoster(canvas: HTMLCanvasElement, roster: Roster, title: string): void {
  const columns = roster.groups.length
  const width = PADDING * 2 + columns * COLUMN_WIDTH + (columns - 1) * GAP
  const height = HEADER_HEIGHT + GROUP_HEADER + PARTY_SIZE * ROW_HEIGHT + PADDING * 2

  canvas.width = width * SCALE
  canvas.height = height * SCALE

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = INK.background
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = INK.text
  ctx.font = '600 19px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'top'
  ctx.fillText(title, PADDING, PADDING)

  const filled = roster.groups.flat().filter(Boolean).length
  ctx.fillStyle = INK.faint
  ctx.font = '12px ui-monospace, Consolas, monospace'
  ctx.fillText(`${filled} of ${roster.size} seats · TBC Phase 2`, PADDING, PADDING + 26)

  roster.groups.forEach((group, groupIndex) => {
    const x = PADDING + groupIndex * (COLUMN_WIDTH + GAP)
    const y = HEADER_HEIGHT

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
 * Triggers the download.
 *
 * `toBlob` rather than a data URL because a 25-seat chart at 2x exceeds what some browsers accept in
 * an `href`, and a silently truncated download is worse than none.
 */
export function downloadRosterImage(roster: Roster, title: string): void {
  const canvas = document.createElement('canvas')
  drawRoster(canvas, roster, title)

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
