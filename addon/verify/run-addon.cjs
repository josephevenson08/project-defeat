/*
 * Runs ProjectDefeatExport.lua in a real Lua 5.1 VM with the WoW API stubbed,
 * so the export logic can be checked without the game.
 *
 * The stubs return the Phase 2 Fury Warrior from IN-GAME-IMPORT-SCOPE.md, so the
 * output can be compared against the format that document specifies.
 */
const { lua, lauxlib, lualib, to_luastring, to_jsstring } = require('fengari')
const fs = require('node:fs')
const path = require('node:path')

const ADDON = path.resolve(__dirname, '../ProjectDefeatExport/ProjectDefeatExport.lua')

const L = lauxlib.luaL_newstate()
lualib.luaL_openlibs(L)

const push = (value) => {
  if (value === null || value === undefined) lua.lua_pushnil(L)
  else if (typeof value === 'number') lua.lua_pushnumber(L, value)
  else if (typeof value === 'boolean') lua.lua_pushboolean(L, value)
  else lua.lua_pushstring(L, to_luastring(String(value)))
}

/** Registers a Lua global function returning the values the JS fn produces. */
const fn = (name, impl) => {
  lua.lua_pushjsfunction(L, (state) => {
    const args = []
    for (let i = 1; i <= lua.lua_gettop(state); i++) {
      const t = lua.lua_type(state, i)
      if (t === lua.LUA_TNUMBER) args.push(lua.lua_tonumber(state, i))
      else if (t === lua.LUA_TSTRING) args.push(to_jsstring(lua.lua_tostring(state, i)))
      else if (t === lua.LUA_TTABLE) {
        const table = {}
        lua.lua_pushnil(state)
        while (lua.lua_next(state, i) !== 0) {
          const key = to_jsstring(lua.lua_tostring(state, -2))
          table[key] = lua.lua_tonumber(state, -1)
          lua.lua_pop(state, 1)
        }
        args.push(table)
      } else args.push(undefined)
    }
    const out = impl(...args)
    const values = Array.isArray(out) ? out : [out]
    for (const v of values) push(v)
    return values.length
  })
  lua.lua_setglobal(L, to_luastring(name))
}

// ── The character: the Phase 2 Fury Warrior from the scope document ──────────
const GEAR = {
  1: '|cnIQ4|Hitem:30120:3003:32409:30546:0:0:0:0:70:0:0|h[Destroyer Battle-Helm]|h|r',
  2: '|cnIQ4|Hitem:30022:0:0:0:0:0:0:0:70:0:0|h[Pendant of the Perilous]|h|r',
  3: '|cnIQ4|Hitem:30122:2986:30582:24027:0:0:0:0:70:0:0|h[Destroyer Shoulderblades]|h|r',
  15: '|cnIQ4|Hitem:24259:368:24027:0:0:0:0:0:70:0:0|h[Vengeance Wrap]|h|r',
  5: '|cnIQ4|Hitem:30118:2661:30584:30602:28362:0:0:0:70:0:0|h[Destroyer Breastplate]|h|r',
  9: '|cnIQ4|Hitem:30057:2647:24027:0:0:0:0:0:70:0:0|h[Bracers of Eradication]|h|r',
  10: '|cnIQ4|Hitem:30119:684:0:0:0:0:0:0:70:0:0|h[Destroyer Gauntlets]|h|r',
  6: '|cnIQ4|Hitem:30106:0:28119:28363:0:0:0:0:70:0:0|h[Belt of One-Hundred Deaths]|h|r',
  7: '|cnIQ4|Hitem:29995:3012:0:0:0:0:0:0:70:0:0|h[Leggings of Murderous Intent]|h|r',
  8: '|cnIQ4|Hitem:30081:2939:0:0:0:0:0:0:70:0:0|h[Warboots of Obliteration]|h|r',
  11: '|cnIQ4|Hitem:29997:0:0:0:0:0:0:0:70:0:0|h[Band of the Ranger-General]|h|r',
  12: '|cnIQ4|Hitem:28757:0:0:0:0:0:0:0:70:0:0|h[Ring of Reciprocity]|h|r',
  13: '|cnIQ4|Hitem:21670:0:0:0:0:0:0:0:70:0:0|h[Dragonspine Trophy]|h|r',
  14: '|cnIQ4|Hitem:28830:0:0:0:0:0:0:0:70:0:0|h[Badge of the Swarmguard]|h|r',
  16: '|cnIQ4|Hitem:28439:2673:0:0:0:0:0:0:70:0:0|h[Dragonstrike]|h|r',
  17: '|cnIQ4|Hitem:30082:2673:0:0:0:0:0:0:70:0:0|h[Talon of Azshara]|h|r',
  18: '|cnIQ4|Hitem:30105:0:0:0:0:0:0:0:70:0:0|h[Serpent Spine Longbow]|h|r',
}

