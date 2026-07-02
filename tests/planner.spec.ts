import { expect, test } from '@playwright/test'
import {
  armsWarriorPhase2Bis,
  elementalShamanPhase2Bis,
  enhancementShamanPhase2Bis,
  furyWarriorPhase2Bis,
  protectionWarriorPhase2Bis,
  restorationShamanPhase2Bis,
} from '../src/domain/bis'
import { factions } from '../src/domain/character/races'
import { racesByClass, getClassesForRace, getRacesForClassAndFaction } from '../src/domain/character/races'
import { tbcClasses } from '../src/domain/character/tbcClasses'
import { gearSlots } from '../src/domain/gear/gearSlots'
import { getItemById, getItemsForSlot } from '../src/domain/gear/sampleItems'
import { isItemCompatibleWithGearSlot } from '../src/domain/gear/slotCompatibility'

function readStatValue(text: string) {
  const match = text.match(/-?\d+/)
  return match ? Number(match[0]) : 0
}

test('user can run a basic local physical DPS simulation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /project defeat/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /character/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gear', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /stats/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /simulation/i })).toBeVisible()

  await expect(page.getByLabel('Class')).toHaveValue('Warrior')
  await expect(page.getByLabel('Specialization')).toHaveValue('Fury')
  await expect(page.getByText('Physical DPS', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('training-sword')

  // Regression check: Warriors have no Relic slot, and the default gear should not silently
  // inherit phantom spell/healing power from an illegally-equipped Totem/Libram/Idol.
  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  expect(readStatValue(await page.getByTestId('stat-spell-power').innerText())).toBe(0)
  expect(readStatValue(await page.getByTestId('stat-healing-power').innerText())).toBe(0)

  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
  await expect(page.getByText('Attack power', { exact: true })).toBeVisible()
})

test('class, faction, race, gems, and caster simulation flow work', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByLabel('Race')).toHaveValue('Orc')
  await page.getByLabel('Race').selectOption('Blood Elf')
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByLabel('Specialization')).toHaveValue('Arcane')
  await page.getByLabel('Specialization').selectOption('Fire')

  await expect(page.getByText(/Blood Elf Fire Mage/i)).toBeVisible()
  await expect(page.getByText('Caster DPS', { exact: true })).toBeVisible()

  await page.getByLabel('Chest', { exact: true }).selectOption('Spellfire Training Robe')
  await page.getByLabel('Main Hand', { exact: true }).selectOption('Apprentice Focus Staff')
  await page.getByLabel('Head Red socket').selectOption('Runed Living Ruby')
  await page.getByLabel('Head enchant').selectOption('Glyph of Power')

  await expect(page.getByTestId('stat-spell-power')).toBeVisible()
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/Estimated DPS/i)).toBeVisible()
  await expect(page.getByText(/Prototype caster formula/i)).toBeVisible()
  await expect(page.getByText('Spell power', { exact: true })).toBeVisible()
})

test('healer and tank roles produce role-specific results', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Priest')
  await expect(page.getByLabel('Specialization')).toHaveValue('Discipline')
  await page.getByLabel('Specialization').selectOption('Holy')
  await expect(page.getByText('Healer', { exact: true })).toBeVisible()
  await page.getByLabel('Hands', { exact: true }).selectOption("Healer's Grace Gloves")
  await page.getByLabel('Hands enchant').selectOption('Enchant Gloves - Major Healing')
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/Estimated Healing/i)).toBeVisible()
  await expect(page.getByText(/Prototype healer formula/i)).toBeVisible()

  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Specialization').selectOption('Protection')
  await expect(page.getByText('Tank', { exact: true })).toBeVisible()
  await page.getByLabel('Chest', { exact: true }).selectOption('Bulwark Chestguard')
  await page.getByLabel('Off Hand', { exact: true }).selectOption('Shield of Rehearsal')
  await page.getByRole('button', { name: /run simulation/i }).click()

  await expect(page.getByText(/Survivability Score/i)).toBeVisible()
  await expect(page.getByText(/Prototype tank formula/i)).toBeVisible()
})

test('expanded gear foundation has multiple options for every slot', async ({ page }) => {
  await page.goto('/')

  // Default character is Warrior/Fury, which has no Relic slot in TBC (only Shaman/Paladin/Druid do),
  // so that slot is intentionally not rendered here even though the underlying catalog has Relic items.
  const visibleSlotsForDefaultCharacter = gearSlots.filter((slot) => slot !== 'Relic')

  for (const slot of gearSlots) {
    const itemOptions = getItemsForSlot(slot)
    expect(itemOptions.length, `${slot} should have multiple data options`).toBeGreaterThan(1)
  }

  for (const slot of visibleSlotsForDefaultCharacter) {
    await expect(page.getByLabel(slot, { exact: true }).locator('option')).not.toHaveCount(0)
  }
})

