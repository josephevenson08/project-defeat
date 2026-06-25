import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
})

test('profession changes preserve current gear and Load Recommended refreshes rankings', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Spec').selectOption('Fire')
  await page.getByRole('button', { name: /^Engineering$/ }).click()
  await page.getByRole('button', { name: /Load Recommended/i }).click()

  await expect(page.getByRole('button', { name: /Head Destruction Holo-Gogs/i })).toBeVisible()

  await page.getByRole('button', { name: /^Tailoring$/ }).click()
  await page.getByRole('button', { name: /^Engineering$/ }).click()

  await expect(page.getByRole('button', { name: /Head Destruction Holo-Gogs/i })).toBeVisible()
  await expect(page.getByText(/Destruction Holo-Gogs requires Engineering/i)).toBeVisible()
  await page.getByRole('button', { name: /Load Recommended/i }).click()
  await expect(page.getByRole('button', { name: /Head Spellstrike Hood/i })).toBeVisible()
  await page.getByRole('button', { name: /Head Spellstrike Hood/i }).click()

  const dialog = page.getByRole('dialog', { name: /Spellstrike Hood ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/Rank #\d+ for Head/i)).toBeVisible()
  await expect(dialog.getByText('Crafted by Tailoring')).toBeVisible()
  await expect(dialog.getByText(/Guide priority and documented synergy rank first/i)).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /Spellstrike Hood ranking details/i })).toBeHidden()
})

test('profession selector enforces two primary professions', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /^Leatherworking$/ }).click()
  await page.getByRole('button', { name: /^Engineering$/ }).click()
  await page.getByRole('button', { name: /^Tailoring$/ }).click()

  await expect(page.getByText(/TBC characters can plan two primary professions here/i)).toBeVisible()
  await expect(page.getByText('profession pairs', { exact: true })).toBeVisible()
})

test('new builds start with no professions selected but still show profession items in rankings', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: /^Leatherworking$/ })).not.toHaveClass(/active/)
  await expect(page.getByRole('button', { name: /^Engineering$/ })).not.toHaveClass(/active/)

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Spec').selectOption('Arcane')

  await expect(page.getByRole('button', { name: /Head Cowl of Tirisfal/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Preview Spellstrike Hood/i })).toBeVisible()
  await expect(page.getByText('Crafted by Tailoring')).toBeVisible()
  await expect(page.getByText('Requires Tailoring')).toHaveCount(0)
})

test('shared links sanitize invalid profession-gated gear', async ({ page }) => {
  await page.goto('/?faction=Alliance&race=Human&class=Mage&spec=Arcane&phase=2&professions=Tailoring&gear=32476')

  await expect(page.getByRole('button', { name: /Head Cowl of Tirisfal/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Head Gadgetstorm Goggles/i })).toHaveCount(0)
})

test('blacksmithing and leatherworking keep a melee head fallback with ranking depth', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Spec').selectOption('Fury')
  await page.getByRole('button', { name: /^Blacksmithing$/ }).click()
  await page.getByRole('button', { name: /^Leatherworking$/ }).click()

  await expect(page.getByRole('button', { name: /Head Destroyer Battle-Helm/i })).toBeVisible()
  await page.getByRole('button', { name: /Head Destroyer Battle-Helm/i }).click()

  await expect.poll(async () => page.locator('[aria-label*="for Head"]').count()).toBeGreaterThan(2)
})

test('profession weapon rankings include Dragonstrike without Blacksmithing selected', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Warrior')
  await page.getByLabel('Spec').selectOption('Fury')
  await expect(page.getByRole('button', { name: /^Blacksmithing$/ })).not.toHaveClass(/active/)
  await page.getByRole('button', { name: /Main Hand/i }).click()
  await page.keyboard.press('Escape')
  await page.getByPlaceholder('Search item, source, ID...').fill('Dragonstrike')

  await expect(page.getByRole('button', { name: /Preview Dragonstrike/i })).toBeVisible()
  await expect(page.getByText('Requires Blacksmithing')).toBeVisible()
  await page.getByRole('button', { name: /Preview Dragonstrike/i }).click()

  const dialog = page.getByRole('dialog', { name: /Dragonstrike ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/Spec-slot Profession Option #4/i)).toBeVisible()
  await expect(dialog.getByText('Requires Blacksmithing')).toBeVisible()
  await expect(dialog.getByText(/Blacksmithing: Hammersmith final upgrade/i)).toBeVisible()
  await expect(dialog.getByText(/Crafting materials/i)).toBeVisible()
  await expect(dialog.getByText(/Dragonmaw/i)).toBeVisible()
  await expect(dialog.getByText(/Nether Vortex/i)).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Open source record/i })).toHaveAttribute('href', /wowhead\.com\/tbc\/item=28439/)
  await expect(dialog.getByRole('button', { name: /Needs Blacksmithing/i })).toBeDisabled()
})

