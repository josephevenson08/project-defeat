# Tracker.gg (Tracker Network)

Looked at: 2026-10-01. Session 2, batch B. Source IDs (NB...) are listed in `../sources.md`. Pages opened
in the Claude browser pane at a **1024 x 768 CSS px** viewport (`innerWidth` 1024) and read with a
computed-style script; the pane was hidden, so **no screenshots**. I did not open individual player
profiles, and I have left player names off this page on purpose.

## What I saw on the live site (2026-10-01, 1024 px)

Pages: the network home page, tracker.gg [NB24], and the VALORANT hub, tracker.gg/valorant [NB25].

**One shell, many games, tokens per game.** The top strip is a cross-game switcher (Fortnite,
Valorant, R6 Siege, More Games); below it a per-game nav (on VALORANT: Home, Leaderboards, Lineups,
Premier, More) [NB24, NB25]. The root element defines **482 CSS custom properties**, including
per-game families (`--color-valorant-team-1`, `--color-rgb-deadlock-amber`, `--color-smite-...`,
`--color-tft-...`), rank tiers (iron, bronze, silver, gold, platinum) and meaning-based tokens
(`increment` / `decrement`, `good` / `bad`, `success`, `warning`, `danger`) [NB25]. The VALORANT
page title word "STATS" is in VALORANT red `rgb(255,70,85)` [NB25].

**Search is the hero.** The VALORANT hub leads with "VALORANT STATS" and a search box whose
placeholder shows the expected input format, a Riot ID with tag or an agent name [NB25]. Under it:
"Or sign in with Riot ID" and a "Make private" option [NB25].

**Context strip under the search.** "Season Ends 12d 4h" and "Players Tracked 150,704,517" sit as two
small labelled figures right under the search box [NB25]. The home page does the same at network
scale (300M+ players tracked, 25M+ matches in the past 24 hours) [NB24].

**Numbers carry their direction.** The home page "PLAYER COUNT, Last 30 Days" table colors each game's
count and its percent change green `rgb(94,231,144)` or red `rgb(228,72,93)` by direction (for example
+9.0% or -55.0%) [NB24].

**Bridges to the game.** The VALORANT hub has several blocks selling the desktop overlay ("LIVE MATCH
SCOUTING", "PRE-MATCH PREPARATION", "DETAILED MATCH HISTORY") and the mobile app [NB25]. The network
nav lists Apps, Overlays and a Twitch Bot [NB24].

**Type and shape.** Body Roboto 15 px; display heads in **Saira** (a squared, slightly condensed sans),
bold and uppercase [NB24, NB25]. Page surface navy `rgb(15,25,35)` with cards the same color, 16 px
radius; the search field sits in a translucent 8 px-radius box; carousel dots are full pills [NB25].
Secondary text is a cool grey-blue `rgb(153,171,191)` [NB25]. Cards use a Tailwind-style `@container`
class (8 on the VALORANT hub), so components size themselves by their container rather than the
viewport [NB25].

**Ads and premium.** A "Premium users don't see ads" box with an "Upgrade for $3.99/mo" button sits in
the content column [NB25].

**Accessibility probe.** 5 `prefers-reduced-motion` rules found in readable CSS on both pages (4 of
10 sheets unreadable on the home page, 5 unreadable on the VALORANT hub) [NB24, NB25]. No skip link. The home page's only `h1` is empty (its text is presumably an
image or logo) [NB24].

## Changes since 2024

- **New R6 Tracker site, June 2024 (primary).** Tracker Network's own changelog says it launched a new
  site "a few weeks" before 21 June 2024 and then adjusted it from feedback [NB26, 2024-06-21]. Changes
  listed: lifetime stats reworked and **moved to the top** of the profile overview; a games-played
  count tag on each playlist tab; inactive seasons added with a toggle to hide them; larger font for
  rank-point values; **icons removed** from card titles; theme and banner updated [NB26].
- The `v3-` prefix on current card classes suggests a third component generation; that reading is
  mine, *unverified* [NB25].

## Techniques worth noting

- **Search placeholder that teaches the input format.** [NB24-NB26]
- **Two-figure context strip** (time left in season, sample size) under the main control [NB24-NB26].
- **Semantic color tokens for change** (increment / decrement) used on every delta [NB24-NB26].
- **Per-game token families on one root** instead of separate stylesheets [NB24-NB26].
- **Container-query cards.** [NB24-NB26]
- From the 2024 changelog: summary stats first, counts on tabs, fewer decorative icons [NB24-NB26].

## Relevance to Project Defeat

Tracker.gg is a stat-lookup tool like Raider.IO and U.GG, and its 2024 changelog is a rare primary
record of a tool tightening its layout: headline stats to the top, counts on tabs, decoration removed,
key numbers made larger [NB26]. The app could adopt meaning-based tokens for gains and losses in gear
comparisons (an `--increment` / `--decrement` pair that both factions share), and a placeholder that
shows an example query in its item search [NB24, NB25].