test('Enhancement Shaman Phase 2 starter ranking resolves to catalog items', async () => {
  const rankedSlots = new Set(enhancementShamanPhase2Bis.entries.map((entry) => entry.slot))

  for (const slot of gearSlots) {
    expect(rankedSlots.has(slot), `missing Enhancement Shaman ranking for ${slot}`).toBe(true)
  }

  for (const entry of enhancementShamanPhase2Bis.entries) {
    const item = getItemById(entry.itemId)
    expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
    expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
    if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
  }

  expect(getItemById('cataclysm-helm')?.notes).toMatch(/set-bonus/i)
  expect(getItemById('true-aim-stalker-bands')?.slot).toBe('Wrists')
  expect(getItemById('dragonstrike')?.craftedBy).toBe('Blacksmithing')
  expect(getItemById('totem-of-the-astral-winds')?.allowedClasses).toContain('Shaman')
})

test('Enhancement Shaman can pick expanded Phase 2 options and still simulate', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())

  await page.getByLabel('Head', { exact: true }).selectOption({ label: 'Cataclysm Headguard' })
  await page.getByLabel('Wrists', { exact: true }).selectOption({ label: 'True-Aim Stalker Bands' })
  await page.getByLabel('Main Hand', { exact: true }).selectOption({ label: 'Talon of the Phoenix' })
  await page.getByLabel('Off Hand', { exact: true }).selectOption({ label: 'Rod of the Sun King' })
  await page.getByLabel('Totem', { exact: true }).selectOption({ label: 'Totem of the Astral Winds' })

  await expect(page.getByLabel('Main Hand', { exact: true })).toHaveValue('talon-of-the-phoenix')
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Dragonstrike' })).toHaveCount(1)

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Enhancement Shaman filters gear, relics, enchants, and source details by spec', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Shield of Rehearsal' })).toHaveCount(0)

  await expect(page.getByLabel('Main Hand enchant')).toContainText('Enchant Weapon - Mongoose')
  await expect(page.getByLabel('Off Hand enchant')).toContainText('Enchant Weapon - Mongoose')
  await expect(page.getByLabel('Off Hand enchant')).not.toContainText('Enchant Shield - Defense')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByText('No Ranged Weapon Recommended')).toHaveCount(0)

  await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Totem of the Astral Winds' })).toHaveCount(1)
  await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Idol of Testing' })).toHaveCount(0)
  await expect(page.getByLabel('Totem', { exact: true }).locator('option', { hasText: 'Libram of Testing' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ranged', exact: true })).toHaveCount(0)

  await expect(page.getByText('Serpentshrine Cavern · Leotheras the Blind · Phase 2')).toBeVisible()
  await expect(page.getByText(/Needs source\/rank verification/i).first()).toBeVisible()

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('BiS panel shows Enhancement Shaman rankings and equips a listed item', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /BiS \/ Ranked Gear/i })).toBeVisible()

  // Fury Warrior (the default character) now has a real BiS list, so check the empty state
  // against a spec that hasn't been audited yet instead.
  await page.getByLabel('Class').selectOption('Mage')
  await expect(page.getByTestId('bis-empty-state')).toContainText(/No ranked list yet for Arcane Mage/i)

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  await expect(page.getByTestId('bis-panel')).toBeVisible()
  await expect(page.getByText('Enhancement Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Head', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cataclysm Headguard' })).toBeVisible()
  await expect(page.getByText(/Item ID 30190/i)).toBeVisible()

  const before = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  await page.getByRole('button', { name: /Equip Cataclysm Headguard/i }).click()

  await expect(page.getByLabel('Head', { exact: true })).toHaveValue('cataclysm-helm')
  await expect(page.getByRole('button', { name: /Equipped/i }).first()).toBeDisabled()

  const after = readStatValue(await page.getByTestId('stat-attack-power').innerText())
  expect(after).toBeGreaterThan(before)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('BiS panel can equip paired trinket targets without duplicating unique items', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')

  const dragonspineRow = page.locator('.bis-entry', { hasText: 'Dragonspine Trophy' })
  const bloodlustRow = page.locator('.bis-entry', { hasText: 'Bloodlust Brooch' })

  await dragonspineRow.getByRole('button', { name: 'Equip Trinket 1' }).click()
  await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  await expect(dragonspineRow.getByRole('button', { name: 'Unique equipped' })).toBeDisabled()

  await bloodlustRow.getByRole('button', { name: 'Equip Trinket 2' }).click()
  await expect(page.getByLabel('Trinket 2', { exact: true })).toHaveValue('bloodlust-brooch')

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('paired ring and trinket slots share compatible options and block duplicate unique items', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByLabel('Trinket 1', { exact: true }).locator('option', { hasText: 'Dragonspine Trophy' })).toHaveCount(1)
  await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option', { hasText: 'Dragonspine Trophy' })).toHaveCount(1)
  await expect(page.getByLabel('Trinket 1', { exact: true }).locator('option', { hasText: 'Bloodlust Brooch' })).toHaveCount(1)
  await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option', { hasText: 'Bloodlust Brooch' })).toHaveCount(1)

  await page.getByLabel('Trinket 1', { exact: true }).selectOption('dragonspine-trophy')
  await expect(page.getByLabel('Trinket 2', { exact: true }).locator('option[value="dragonspine-trophy"]')).toHaveAttribute('disabled', '')
  await page.getByLabel('Trinket 2', { exact: true }).selectOption('bloodlust-brooch')

  await expect(page.getByLabel('Trinket 1', { exact: true })).toHaveValue('dragonspine-trophy')
  await expect(page.getByLabel('Trinket 2', { exact: true })).toHaveValue('bloodlust-brooch')

  await expect(page.getByLabel('Finger 1', { exact: true }).locator('option', { hasText: 'Ring of a Thousand Marks' })).toHaveCount(1)
  await expect(page.getByLabel('Finger 2', { exact: true }).locator('option', { hasText: 'Ring of a Thousand Marks' })).toHaveCount(1)

  await page.getByLabel('Finger 1', { exact: true }).selectOption('ring-of-a-thousand-marks')
  await expect(page.getByLabel('Finger 2', { exact: true }).locator('option[value="ring-of-a-thousand-marks"]')).toHaveAttribute('disabled', '')
  await page.getByLabel('Finger 2', { exact: true }).selectOption('garonas-signet-ring')

  await expect(page.getByLabel('Finger 1', { exact: true })).toHaveValue('ring-of-a-thousand-marks')
  await expect(page.getByLabel('Finger 2', { exact: true })).toHaveValue('garonas-signet-ring')

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('every class has a legal race in both factions, and every race maps back to its classes', async () => {
  for (const { className } of tbcClasses) {
    for (const faction of factions) {
      expect(getRacesForClassAndFaction(className, faction).length, `${className} should have a legal race in ${faction}`).toBeGreaterThan(0)
    }
  }

  for (const [className, races] of Object.entries(racesByClass)) {
    for (const race of races) {
      expect(getClassesForRace(race), `${race} should list ${className} as playable`).toContain(className)
    }
  }
})

test('Arms, Fury, and Protection Warrior Phase 2 starter rankings resolve to catalog items', async () => {
  for (const bisList of [armsWarriorPhase2Bis, furyWarriorPhase2Bis, protectionWarriorPhase2Bis]) {
    // Warriors have no Relic slot in TBC, so only the other 17 slots are expected to be ranked.
    const expectedSlots = gearSlots.filter((slot) => slot !== 'Relic')
    const rankedSlots = new Set(bisList.entries.map((entry) => entry.slot))

    for (const slot of expectedSlots) {
      expect(rankedSlots.has(slot), `missing ${bisList.spec} Warrior ranking for ${slot}`).toBe(true)
    }

    for (const entry of bisList.entries) {
      const item = getItemById(entry.itemId)
      expect(item, `${entry.itemId} should exist in sampleItems`).toBeTruthy()
      expect(item && isItemCompatibleWithGearSlot(item, entry.slot), `${entry.itemId} should fit ${entry.slot}`).toBe(true)
      if (entry.wowItemId) expect(item?.wowItemId).toBe(entry.wowItemId)
    }
  }
})

test('race/class selection enforces real TBC legality in the UI', async ({ page }) => {
  await page.goto('/')

  // Default is Alliance/Human; Human cannot be a Shaman, so Shaman should not be a selectable class yet.
  await expect(page.getByLabel('Class').locator('option', { hasText: 'Shaman' })).toHaveCount(0)

  await page.getByLabel('Race').selectOption('Draenei')
  await expect(page.getByLabel('Class').locator('option', { hasText: 'Shaman' })).toHaveCount(1)

  await page.getByLabel('Class').selectOption('Shaman')
  await expect(page.getByLabel('Specialization')).toHaveValue('Elemental')

  // Switching faction should keep the class legal by picking a valid race for it (Draenei -> Horde has no Draenei,
  // so it should land on a Horde race that can still be a Shaman: Orc, Tauren, or Troll).
  await page.getByLabel('Faction').selectOption('Horde')
  await expect(page.getByLabel('Race')).toHaveValue(/Orc|Tauren|Troll/)
  await expect(page.getByLabel('Class')).toHaveValue('Shaman')
  await expect(page.getByText('Caster DPS', { exact: true })).toBeVisible()
})

test('crafted items show recipe source, required skill, and material farm locations', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Chest', { exact: true }).selectOption({ label: 'Spellfire Training Robe' })

  const craftingDetails = page.getByLabel('Chest crafting details')
  await expect(craftingDetails).toContainText('Tailoring')
  await expect(craftingDetails).toContainText('350 skill')
  await expect(craftingDetails).toContainText('Spellfire Tailoring')
  await expect(craftingDetails).toContainText('Gidge Spellweave')
  await expect(craftingDetails).toContainText('4x Spellcloth')
  await expect(craftingDetails).toContainText('Primal Mana')
})

test('item quality renders with the standard WoW rarity color', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Enhancement')
  await page.getByLabel('Head', { exact: true }).selectOption({ label: 'Cataclysm Headguard' })

  const qualityLabel = page.locator('.gear-row', { has: page.getByLabel('Head', { exact: true }) }).locator('small strong')
  await expect(qualityLabel).toHaveText('Epic')
  await expect(qualityLabel).toHaveCSS('color', 'rgb(163, 53, 238)')
})

test('character role sets a distinct accent color across Character, Stats, and Simulator panels', async ({ page }) => {
  await page.goto('/')

  // Default Warrior/Fury is Physical DPS -> amber accent.
  await expect(page.getByRole('region', { name: 'Character' }).locator('.summary-card strong')).toHaveCSS('color', 'rgb(245, 158, 11)')

  await page.getByLabel('Class').selectOption('Priest')
  await page.getByLabel('Specialization').selectOption('Holy')

  // Holy Priest is a Healer -> teal accent, and it should carry through to the Stats and Simulator panels too.
  await expect(page.getByRole('region', { name: 'Character' }).locator('.summary-card strong')).toHaveCSS('color', 'rgb(45, 212, 191)')
  await expect(page.getByRole('region', { name: 'Stats' })).toHaveCSS('border-top-color', 'rgb(45, 212, 191)')
  await expect(page.getByRole('region', { name: 'Simulation' })).toHaveCSS('border-top-color', 'rgb(45, 212, 191)')
})

test('Elemental and Restoration Shaman get Totem/Ranged spec-aware slot treatment and their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Faction').selectOption('Horde')
  await page.getByLabel('Race').selectOption('Troll')
  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Specialization').selectOption('Elemental')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByText('Elemental Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'The Nexus-Key' })).toHaveCount(1)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated dps/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)

  await page.getByLabel('Specialization').selectOption('Restoration')

  await expect(page.getByLabel('Ranged', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Totem', exact: true })).toBeVisible()
  await expect(page.getByText('Restoration Shaman Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aegis of the Vindicator' })).toHaveCount(1)
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Rod of the Sun King' })).toHaveCount(0)

  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/estimated healing/i)).toBeVisible()
  await expect(page.getByTestId('simulation-score')).toContainText(/\d/)
})

test('Warrior specs hide the Relic slot and each get their own BiS list', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Specialization').selectOption('Arms')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Arms Warrior Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Main Hand', { exact: true }).locator('option', { hasText: 'Twinblade of the Phoenix' })).toHaveCount(1)

  await page.getByLabel('Specialization').selectOption('Protection')

  await expect(page.getByLabel('Relic', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Protection Warrior Phase 2 Starter Ranked List')).toBeVisible()
  await expect(page.getByLabel('Off Hand', { exact: true }).locator('option', { hasText: 'Aldori Legacy Defender' })).toHaveCount(1)

  await page.getByLabel('Chest', { exact: true }).selectOption({ label: 'Destroyer Chestguard' })
  await page.getByRole('button', { name: /run simulation/i }).click()
  await expect(page.getByText(/Survivability Score/i)).toBeVisible()
})
