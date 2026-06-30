import { Panel } from '../../components/layout/Panel'
import type { StatBlock } from './statsTypes'

type StatsPanelProps = {
  stats: StatBlock
}

const statLabels: Array<[keyof StatBlock, string]> = [
  ['strength', 'Strength'],
  ['agility', 'Agility'],
  ['stamina', 'Stamina'],
  ['intellect', 'Intellect'],
  ['spirit', 'Spirit'],
  ['attackPower', 'Attack Power'],
  ['spellPower', 'Spell Power'],
  ['critRating', 'Crit Rating'],
  ['hitRating', 'Hit Rating'],
]

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <Panel title="Stats" eyebrow="Calculated totals">
      <div className="stats-grid">
        {statLabels.map(([key, label]) => (
          <div className="stat-tile" key={key}>
            <span>{label}</span>
            <strong>{stats[key]}</strong>
          </div>
        ))}
      </div>
    </Panel>
  )
}
