import { animate } from 'animejs'

type AnimationTarget = string | Element | Element[] | NodeListOf<Element> | null

function canAnimate() {
  if (typeof window === 'undefined') return
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function introDurationMs() {
  return prefersReducedMotion() ? 120 : 980
}

export function animateIntro(target: AnimationTarget) {
  if (!canAnimate() || !target) return

  animate(target, {
    opacity: [0, 1],
    translateY: [8, 0],
    scale: [0.99, 1],
    duration: 520,
    easing: 'easeOutQuad',
  })
}

export function animateIntroExit(target: AnimationTarget) {
  if (!canAnimate() || !target) return

  animate(target, {
    opacity: [1, 0],
    translateY: [0, -8],
    duration: 220,
    easing: 'easeOutQuad',
  })
}

export function animatePanelEntrance(target: AnimationTarget) {
  if (!canAnimate() || !target) return

  animate(target, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 360,
    easing: 'easeOutQuad',
  })
}

export function animateEquipFeedback(target: AnimationTarget) {
  if (!canAnimate() || !target) return

  animate(target, {
    scale: [1, 1.015, 1],
    duration: 260,
    easing: 'easeOutQuad',
  })
}

export function animateStatUpdate(target: AnimationTarget) {
  if (!canAnimate() || !target) return

  animate(target, {
    opacity: [0.72, 1],
    translateY: [4, 0],
    duration: 260,
    easing: 'easeOutQuad',
  })
}

export function animateResultCard(target: AnimationTarget) {
  if (!canAnimate() || !target) return

  animate(target, {
    opacity: [0, 1],
    translateY: [10, 0],
    scale: [0.985, 1],
    duration: 420,
    easing: 'easeOutQuad',
  })
}