test('caster waist rankings show Tailoring BiS context without Tailoring selected', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Spec').selectOption('Arcane')
  await page.getByRole('button', { name: /Waist/i }).click()
  await page.keyboard.press('Escape')
  await page.getByPlaceholder('Search item, source, ID...').fill('Belt of Blasting')

  await expect(page.getByRole('button', { name: /Preview Belt of Blasting/i })).toBeVisible()
  await expect(page.getByText('Crafted by Tailoring')).toBeVisible()
  await expect(page.getByText('Requires Tailoring')).toHaveCount(0)
  await page.getByRole('button', { name: /Preview Belt of Blasting/i }).click()

  const dialog = page.getByRole('dialog', { name: /Belt of Blasting ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.source-badge', { hasText: 'Both' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Icy Veins Near-BiS/i })).toBeVisible()
  await expect(dialog.getByText('Crafted by Tailoring')).toBeVisible()
  await expect(dialog.getByRole('button', { name: /Equip to Waist/i })).toBeEnabled()
})

test('rogue crafted gear distinguishes required Leatherworking from BoE crafted items', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Rogue')
  await page.getByLabel('Spec').selectOption('Combat')
  await page.getByRole('button', { name: /Waist/i }).click()
  await page.keyboard.press('Escape')
  await page.getByPlaceholder('Search item, source, ID...').fill('Primalstrike Belt')

  await expect(page.getByRole('button', { name: /Preview Primalstrike Belt/i })).toBeVisible()
  await expect(page.getByText('Requires Leatherworking')).toBeVisible()

  await page.getByPlaceholder('Search item, source, ID...').fill('Fel Leather Boots')
  await page.getByRole('button', { name: /Feet/i }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Preview Fel Leather Boots/i })).toBeVisible()
  await expect(page.getByText('Crafted by Leatherworking')).toBeVisible()
  await expect(page.getByText('Requires Leatherworking')).toHaveCount(0)
})

test('guide-backed items expose provider, confidence, and source agreement labels', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Mage')
  await page.getByLabel('Spec').selectOption('Arcane')
  await page.getByRole('button', { name: /Head Cowl of Tirisfal/i }).click()

  const dialog = page.getByRole('dialog', { name: /Cowl of Tirisfal ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.source-badge', { hasText: 'Wowhead' })).toBeVisible()
  await expect(dialog.getByText('Guide-backed')).toBeVisible()
  await expect(dialog.getByText('Wowhead only')).toBeVisible()
  await expect(dialog.locator('.guide-priority-badge', { hasText: 'Guide priority' })).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Open source record/i })).toHaveAttribute('href', /wowhead\.com\/tbc\/item=30206/)
})

test('hybrid class ranged slots use relic fallbacks instead of physical ranged weapons', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Class').selectOption('Paladin')
  await page.getByLabel('Spec').selectOption('Protection')
  await expect(page.getByRole('button', { name: /Ranged Libram/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Arcanite Steam-Pistol/i })).toHaveCount(0)

  await page.getByLabel('Class').selectOption('Druid')
  await page.getByLabel('Spec').selectOption('Feral Bear')
  await expect(page.getByRole('button', { name: /Ranged Idol/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Arcanite Steam-Pistol/i })).toHaveCount(0)

  await page.getByLabel('Class').selectOption('Shaman')
  await page.getByLabel('Spec').selectOption('Enhancement')
  await expect(page.getByRole('button', { name: /Ranged Totem/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Arcanite Steam-Pistol/i })).toHaveCount(0)
})

