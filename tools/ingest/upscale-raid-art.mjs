/**
 * Resamples an undersized raid panel up to something the reel can render without the browser
 * stretching it.
 *
 * **This does not add detail and is not pretending to.** Serpentshrine Cavern and Tempest Keep only
 * ever arrived at 690px, and the reel was painting them across 1353 CSS pixels — a 1.96x stretch
 * done by the browser's own filter, which on an already-compressed JPEG magnifies the block edges
 * along with everything else. Two things beat that, and this is the second of them:
 *
 *   1. The card got smaller (see `.raid-picker-reel` in global.css). That is the real fix.
 *   2. Whatever stretch is left happens *here*, once, offline, where it can be done properly —
 *      in small steps with a good filter and an unsharp mask after — instead of in the compositor
 *      on every paint. A browser downscaling a prepared 1180px file is always clean; a browser
 *      upscaling a 690px one never is. It is also the only thing that helps a HiDPI screen, where
 *      a 960px card asks for 1440 or 1920 device pixels no matter how small the box gets.
 *
 * Run in a browser canvas rather than with `sharp`, for the same reason `split-raid-art.mjs` is:
 * Playwright is already a devDependency and decodes JPEG natively, and a native image library with
 * a build step is a lot of machinery to add for a job that runs once per image.
 *
 * Usage:
 *   node tools/ingest/upscale-raid-art.mjs [--out <dir>] [<raid-id> ...]
 *
 * With no ids it does every panel under public/raids that is narrower than TARGET_WIDTH, which is
 * the useful default: panels already at full resolution are left alone. `--out` writes somewhere
 * else so a result can be looked at before it replaces the original.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '../..')
const ART = resolve(REPO, 'public/raids')

/**
 * How large to take an undersized panel.
 *
 * 1180 is roughly 1.7x on the two 690px files, which is about as far as a bicubic resample can be
 * pushed before it stops looking like a photograph and starts looking like a painting of one. It is
 * also comfortably more than the 960px the card is now capped at, so the browser downscales on a
 * 1x screen and is close to 1:1 on a 1.5x one.
 *
 * Panels already wider than this are skipped rather than touched — the three 1536px ones need
 * nothing, and re-encoding them would only cost quality.
 */
const TARGET_WIDTH = 1180

/**
 * Never enlarge by more than this in one `drawImage`.
 *
 * A single jump to the final size runs Skia's bicubic filter over a 1.7x gap, which reaches for
 * pixels far enough apart that edges go soft. Three or four smaller steps run the same filter over
 * gaps it handles well, and the result holds its edges noticeably better for the cost of a few
 * milliseconds.
 */
const STEP = 1.25

/**
 * Unsharp mask, applied once at the final size.
 *
 * `AMOUNT` is deliberately timid. The input is a compressed JPEG, so every 8x8 block boundary is an
 * edge as far as a sharpening filter is concerned, and an aggressive pass makes those the sharpest
 * thing in the picture. `THRESHOLD` is what keeps it off them: a difference smaller than this is
 * treated as noise and left alone, so flat sky and smooth armour stay smooth while the silhouettes
 * that carry the image get their acutance back.
 */
const RADIUS = 1.1
const AMOUNT = 0.55
const THRESHOLD = 6

/** JPEG quality for the output. Higher than the 0.86 the splitter uses, because this file is the master now. */
const QUALITY = 0.92

/** Reads a JPEG's SOF marker for its dimensions, so nothing has to be decoded to decide what to skip. */
function jpegSize(bytes) {
  let index = 2
  while (index < bytes.length - 8) {
    if (bytes[index] !== 0xff) {
      index += 1
      continue
    }
    const marker = bytes[index + 1]
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
    if (isStartOfFrame) return { width: bytes.readUInt16BE(index + 7), height: bytes.readUInt16BE(index + 5) }
    index += 2 + bytes.readUInt16BE(index + 2)
  }
  return null
}

const args = process.argv.slice(2)
const outFlag = args.indexOf('--out')
const OUT = outFlag === -1 ? ART : resolve(process.cwd(), args[outFlag + 1])
const ids = args.filter((arg, position) => arg !== '--out' && position !== outFlag + 1 && !arg.startsWith('--'))

const candidates = (ids.length ? ids.map((id) => `${id}.jpg`) : readdirSync(ART).filter((name) => name.endsWith('.jpg')))
  .map((name) => {
    const path = resolve(ART, name)
    if (!existsSync(path)) throw new Error(`no panel at ${path}`)
    const bytes = readFileSync(path)
    return { name, path, bytes, size: jpegSize(bytes) }
  })
  .filter((panel) => {
    if (!panel.size) throw new Error(`${panel.name} is not a JPEG this can read`)
    if (panel.size.width >= TARGET_WIDTH) {
      console.log(`  ${panel.name.padEnd(26)} ${panel.size.width}x${panel.size.height}  already large enough, skipped`)
      return false
    }
    return true
  })

