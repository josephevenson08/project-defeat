# U.GG and Mobalytics (multi-game companion sites)

Looked at: 2026-10-01. Source IDs refer to `../sources.md`. Pages inspected in a 1280 x 720 CSS px viewport:
U.GG's Ahri build page [M1], Mobalytics' home page and Diablo 4 builds page [M2]. Blitz was not
inspected (time; two of the three named tools were covered).

## U.GG (seen 2026-10-01)

- **Cross-game strip at the top**: League of Legends, Valorant, Rematch, Teamfight Tactics,
  Deadlock (NEW), World of Warcraft, Helldivers 2 [M1]. A banner advertised an "Icy Veins WoW app"
  under the U.GG brand [M1].
- **Left icon rail** (download, plus, guides, tools, Discord, profile) and a top search for
  "Summoner or Champion" with a region badge [M1].
- **Patch badge in the title row**: "Ahri Build for Mid, Emerald + [Patch 26.19]" [M1].
- **Filter bar**: role toggles, rank ("Emerald +"), "vs. Champion..." picker, More [M1].
- **Stat strip** before the details: Tier S, Win Rate 50.68%, Rank 21/58, Pick Rate 9%, Ban Rate
  2.9%, Matches 130,326 [M1].
- **Every recommendation block states its sample**: "Ahri Runes ... 53.25% WR (4,915 Matches)" [M1].
- **One-click action**: an "Auto-Import" button that sends the build to the game client [M1].
- Type: headings in **Barlow** (the same family the app's UI face belongs to), numbers in Inter 800;
  navy-black `rgb(7,7,32)` background [M1]. No skip link or reduced-motion rule found [M1].

## Mobalytics (seen 2026-10-01)

- Home: big uppercase headline in a condensed face (Oswald loads) with one yellow accent phrase,
  a yellow "Download desktop app" button, and game cards below [M2]. A cookie banner offered only
  "Accept"; I did not accept it.
- Diablo 4 builds: **left icon rail**, a **cross-game tab strip** (LoL, TFT, Diablo 4, PoE 2, PoE,
  WoW Forever [New], Destiny 2), rounded cards on a deep purple `rgb(23,18,51)` ground, a "Build
  Tracker" call-out, and "Verified Builds / Creator" tabs [M2]. Roboto body [M2].

## Changes since 2024

No dated redesign announcements were searched for or found for either site in this pass; the notes
above are observations of the live pages on 2026-10-01, not claims about when they changed. Both
now list a WoW section, which places them in the same market as Wowhead and Raider.IO.

## Techniques worth noting

- **Context chips in the title** (patch, role, rank) so the reader knows what the numbers apply to.
- **Sample size beside every percentage.**
- **Stat strip first, detail second.**
- **Left icon rail + top cross-game strip** as the shell for many games.
- **Export / import buttons** next to the recommendation.

## Relevance to Project Defeat

The app shows Phase 2 rankings and BiS lists. U.GG's habit of stating patch and sample beside each
number maps onto stating phase and source beside each ranking. "Auto-Import" is the same job as
the app's addon import/export string (`/pdexport`), which U.GG puts next to the recommendation it
applies to rather than on a separate screen.
