# U.GG and Mobalytics (multi-game companion sites)

Looked at: 2026-10-01 (session 1; skip links rechecked in the merge step). Source IDs refer to
`../sources.md`. Pages inspected in a 1280 x 720 CSS px viewport: U.GG's Ahri build page [M1],
Mobalytics' home page and Diablo 4 builds page [M2]. Blitz, skipped in session 1, now has its own
note: [blitz.md](blitz.md).

## U.GG (seen 2026-10-01)

- **Cross-game strip at the top**: League of Legends, Valorant, Rematch, Teamfight Tactics,
  Deadlock (NEW), World of Warcraft, Helldivers 2 [M1]. A banner advertised an "Icy Veins WoW app"
  under the U.GG brand [M1]; Icy Veins and U.GG are sister brands under Vedatis [NC16].
- **Left icon rail** (download, plus, guides, tools, Discord, profile) and a top search for
  "Summoner or Champion" with a region badge [M1].
- **Patch badge in the title row**: "Ahri Build for Mid, Emerald + [Patch 26.19]" [M1].
- **Filter bar**: role toggles, rank ("Emerald +"), "vs. Champion..." picker, More [M1].
- **Stat strip** before the details: Tier S, Win Rate 50.68%, Rank 21/58, Pick Rate 9%, Ban Rate
  2.9%, Matches 130,326 [M1].
- **Every recommendation block states its sample**: "Ahri Runes ... 53.25% WR (4,915 Matches)" [M1].
- **One-click action**: an "Auto-Import" button that sends the build to the game client [M1].
- Type: headings in **Barlow** (the same family the app's UI face belongs to), numbers in Inter 800;
  navy-black `rgb(7,7,32)` background [M1]. No skip control found [K1]; no reduced-motion rule in
  readable CSS (*unverified*) [M1].

## Mobalytics (seen 2026-10-01)

- Home: big uppercase headline in a condensed face (Oswald loads) with one yellow accent phrase,
  a yellow "Download desktop app" button, and game cards below [M2]. A cookie banner offered only
  "Accept"; I did not accept it [M2]. No skip control found [K1].
- Diablo 4 builds: **left icon rail**, a **cross-game tab strip** (LoL, TFT, Diablo 4, PoE 2, PoE,
  WoW Forever [New], Destiny 2), rounded cards on a deep purple `rgb(23,18,51)` ground, a "Build
  Tracker" call-out, and "Verified Builds / Creator" tabs [M2]. Roboto body [M2].

## Changes since 2024

No dated redesign announcements were searched for or found for either site; the notes above are
observations of the live pages on 2026-10-01, not claims about when they changed. Both now list a
WoW section, which places them in the same market as Wowhead and Raider.IO [M1, M2].

## Techniques worth noting

- **Context chips in the title** (patch, role, rank) so the reader knows what the numbers apply to
  [M1].
- **Sample size beside every percentage** [M1].
- **Stat strip first, detail second** [M1].
- **Left icon rail + top cross-game strip** as the shell for many games [M1, M2].
- **A send-to-game button** next to the recommendation [M1].

## Relevance to Project Defeat

The app shows Phase 2 rankings and BiS lists [A1]. U.GG's habit of stating patch and sample beside
each number maps onto stating phase and source beside each ranking [M1]. U.GG's Auto-Import sends a
build **into** the game; Project Defeat's addon only reads the character **out of** the game (the
`/pdexport` string pasted into the app), so the transferable part is placement, not direction: put
the import action next to the thing it fills [M1, A2].