test('retribution paladin uses a ret libram and does not borrow melee off-hands', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Blood%20Elf&class=Paladin&spec=Retribution&phase=2')

  await expect(page.getByRole('heading', { name: /Blood Elf Retribution Paladin/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Shoulder Shoulderpads of the Stranger/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Libram of Avengement/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Arcanite Steam-Pistol/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Off Hand Talon of Azshara/i })).toHaveCount(0)

  await page.getByRole('button', { name: /Ranged Libram of Avengement/i }).click()
  const dialog = page.getByRole('dialog', { name: /Libram of Avengement ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.synergy-badge', { hasText: 'Synergy-ranked' })).toBeVisible()
  await expect(dialog.getByText(/Retribution libram priority/i)).toBeVisible()
  await expect(dialog.getByRole('link', { name: /Wowhead BiS/i })).toBeVisible()
})

test('beast mastery hunter phase 2 has guide-backed armor and weapon slot coverage', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Troll&class=Hunter&spec=Beast%20Mastery&phase=2')

  await expect(page.getByRole('heading', { name: /Troll Beast Mastery Hunter/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Head Rift Stalker Helm/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Chest Rift Stalker Hauberk/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Hands Rift Stalker Gauntlets/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Main Hand Talon of the Phoenix/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Off Hand Claw of the Phoenix/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Serpent Spine Longbow/i })).toBeVisible()

  await page.getByRole('button', { name: /Head Rift Stalker Helm/i }).click()
  const dialog = page.getByRole('dialog', { name: /Rift Stalker Helm ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.synergy-badge', { hasText: 'Synergy-ranked' })).toBeVisible()
  await expect(dialog.getByText(/Rift Stalker 4-piece transition/i)).toBeVisible()
})

test('troll horde enhancement shaman phase 2 shows True-Aim and Cataclysm guide-backed rankings', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Troll&class=Shaman&spec=Enhancement&phase=2')

  await expect(page.getByRole('heading', { name: /Troll Enhancement Shaman/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ranged Totem of the Astral Winds/i })).toBeVisible()

  await page.getByRole('button', { name: /^Wrist/i }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Preview True-Aim Stalker Bands/i })).toBeVisible()
  await page.getByRole('button', { name: /Preview True-Aim Stalker Bands/i }).click()

  const wristDialog = page.getByRole('dialog', { name: /True-Aim Stalker Bands ranking details/i })
  await expect(wristDialog).toBeVisible()
  await expect(wristDialog.getByText(/Rank #\d+ for Wrist/i)).toBeVisible()
  await expect(wristDialog.getByText(/Spec-slot BiS #1/i)).toBeVisible()
  await expect(wristDialog.locator('.source-badge', { hasText: 'Wowhead + wowtbc.gg' })).toBeVisible()
  await expect(wristDialog.locator('.synergy-badge', { hasText: 'Synergy-ranked' })).toBeVisible()
  await expect(wristDialog.getByText(/Favored Enhancement bracer/i)).toBeVisible()
  await expect(wristDialog.getByRole('link', { name: /wowtbc\.gg BiS/i })).toBeVisible()

  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: /^Head/i }).click()
  await page.keyboard.press('Escape')
  await page.getByPlaceholder('Search item, source, ID...').fill('Cataclysm Helm')
  await expect(page.getByRole('button', { name: /Preview Cataclysm Helm/i })).toBeVisible()
  await page.getByRole('button', { name: /Preview Cataclysm Helm/i }).click()

  const helmDialog = page.getByRole('dialog', { name: /Cataclysm Helm ranking details/i })
  await expect(helmDialog).toBeVisible()
  await expect(helmDialog.getByText(/Tier 5: Helm of the Vanquished Champion/i)).toBeVisible()
  await expect(helmDialog.getByText(/Spec-slot BiS #1/i)).toBeVisible()
  await expect(helmDialog.locator('.source-badge', { hasText: 'Wowhead + wowtbc.gg' })).toBeVisible()
  await expect(helmDialog.locator('.synergy-badge', { hasText: 'Synergy-ranked' })).toBeVisible()
  await expect(helmDialog.getByText(/Cataclysm 4-piece chase/i)).toBeVisible()
  await expect(helmDialog.getByText(/haste: 100/i)).toHaveCount(0)
  await expect(helmDialog.getByRole('link', { name: /Wowhead BiS/i })).toBeVisible()
})

test('orc enhancement shaman does not receive non-orc Talon and Rod synergy boost', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Orc&class=Shaman&spec=Enhancement&phase=2')

  await expect(page.getByRole('heading', { name: /Orc Enhancement Shaman/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Main Hand Merciless Gladiator's Cleaver/i })).toBeVisible()
  await page.getByRole('button', { name: /Main Hand/i }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: /Preview Merciless Gladiator's Cleaver/i })).toBeVisible()
  await page.getByPlaceholder('Search item, source, ID...').fill('Talon of the Phoenix')
  await expect(page.getByRole('button', { name: /Preview Talon of the Phoenix/i })).toBeVisible()
  await page.getByRole('button', { name: /Preview Talon of the Phoenix/i }).click()

  const dialog = page.getByRole('dialog', { name: /Talon of the Phoenix ranking details/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.synergy-badge', { hasText: 'Synergy-ranked' })).toHaveCount(0)
  await expect(dialog.getByText(/Orc weapon racial paths need a separate axe-focused ranking import/i)).toBeVisible()
})

test('troll enhancement shaman phase 2 includes tier, True-Aim, weapons, and totem coverage', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Troll&class=Shaman&spec=Enhancement&phase=2')

  await expect(page.getByRole('button', { name: /Head Cataclysm Helm/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Chest Cataclysm Chestplate/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Wrist True-Aim Stalker Bands/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Hands Cataclysm Gauntlets/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Legs Cataclysm Legplates/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Main Hand Talon of the Phoenix/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Main Hand Twinblade of the Phoenix/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Ranged Totem of the Astral Winds/i })).toBeVisible()

  await page.getByRole('button', { name: /Wrist/i }).click()
  await page.keyboard.press('Escape')
  await page.getByPlaceholder('Search item, source, ID...').fill('True-Aim')
  await expect(page.getByRole('button', { name: /Preview True-Aim Stalker Bands/i })).toBeVisible()
  await page.getByRole('button', { name: /Preview True-Aim Stalker Bands/i }).click()

  const wristDialog = page.getByRole('dialog', { name: /True-Aim Stalker Bands ranking details/i })
  await expect(wristDialog).toBeVisible()
  await expect(wristDialog.getByText(/Item Ranking/i)).toBeVisible()
  await expect(wristDialog.getByText(/Leotheras the Blind, Serpentshrine Cavern/i)).toBeVisible()
  await expect(wristDialog.locator('.agreement-badge', { hasText: 'Wowhead + wowtbc.gg' })).toBeVisible()
  await expect(wristDialog.getByRole('link', { name: /Open source record/i })).toHaveAttribute('href', /wowhead\.com\/tbc\/item=30091/)
  await expect(wristDialog.getByText(/favored Phase 2 Enhancement bracers/i)).toBeVisible()

  await page.keyboard.press('Escape')
  await page.getByPlaceholder('Search item, source, ID...').fill('')
  await page.getByRole('button', { name: /Main Hand/i }).click()
  await expect(page.getByRole('button', { name: /Preview Talon of the Phoenix/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Preview Netherbane/i })).toBeVisible()

  await page.getByRole('button', { name: /Close item details/i }).click()
  await page.getByRole('button', { name: /Off Hand/i }).click()
  await expect(page.getByRole('button', { name: /Preview Rod of the Sun King/i })).toBeVisible()
})

test('phase 2 enhancement plan shows profession-locked ring enchants and physical gem tiers', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Troll&class=Shaman&spec=Enhancement&phase=2')

  await expect(page.getByRole('heading', { name: /Enhancement Plan/i })).toBeVisible()
  await expect(page.getByText(/Hit to cap > Expertise/i)).toBeVisible()
  const ringStriking = page.locator('.enhancement-card').filter({ hasText: 'Enchant Ring - Striking' })
  await expect(ringStriking).toBeVisible()
  await expect(ringStriking.getByText('Requires Enchanting')).toBeVisible()
  await expect(ringStriking.getByText(/2x Large Prismatic Shard/i)).toBeVisible()
  await expect(ringStriking.getByText(/Disenchant rare Outland gear/i)).toBeVisible()
  await expect(ringStriking.getByRole('link', { name: /Open source for Large Prismatic Shard/i })).toHaveAttribute('href', /item=22449/)

  await page.getByRole('button', { name: /^Enchanting$/ }).click()
  await expect(page.getByText('Enchanting active')).toBeVisible()

  await page.getByRole('tab', { name: /Gems/i }).click()
  await expect(page.getByText('Relentless Earthstorm Diamond')).toBeVisible()
  await expect(page.getByText(/Requires at least 2 Red, 2 Yellow, and 2 Blue gems/i)).toBeVisible()
  const metaGroup = page.locator('.enhancement-group').filter({
    has: page.locator('.enhancement-group-title span', { hasText: /^Meta$/ }),
  })
  await expect(metaGroup.locator('.enhancement-card').first()).toContainText('Relentless Earthstorm Diamond')
  const boldRuby = page.locator('.enhancement-card').filter({ hasText: 'Bold Living Ruby' })
  await expect(boldRuby).toBeVisible()
  await expect(boldRuby.getByText('1x Living Ruby')).toBeVisible()
  await expect(boldRuby.getByText(/Prospected from high-level Outland ore/i)).toBeVisible()
})

test('caster enhancement plan exposes school-specific weapon enchants and acquisition details', async ({ page }) => {
  await page.goto('/?faction=Alliance&race=Human&class=Mage&spec=Fire&phase=2')

  await expect(page.getByText(/Spell Hit to cap > Spell Damage/i)).toBeVisible()
  await expect(page.getByText('Enchant Weapon - Sunfire')).toBeVisible()
  const sunfire = page.locator('.enhancement-card').filter({ hasText: 'Enchant Weapon - Sunfire' })
  await expect(sunfire.getByText(/Shade of Aran/i)).toBeVisible()
  await expect(sunfire.getByText(/12x Void Crystal/i)).toBeVisible()
  await expect(page.getByText('Enchant Weapon - Major Spellpower')).toBeVisible()
  await expect(page.getByText('Enchant Gloves - Spell Strike')).toBeVisible()
  await expect(page.getByText('Enchant Bracer - Major Intellect')).toBeVisible()

  await page.getByRole('tab', { name: /Gems/i }).click()
  const chaotic = page.locator('.enhancement-card').filter({
    has: page.locator('strong', { hasText: /^Chaotic Skyfire Diamond$/ }),
  })
  await expect(chaotic).toBeVisible()
  await expect(chaotic.getByText(/Coilskar Sirens/i)).toBeVisible()
  const veiled = page.locator('.enhancement-card').filter({
    has: page.locator('strong', { hasText: /^Veiled Noble Topaz$/ }),
  })
  await expect(veiled).toBeVisible()
  await expect(veiled.getByText(/rare Outland drops/i)).toBeVisible()
  await expect(veiled.getByText(/Prospected from high-level Outland ore/i)).toBeVisible()
  await expect(veiled.getByRole('link', { name: /Open source for Veiled Noble Topaz/i })).toHaveAttribute('href', /item=31867/)
  await expect(page.getByText('Brilliant Dawnstone')).toBeVisible()
  await expect(page.getByText('Mystical Skyfire Diamond')).toBeVisible()
})

test('character pane centers gear and imports known item ids for sim staging', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Troll&class=Shaman&spec=Enhancement&phase=2')

  await expect(page.getByLabel(/Troll Enhancement Shaman character pane/i)).toBeVisible()
  await expect(page.getByText(/Phase 2 BiS view/i)).toBeVisible()
  await expect(page.getByText(/Cataclysm pieces gain real value as a 4-piece package/i)).toBeVisible()

  await page.getByLabel(/Import gear from addon/i).fill('Owned item ids: 30091 30189')
  await page.getByRole('button', { name: /Import Known Items/i }).click()

  await expect(page.getByText(/Staged \d+ equippable items from \d+ known matches/i)).toBeVisible()
  await expect(page.getByLabel(/Staged import review/i)).toContainText('True-Aim Stalker Bands')
  await page.getByRole('button', { name: /Apply Staged/i }).click()
  await expect(page.getByText(/Applied \d+ staged items to the character pane/i)).toBeVisible()
  await expect(page.getByText(/guide-backed pieces equipped/i)).toBeVisible()
})

test('import staging does not mark owned or equip blocked gear before apply', async ({ page }) => {
  await page.goto('/?faction=Horde&race=Troll&class=Shaman&spec=Enhancement&phase=2')

  await expect(page.getByRole('button', { name: /Owned gear only \(0\)/i })).toBeVisible()
  await page.getByLabel(/Import gear from addon/i).fill('28439 28439 999999')
  await page.getByRole('button', { name: /Import Known Items/i }).click()

  await expect(page.getByLabel(/Staged import review/i)).toContainText('Dragonstrike')
  await expect(page.getByLabel(/Staged import review/i)).toContainText('Duplicate ID')
  await expect(page.getByLabel(/Staged import review/i)).toContainText('Unknown item 999999')
  await expect(page.getByRole('button', { name: /Owned gear only \(0\)/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Apply Staged/i })).toBeDisabled()
})

const phase2Profiles = [
  ['Horde', 'Tauren', 'Druid', 'Balance', 'Idol'],
  ['Horde', 'Tauren', 'Druid', 'Feral Bear', 'Idol'],
  ['Horde', 'Tauren', 'Druid', 'Feral Cat', 'Idol'],
  ['Horde', 'Tauren', 'Druid', 'Restoration', 'Idol'],
  ['Horde', 'Troll', 'Hunter', 'Beast Mastery', 'Serpent Spine'],
  ['Horde', 'Troll', 'Hunter', 'Marksmanship', 'Serpent Spine'],
  ['Horde', 'Troll', 'Hunter', 'Survival', 'Serpent Spine'],
  ['Alliance', 'Human', 'Mage', 'Arcane', 'Wand'],
  ['Alliance', 'Human', 'Mage', 'Fire', 'Wand'],
  ['Alliance', 'Human', 'Mage', 'Frost', 'Wand'],
  ['Horde', 'Blood Elf', 'Paladin', 'Holy', 'Libram'],
  ['Horde', 'Blood Elf', 'Paladin', 'Protection', 'Libram'],
  ['Horde', 'Blood Elf', 'Paladin', 'Retribution', 'Libram'],
  ['Alliance', 'Human', 'Priest', 'Discipline', 'Rod'],
  ['Alliance', 'Human', 'Priest', 'Holy', 'Rod'],
  ['Alliance', 'Human', 'Priest', 'Shadow', 'Wand'],
  ['Alliance', 'Human', 'Rogue', 'Assassination', 'Steam-Pistol'],
  ['Alliance', 'Human', 'Rogue', 'Combat', 'Steam-Pistol'],
  ['Alliance', 'Human', 'Rogue', 'Subtlety', 'Steam-Pistol'],
  ['Horde', 'Troll', 'Shaman', 'Elemental', 'Totem'],
  ['Horde', 'Troll', 'Shaman', 'Enhancement', 'Totem'],
  ['Horde', 'Troll', 'Shaman', 'Restoration', 'Totem'],
  ['Horde', 'Orc', 'Warlock', 'Affliction', 'Wand'],
  ['Horde', 'Orc', 'Warlock', 'Demonology', 'Wand'],
  ['Horde', 'Orc', 'Warlock', 'Destruction', 'Wand'],
  ['Alliance', 'Human', 'Warrior', 'Arms', 'Longbow|Insurance|Steam-Pistol'],
  ['Alliance', 'Human', 'Warrior', 'Fury', 'Insurance|Longbow|Steam-Pistol'],
  ['Alliance', 'Human', 'Warrior', 'Protection', 'Khorium Destroyer|Shuriken|Steam-Pistol'],
] as const

test('all 28 Phase 2 spec profiles expose guide coverage and legal gear structure', async ({ page }) => {
  for (const [faction, race, playerClass, spec, rangedPattern] of phase2Profiles) {
    const params = new URLSearchParams({ faction, race, class: playerClass, spec, phase: '2' })
    await page.goto(`/?${params.toString()}`)

    await expect(page.getByRole('heading', { name: new RegExp(`${race} ${spec} ${playerClass}`, 'i') })).toBeVisible()
    await expect(page.getByText('Phase 2 guide profile')).toBeVisible()
    await expect(page.getByRole('link', { name: /Open guide/i })).toHaveAttribute('href', /wowhead\.com\/tbc\/guide\/classes/)
    await expect(page.getByRole('button', { name: /^Blacksmithing$/ })).not.toHaveClass(/active/)
    await expect(page.locator('.gear-slot')).toHaveCount(17)
    await expect.poll(async () => page.locator('.gear-slot strong', { hasText: 'Empty' }).count()).toBeLessThanOrEqual(1)

    const rangedSlot = page.locator('.gear-slot').filter({ has: page.locator('.slot-label', { hasText: /^Ranged$/ }) })
    await expect(rangedSlot).toContainText(new RegExp(rangedPattern, 'i'))
  }
})
