/**
 * Whether the optional 3D scene and the motion layer run, and loading them (port step 7).
 *
 * **This is the only part of the layer in the main bundle.** `three` and the scene live in
 * `waterScene.ts`, the DOM effects in `motionLayer.ts`, and both are imported on demand, after the
 * first screen is up, so a visitor who never sees the scene never downloads it.
 *
 * **Who gets the still backdrop instead** (the `body::before` that step 0 paints for every tab):
 * - **Reduced motion**: nothing loads at all, the scene or the motion, and the switch says why.
 * - **WebGL 2 off, or only in software** (`failIfMajorPerformanceCaveat`: a blocklisted graphics card
 *   falls back to a software renderer that cannot keep up).
 * - **Weak hardware**: under 4 GB of memory, two processor cores or fewer, or Data Saver on. The scene
 *   also gives up by itself if even its lowest quality runs under about 25 frames a second.
 * The motion layer still runs on those devices; it is a few CSS animations.
 *
 * **On by default** (the owner's call, 2026-10-23), with a switch at the end of the top bar that is
 * remembered. `'force'` skips the hardware check, for the tests, whose browser renders in software.
 */
import { useSyncExternalStore } from 'react'

const KEY = 'project-defeat:scene:v1'

export type SceneState =
  | { status: 'on' | 'loading' | 'off' | 'reduced' }
  | { status: 'unavailable'; why: string }

/** What the scene module gives back once it runs. */
export type SceneHandle = {
  stop(): void
  swell(): void
  embers(): void
  groups(f: readonly number[], n: number): void
}

let state: SceneState = { status: 'off' }
const listeners = new Set<() => void>()
let scene: SceneHandle | undefined
let motion: Promise<typeof import('./motionLayer')> | undefined
let detachMotion: (() => void) | undefined
// Bumped on every change, so a scene that finishes loading after the switch went off again is dropped.
let run = 0

function set(next: SceneState) {
  state = next
  listeners.forEach((listener) => listener())
}

function readPreference() {
  try {
    return localStorage.getItem(KEY) ?? 'on'
  } catch {
    return 'on'
  }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)')

function whenIdle(then: () => void) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(then, { timeout: 2000 })
  else setTimeout(then, 1200)
}

/** Why this device gets the still backdrop, or nothing when it may run the scene. */
function unavailable(force: boolean) {
  const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (!force) {
    if (device.connection?.saveData) return 'Data Saver is on'
    if (device.deviceMemory !== undefined && device.deviceMemory < 4) return 'this device has little memory'
    if (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2) return 'this device has few processor cores'
  }
  let gl: WebGL2RenderingContext | null
  try {
    gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: !force })
  } catch {
    gl = null
  }
  if (!gl) return force ? 'WebGL is off in this browser' : 'WebGL is off or runs in software here'
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  return undefined
}

function sync() {
  const ticket = ++run
  if (scene) {
    scene.stop()
    scene = undefined
    // A swell goes back to brightening the backdrop.
    void motion?.then((m) => m.setScene(undefined))
  }
  if (reducedMotion().matches) {
    detachMotion?.()
    detachMotion = undefined
    set({ status: 'reduced' })
    return
  }
  motion ??= import('./motionLayer')
  const layer = motion
  if (!detachMotion) whenIdle(() => void layer.then((m) => {
    if (!detachMotion && !reducedMotion().matches) detachMotion = m.startMotion()
  }))
  const preference = readPreference()
  if (preference === 'off') {
    set({ status: 'off' })
    return
  }
  const why = unavailable(preference === 'force')
  if (why) {
    set({ status: 'unavailable', why })
    return
  }
  set({ status: 'loading' })
  whenIdle(() => {
    Promise.all([import('./waterScene'), layer])
      .then(([water, m]) => {
        if (ticket !== run) return
        scene = water.startScene({
          force: preference === 'force',
          onFail: (reason) => {
            if (ticket !== run) return
            scene = undefined
            m.setScene(undefined)
            set({ status: 'unavailable', why: reason })
          },
        })
        m.setScene(scene)
        set({ status: 'on' })
      })
      .catch(() => {
        if (ticket === run) set({ status: 'unavailable', why: 'the scene could not load' })
      })
  })
}

/** Once, from `main.tsx`, after the first render. */
export function bootScene() {
  reducedMotion().addEventListener('change', sync)
  sync()
}

export function setScenePreference(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // Not remembered, but it still switches for this visit.
  }
  sync()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSceneState() {
  return useSyncExternalStore(subscribe, () => state)
}
