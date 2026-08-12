import type { CSSProperties } from 'react'
import { Panel } from '../../components/layout/Panel'
import { getRoleAccentColor } from '../../domain/character/roleTheme'
import { getRoleForSpec } from '../../domain/character/tbcClasses'
import type { CharacterProfile } from '../character/characterTypes'
import { specTierLists } from '../../domain/tierlists'
import type { SpecTierList, TierRow } from '../../domain/tierlists'

type TierListsPanelProps = {
  /**
   * The character to mark on the lists, when there is one. Undefined until creation has actually been
   * run — highlighting the default Fury Warrior for someone who never chose it would be inventing an
   * answer to "where do I stand".
   */
  highlight?: CharacterProfile
}

/**
 * Wowhead's Phase 2 spec tier lists — DPS, healer and tank.
 *
 * All three are on one page rather than behind a picker like the raids are. The raids picker exists
 * because five loot tables is several hundred rows; all three tier lists together are 28 placements,
 * and the comparison between them is worth something — seeing that Feral Druid is C-tier for damage
 * and S-tier for tanking is the kind of thing you only notice with both on screen.
 *
 * **Tier letters are not drawn in item-quality colours**, though Wowhead draws them that way (S is
 * `q5`, A is `q4`, and so on). Quality colour is the one chromatic signal this interface spends, and
 * it means "this item is epic" everywhere else in the app; borrowing it here to mean "this spec is
 * good" would make the loudest colour on the page ambiguous. Rank reads through text weight and rule
 * strength instead, which is the same vocabulary the rest of the app ranks with.
 */
export function TierListsPanel({ highlight }: TierListsPanelProps) {
  return (
    <>
      <div className="tier-intro">
        <p className="eyebrow">Phase 2 · Serpentshrine Cavern and Tempest Keep</p>
        <h2>Spec tier lists</h2>
        <p className="panel-copy">
          Where each spec stands in Tier 5 content, as published by Wowhead. These rank <em>specs</em>, not items — they
          say nothing about which helm to wear, and they are not what the per-slot rankings in the planner are built
          from. Wowhead's reasoning for each placement is on their pages, linked under every list.
        </p>
      </div>

      {specTierLists.map((list) => (
        <TierListSection key={list.role} list={list} highlight={highlight} />
      ))}
    </>
  )
}

function TierListSection({ list, highlight }: { list: SpecTierList; highlight?: CharacterProfile }) {
  const placementCount = list.tiers.reduce((total, tier) => total + tier.placements.length, 0)

  return (
    <Panel
      title={`${list.role} tier list`}
      eyebrow={`${list.tiers.length} tiers · ${placementCount} ${placementCount === 1 ? 'spec' : 'specs'}`}
      className="tier-panel-shell"
    >
      <div className="tier-rows">
        {list.tiers.map((tier, index) => (
          <TierRowView key={tier.label} tier={tier} depth={index} highlight={highlight} />
        ))}
      </div>

      <p className="tier-source">
        <a href={list.sourceUrl} target="_blank" rel="noreferrer noopener">
          {list.title}
        </a>
      </p>
    </Panel>
  )
}

/**
 * `depth` is the tier's position, 0 for the top one. It drives how strongly the row is drawn: the
 * best tier is the brightest and the rule beside it the strongest, fading as you go down. That is the
 * ranking signal, in place of the colour ramp Wowhead uses.
 */
function TierRowView({ tier, depth, highlight }: { tier: TierRow; depth: number; highlight?: CharacterProfile }) {
  return (
    <div className="tier-row" data-depth={depth} data-testid={`tier-row-${tier.label}`}>
      <div className="tier-row-label">
        <span className="tier-letter">{tier.label}</span>
      </div>

      <ul className="tier-specs">
        {tier.placements.map((placement) => {
          const isHighlight = highlight?.className === placement.className && highlight?.spec === placement.spec
          const accent = isHighlight ? getRoleAccentColor(getRoleForSpec(placement.className, placement.spec)) : undefined

          return (
            <li
              key={placement.slug}
              className="tier-spec"
              data-current={isHighlight || undefined}
              style={accent ? ({ '--tier-accent': accent } as CSSProperties) : undefined}
              data-testid={`tier-spec-${placement.slug}`}
            >
              <span className="tier-spec-spec">{placement.spec}</span>
              <span className="tier-spec-class">{placement.className}</span>
              {/* Named rather than implied by the accent alone, so the mark is not colour-only. */}
              {isHighlight && <span className="tier-spec-you">Your spec</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
