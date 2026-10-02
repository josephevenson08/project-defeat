# Blitz.gg

Looked at: 2026-10-01. Session 2, batch C. Source IDs refer to
`../sources.md`. Pages inspected in the Claude browser pane at a 1024 x 768 CSS px viewport
(`innerWidth` 1024), measured by computed-style script and by reading the page's own readable CSS;
screenshots timed out, so nothing here is from a screenshot [NC20-NC22]. Blitz has no WoW content;
it covers League of Legends, TFT, VALORANT, Counter-Strike 2, Fortnite, Escape From Tarkov, Apex
Legends, Marvel Rivals and Deadlock [NC20]. Main page studied: the **League of Legends champion
build page** (Ahri, mid), Blitz's equivalent of a spec's gear page [NC21].

## What I saw (2026-10-01)

### Shell

- **Top game strip** listing all nine games, then a search button "Search... Ctrl K", "Go
  Ad-Free", Log In and "Download Blitz" [NC20]. On a game page the search label becomes "Search
  Profiles (Name#Tag), Champions, etc." [NC21]. This is T2 (game first) and T3 (search with a
  keyboard shortcut) together.
- **Per-game tabs** for League: Home, Champions, Tier List, League Classic, ARAM Mayhem, Arena,
  News, Overlays [NC21].
- **Home page**: a 36 px, 725-weight Inter headline about overlays and stats, two big counters
  ("240M+ Players", "3B+ Matches Analyzed"), a "Fully Compliant" badge, download buttons, then a
  "Latest News" list where each item shows a relative age in caps ("12 HOURS AGO", "9 DAYS AGO")
  and many titles name a patch ("LoL Patch 26.19 Notes", "TFT Patch 18.3 Notes") [NC20].
- **Theme**: page `rgb(14,16,21)`, text `rgb(235,236,240)`, Inter only, 16 px [NC20]. Buttons are
  8 px rounded on translucent greys; the ad-free button is a translucent gold [NC20]. No skip link;
  2 `prefers-reduced-motion` rules; 0 `prefers-color-scheme` rules [NC20, NC21].

### Champion build page (Ahri mid)

- **Provenance in the H1 and right under it** (seen): "Ahri Mid Build, Runes, Items, and Stats -
  Patch 26.19 (Emerald+)", a one-line description, then **"Data updated 1 minute ago."** [NC21].
  Patch, rank bracket and data age are all stated before any number.
- **Mode tabs**: Build, ARAM Mayhem, Classic (tagged "New"), ARAM, URF, Arena, Pro Builds, One
  Tricks ("New"), Counters, Synergies, Abilities [NC21]. Active tab is white with a 3 px underline
  in `--game-color`; inactive tabs are grey `rgb(137,141,148)`; "New" badges are gold text on a 15%
  gold tint, 5 px radius [NC21].
- **Summary strip** (seen): Tier (an icon), Win Rate 50.7%, **Win Rate Change -0.4%**, Pick rate
  4.8%, Ban rate 1.6%, Matches 122,008 [NC21]. Values are 22 px, 650 weight [NC21]. The CSS colors
  the change value green when up and red when down, with arrow icons (`.wr-diff.up`, `.down`)
  [NC21].
- **Sample size on every recommendation block**: "AP 148,367 GAMES 51%", runes "127,985 GAMES",
  ability order "64% 30,122 GAMES" [NC21]. The block footer repeats "Patch: 26.19" [NC21].
- **Build sections**: Runes, Summoner Spells, Items (Starting, Build Order, Completed,
  Situational), Ability Max Order with an 18-level skill grid, and a **Damage Breakdown** bar
  (72% AP, 21% True, 7% physical) drawn as proportional chips in the damage-type colors [NC21].
- **Social proof rows**: an "OTP" (one-trick) build from a named Challenger player with LP, and a
  long list of pro players' recent games with region tags (EUW, NA, BR, KR, TR) [NC21].
- **Generated summary paragraph**: a plain sentence restating tier, win, pick and ban rates,
  sample size, region and patch, the core item path, the keystone and the hardest matchup [NC21].
  Below it: Key Insights, Strengths, Weaknesses, Similar Champions [NC21].
- **Accessibility nit**: the tier icon shows the letter A but its `alt` text is "Tier 2" [NC21].

### Engineering signals from the readable CSS (seen)

- Svelte components (`svelte-*` class hashes) and heavy use of **container queries**: the stats
  strip, toolbar, similar-champions grid and footer each re-flow by their own width, e.g. the stats
  strip becomes a 3-column grid at 800 px or less [NC21].
- **Per-game accent token**: tab underline and "New" badges use `var(--game-color, var(--primary))`
  [NC21]. That is T1 (one system, re-skinned per product) inside a single site.
- **Tab indicator uses the View Transitions API** (`view-transition-name: page-tab-indicator`), so
  the underline can animate between tabs [NC21].
- A **`body.theme-minimal`** variant appears throughout the CSS (flatter backgrounds, smaller rune
  icons, a different toggle color) [NC21]. I did not find the switch for it on the web page; it may
  belong to the desktop app (*unverified*).
- **Game-semantic tokens**: rank colors with paired text colors (`--rank-gold`,
  `--rank-gold-text`, through Challenger), damage types (`--ad`, `--ap`, `--true`), and region
  colors for player portraits [NC21].
- An overlay mode class (`.is-overlay`) sizes the main content to the full viewport, so the same
  front end appears to serve the in-game overlay (*unverified* beyond the CSS) [NC21].
- The 404 page prints the missing path and a build hash ("adc500c"); the footer line "Made with
  Lots of Love and Tilt in ..." named Brazil on one load and France on the next [NC21, NC22].

## Changes since 2024 (from dated sources)

- I found **no dated first-party or reputable source** describing a Blitz web redesign or product
  change in 2024 to 2026; blitz.gg/news refused a text fetch (HTTP 403) and blitz.gg/changelog is
  a 404 [NC22]. Everything above is "seen" on 2026-10-01 only [NC20, NC21].

## Background (pre-2024, context only)

- **2023**: the design studio Báchoo did a brand refresh for Blitz: logo update, brand guidelines,
  website redesign and key visuals, keeping the lightning mark [NC23]. Whether today's site is
  that design is *unverified* [NC23].

## Techniques worth noting

- **Patch, bracket and "data updated N minutes ago"** stated before the numbers [NC20, NC21].
- **Change since last patch** shown next to the headline figure, colored by direction [NC20, NC21].
- **Sample size on every block**, not once per page [NC20, NC21].
- **A generated plain-language summary** that restates the key numbers [NC20, NC21].
- **Container-query components** that re-flow by their own width [NC20, NC21].
- **Per-game accent token** for tabs and badges [NC20, NC21].

## Relevance to Project Defeat

Blitz is data-driven where Project Defeat is curated, but the provenance habits carry over: print
the phase and data date in the heading, show a delta when something changed between phases, and
write a one-sentence summary under a dense table [NC21]. The `--game-color` token is the same idea as the
app's faction theming; Blitz shows it can be limited to small surfaces (a tab underline, a badge)
and still read as themed [NC21, A2].