// A 21/40/0 Fury build: [tab][index] = { talentID, tier, column, rank }
const TALENTS = {
  1: [
    { talentID: 124, tier: 1, column: 1, rank: 3 },
    { talentID: 130, tier: 1, column: 2, rank: 4 },
    { talentID: 641, tier: 2, column: 2, rank: 5 },
    { talentID: 131, tier: 3, column: 1, rank: 2 },
    { talentID: 137, tier: 3, column: 2, rank: 1 },
    { talentID: 121, tier: 3, column: 3, rank: 3 },
    { talentID: 662, tier: 4, column: 3, rank: 2 },
    { talentID: 133, tier: 5, column: 2, rank: 1 },
    { talentID: 9999, tier: 6, column: 1, rank: 0 }, // unspent: must not export
  ],
  2: [
    { talentID: 157, tier: 1, column: 3, rank: 5 },
    { talentID: 159, tier: 2, column: 3, rank: 5 },
    { talentID: 154, tier: 3, column: 4, rank: 5 },
    { talentID: 1581, tier: 4, column: 1, rank: 5 },
    { talentID: 155, tier: 4, column: 3, rank: 5 },
    { talentID: 165, tier: 5, column: 2, rank: 1 },
    { talentID: 1543, tier: 5, column: 4, rank: 2 },
    { talentID: 156, tier: 6, column: 3, rank: 5 },
    { talentID: 167, tier: 7, column: 2, rank: 1 },
    { talentID: 1655, tier: 7, column: 3, rank: 1 },
    { talentID: 1658, tier: 8, column: 3, rank: 5 },
  ],
  3: [],
}

// Skill lines, with the Professions header COLLAPSED — the case the addon has
// to handle, and the one WoWSims' exporter misses.
const SKILL_LINES = [
  { name: 'Weapon Skills', isHeader: true, isExpanded: true, rank: 0 },
  { name: 'Axes', isHeader: false, isExpanded: false, rank: 350 },
  { name: 'Professions', isHeader: true, isExpanded: false, rank: 0 },
  { name: 'Blacksmithing', isHeader: false, isExpanded: false, rank: 375 },
  { name: 'Mining', isHeader: false, isExpanded: false, rank: 375 },
  { name: 'Secondary Skills', isHeader: true, isExpanded: true, rank: 0 },
  { name: 'Cooking', isHeader: false, isExpanded: false, rank: 375 },
]
let expandedAll = false
const collapsedAgain = []

const PROFESSION_NAMES = {
  164: 'Blacksmithing', 165: 'Leatherworking', 171: 'Alchemy', 182: 'Herbalism',
  186: 'Mining', 197: 'Tailoring', 202: 'Engineering', 333: 'Enchanting',
  393: 'Skinning', 755: 'Jewelcrafting',
}

fn('UnitRace', () => ['Orc', 'Orc', 2])
fn('UnitClass', () => ['Warrior', 'WARRIOR', 1])
fn('UnitFactionGroup', () => ['Horde', 'Horde'])
fn('UnitLevel', () => 70)
fn('GetBuildInfo', () => ['2.5.6', '69795', 'Sep 9 2026', 20506])
fn('GetInventoryItemLink', (_unit, slot) => GEAR[slot] ?? null)
fn('GetNumTalentTabs', () => 3)
fn('GetNumTalents', (tab) => (TALENTS[tab] ?? []).length)
fn('GetNumSkillLines', () => SKILL_LINES.length)
fn('GetSkillLineInfo', (index) => {
  const line = SKILL_LINES[index - 1]
  if (!line) return [null]
  // Before ExpandSkillHeader(0), the two professions are hidden behind their
  // collapsed header — modelled by reporting them only once expanded.
  return [line.name, line.isHeader, line.isExpanded || expandedAll, line.rank]
})
fn('ExpandSkillHeader', () => { expandedAll = true; return [] })
fn('CollapseSkillHeader', (index) => { collapsedAgain.push(index); return [] })
fn('tinsert', () => [])
fn('print', (...args) => { console.log('[in-game print]', ...args); return [] })

