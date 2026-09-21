#!/usr/bin/env node
/**
 * One usability-study participant's browser, held open between commands.
 *
 * A walkthrough is a chain of small decisions — look, think, click, look again — and each of those is a
 * separate shell call from the participant agent. Relaunching a browser per call would throw away the
 * page's state (the scroll position, an open popup, the character built so far), so this keeps one
 * Playwright page alive and takes commands over local HTTP instead. `walk.mjs` is the client.
 *
 * **It is also the observer.** Every command is appended to `actions.jsonl` with a timestamp, the
 * participant's think-aloud note, where the page was, and a screenshot of what it looked like
 * afterwards — the equivalent of the screen recording and event log in a lab study. The study's
 * findings are coded from this log, not from what a participant later says it did, because the two
 * disagree often enough in human studies to be worth never relying on the second alone.
 *
 * **It only lets a participant touch what is on screen.** A click on text that exists further down the
 * page is refused as "not on screen", with no hint that it exists, because a person cannot click what
 * they have not scrolled to — and letting them would erase exactly the finding a first-visit study is
 * for: what people never scroll far enough to see.
 *
 *   node tools/usability-study/walk-server.mjs --id P01 --device desktop-1440 --port 9301 --out <dir>
 *        [--url https://josephevenson08.github.io/project-defeat/]
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { chromium, devices, webkit } from '@playwright/test'

const args = {}
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1]

const id = args.id ?? 'P00'
const port = Number(args.port ?? 9300)
const out = path.resolve(args.out ?? `study/${id}`)
const startUrl = args.url ?? 'https://josephevenson08.github.io/project-defeat/'

/*
 * Real Safari's engine for the Apple devices, since Playwright ships WebKit: a phone participant on an
 * emulated iPhone running Chromium would be testing a browser no iPhone runs.
 */
const DEVICES = {
  'desktop-1440': { engine: chromium, context: { viewport: { width: 1440, height: 900 } } },
  'desktop-1920': { engine: chromium, context: { viewport: { width: 1920, height: 1080 } } },
  'laptop-1366': { engine: chromium, context: { viewport: { width: 1366, height: 768 } } },
  // A 1440x900 screen at 150% browser zoom: the page lays out at 960 CSS pixels with everything larger.
  'zoomed-150': { engine: chromium, context: { viewport: { width: 960, height: 600 }, deviceScaleFactor: 1.5 } },
  iphone: { engine: webkit, context: devices['iPhone 13'] },
  pixel: { engine: chromium, context: devices['Pixel 7'] },
  ipad: { engine: webkit, context: devices['iPad (gen 7)'] },
}

const device = DEVICES[args.device ?? 'desktop-1440']
if (!device) throw new Error(`Unknown --device ${args.device}. Known: ${Object.keys(DEVICES).join(', ')}`)
const touch = Boolean(device.context.hasTouch)

fs.mkdirSync(path.join(out, 'shots'), { recursive: true })
const logFile = path.join(out, 'actions.jsonl')

const browser = await device.engine.launch()
const context = await browser.newContext(device.context)
const pages = [await context.newPage()]
let page = pages[0]
let openedTab = null
context.on('page', (opened) => {
  pages.push(opened)
  page = opened
  openedTab = opened
})

const started = Date.now()
let step = 0
let lastCommandAt = Date.now()

