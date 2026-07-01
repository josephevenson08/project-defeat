import type { ReactNode } from 'react'

type PanelProps = {
  title: string
  eyebrow?: string
  children: ReactNode
}

export function Panel({ title, eyebrow, children }: PanelProps) {
  return (
    <section className="panel" aria-label={title}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children}
    </section>
  )
}
