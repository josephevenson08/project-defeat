--[[----------------------------------------------------------------------------
Project Defeat Export — one string carrying your character to the planner.

    /pdexport

MIT licensed. See LICENSE at the root of the Project Defeat repository.

WHAT THIS SENDS, AND WHAT IT DOES NOT

It carries what a planner needs to reproduce your character: race, class,
faction, level, professions, talents, and every equipped item with its enchant
and gems. It carries **no name, no realm, no GUID and no guild** — nothing that
identifies who you are. The string is yours; nothing is transmitted anywhere by
this addon, which has no network access of any kind. You copy it and decide
where it goes.

WHY THE C_ APIs

2.5.6 still provides the old globals (`GetTalentInfo`, `GetItemGem`) but only as
deprecation fallbacks, re-created at load by `Blizzard_Deprecated*` when the
`loadDeprecationFallbacks` CVar is on. That CVar defaults on in release builds,
"can default to disabled in test builds", and resets on restart — so an addon
built on those globals works until the day it doesn't. Every call below is the
namespaced API that exists whether or not the fallbacks loaded. WeakAuras does
the same thing for the same reason.
------------------------------------------------------------------------------]]

local ADDON_VERSION = "1.0.0"
local FORMAT_VERSION = 1

--[[
Equipment slots, in the order the planner lists them.

4 (Shirt) and 19 (Tabard) are deliberately absent: neither carries stats, so
neither is worth a byte. Slot 18 is Ranged for most classes and Relic for
Druid, Paladin and Shaman — the site decides which from the class, because the
game gives one slot id to both.
]]
local SLOTS = { 1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 12, 13, 14, 16, 17, 18 }

--[[
The ten primary professions, by SkillLine id.

Ids rather than names, so the export is identical on every locale — a German
client reports "Schneiderei" where an English one reports "Tailoring", and a
site that had to recognise both would be wrong in the twelve languages nobody
tested. The names are used only to *find* the skill lines, via the game's own
localised display name for each id.
]]
local PRIMARY_PROFESSIONS = { 164, 165, 171, 182, 186, 197, 202, 333, 393, 755 }

-- ---------------------------------------------------------------------------
-- Reading the character
-- ---------------------------------------------------------------------------