/** Lets the page finish whatever the last input started — a route change, a lazy chunk, an animation. */
async function settle() {
  await page.waitForLoadState('domcontentloaded', { timeout: 8000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(450)
}

async function screenshot() {
  const file = path.join(out, 'shots', `s${String(step).padStart(3, '0')}.jpg`)
  try {
    await page.screenshot({ path: file, type: 'jpeg', quality: 60, scale: 'css' })
    return file
  } catch {
    return null
  }
}

/** Where the participant is: the page, how far down it, and the headings in view. */
function whereAmI() {
  return page.evaluate(() => {
    const vh = innerHeight
    const headings = [...document.querySelectorAll('h1,h2,h3')]
      .filter((h) => {
        const r = h.getBoundingClientRect()
        return r.height > 0 && r.bottom > 0 && r.top < vh && getComputedStyle(h).visibility !== 'hidden'
      })
      .map((h) => `${h.tagName.toLowerCase()}: ${h.innerText.trim().replace(/\s+/g, ' ').slice(0, 80)}`)
      .slice(0, 12)
    return {
      title: document.title,
      scroll: `${Math.round(scrollY)} of ${Math.max(0, document.documentElement.scrollHeight - vh)}px scrolled`,
      headingsOnScreen: headings,
    }
  })
}

/** What a screen reader or a sighted keyboard user would learn about the focused element. */
function describeFocus() {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { focused: 'nothing (page body)' }
    const label = (
      el.getAttribute('aria-label') ||
      (el.tagName === 'SELECT' ? (el.labels?.[0]?.innerText ?? '').replace(el.innerText, '') : el.labels?.[0]?.innerText) ||
      (el.getAttribute('aria-labelledby') &&
        document.getElementById(el.getAttribute('aria-labelledby'))?.innerText) ||
      el.innerText ||
      el.getAttribute('title') ||
      el.getAttribute('placeholder') ||
      ''
    )
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 100)
    const role = el.getAttribute('role') || { A: 'link', BUTTON: 'button', SELECT: 'combobox', INPUT: `input(${el.type})`, TEXTAREA: 'textbox', SUMMARY: 'disclosure' }[el.tagName] || el.tagName.toLowerCase()
    const states = ['aria-pressed', 'aria-expanded', 'aria-selected', 'aria-checked', 'aria-current']
      .filter((a) => el.hasAttribute(a))
      .map((a) => `${a.replace('aria-', '')}=${el.getAttribute(a)}`)
    if (el.tagName === 'SELECT') states.push(`value="${el.options[el.selectedIndex]?.text ?? ''}"`)
    /*
     * A date or time field is several stops, not one: Tab walks its month, day and year (or hour,
     * minute, AM/PM) before leaving it. A screen reader announces each part; this harness can only see
     * the field, so without this note three Tabs read as "stuck", and a participant reported a keyboard
     * trap that verification showed does not exist (the fourth Tab leaves the field).
     */
    if (el.tagName === 'INPUT' && ['date', 'time', 'datetime-local', 'month', 'week'].includes(el.type)) {
      states.push(`a ${el.type} field made of parts; Tab moves through each part before leaving the field`)
    }
    const cs = getComputedStyle(el)
    const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'
    const r = el.getBoundingClientRect()
    return {
      focused: `${role} "${label}"${states.length ? ` [${states.join(', ')}]` : ''}`,
      focusRingVisible: ring,
      onScreen: r.bottom > 0 && r.top < innerHeight,
    }
  })
}

/** Resolves what the participant pointed at, from what they could see. Never a CSS selector or test id. */
async function resolveTarget(a) {
  let locator
  if (a.role) locator = page.getByRole(a.role, { name: a.name, exact: Boolean(a.exact) })
  else if (a.label) locator = page.getByLabel(a.label, { exact: Boolean(a.exact) })
  else if (a.placeholder) locator = page.getByPlaceholder(a.placeholder)
  else if (a.text !== undefined) locator = page.getByText(String(a.text), { exact: Boolean(a.exact) })
  else return { error: 'Say what to act on: --text, --role with --name, --label, --placeholder, or --x and --y.' }

  const viewport = page.viewportSize()
  const matches = []
  for (const candidate of await locator.all()) {
    const box = await candidate.boundingBox().catch(() => null)
    if (!box || box.width === 0 || box.height === 0) continue
    if (box.y + box.height <= 0 || box.y >= viewport.height || box.x + box.width <= 0 || box.x >= viewport.width) continue
    matches.push(candidate)
  }
  if (matches.length === 0) return { error: 'Nothing matching that is visible on the screen right now.' }
  const index = Number(a.nth ?? 0)
  if (index >= matches.length) return { error: `Only ${matches.length} visible match(es).` }
  return { locator: matches[index], note: matches.length > 1 ? `${matches.length} visible matches; used number ${index}` : undefined }
}

async function pointAt(a, action) {
  if (a.x !== undefined && a.y !== undefined) {
    if (action === 'hover') await page.mouse.move(Number(a.x), Number(a.y))
    else if (touch) await page.touchscreen.tap(Number(a.x), Number(a.y))
    else await page.mouse.click(Number(a.x), Number(a.y))
    return {}
  }
  const found = await resolveTarget(a)
  if (found.error) return found
  if (action === 'hover') await found.locator.hover({ timeout: 4000 })
  else if (touch) await found.locator.tap({ timeout: 4000 })
  else await found.locator.click({ timeout: 4000 })
  return { note: found.note }
}

/** Every piece of text in the viewport, top to bottom — what a sighted person could read right now. */
function visibleText(maxChars) {
  return page.evaluate((limit) => {
    const vh = innerHeight
    const lines = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim().replace(/\s+/g, ' ')
      if (!text) continue
      const parent = node.parentElement
      const cs = parent && getComputedStyle(parent)
      if (!cs || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.05) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      const r = range.getBoundingClientRect()
      if (r.width === 0 || r.bottom <= 0 || r.top >= vh) continue
      lines.push({ y: Math.round(r.top), x: Math.round(r.left), text })
    }
    lines.sort((a, b) => a.y - b.y || a.x - b.x)
    const merged = []
    for (const line of lines) {
      const last = merged[merged.length - 1]
      if (last && Math.abs(last.y - line.y) < 6) last.text += ` ${line.text}`
      else merged.push({ ...line })
    }
    return merged.map((l) => l.text).join('\n').slice(0, limit)
  }, maxChars)
}

