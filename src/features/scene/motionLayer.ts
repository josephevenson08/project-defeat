/**
 * The motion each ported tab left for the last step (port step 7), loaded on demand by `sceneControl.ts`.
 *
 * Tabs ask for it with `cue()` (`lib/motion.ts`); this answers. The moments are the prototypes':
 * tiles landing row by row, panels rising into place, a route drawing itself, a ring of light opening a
 * pane, a learned talent's pulse, a slow tint on a row short of the hit cap, and the scene's swell and
 * embers, which brighten the still backdrop instead when there is no scene.
 *
 * **The browser's own animations, not a library's.** Each moment is a Web Animation from a start
 * state to the element's own style, so it cleans up after itself, a cancelled one leaves nothing
 * behind, and the compositor runs it. anime.js (already in the app) tweens the scene's numbers.
 *
 * Never loaded with reduced motion, and detached the moment reduced motion is switched on.
 */
import { attachMotion, type MotionCue } from '../../lib/motion'
import type { SceneHandle } from './sceneControl'

/* The prototypes' GSAP eases, as CSS curves. */
const EXPO_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
const BACK_OUT = 'cubic-bezier(0.34, 1.7, 0.64, 1)'
const POWER2_OUT = 'cubic-bezier(0.33, 1, 0.68, 1)'
const POWER2_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)'
const POWER1_IN = 'cubic-bezier(0.32, 0, 0.67, 0)'

let scene: SceneHandle | undefined
const live = new Set<Animation>()
const observers = new Set<IntersectionObserver>()
let swellTimer: ReturnType<typeof setTimeout> | undefined

export function setScene(next: SceneHandle | undefined) {
  scene = next
}

function play(element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) {
  // One moment at a time per element: the same cue twice (React's strict mode runs effects twice) restarts it.
  element.getAnimations().forEach((running) => live.has(running) && running.cancel())
  const animation = element.animate(keyframes, options)
  live.add(animation)
  const done = () => live.delete(animation)
  animation.addEventListener('finish', done)
  animation.addEventListener('cancel', done)
  return animation
}

function elements(target: Element | string | null | undefined) {
  if (!target) return []
  return typeof target === 'string' ? [...document.querySelectorAll(target)] : [target]
}

/** Only what is on screen, or just below it: a moment nobody sees only delays the page's settling. */
function onScreen(list: Element[], limit = Infinity) {
  return list
    .filter((element) => {
      if (!element.isConnected) return false
      const box = element.getBoundingClientRect()
      return box.width > 0 && box.bottom > 0 && box.top < window.innerHeight * 1.15
    })
    .slice(0, limit)
}

/* Tiles land row by row: a small drop with a little overshoot, each a beat after the one before. */
function land(target: Element | string | null | undefined) {
  onScreen(elements(target)).forEach((tile, i) =>
    play(tile, [{ opacity: 0, transform: 'translateY(10px) scale(0.86)' }, { opacity: 1, transform: 'none' }], {
      duration: 350,
      delay: i * 25,
      easing: BACK_OUT,
      fill: 'backwards',
    }),
  )
}

/* New panels rise into place, up to ten at a time. */
function rise(target: Element | string | null | undefined) {
  onScreen(elements(target), 10).forEach((panel, i) =>
    play(panel, [{ opacity: 0, transform: 'translateY(34px)' }, { opacity: 1, transform: 'none' }], {
      duration: 600,
      delay: i * 50,
      easing: EXPO_OUT,
      fill: 'backwards',
    }),
  )
}

/* A route line draws itself from its start. */
function draw(target: Element | string | null | undefined) {
  onScreen(elements(target)).forEach((line) => {
    if (!(line instanceof SVGGeometryElement)) return
    const length = line.getTotalLength()
    if (!(length > 0)) return
    line.style.strokeDasharray = `${length}`
    const animation = play(line, [{ strokeDashoffset: `${length}` }, { strokeDashoffset: '0' }], { duration: 1100, easing: POWER2_IN_OUT })
    const clear = () => line.style.removeProperty('stroke-dasharray')
    animation.addEventListener('finish', clear)
    animation.addEventListener('cancel', clear)
  })
}

/*
 * A small ring of light opens where a pane appears (the prototypes' K8), and the pane settles from a
 * little brighter. The prototypes opened the pane through a growing circle (`clip-path`), but a clipped
 * corner cannot be pressed, and a pane's close button sits in its corner: a filter clips nothing.
 */
