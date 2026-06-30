import { Panel } from '../../components/layout/Panel'
import { statLabels, type StatBlock } from './statsTypes'

type StatsPanelProps = {
  stats: StatBlock
}

function testIdForStat(label: string) {
  return `stat-${label.toLowerCase().replaceAll(' ', '-')}`
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <Panel title="Stats" eyebrow="Calculated totals">
      <div className="stats-grid">
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
