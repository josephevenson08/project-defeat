// Vendors the zone map artwork the farming routes are drawn on.
//
// **This reverses a standing decision, and the reversal is the repo owner's.** Every file that draws
// a route has said since it was written that Blizzard's zone art cannot be vendored, and the bare
// density square was designed around that absence — coordinates are percentages of a zone's own
// extent, so the node cloud reproduced the farmable shape without reproducing the map. That was a
// good answer to the constraint. The constraint is now lifted: the owner decided on 2026-09-04 to
// vendor the art, which Blizzard's Game Content Usage Rules permit a non-commercial fan site to do
// with attribution, and the app carries that attribution on every map.
//
// It is the same call this repo already made for the 1,943 item and spell icons in `public/icons`,
// applied to a second kind of Blizzard artwork.
//
// **The area ids come from the spawn cache rather than a new request.** Wowhead keys `g_mapperData`
// by area id and names the zone inside it:
//
//     g_mapperData = {"3483":[{"count":245,"coords":[...],"uiMapName":"Hellfire Peninsula"}]}
//
// So every zone this repo draws already has its id sitting in a page the node ingest fetched months
// ago. All 42 resolve, and the script fails rather than guessing if one stops resolving.
//
// **The coordinate spaces already agree**, which is why no transform is needed anywhere downstream:
// spawn coordinates are 0-100 percentages of the zone's extent, and that is exactly the space these
// images cover.
//
// Run: node tools/ingest/ingest-zone-maps.mjs [--force]
// Writes: public/maps/<areaId>.jpg, src/domain/professions/zoneMaps.json

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const SPAWN_CACHE = resolve(HERE, '.cache/node-spawns')
const OUT_DIR = resolve(REPO, 'public/maps')
const OUT_JSON = resolve(REPO, 'src/domain/professions/zoneMaps.json')
const force = process.argv.includes('--force')

/**
 * `zoom` rather than `original`.
 *
 * Original is 128 KB a zone against 69 KB, for artwork that renders at about 420 CSS pixels. Doubling
 * the repo's map payload to feed detail no viewport shows is the same waste the icon fetch avoids by
 * taking 56x56 instead of the largest size on offer.
 */
const CDN = 'https://wow.zamimg.com/images/wow/maps/enus/zoom'

/**
 * Reads a JPEG's pixel dimensions out of its own header.
 *
 * **The maps are not square and the overlay has to know it.** Tirisfal Glades is 772x515. Spawn
 * coordinates are percentages of the zone's extent on each axis independently, so they map onto the
 * *whole* image — which means a frame that forces a square either crops the art (and puts every dot
 * in the wrong place) or stretches it. Carrying the real aspect ratio lets the frame match the image
 * and the coordinates land where they belong.
 *
 * Walks the segment markers to the first SOF rather than pulling in an image library for two numbers.
 */
function jpegSize(buffer) {
  let offset = 2 // skip SOI
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = buffer[offset + 1]
    // SOF0-SOF15, excluding the non-frame markers that share the range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    offset += 2 + buffer.readUInt16BE(offset + 2)
  }
  return null
}

/** Zone name -> Wowhead area id, harvested from the spawn pages already on disk. */
function resolveAreaIds() {
  const byName = new Map()
  for (const file of readdirSync(SPAWN_CACHE)) {
    const mapper = /g_mapperData = (\{.*?\});/s.exec(readFileSync(resolve(SPAWN_CACHE, file), 'utf8'))?.[1]
    if (!mapper) continue
    let parsed
    try {
      parsed = JSON.parse(mapper)
    } catch {
      continue
    }
    for (const [areaId, entries] of Object.entries(parsed)) {
      for (const entry of entries) {
        if (entry.uiMapName) byName.set(entry.uiMapName, Number(areaId))
      }
    }
  }
  return byName
}

const areaIds = resolveAreaIds()

const { nodes } = JSON.parse(readFileSync(resolve(REPO, 'src/domain/professions/nodeSpawns.json'), 'utf8'))
const wanted = [...new Set(nodes.flatMap((node) => node.zones.map((zone) => zone.zone)))].sort()

const unresolved = wanted.filter((zone) => !areaIds.has(zone))
if (unresolved.length > 0) {
  console.error(`REFUSING TO WRITE — no area id for: ${unresolved.join(', ')}`)
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const zones = {}
const failed = []
let fetched = 0

for (const zone of wanted) {
  const areaId = areaIds.get(zone)
  const target = resolve(OUT_DIR, `${areaId}.jpg`)

  try {
    let buffer
    if (!force && existsSync(target) && statSync(target).size > 2000) {
      buffer = readFileSync(target)
    } else {
      const res = await fetch(`${CDN}/${areaId}.jpg`, {
        headers: { 'User-Agent': 'project-defeat-map-fetch' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      buffer = Buffer.from(await res.arrayBuffer())
      // A CDN error page is also "successful" bytes; a real zone map is never this small.
      if (buffer.length < 2000) throw new Error(`suspiciously small (${buffer.length} bytes)`)
      writeFileSync(target, buffer)
      fetched += 1
      await new Promise((r) => setTimeout(r, 250))
    }

    const size = jpegSize(buffer)
    if (!size) throw new Error('could not read its own dimensions')
    zones[zone] = { areaId, file: `${areaId}.jpg`, width: size.width, height: size.height }
  } catch (err) {
    failed.push(`${zone} (${areaId}): ${err.message}`)
  }
}

/*
 * **A zone with no art is recorded by name, not counted.** Alterac Mountains has no map at this CDN
 * at any size — area 36 is a 404 while Alterac Valley next door is fine — so Wintersbite, its only
 * herb, keeps the bare density square. That is the original design still working as a fallback
 * rather than a hole, and naming it means a second one appearing is a visible change here rather
 * than a zone that quietly stops having a background.
 */
if (failed.length > 0) {
  console.log(`${failed.length} zone(s) have no map art and will fall back to the bare grid:`)
  for (const line of failed) console.log(`  ${line}`)
}

if (Object.keys(zones).length === 0) {
  console.error('REFUSING TO WRITE — no zone maps resolved at all.')
  process.exit(1)
}

writeFileSync(
  OUT_JSON,
  `${JSON.stringify(
    {
      note: 'Generated by tools/ingest/ingest-zone-maps.mjs. Do not edit by hand.',
      attribution:
        'Zone maps are Blizzard Entertainment artwork, used under the Game Content Usage Rules for a non-commercial fan project. Not affiliated with or endorsed by Blizzard Entertainment.',
      source: 'https://wow.zamimg.com/images/wow/maps/enus/zoom/<areaId>.jpg',
      zoneCount: Object.keys(zones).length,
      /** Zones this repo draws that the CDN has no art for. Named so a second one is a visible change. */
      withoutArt: failed.map((line) => line.split(' (')[0]).sort(),
      zones,
    },
    null,
    2,
  )}\n`,
)

const bytes = Object.values(zones).reduce((sum, zone) => sum + statSync(resolve(OUT_DIR, zone.file)).size, 0)
console.log(
  `zone maps: ${Object.keys(zones).length} zones, ${fetched} fetched, ${(bytes / 1024 / 1024).toFixed(1)} MB on disk`,
)