function visibleControls() {
  return page.evaluate(() => {
    const vh = innerHeight
    const vw = innerWidth
    const selector =
      'a[href],button,input,select,textarea,summary,[role=button],[role=tab],[role=link],[role=checkbox],[role=switch],[role=menuitem],[tabindex]:not([tabindex="-1"])'
    return [...document.querySelectorAll(selector)]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05
      })
      .slice(0, 90)
      .map((el) => {
        const r = el.getBoundingClientRect()
        const at = `at ${Math.round(r.x + r.width / 2)},${Math.round(r.y + r.height / 2)}`
        // A label that wraps its select also contains every option's text, so a dropdown would read
        // "Race Human Dwarf Night Elf..." — name it by the label alone and say what it is set to.
        if (el.tagName === 'SELECT') {
          const label = (el.getAttribute('aria-label') || (el.labels?.[0]?.innerText ?? '').replace(el.innerText, '') || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ')
          return `dropdown "${label}" (currently "${el.options[el.selectedIndex]?.text ?? ''}", ${el.options.length} options) ${at}`
        }
        const name = (el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.innerText || el.value || el.getAttribute('title') || el.getAttribute('placeholder') || el.getAttribute('alt') || '')
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 60)
        const role = el.getAttribute('role') || { A: 'link', BUTTON: 'button', INPUT: `input:${el.type}`, TEXTAREA: 'textbox', SUMMARY: 'disclosure' }[el.tagName] || el.tagName.toLowerCase()
        return `${role} "${name}" ${at}`
      })
  })
}

/** The accessibility tree's outline — landmarks and headings — which is how screen reader users skim. */
function outline() {
  return page.evaluate(() => {
    const items = []
    for (const el of document.querySelectorAll('header,nav,main,aside,footer,section[aria-label],[role=region],[role=navigation],[role=main],[role=dialog],h1,h2,h3,h4')) {
      if (el.closest('[aria-hidden="true"]') || getComputedStyle(el).display === 'none') continue
      const tag = el.tagName.toLowerCase()
      if (/^h[1-4]$/.test(tag)) items.push(`${'  '.repeat(Number(tag[1]) - 1)}heading level ${tag[1]}: ${el.innerText.trim().replace(/\s+/g, ' ').slice(0, 90)}`)
      else items.push(`landmark ${el.getAttribute('role') || tag}${el.getAttribute('aria-label') ? ` "${el.getAttribute('aria-label')}"` : ''}`)
    }
    return items.slice(0, 120).join('\n')
  })
}

const READ_ONLY = new Set(['look', 'aria', 'outline', 'screenshot', 'where'])

