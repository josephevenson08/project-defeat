import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { animatePanelEntrance } from '../../lib/animations'

type PanelProps = {
  title: string
  eyebrow?: string
  className?: string
  /** Sets --panel-accent for this panel; used to tie a section's chrome to the character's current role. */
  accentColor?: string
  children: ReactNode
}

export function Panel({ title, eyebrow, className = '', accentColor, children }: PanelProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    animatePanelEntrance(panelRef.current)
  }, [])

  const style = accentColor ? ({ '--panel-accent': accentColor } as CSSProperties) : undefined

  return (
    <section className={`panel ${className}`.trim()} aria-label={title} ref={panelRef} style={style}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