--[[
Item links are colon-delimited after `|Hitem:`, and the fields we want are the
first seven:

    itemID : enchantID : gem1 : gem2 : gem3 : gem4 : suffixID : ...

Parsed from the `|Hitem:` marker rather than by counting characters from the
start, because the colour prefix changed shape in a later patch (`|cffRRGGBB`
became `|cnIQx`) and an offset-based parser would have silently read the wrong
fields the day the client updated.
]]
local function parseItemLink(link)
    local payload = link:match("|Hitem:([^|]+)")
    if not payload then return nil end

    local fields = {}
    for value in (payload .. ":"):gmatch("([^:]*):") do
        fields[#fields + 1] = tonumber(value) or 0
    end

    local itemId = fields[1]
    if not itemId or itemId == 0 then return nil end

    return {
        item = itemId,
        enchant = fields[2],
        gems = { fields[3], fields[4], fields[5], fields[6] },
        suffix = fields[7],
    }
end

local function readGear()
    local gear = {}

    for _, slot in ipairs(SLOTS) do
        local link = GetInventoryItemLink("player", slot)
        if link then
            local parsed = parseItemLink(link)
            if parsed then
                parsed.slot = slot
                gear[#gear + 1] = parsed
            end
        end
    end

    return gear
end

--[[
Every talent with at least one point, carrying its id *and* its position.

The position is the redundancy that makes a mismatch survivable: if the
client's talentID ever disagrees with the one the planner's trees were built
from, tab/tier/column still places the talent exactly, and the site can say so
instead of silently dropping a point. It costs about 115 characters.
]]
local function readTalents()
    local talents = {}

    for tab = 1, GetNumTalentTabs() do
        for index = 1, GetNumTalents(tab) do
            local info = C_SpecializationInfo.GetTalentInfo({
                specializationIndex = tab,
                talentIndex = index,
            })

            if info and info.rank and info.rank > 0 then
                talents[#talents + 1] = {
                    info.talentID,
                    tab,
                    info.tier,
                    info.column,
                    info.rank,
                }
            end
        end
    end

    return talents
end

--[[
Professions, read off the skill list.

**The skill list only reports what is expanded**, and a player who collapsed
the "Professions" header exports none — which would leave the planner thinking
an Enchanter has no Enchanting and stripping their ring enchants as illegal.
So the headers are expanded, the list is read, and anything that was collapsed
is put back the way it was found. Leaving someone's UI rearranged as a side
effect of an export is not this addon's business.
]]
local function readProfessions()
    local localisedName = {}
    for _, skillLine in ipairs(PRIMARY_PROFESSIONS) do
        local name = C_TradeSkillUI.GetTradeSkillDisplayName(skillLine)
        if name then localisedName[name] = skillLine end
    end

    local collapsed = {}
    for index = GetNumSkillLines(), 1, -1 do
        local _, isHeader, isExpanded = GetSkillLineInfo(index)
        if isHeader and not isExpanded then collapsed[#collapsed + 1] = index end
    end
    ExpandSkillHeader(0)

    local professions = {}
    for index = 1, GetNumSkillLines() do
        local name, isHeader, _, rank = GetSkillLineInfo(index)
        local skillLine = (not isHeader) and name and localisedName[name] or nil
        if skillLine then
            professions[#professions + 1] = { skillLine = skillLine, rank = rank or 0 }
        end
    end

    -- Put the player's own collapsed headers back, highest index first so the
    -- indices below each one do not shift under the loop.
    for i = #collapsed, 1, -1 do
        CollapseSkillHeader(collapsed[i])
    end

    return professions
end

-- ---------------------------------------------------------------------------
-- Writing the string
-- ---------------------------------------------------------------------------

--[[
The export is assembled by hand rather than through a JSON library.

Every value in it is either a number the API gave us or a token from a fixed
set (`WARRIOR`, `NightElf`, `Alliance`), so there is no free text to escape and
no user input to sanitise — which is what makes a general-purpose encoder, and
the dependency it would bring, unnecessary for a file this size.

`%d` throughout, because Lua prints numbers as floats given the chance and
`"item":30120.0` is not valid JSON.
]]
local function number(value)
    return string.format("%d", value or 0)
end

local function buildExportString()
    local _, raceToken = UnitRace("player")
    local _, classToken = UnitClass("player")
    local factionToken = UnitFactionGroup("player")
    local version, build = GetBuildInfo()

    local parts = {}
    local function add(text) parts[#parts + 1] = text end

    add('{"format":"project-defeat-character"')
    add(',"formatVersion":' .. number(FORMAT_VERSION))
    add(',"addon":"' .. ADDON_VERSION .. '"')
    add(',"client":"' .. version .. "." .. build .. '"')
    add(',"level":' .. number(UnitLevel("player")))
    add(',"race":"' .. (raceToken or "") .. '"')
    add(',"class":"' .. (classToken or "") .. '"')
    add(',"faction":"' .. (factionToken or "") .. '"')

    local professions = readProfessions()
    add(',"professions":[')
    for i, entry in ipairs(professions) do
        if i > 1 then add(",") end
        add('{"skillLine":' .. number(entry.skillLine) .. ',"rank":' .. number(entry.rank) .. "}")
    end
    add("]")

    local talents = readTalents()
    add(',"talents":[')
    for i, talent in ipairs(talents) do
        if i > 1 then add(",") end
        add("[" .. number(talent[1]) .. "," .. number(talent[2]) .. "," ..
            number(talent[3]) .. "," .. number(talent[4]) .. "," .. number(talent[5]) .. "]")
    end
    add("]")

    local gear = readGear()
    add(',"gear":[')
    for i, piece in ipairs(gear) do
        if i > 1 then add(",") end
        add('{"slot":' .. number(piece.slot) .. ',"item":' .. number(piece.item))

        if piece.enchant and piece.enchant > 0 then
            add(',"enchant":' .. number(piece.enchant))
        end

        -- Trailing empty sockets are dropped; a 0 in the middle is kept, because
        -- position is what tells the planner which socket is unfilled.
        local lastGem = 0
        for slotIndex = 1, 4 do
            if piece.gems[slotIndex] and piece.gems[slotIndex] > 0 then lastGem = slotIndex end
        end
        if lastGem > 0 then
            add(',"gems":[')
            for slotIndex = 1, lastGem do
                if slotIndex > 1 then add(",") end
                add(number(piece.gems[slotIndex]))
            end
            add("]")
        end

        if piece.suffix and piece.suffix ~= 0 then
            add(',"suffix":' .. number(piece.suffix))
        end

        add("}")
    end
    add("]}")

    return table.concat(parts)
end

-- ---------------------------------------------------------------------------
-- The window
-- ---------------------------------------------------------------------------

--[[
An EditBox with its contents already selected, because **an addon cannot write
the clipboard** — `CopyToClipboard` is protected. Ctrl+C is the only way the
string can leave the game, so the addon's whole job at this point is to make
Ctrl+C the only thing left to do.

Built on first use rather than at load: a player who never types /pdexport
should pay nothing for having the addon installed.
]]
local frame

local function ensureFrame()
    if frame then return frame end

    frame = CreateFrame("Frame", "ProjectDefeatExportFrame", UIParent, "BasicFrameTemplateWithInset")
    frame:SetSize(560, 220)
    frame:SetPoint("CENTER")
    frame:SetMovable(true)
    frame:EnableMouse(true)
    frame:RegisterForDrag("LeftButton")
    frame:SetScript("OnDragStart", frame.StartMoving)
    frame:SetScript("OnDragStop", frame.StopMovingOrSizing)
    frame:SetFrameStrata("DIALOG")

    -- Guarded, both of them: `TitleText` and `CharCount` are parentKeys on
    -- Blizzard's templates, and a template that shifts them in a patch should
    -- cost this addon a title, not its whole window.
    if frame.TitleText then frame.TitleText:SetText("Project Defeat Export") end

    local hint = frame:CreateFontString(nil, "ARTWORK", "GameFontHighlightSmall")
    hint:SetPoint("TOPLEFT", 14, -32)
    hint:SetPoint("TOPRIGHT", -14, -32)
    hint:SetJustifyH("LEFT")
    hint:SetText("Press Ctrl+C to copy, then paste it into the planner's Build tab.")

    local scroll = CreateFrame("ScrollFrame", "$parentScroll", frame, "InputScrollFrameTemplate")
    scroll:SetPoint("TOPLEFT", 14, -54)
    scroll:SetPoint("BOTTOMRIGHT", -32, 16)
    if scroll.CharCount then scroll.CharCount:Hide() end

    local editBox = scroll.EditBox
    editBox:SetMaxLetters(0)
    editBox:SetFontObject("ChatFontNormal")
    editBox:SetWidth(scroll:GetWidth())
    -- Escape closes the window rather than only clearing focus, which is what
    -- every other panel in the game does with Escape.
    editBox:SetScript("OnEscapePressed", function() frame:Hide() end)

    frame.EditBox = editBox
    tinsert(UISpecialFrames, "ProjectDefeatExportFrame")

    return frame
end

local function showExport()
    -- The whole path is guarded, not just the reading half: building the window
    -- touches Blizzard templates this addon cannot test against every client,
    -- and a player deserves a sentence they can put in a bug report rather than
    -- a red Lua error and no string.
    local ok, err = pcall(function()
        local export = buildExportString()
        local window = ensureFrame()
        window:Show()
        window.EditBox:SetText(export)
        window.EditBox:HighlightText()
        window.EditBox:SetFocus()
    end)

    if not ok then
        print("|cffffd100Project Defeat Export|r: could not build the export — " .. tostring(err))
    end
end

SLASH_PROJECTDEFEATEXPORT1 = "/pdexport"
SLASH_PROJECTDEFEATEXPORT2 = "/projectdefeat"
SlashCmdList["PROJECTDEFEATEXPORT"] = showExport
