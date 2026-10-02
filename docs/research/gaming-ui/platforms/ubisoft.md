# Ubisoft: ubisoft.com, a franchise game page, Ubisoft Connect

Looked at: 2026-10-01. Session 2, batch A. Sources are listed in `../sources.md` (IDs NA8 to NA12).

## What I saw on the live site (2026-10-01)

Inspected in the Claude browser pane in my own tab, viewport `innerWidth` 1024 px. Computed styles and
DOM read by script; **no screenshot** (pane hidden, capture timed out). The first load of the home
page rendered **unstyled** (Times New Roman, no stylesheets applied); a reload four seconds later
loaded all sheets, and the figures below come from that second load [NA8].

**Publisher hub (ubisoft.com/en-us).** The body is near-black (`rgb(13,13,13)`) with Open Sans body
text; section headings ("Trending games", the sale banner) use the in-house **Ubisoft Sans** at 24
to 32 px, weight 700, near-white [NA8]. Every primary CTA I sampled ("Shop now", "Play now", "Get
Ubisoft Connect") is a **pill** (computed radius 10000 px) in bright blue `rgb(0,110,245)` with
white 14 px Open Sans 700 text [NA8]. The home page leads with a promotional banner, then news cards,
then a "Trending games" rail [NA8].

**Global navigation as a web component.** The header is a `<global-navigation>` element (attribute
`render-search="true"`) whose links live in a shadow root; the footer is a `<global-footer>`
element [NA8]. Inside the nav's shadow root: a **"Skip to main content"** link, then Games, Help,
Store and Ubisoft+ [NA8]. The Games menu offers "Browse by category" (Featured, New to Old, Free To
Play) and "Browse by Platform" (PC, Xbox, PlayStation, Nintendo Switch, Virtual reality, Mobile),
plus a list of current titles [NA8]. A search field ("Search…") is present [NA8]. The same nav
element sits on the game page, so one header serves the hub and every franchise [NA8, NA9].

**Franchise game page (Assassin's Creed Shadows).** The page swaps to an in-world look on the
same domain: headings in a display serif loaded as **"portrait"**, **uppercase with wide tracking**
(40 px with 3.2 px letter-spacing on the game title; 56 px with 11.2 px on "LATEST NEWS"), body in
**Avenir**, black background [NA9]. Buttons are **square (0 px)**: a teal "Buy AC Black Flag
Resynced" button, and translucent red (`rgba(211,12,20,0.9)`) "LEARN MORE" / "WATCH THE TRAILER"
buttons [NA9]. An edition picker (Standard / Deluxe / Collector's) is a set of white tabs with
only the last corner rounded at 4 px [NA9]. A franchise sub-menu lists the other Assassin's Creed
games (Black Flag Resynced, Shadows, Mirage, Valhalla, "All AC Games") and News, so the page
offers a switch between titles in the series [NA9]. News cards are titled with update names and
version numbers, for example "AC Shadows Title Update 1.1.11" [NA9].

**Accessibility signals.** Skip link: yes (inside the shadow-DOM nav) [NA8]. My count of
`prefers-reduced-motion` rules was 0, but 7 of the home page's stylesheets were cross-origin and
unreadable, and shadow roots held no such rule in inline styles, so reduced-motion support is
*unverified* [NA8].

## Changes since 2024

- **ubisoft.com rebuilt, spring 2025.** Archived copies of the home page up to 2025-04-15 show no
  Next.js build; from 2025-05-01 on, every copy loads Next.js chunks from a
  `1wd-ubisoft-com` path, the same build the live site uses today [NA10, NA8]. The
  `<global-navigation>` element was present before and after the change [NA10]. I found no Ubisoft
  post or press article describing this rebuild, so its purpose and exact date are *unverified*;
  the window comes only from archive captures [NA10].
- **Steam players no longer need the Connect launcher (test), September 2026.** PCGamesN
  reported that a Prince of Persia: The Lost Crown update on Steam replaced the
  separate Ubisoft Connect client with a background tool, "Ubisoft Connect Services", that still
  handles cross-progression, challenges and rewards [NA12, 2026-09-10]. The report rests on an
  in-game message shared by players, not a Ubisoft press release [NA12].
- **Ubisoft Connect PC overhaul: background only.** The library redesign, player profiles and
  "one tech stack" for UI were announced on Ubisoft News on 2023-06-26 [NA11]. That is before this
  research window [NA11]. Some search summaries dated the rollout to January 2026; they came from an SEO
  site and are not used.

## Techniques worth noting

- **Neutral, rounded publisher shell; square, in-world franchise pages** on one domain and under
  one shared nav [NA8, NA9].
- **Display serif, uppercase and widely tracked** for franchise identity; a humanist sans for
  everything else [NA9].
- **Series switcher on the game page** (the other AC titles in a sub-menu) [NA9].
- **Shrinking the launcher footprint:** the Steam test moves Connect's account features into a
  background service [NA12].

## Relevance to Project Defeat

Ubisoft repeats the Blizzard split almost exactly: a dark, neutral hub with blue pill CTAs, and a
franchise page with a tracked uppercase serif and hard-edged buttons [NA8, NA9]. The AC page's
uppercase, wide-tracked serif headings over black are the closest match in this batch to the
app's Cinzel-on-dark look [NA9].
