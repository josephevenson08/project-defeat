import { useEffect, useRef, type ReactNode } from 'react'
import { animatePanelEntrance } from '../../lib/animations'

type PanelProps = {
  title: string
  eyebrow?: string
  className?: string
  children: ReactNode
}

export function Panel({ title, eyebrow, className = '', children }: PanelProps) {
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    animatePanelEntrance(panelRef.current)
  }, [])

  return (
    <section className={`panel ${className}`.trim()} aria-label={title} ref={panelRef}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
