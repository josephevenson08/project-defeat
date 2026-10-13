import { useState } from 'react'
import { SpecIcon } from '../../components/ui/SpecIcon'
import { getQualityColor } from '../../domain/gear/qualityColors'
import { getRaidBuild, type Roster } from '../../domain/raidcomp'
import {
  exampleRaid,
  firstPicks,
  isContested,
  lootItem,
  lootKindLabel,
  lootSources,
  raidDropCount,
  raidersFrom,
  sortLoot,
  whoWants,
  type Raid,
  type RaidLootEntry,
  type Raider,
  type Want,
} from '../../domain/raids'
import { hasBossArt } from '../../domain/raids/bossArt'
import { LootIcon } from './LootIcon'
import { lootKey, slotName, type LootTipBinder } from './raidLootTip'

type ForMyRaidProps = {
  raid: Raid
  /** The roster saved on Raid Composition, when there is one. */
  saved?: Roster
  onPlanRaid: () => void
  /** Scrolls to a drop on this page and marks it (the "Most wanted" shortcuts). */
  onJump: (key: string) => void
  bindTip: LootTipBinder
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function RaiderIcon({ raider, size }: { raider: Raider; size: number }) {
  return (
    <SpecIcon
      className={raider.className}
      spec={raider.spec}
      size={size}
      icon={raider.buildId ? getRaidBuild(raider.buildId)?.icon : undefined}
    />
  )
}

/**
 * Design C, merged into the tab as "For my raid" (decided 2026-10-11): who in your raid wants each
 * drop. For every drop it shows the raiders whose spec's Wowhead Phase 2 list ranks it, with the
 * rank; drops go most-wanted first, and one that three or more raiders rank first is marked
 * contested. A tier token counts for whoever ranks a set piece it buys. Press a raider for only
 * their wishlist.
 *
 * It reads the raid saved on Raid Composition. Until there is one, or when that raid is the wrong
 * size for this one, it shows the example raid and says so every time, with the way to plan your own.
 */
export function ForMyRaid({ raid, saved, onPlanRaid, onJump, bindTip }: ForMyRaidProps) {
  const [selected, setSelected] = useState<string>()

  const hasSaved = saved !== undefined && saved.groups.some((group) => group.some(Boolean))
  const useSaved = hasSaved && saved.size === raid.playerSize
  const raiders = raidersFrom(useSaved ? saved : exampleRaid(raid.playerSize))
  const groups = Math.max(...raiders.map((raider) => raider.group)) + 1
  const sources = lootSources(raid)

  const wants = new Map<RaidLootEntry, Want[]>()
  for (const source of sources) for (const entry of source.entries) if (!wants.has(entry)) wants.set(entry, whoWants(entry, raiders))
  const wanted = [...wants.keys()].filter((entry) => wants.get(entry)!.length > 0)
  const contested = wanted.filter((entry) => isContested(wants.get(entry)!))
  const countFor = (raider: Raider) => wanted.filter((entry) => wants.get(entry)!.some((want) => want.raider.key === raider.key)).length
  const noList = raiders.filter((raider) => !raider.list)
  const selectedRaider = raiders.find((raider) => raider.key === selected)
  const top = [...wanted]
    .sort((a, b) => wants.get(b)!.length - wants.get(a)!.length || wants.get(a)![0].rank - wants.get(b)![0].rank)
    .slice(0, 6)

  return (
    <div className="raid-plan">
      <section className="panel raid-plan-summary" aria-labelledby="raid-plan-title">
        <h2 id="raid-plan-title">
          From your raid{' '}
          <small>
            {plural(raiders.length, 'raider')} · {raid.name}
          </small>
        </h2>
        <p className="raid-plan-source" data-testid="raid-plan-source">
          {useSaved ? (
            'Your raid from Raid Composition.'
          ) : (
            <>
              The <strong>example {raid.playerSize}-player raid</strong>
              {hasSaved ? `: the raid you planned is a different size, and ${raid.name} is a ${raid.playerSize}-player raid` : ''}.{' '}
              <button type="button" className="link-button" onClick={onPlanRaid}>
                Plan your own on Raid Composition
              </button>{' '}
              and it shows here.
            </>
          )}{' '}
          Press a raider for their wishlist; the number is how many drops here their list ranks.
        </p>

        <div className={`raid-plan-roster${groups === 2 ? ' raid-plan-roster-ten' : ''}`} role="group" aria-label="Your raid">
          {Array.from({ length: groups }, (_, group) => (
            <div className="raid-plan-group" key={group}>
              <span>Group {group + 1}</span>
              <ul>
                {raiders
                  .filter((raider) => raider.group === group)
                  .map((raider) => {
                    const count = raider.list ? countFor(raider) : 0
                    const name = `${raider.label}: ${raider.list ? `${plural(count, 'drop')} here` : 'no Wowhead list'}`
                    return (
                      <li key={raider.key}>
                        <button
                          type="button"
                          className={`raid-plan-raider${count ? '' : ' raid-plan-raider-none'}`}
                          aria-pressed={raider.key === selected}
                          aria-label={name}
                          title={name}
                          onClick={() => setSelected((current) => (current === raider.key ? undefined : raider.key))}
                          data-testid={`raider-${raider.key}`}
                        >
                          <RaiderIcon raider={raider} size={32} />
                          {raider.list && <b>{count}</b>}
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>
          ))}
        </div>

        <ul className="raid-plan-facts">
          <li>
            <b>Wanted</b>
            {wanted.length} of {raidDropCount(raid)} drops
          </li>
          <li>
            <b>Contested (3+ rank it first)</b>
            {contested.length}
          </li>
          <li>
            <b>Raiders with nothing here</b>
            {raiders.filter((raider) => raider.list && !countFor(raider)).length}
          </li>
        </ul>
        {noList.length > 0 && (
          <p className="raid-plan-note">
            {noList.map((raider) => raider.label).join(', ')}: Wowhead's Feral list is for cat DPS, so Bear tanks have no list of their own
            here.
          </p>
        )}

        {selectedRaider ? (
          <div className="raid-plan-selected">
            <RaiderIcon raider={selectedRaider} size={24} />
            <span>
              <strong>{selectedRaider.label}</strong>: {plural(countFor(selectedRaider), 'drop')} here on their list,{' '}
              {wanted.filter((entry) => wants.get(entry)!.some((want) => want.raider.key === selected && want.rank === 1)).length} of them
              their first pick.
            </span>
            <button type="button" onClick={() => setSelected(undefined)}>
              Show everyone
            </button>
          </div>
        ) : (
          top.length > 0 && (
            <div>
              <p className="raid-plan-label">Most wanted here</p>
              <div className="raid-plan-top">
                {top.map((entry) => {
                  const item = lootItem(entry)
                  const list = wants.get(entry)!
                  return (
                    <button key={lootKey(entry)} type="button" className="raid-plan-top-item" onClick={() => onJump(lootKey(entry))} {...bindTip(entry)}>
                      <LootIcon entry={entry} size={34} />
                      <span>
                        <b style={{ color: item ? getQualityColor(item.quality) : undefined }}>{entry.name}</b>
                        <small>
                          {plural(list.length, 'raider')}
                          {firstPicks(list) ? ` · ${firstPicks(list)} rank it first` : ''}
                        </small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        )}
      </section>

      <div className="raid-plan-bosses">
        {sources.map((source, order) => {
          const all = sortLoot(source.entries)
          const mine = all
            .filter((entry) => wants.get(entry)!.length && (!selected || wants.get(entry)!.some((want) => want.raider.key === selected)))
            .sort((a, b) => {
              const wa = wants.get(a)!
              const wb = wants.get(b)!
              const byPick = selected
                ? wa.find((want) => want.raider.key === selected)!.rank - wb.find((want) => want.raider.key === selected)!.rank
                : 0
              return byPick || wb.length - wa.length || wa[0].rank - wb[0].rank
            })
          if (selected && mine.length === 0) return null
          const rest = all.filter((entry) => wants.get(entry)!.length === 0)
          const raidersHere = new Set(mine.flatMap((entry) => wants.get(entry)!.map((want) => want.raider.key)))
          const hot = mine.filter((entry) => isContested(wants.get(entry)!)).length
          const id = source.boss?.id ?? 'trash'
          return (
            <section key={id} className="panel raid-plan-boss" aria-labelledby={`raid-plan-${id}`} data-testid={`raid-plan-${id}`}>
              <h2 id={`raid-plan-${id}`}>
                {source.boss && hasBossArt(source.boss.id) ? (
                  <span
                    className="journal-portrait"
                    style={{ backgroundImage: `url(${import.meta.env.BASE_URL}raids/bosses/${source.boss.id}.jpg)` }}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="journal-portrait" aria-hidden="true">
                    {source.boss ? (source.boss.optional ? '·' : String(source.boss.encounterOrder ?? order + 1).padStart(2, '0')) : '✦'}
                  </span>
                )}
                <span>{source.boss ? source.boss.name : 'Notable trash'}</span>
                <small>
                  {plural(mine.length, 'drop')} wanted
                  {selected ? '' : ` · ${plural(raidersHere.size, 'raider')}`}
                  {hot ? ` · ${hot} contested` : ''}
                </small>
              </h2>
              {mine.length > 0 ? (
                <ul className="raid-plan-loot">
                  {mine.map((entry) => (
                    <WantedRow key={lootKey(entry)} entry={entry} wants={wants.get(entry)!} selected={selected} bindTip={bindTip} />
                  ))}
                </ul>
              ) : (
                <p className="raid-plan-empty">Nothing here is on anyone's list in this raid.</p>
              )}
              {!selected && rest.length > 0 && (
                <details className="raid-plan-rest">
                  <summary>{plural(rest.length, 'drop')} nobody here ranks</summary>
                  <ul>
                    {rest.map((entry) => (
                      <li key={lootKey(entry)}>
                        <button type="button" aria-label={entry.name} data-loot={lootKey(entry)} {...bindTip(entry)}>
                          <LootIcon entry={entry} size={30} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )
        })}
      </div>

      <p className="raid-plan-about">
        Who wants what: each raider's spec and Wowhead's Phase 2 list for it (27 lists; Rogue's three specs and Priest's two healers share
        one). A token counts for whoever ranks a set piece it buys.
      </p>
    </div>
  )
}

function WantedRow({ entry, wants, selected, bindTip }: { entry: RaidLootEntry; wants: Want[]; selected?: string; bindTip: LootTipBinder }) {
  const item = lootItem(entry)
  const hot = isContested(wants)
  const meta = [slotName(item?.slot), item?.weaponType ?? item?.armorType, lootKindLabel(entry)].filter(Boolean).join(' · ')

  // One chip per build and rank: "Fury Warrior ×2 #3".
  const chips: { raider: Raider; rank: number; count: number; mine: boolean; title: string }[] = []
  for (const want of wants) {
    const same = chips.find((chip) => (chip.raider.buildId ?? chip.raider.label) === (want.raider.buildId ?? want.raider.label) && chip.rank === want.rank)
    if (same) {
      same.count += 1
      same.mine ||= want.raider.key === selected
      continue
    }
    const build = want.raider.buildId ? getRaidBuild(want.raider.buildId) : undefined
    chips.push({
      raider: want.raider,
      rank: want.rank,
      count: 1,
      mine: want.raider.key === selected,
      title: `${build?.label ?? want.raider.spec} ${want.raider.className}: #${want.rank} on their list${want.via ? ` (for ${want.via.name})` : ` (${slotName(want.slot)})`}`,
    })
  }

  return (
    <li className={`raid-plan-row${hot ? ' raid-plan-row-hot' : ''}`} data-loot={lootKey(entry)}>
      <button type="button" className="raid-plan-item" {...bindTip(entry)}>
        <LootIcon entry={entry} size={34} />
        <span>
          <b style={{ color: item ? getQualityColor(item.quality) : undefined }}>{entry.name}</b>
          <small>{meta}</small>
        </span>
      </button>
      <span className="raid-plan-count">
        {plural(wants.length, 'raider')}
        {firstPicks(wants) ? ` · ${firstPicks(wants)} first` : ''}
        {hot && <span className="raid-plan-hot">Contested</span>}
      </span>
      <span className="raid-plan-who">
        {chips.map((chip) => (
          <span
            key={`${chip.raider.key}-${chip.rank}`}
            className={`raid-plan-chip${chip.rank === 1 ? ' raid-plan-chip-first' : ''}${chip.mine ? ' raid-plan-chip-mine' : ''}`}
            title={`${chip.count > 1 ? `${chip.count} × ` : ''}${chip.title}`}
          >
            <RaiderIcon raider={chip.raider} size={20} />
            {chip.count > 1 ? `×${chip.count} ` : ''}#{chip.rank}
            <span className="visually-hidden">
              {' '}
              {chip.count > 1 ? `${chip.count} × ` : ''}
              {chip.title}
            </span>
          </span>
        ))}
      </span>
    </li>
  )
}
