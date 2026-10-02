# Microsoft: Xbox PC app and xbox.com

Looked at: 2026-10-01 (session 1). Source IDs refer to `../sources.md`.

## What I saw on xbox.com (2026-10-01, 1280 px)

- The home URL redirected to `/en-US/home_alt/light/home`, i.e. a light variant of the home page is
  a served route [X1].
- Page body on white with Segoe UI; headings and buttons in **Segoe Sans Display** (700 for game
  titles) [X1].
- Primary CTA ("Get it now →") is a **pill (999 px radius)** in a neon green (`#90f910`) with dark
  text and an arrow glyph [X1].
- Loaded faces include the **Bahnschrift** family in several widths (condensed, semicondensed) [X1].
- **Accessibility signals in the CSS I could read:** a "Skip to main content" link; 9
  `prefers-reduced-motion` rules and 6 `prefers-color-scheme` rules in readable stylesheets [X1].
  The skip link was found again by the merge-step re-probe, which served as its positive control
  [K1].
- Structure: hero carousel of current releases, then "Explore Xbox" with Game Pass / Games /
  Devices / Accessories / Play entry points [X1].

## Xbox PC app changes since 2024 (from Xbox Wire)

- **Aggregated library, June 2025.** The Xbox PC app's library started listing installed games from
  other PC stores (Battle.net and others) alongside Xbox and Game Pass titles, with a "Most recent"
  sidebar section and a setting to hide individual storefronts; games show which store they come
  from [X2]. Xbox said the same library would appear in the new full screen experience on the ROG
  Xbox Ally handhelds that holiday [X2].
- **September 2025 update.** Rolled out "My apps" (launch third-party apps such as browsers and
  storefronts from the Xbox app), play history across devices, cleaner Game Bar social widgets in
  compact and desktop modes, better controller navigation in the overlay, a network quality
  indicator, and a Rewards hub rebuilt for every screen size including handhelds, with progress
  "Goal Cards" [X4]. Xbox described the result as smoother "across all screen sizes, including
  handhelds" [X4].
- The ROG Xbox Ally handhelds launched globally on 2025-10-16 [X4], carrying the full screen
  experience described in June [X2].

## Techniques worth noting

- **One library across sources**, with a small badge for where each item comes from [X2].
- **Same content, several shells**: desktop window, compact overlay, full-screen handheld [X2, X4].
- **Progress made visible** (Goal Cards) as a first-class UI element [X4].
- **Reduced motion and color scheme handled in CSS**, plus a skip link, on the marketing site [X1].
- **Pill CTAs and a neutral system face** (Segoe), with the brand carried by one accent color [X1].

## Relevance to Project Defeat

The "badge for where it comes from" idea fits item rows (drop source: raid boss, badge vendor,
crafted, reputation) in a single list [X2]. Goal Cards are a close cousin of an attunement or
profession-progress tracker [X4].
