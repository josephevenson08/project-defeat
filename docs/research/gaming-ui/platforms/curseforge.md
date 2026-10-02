# CurseForge (Overwolf)

Looked at: 2026-10-01. Session 2, batch B. Source IDs (NB...) are listed in `../sources.md`. Pages opened
in the Claude browser pane at a **1024 x 768 CSS px** viewport (`innerWidth` 1024) and read with a
computed-style script; the pane was hidden, so **no screenshots**. Overwolf's own site and the
CurseForge desktop app were **not** inspected.

## What I saw on the live site (2026-10-01, 1024 px)

Pages: the World of Warcraft landing page, curseforge.com/wow [NB19], and the WoW addon search page,
curseforge.com/wow/search?class=addons [NB20].

**A game switcher is the first menu.** The header's Browse menu lists "BROWSE ALL (128)" and then
games by name (Minecraft, The Sims 4, World of Warcraft, Minecraft Bedrock, Ark Survival Ascended,
Hytale, inZOI, StarCraft II ...) [NB19]. The rest of the header: Create (author links), Studios, Go
Premium, **Get CurseForge App**, Sign In [NB19].

**WoW "flavor" filter that names TBC.** The search page's filter column has Categories, then a
**Flavor** group: Retail, Classic, Classic TBC, WotLK Classic, MoP Classic, Cataclysm Classic, Forever,
Titan Reforged Classic; then a **Game Version** group with patch numbers (12.1.5, 12.1.0 ...) [NB20].
So the "which version of WoW" choice is a first-class filter, and TBC Classic is one of the named
options [NB20].

**Dense, provenance-rich result rows.** Each result shows name, author ("By MysticalOS"), a one-line
summary, a category chip with "+2", total downloads (635.0M), last-update date (Sep 29, 2026), latest
file version, and a compatibility line such as "Retail + 5" (the main flavor plus how many others)
[NB20]. Results can be sorted by Relevancy, Popularity, Latest update, Creation Date, Total Downloads
or A-Z, with 10 / 20 / 50 per page [NB20]. On the landing page, "Latest Addons" cards show author,
download count and date [NB19].

**Install hands off to the app.** Every featured and listed addon has an orange **Install** button next
to a grey View / Download button [NB19, NB20]. The landing page also promotes app release notes ("App
Version 1.321") with a Read Blog button [NB19].

**Search.** A search field scoped to the game: "Search for World of Warcraft addons..." [NB19].

**Type and color.** Near-black page `rgb(13,13,13)`; body Lato 16 px in grey `rgb(153,153,153)`; the
page title "World of Warcraft Addons" in Montserrat 700 at 32 px; section heads in Lato [NB19]. One
accent, orange `rgb(241,100,54)`, on Install and Read Blog; secondary buttons are flat greys
(`rgb(51,51,51)`, `rgb(32,32,32)`) [NB19]. Every sampled button had a **0 px** radius [NB19]. The font
class names follow the pattern Next.js generates for self-hosted fonts (`...-module__...__variable`),
so the site is likely a Next.js app; that is an inference, *unverified* [NB19].

**Accessibility probe.** A real `h1` and `h2`/`h3` hierarchy is present [NB19]. No skip link. 18 of 19
stylesheets were unreadable, so "0 reduced-motion rules" is *unverified* [NB19].

## Changes since 2024

- **Hytale's official mod platform (2026).** Hypixel Studios' own post says it partnered with
  CurseForge to run all submissions, moderation and logistics for its modding contest [NB21,
  2026-03-05]. Hytale appears in CurseForge's game menu on the live site [NB19]. That CurseForge is
  Hytale's only official mod platform is claimed by fan and SEO sites in search results, which I did
  not use; *unverified*.
- **Background, older than 2024:** the current website design became the default in April 2023 after
  a beta from December 2022 (Overwolf's Medium post returned 403; date from search results only,
  *unverified*) [NB23]; a standalone CurseForge client that works without Overwolf was announced in
  May 2022 [NB22, 2022-05-16]. Neither counts as a 2024+ change [NB22, NB23].
- No 2024+ redesign was found.

## Techniques worth noting

- **Version / flavor as a filter facet**, with TBC Classic named [NB19, NB20].
- **Rows that print downloads, last update, file version and compatibility count** inline [NB19, NB20].
- **Install deep-link to a desktop client** on every row [NB19, NB20].
- **Square buttons, one orange accent, greys for everything else.** [NB19, NB20]

## Relevance to Project Defeat

CurseForge is where many of this app's users already get their addons, and its search page shows a
mature pattern for a long, filterable list: facets on the left (category, flavor, patch), a sort and
page-size control, and rows that carry their own provenance (author, date, version, compatibility) [NB20].
The app's item and BiS lists could borrow the row anatomy, especially "last updated" and "fits these
versions" inline [NB20, A2].
