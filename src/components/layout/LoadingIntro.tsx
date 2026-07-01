import { useEffect, useRef, useState } from 'react'
import { animateIntro, animateIntroExit, introDurationMs, prefersReducedMotion } from '../../lib/animations'

const loadingLines = ['Loading item data...', 'Preparing BiS lists...', 'Entering Outland...', 'Building simulation profile...']

type LoadingIntroProps = {
  onComplete: () => void
}

export function LoadingIntro({ onComplete }: LoadingIntroProps) {
  const introRef = useRef<HTMLDivElement>(null)
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    const reduceMotion = prefersReducedMotion()
    const lineInterval = reduceMotion
      ? undefined
      : window.setInterval(() => {
          setLineIndex((current) => (current + 1) % loadingLines.length)
        }, 230)

    animateIntro(introRef.current)

    const exitTimer = window.setTimeout(() => {
      animateIntroExit(introRef.current)
    }, Math.max(introDurationMs() - 220, 0))

    const completeTimer = window.setTimeout(onComplete, introDurationMs())

    return () => {
      if (lineInterval) window.clearInterval(lineInterval)
      window.clearTimeout(exitTimer)
      window.clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="loading-intro" data-testid="loading-intro" ref={introRef}>
      <div className="loading-mark" aria-hidden="true" />
      <p className="eyebrow">Project Defeat</p>
      <h1>Project Defeat</h1>
      <p>TBC Anniversary Simulator & Gear Planner</p>
      <span aria-live="polite">{loadingLines[lineIndex]}</span>
    </div>
  )
}