// C_SpecializationInfo.GetTalentInfo / C_TradeSkillUI.GetTradeSkillDisplayName
const namespace = (name, methods) => {
  lua.lua_newtable(L)
  for (const [method, impl] of Object.entries(methods)) {
    lua.lua_pushjsfunction(L, (state) => {
      const top = lua.lua_gettop(state)
      let arg
      if (top >= 1 && lua.lua_type(state, 1) === lua.LUA_TTABLE) {
        arg = {}
        lua.lua_pushnil(state)
        while (lua.lua_next(state, 1) !== 0) {
          arg[to_jsstring(lua.lua_tostring(state, -2))] = lua.lua_tonumber(state, -1)
          lua.lua_pop(state, 1)
        }
      } else if (top >= 1) arg = lua.lua_tonumber(state, 1)

      const out = impl(arg)
      if (out === null || out === undefined) { lua.lua_pushnil(state); return 1 }
      if (typeof out === 'object') {
        lua.lua_newtable(state)
        for (const [k, v] of Object.entries(out)) {
          lua.lua_pushstring(state, to_luastring(k))
          push(v)
          lua.lua_settable(state, -3)
        }
        return 1
      }
      push(out)
      return 1
    })
    lua.lua_setfield(L, -2, to_luastring(method))
  }
  lua.lua_setglobal(L, to_luastring(name))
}

namespace('C_SpecializationInfo', {
  GetTalentInfo: (query) => {
    const talent = (TALENTS[query.specializationIndex] ?? [])[query.talentIndex - 1]
    return talent ?? null
  },
})
namespace('C_TradeSkillUI', {
  GetTradeSkillDisplayName: (skillLineID) => PROFESSION_NAMES[skillLineID] ?? null,
})

// ── The UI, stubbed down to the one call that matters: SetText ──────────────
let captured = null
lauxlib.luaL_dostring(L, to_luastring(`
  UIParent = {}
  UISpecialFrames = {}
  SlashCmdList = {}

  -- A widget that answers to anything: indexing returns another widget, and a
  -- widget is callable, so both frame.TitleText:SetText(x) and frame:Show()
  -- work the way they do against the real client's objects.
  local function widget()
    local self = {}
    return setmetatable(self, {
      __index = function(_, key)
        if key == "EditBox" then return _G.__editbox end
        return widget()
      end,
      __call = function() return widget() end,
    })
  end

  _G.__editbox = setmetatable({}, {
    __index = function(_, key)
      if key == "SetText" then return function(_, text) _G.__captured = text end end
      return widget()
    end,
  })

  CreateFrame = function() return widget() end
`))

const chunk = lauxlib.luaL_loadstring(L, to_luastring(fs.readFileSync(ADDON, 'utf8')))
if (chunk !== lua.LUA_OK) {
  console.error('LOAD FAILED:', to_jsstring(lua.lua_tostring(L, -1)))
  process.exit(1)
}
if (lua.lua_pcall(L, 0, 0, 0) !== lua.LUA_OK) {
  console.error('RUN FAILED:', to_jsstring(lua.lua_tostring(L, -1)))
  process.exit(1)
}

// Invoke the slash handler exactly as the client would.
lauxlib.luaL_dostring(L, to_luastring('SlashCmdList["PROJECTDEFEATEXPORT"]("")'))
lua.lua_getglobal(L, to_luastring('__captured'))
captured = lua.lua_type(L, -1) === lua.LUA_TSTRING ? to_jsstring(lua.lua_tostring(L, -1)) : null

if (!captured) {
  console.error('NO EXPORT PRODUCED')
  process.exit(1)
}

console.log('--- export string ---')
console.log(captured)
console.log('--- checks ---')
console.log('length:', captured.length)

const parsed = JSON.parse(captured) // throws if the hand-built JSON is malformed
console.log('valid JSON: yes')
console.log('format:', parsed.format, 'v' + parsed.formatVersion)
console.log('race/class/faction/level:', parsed.race, parsed.class, parsed.faction, parsed.level)
console.log('gear pieces:', parsed.gear.length)
console.log('talents exported:', parsed.talents.length, '(rank-0 excluded:', !parsed.talents.some((t) => t[4] === 0), ')')
console.log('talent points:', parsed.talents.reduce((sum, t) => sum + t[4], 0))
console.log('professions:', JSON.stringify(parsed.professions), '(behind a collapsed header)')
console.log('headers re-collapsed:', JSON.stringify(collapsedAgain))
console.log('identifying fields present:', ['name', 'realm', 'guid', 'guild'].filter((k) => k in parsed))
const head = parsed.gear.find((g) => g.slot === 1)
console.log('head:', JSON.stringify(head))
const neck = parsed.gear.find((g) => g.slot === 2)
console.log('neck (no enchant, no gems):', JSON.stringify(neck))
fs.writeFileSync(path.resolve(__dirname, 'fixture-export.json'), captured)
console.log('\nwrote fixture-export.json')
