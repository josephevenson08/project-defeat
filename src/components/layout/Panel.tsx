import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  eyebrow?: string
  className?: string
  children: ReactNode
}

export function Panel({ title, eyebrow, className = '', children }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()} aria-label={title}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
