# Square Enix: Final Fantasy XIV promotional site and The Lodestone

Looked at: 2026-10-01. Session 2, batch A. Sources are listed in `../sources.md` (IDs NA19 to NA22).

## What I saw on the live sites (2026-10-01)

Inspected in the Claude browser pane in my own tab, viewport `innerWidth` 1024 px. Computed styles and
DOM read by script; **no screenshot** (pane hidden), so key art and image-based buttons are not
described.

### The Lodestone (na.finalfantasyxiv.com/lodestone/)

**A long-lived, dense portal.** Body text is **12 px Arial/Verdana** with Japanese fallbacks
(Meiryo, Hiragino Sans), light grey on a charcoal frame (`rgb(63,67,69)`), and content panels in
pale grey (`rgb(238,238,238)`) with dark text [NA19]. Section heads ("Special Notices", "News",
"Topics") are only 14 px bold Arial; topic headlines are 18 px in a green (`rgb(107,153,61)`)
[NA19]. This is the densest page in my batch, closer to a 2000s portal than to the
marketing sites around it [NA19, NA20].

**Navigation.** A single dark bar of square (0 px) tabs in Noto Sans 700: News, Getting Started,
Play Guide, Community, Standings, Help & Support, with "View Your Character Profile / Log In" above
it [NA19]. The language selector is a rounded (10 px) dark chip [NA19]. A search box is present
[NA19].

**News sorted by type, dated in the reader's time zone.** The news block has tabs for Latest,
Topics, Notices, Maintenance, Updates and Status; the top tabs are blue with 4 px top corners only
[NA19]. Each item carries a type tag such as "[Important]" and a date [NA19]. The dates are not
printed by the server: each is an inline script that turns a Unix timestamp into a local date
(`ldst_strftime(…, 'YMD')`) [NA19]. Headlines themselves carry version context, for example
"Patch 7.56 Notes" [NA19]. A right column holds "Community Wall" and "Standings" [NA19].

**Not built for phones at this URL.** The Lodestone page has **no viewport meta tag**, while the
promotional site does; I did not test whether a separate phone layout is served to mobile user
agents, so mobile behaviour is *unverified* [NA19, NA20].

### Promotional site (na.finalfantasyxiv.com)

- Same charcoal top strip as the Lodestone, then marketing sections with **Noto Serif** headings:
  21 px bold white over imagery for the four feature blocks, and a 48 px weight-900 dark heading
  ("Begin Your FINAL FANTASY XIV Journey Today") on a light band near the bottom [NA20].
- The two main CTAs, "Start for Free" and "Buy the Full Game", are image-plus-label links whose
  corners are **asymmetric (24 px top-left, 8 px top-right)**; the free-trial one draws a green
  gradient (`rgb(163,204,41)` to `rgb(140,191,38)`) in a pseudo-element [NA20].
- Responsive viewport meta present [NA20].

**Accessibility signals (both pages).** No skip link; 0 `prefers-reduced-motion` rules found, but 11
of 12 stylesheets on the Lodestone and 3 of 4 on the promo site were unreadable cross-origin, so
this is *unverified* [NA19, NA20].

## Changes since 2024 (from the Lodestone's own update log)

The Lodestone keeps a public, dated changelog of the site itself [NA21]. Entries in the window
include:

- **2025-04-22:** a Cosmic Exploration site with guides and **world project status tracking**
  [NA21].
- **2025-08-05:** Lodestone community activity can now trigger **notifications in the Companion
  App** [NA21].
- **2025-10-07:** rankings for the new deep dungeon added [NA21].
- **2025-05-27, 2025-12-16, 2026-04-28, 2026-09-08:** character profiles extended in step with
  patches (new progression stats, an Emotes page, a Master's Bestiary for the new job) [NA21].
- **2026-08-04:** game manual and UI guide updated for the Nintendo Switch 2 version [NA21].
- **2026-09-08:** Crucible rankings added to the Standings menu [NA21].

Most other entries are database, job-guide and UI-guide refreshes tied to a named patch [NA21].
I found no visual redesign of either site in the window: archived copies of the promotional
site from 2024-03-01 and 2025-03-07 carry the same title and free-trial links [NA22], and the Lodestone's
log lists content changes only [NA21]. Visual continuity since before 2024 is therefore my
reading, not a stated fact [NA21, NA22].

## Techniques worth noting

- **A public changelog for the website itself,** dated and tied to game patches [NA21].
- **Character profile pages that grow with each patch** (new stats and pages) [NA21].
- **News split by type** (Topics, Notices, Maintenance, Updates, Status) with type tags and
  **local-time dates** [NA19].
- **Serif display face for the marketing layer; plain sans for the portal** [NA19, NA20].

## Relevance to Project Defeat

The Lodestone is the closest official analogue in this batch to what Project Defeat does: character
profiles, standings and a database kept in sync with patches [NA19, NA21]. Its changelog that names
the patch each change follows is a cheap way to show provenance [NA21]. Its 12 px text and missing
viewport meta are the parts not to copy [NA19].