function enter(target: Element | string | null | undefined) {
  onScreen(elements(target), 1).forEach((pane) => {
    const box = pane.getBoundingClientRect()
    const size = Math.max(40, Math.min(box.width, box.height) * 0.9)
    const ring = document.createElement('div')
    ring.className = 'scene-ring'
    ring.setAttribute('aria-hidden', 'true')
    ring.style.width = ring.style.height = `${size}px`
    ring.style.left = `${box.left + box.width / 2 - size / 2}px`
    ring.style.top = `${box.top + box.height / 2 - size / 2}px`
    document.body.appendChild(ring)
    play(pane, [{ filter: 'brightness(1.3)' }, { filter: 'brightness(1)' }], { duration: 700, easing: POWER2_OUT })
    const glow = play(
      ring,
      [
        { transform: 'scale(0.15)', opacity: 0, easing: POWER2_OUT },
        { transform: 'scale(1.2)', opacity: 0.7, offset: 0.44, easing: POWER1_IN },
        { transform: 'scale(1.7)', opacity: 0 },
      ],
      { duration: 800 },
    )
    const remove = () => ring.remove()
    glow.addEventListener('finish', remove)
    glow.addEventListener('cancel', remove)
  })
}

/* Bars fill from the left, a beat apart, the first time they scroll into view. */
function fill(target: Element | string | null | undefined) {
  const bars = elements(target)
  if (!bars.length) return
  const watch = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      watch.unobserve(entry.target)
      play(entry.target, [{ transform: 'scaleX(0)', transformOrigin: '0 50%' }, { transform: 'scaleX(1)', transformOrigin: '0 50%' }], {
        duration: 900,
        delay: bars.indexOf(entry.target) * 60,
        easing: EXPO_OUT,
        fill: 'backwards',
      })
    })
  })
  bars.forEach((bar) => watch.observe(bar))
  observers.add(watch)
}

/* A learned point pulses once. Tabs pass what is inside the button, so the button's own box never moves under a click. */
function pulse(target: Element | string | null | undefined) {
  elements(target).forEach((point) =>
    play(point, [{ transform: 'scale(1)' }, { transform: 'scale(1.14)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' }),
  )
}

/* The prototypes' K10: a slow tint on a row while it is short (the text says so too; the tint only adds to it). */
function taint(target: Element | string | null | undefined, on: boolean) {
  elements(target).forEach((row) => {
    if (!row.classList.contains('scene-taint')) {
      row.classList.add('scene-taint')
      // Drawn untinted once first, so the tint fades in rather than appearing.
      void getComputedStyle(row, '::after').opacity
    }
    row.classList.toggle('is-tainted', on)
  })
}

/* Without the scene, a swell brightens the still backdrop once. */
function swellBackdrop() {
  const root = document.documentElement
  root.classList.remove('backdrop-swell')
  void root.offsetWidth
  root.classList.add('backdrop-swell')
  clearTimeout(swellTimer)
  swellTimer = setTimeout(() => root.classList.remove('backdrop-swell'), 1300)
}

function answer(next: MotionCue) {
  if (next.kind === 'groups') {
    scene?.groups(next.f, next.n)
    return
  }
  if (next.kind === 'swell') {
    if (scene) scene.swell()
    else swellBackdrop()
    return
  }
  if (next.kind === 'embers') {
    scene?.embers()
    return
  }
  // A frame later, so React has drawn what the cue is about.
  requestAnimationFrame(() => {
    if (next.kind === 'taint') taint(next.target, next.on)
    else ({ land, rise, draw, enter, pulse, fill })[next.kind](next.target)
  })
}

export function startMotion() {
  const root = document.documentElement
  root.classList.add('motion')
  const detach = attachMotion(answer)
  return () => {
    detach()
    live.forEach((animation) => animation.cancel())
    live.clear()
    observers.forEach((watch) => watch.disconnect())
    observers.clear()
    clearTimeout(swellTimer)
    root.classList.remove('motion', 'backdrop-swell')
    document.querySelectorAll('.scene-taint').forEach((row) => row.classList.remove('scene-taint', 'is-tainted'))
    document.querySelectorAll('.scene-ring').forEach((ring) => ring.remove())
  }
}