if (!candidates.length) {
  console.log('\nnothing to do.')
  process.exit(0)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

for (const panel of candidates) {
  const result = await page.evaluate(
    async ({ src, targetWidth, step, radius, amount, threshold, quality }) => {
      const image = new Image()
      await new Promise((done, fail) => {
        image.onload = done
        image.onerror = () => fail(new Error('the browser could not decode that file'))
        // A data URL rather than a file:// one. An image loaded from file:// onto about:blank counts
        // as cross-origin, which taints the canvas and makes both getImageData and toDataURL throw —
        // and this needs getImageData for the unsharp mask.
        image.src = src
      })

      const scale = targetWidth / image.naturalWidth
      const targetHeight = Math.round(image.naturalHeight * scale)

      /** One canvas holding the current stage of the resample. */
      let stage = document.createElement('canvas')
      stage.width = image.naturalWidth
      stage.height = image.naturalHeight
      let context = stage.getContext('2d')
      context.drawImage(image, 0, 0)

      // Climb to the target in steps no larger than `step`, so the filter never spans a wide gap.
      let currentWidth = image.naturalWidth
      while (currentWidth < targetWidth) {
        const nextWidth = Math.min(targetWidth, Math.round(currentWidth * step))
        const nextHeight = Math.round((nextWidth / image.naturalWidth) * image.naturalHeight)
        const next = document.createElement('canvas')
        next.width = nextWidth
        next.height = nextHeight
        const nextContext = next.getContext('2d')
        nextContext.imageSmoothingEnabled = true
        nextContext.imageSmoothingQuality = 'high'
        nextContext.drawImage(stage, 0, 0, nextWidth, nextHeight)
        stage = next
        context = nextContext
        currentWidth = nextWidth
      }

      // ── Unsharp mask ────────────────────────────────────────────────────────────────────────
      // A separable box blur run three times, which converges on a Gaussian closely enough for this
      // and costs a fraction of a true Gaussian convolution. Then each channel is pushed away from
      // its blurred self, but only where the two already differ by more than the threshold.
      const { width, height } = stage
      const source = context.getImageData(0, 0, width, height)
      const pixels = source.data

      const blurred = new Float32Array(width * height * 3)
      for (let i = 0, p = 0; i < pixels.length; i += 4, p += 3) {
        blurred[p] = pixels[i]
        blurred[p + 1] = pixels[i + 1]
        blurred[p + 2] = pixels[i + 2]
      }

      const span = Math.max(1, Math.round(radius))
      const scratch = new Float32Array(blurred.length)
      const boxBlurPass = (input, output, along) => {
        const outer = along === 'x' ? height : width
        const inner = along === 'x' ? width : height
        const strideInner = along === 'x' ? 3 : width * 3
        const strideOuter = along === 'x' ? width * 3 : 3
        for (let o = 0; o < outer; o += 1) {
          const base = o * strideOuter
          for (let channel = 0; channel < 3; channel += 1) {
            for (let i = 0; i < inner; i += 1) {
              let total = 0
              let count = 0
              for (let k = -span; k <= span; k += 1) {
                const at = i + k
                if (at < 0 || at >= inner) continue
                total += input[base + at * strideInner + channel]
                count += 1
              }
              output[base + i * strideInner + channel] = total / count
            }
          }
        }
      }

      for (let pass = 0; pass < 3; pass += 1) {
        boxBlurPass(blurred, scratch, 'x')
        boxBlurPass(scratch, blurred, 'y')
      }

      for (let i = 0, p = 0; i < pixels.length; i += 4, p += 3) {
        for (let channel = 0; channel < 3; channel += 1) {
          const original = pixels[i + channel]
          const difference = original - blurred[p + channel]
          if (Math.abs(difference) < threshold) continue
          const sharpened = original + difference * amount
          pixels[i + channel] = sharpened < 0 ? 0 : sharpened > 255 ? 255 : sharpened
        }
      }

      context.putImageData(source, 0, 0)

      return { data: stage.toDataURL('image/jpeg', quality), width, height, targetHeight }
    },
    {
      src: `data:image/jpeg;base64,${panel.bytes.toString('base64')}`,
      targetWidth: TARGET_WIDTH,
      step: STEP,
      radius: RADIUS,
      amount: AMOUNT,
      threshold: THRESHOLD,
      quality: QUALITY,
    },
  )

  const bytes = Buffer.from(result.data.split(',')[1], 'base64')
  writeFileSync(resolve(OUT, panel.name), bytes)
  console.log(
    `  ${panel.name.padEnd(26)} ${panel.size.width}x${panel.size.height} -> ${result.width}x${result.height}  ` +
      `${(panel.bytes.length / 1024).toFixed(0)} KB -> ${(bytes.length / 1024).toFixed(0)} KB`,
  )
}

await browser.close()
console.log(`\nwrote ${candidates.length} panel(s) to ${OUT}`)