async function perform(a) {
  const action = a.do
  const result = {}
  openedTab = null

  switch (action) {
    case 'where':
      break
    case 'look':
      result.text = await visibleText(Number(a.max ?? 3500))
      result.controls = await visibleControls()
      break
    case 'screenshot':
      break
    case 'outline':
      result.outline = await outline()
      break
    case 'aria': {
      const scope = a.scope ? page.getByRole(a.scope, a.name ? { name: a.name } : undefined).first() : page.locator('body')
      const tree = await scope.ariaSnapshot({ timeout: 5000 }).catch((error) => `(could not read: ${error.message.split('\n')[0]})`)
      const max = Number(a.max ?? 6000)
      result.aria = tree.length > max ? `${tree.slice(0, max)}\n… (${tree.length - max} more characters; use --scope to narrow)` : tree
      break
    }
    case 'click':
    case 'tap':
    case 'hover':
      Object.assign(result, await pointAt(a, action === 'hover' ? 'hover' : 'click'))
      break
    case 'fill': {
      const found = await resolveTarget(a)
      if (found.error) return found
      await found.locator.fill(String(a.value ?? ''), { timeout: 4000 })
      break
    }
    case 'type':
      await page.keyboard.type(String(a.text ?? ''), { delay: 25 })
      break
    case 'select': {
      const found = await resolveTarget(a)
      if (found.error) return found
      await found.locator.selectOption({ label: String(a.option) }, { timeout: 4000 }).catch(async () => found.locator.selectOption(String(a.option), { timeout: 4000 }))
      break
    }
    case 'press':
      await page.keyboard.press(String(a.key))
      break
    case 'scroll':
      if (a.to === 'top') await page.evaluate(() => scrollTo(0, 0))
      else if (a.to === 'bottom') await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
      // Touch-emulated WebKit ignores wheel events outright — measured: 700px of wheel left an iPhone
      // at 0 of 4,504px — so a touch device scrolls the document the way a swipe would.
      else if (touch) await page.evaluate((dy) => scrollBy(0, dy), Number(a.dy ?? 600))
      else {
        const viewport = page.viewportSize()
        await page.mouse.move(viewport.width / 2, viewport.height / 2)
        await page.mouse.wheel(0, Number(a.dy ?? 600))
      }
      break
    case 'back':
      await page.goBack({ timeout: 8000 }).catch(() => {})
      break
    case 'goto':
      await page.goto(String(a.url), { timeout: 20000 })
      break
    case 'tabs':
      result.tabs = pages.map((p, i) => `${i}${p === page ? ' (current)' : ''}: ${p.url()}`)
      break
    case 'switch-tab':
      page = pages[Number(a.index ?? 0)] ?? page
      await page.bringToFront()
      break
    case 'close-tab':
      if (pages.length > 1) {
        const closing = page
        pages.splice(pages.indexOf(closing), 1)
        await closing.close()
        page = pages[pages.length - 1]
        await page.bringToFront()
      }
      break
    case 'wait':
      await page.waitForTimeout(Math.min(Number(a.ms ?? 1000), 10000))
      break
    case 'end':
      break
    default:
      return { error: `Unknown action "${action}". Known: look, screenshot, where, outline, aria, click, tap, hover, fill, type, select, press, scroll, back, goto, tabs, switch-tab, close-tab, wait, end.` }
  }

  if (!READ_ONLY.has(action)) await settle()
  if (openedTab) result.newTab = `A new tab opened (${openedTab.url()}); you are now on it. "close-tab" returns to the previous one.`
  if (['press', 'click', 'tap', 'fill', 'type', 'select'].includes(action)) Object.assign(result, await describeFocus().catch(() => ({})))
  return result
}

let queue = Promise.resolve()

function handle(body) {
  const run = queue.then(async () => {
    lastCommandAt = Date.now()
    step += 1
    const { think, do: action, ...rest } = body
    let result
    try {
      result = await perform(body)
    } catch (error) {
      result = { error: error.message.split('\n')[0] }
    }
    const where = await whereAmI().catch(() => ({}))
    const shot = action === 'end' ? null : await screenshot()
    const entry = {
      step,
      t: new Date().toISOString(),
      elapsedS: Math.round((Date.now() - started) / 1000),
      do: action,
      args: rest,
      think: think ?? null,
      ok: !result.error,
      error: result.error,
      note: result.note,
      url: page.url(),
      ...where,
      focused: result.focused,
      focusRingVisible: result.focusRingVisible,
      newTab: result.newTab ? openedTab?.url() ?? true : undefined,
      shot,
    }
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`)
    return { step, ...result, ...where, url: page.url(), screenshot: shot }
  })
  queue = run.catch(() => {})
  return run
}

async function shutdown(code = 0) {
  await browser.close().catch(() => {})
  process.exit(code)
}

// Arrival: the participant's first view, before they have done anything.
await page.goto(startUrl, { timeout: 30000 })
await settle()
await page.waitForTimeout(1500)
{
  const where = await whereAmI().catch(() => ({}))
  const shot = await screenshot()
  fs.appendFileSync(logFile, `${JSON.stringify({ step: 0, t: new Date().toISOString(), elapsedS: 0, do: 'arrive', args: { device: args.device ?? 'desktop-1440' }, url: page.url(), ...where, shot })}\n`)
}

const server = http.createServer((req, res) => {
  const send = (status, payload) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(payload, null, 1))
  }
  if (req.url === '/health') return send(200, { ok: true, id, device: args.device, step })
  if (req.method !== 'POST' || req.url !== '/act') return send(404, { error: 'POST /act' })
  let raw = ''
  req.on('data', (chunk) => (raw += chunk))
  req.on('end', async () => {
    let body
    try {
      body = JSON.parse(raw)
    } catch {
      return send(400, { error: 'Body must be JSON' })
    }
    const result = await handle(body)
    send(200, result)
    if (body.do === 'end') setTimeout(() => shutdown(0), 200)
  })
})

server.listen(port, '127.0.0.1', () => console.log(`READY ${id} ${args.device ?? 'desktop-1440'} http://127.0.0.1:${port}`))

// A participant that dies mid-session must not leave a browser running for the rest of the day. Long
// enough to cover the research step, which happens before the first command arrives.
setInterval(() => {
  if (Date.now() - lastCommandAt > 45 * 60 * 1000) shutdown(0)
}, 60 * 1000).unref()
