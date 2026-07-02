import { useEffect, useRef } from 'react'
import { Panel } from '../../components/layout/Panel'
import type { CharacterRole } from '../../domain/character/characterTypes'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { animateStatUpdate } from '../../lib/animations'
import { statLabels, type StatBlock } from './statsTypes'

type StatsPanelProps = {
  stats: StatBlock
  role: CharacterRole
}

function testIdForStat(label: string) {
  return `stat-${label.toLowerCase().replaceAll(' ', '-')}`
}

export function StatsPanel({ stats, role }: StatsPanelProps) {
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    animateStatUpdate(statsRef.current?.querySelectorAll('.stat-tile strong') ?? null)
  }, [stats])

  return (
    <Panel title="Stats" eyebrow="Calculated totals" accentColor={getRoleAccentColor(role)}>
      <div className="stats-grid" ref={statsRef}>
        {statLabels.map(([key, label]) => (
          <div className="stat-tile" data-testid={testIdForStat(label)} key={key}>
            <span>{label}</span>
            <strong>{stats[key]}</strong>
          </div>
        ))}
      </div>
    </Panel>
  )
}
