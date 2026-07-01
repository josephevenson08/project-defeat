import { animate } from 'animejs'

export function animateResultCard(selector: string) {
  if (typeof window === 'undefined') return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  animate(selector, {
    opacity: [0, 1],
    translateY: [10, 0],
    scale: [0.98, 1],
    duration: 420,
    easing: 'easeOutQuad',
  })
}
