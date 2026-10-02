# GOG (formerly part of CD Projekt): gog.com and GOG GALAXY

Looked at: 2026-10-01. Session 2, batch A. Sources are listed in `../sources.md` (IDs NA23 to NA28).

GOG was sold by CD Projekt to its co-founder Michał Kiciński in December 2025; GOG said GALAXY stays
optional and libraries and installers do not change [NA28]. It is filed here under GOG.

## What I saw on the live site (2026-10-01)

Inspected in the Claude browser pane in my own tab, viewport `innerWidth` 1024 px. Computed styles and
DOM read by script; **no screenshot** (pane hidden). A cookie banner was present on gog.com and an
age-confirmation overlay on the product page; I accepted neither and read the page underneath
[NA23, NA24].

**Dark store, one house face.** Body `rgb(33,33,33)` with many pure-black blocks, near-white text, and
a single custom face, **Lato GOG** (plus a `gog-icons` icon font) for everything [NA23]. Headings are
sentence-case, 24 px 700 on the home page and 32 px 700 for the product title [NA23, NA24].

**Colour by action, small radii.** "Add to cart" is lime green `rgb(157,214,48)` with dark text and a
**6 px** radius; "Wishlist it" is a translucent white 4 px button; "JOIN GOG" is purple
`rgb(165,36,171)` at 4 px; dialog buttons are 5 px [NA23, NA24]. So GOG sits at the low end of the
"rounded storefront" range: 4 to 6 px, not pills [NA23, NA24].

**Navigation.** Top bar: GAMES, ABOUT, COMMUNITY, SUPPORT, cart, SIGN IN, JOIN GOG [NA23]. A second
row of links promotes GOG's own programmes: GALAXY, Patrons, Dreamlist, Game Preservation and
One-click Mods [NA23]. The search field reads "Search games" [NA23]. Home sections include large
"spot" banners, preservation news with a link to the Patrons hub, New releases, GOG Mods and
Bestsellers [NA23]. Products carry labels such as "GOOD OLD GAME" and "SOON" [NA23].

**Product page: the trust strip.** Under the title, Dungeon Keeper 2 shows genre tags, a rating
with its sample size ("4.5/5", 1392 reviews), languages, and a sale end time with its time zone
[NA24]. The price block adds "Lowest price in the last 30 days before discount" [NA24]. Below the buy
buttons a strip states the game was brought "up to today's standards" by the Preservation
Program, links a **"GOG Version Changelog"**, and lists "Windows 11 verified", tech support and
"Lifetime Maintenance" [NA24]. A "Buy series" box offers the whole series [NA24].

**Build and accessibility signals.** An Angular app (`app-root`, `router-outlet`) with custom elements
such as `product-price`, `add-to-cart-button` and `big-spot-v2`, and 27 shadow roots [NA23]. No skip
link found; 0 `prefers-reduced-motion` and 2 `prefers-color-scheme` rules in readable CSS, but 4
sheets were unreadable and shadow roots were not searched, so reduced-motion is *unverified*
[NA23].

## Changes since 2024

- **Preservation Program, November 2024.** GOG began marking maintained classics "Preserved by
  GOG"; it launched with 100 titles and the post now says 267 [NA25]. The live product page turns
  this into a visible trust strip and a per-game changelog [NA24].
- **Dreamlist, January 2025.** A community voting page for games people want brought to GOG,
  replacing the old community wishlist [NA27, 2025-01-30]. It came to GALAXY in version 2.0.86
  Beta on 2025-07-09 [NA26].
- **GALAXY client, 2025 to 2026** (from GOG's own changelog) [NA26]:
  - 2.0.81 Beta, 2025-04-07: a new **"Discover" view becomes the default start page**; a
    redesigned leaderboards widget; screen-reader accessibility improvements.
  - 2.0.89 / 2.0.90 Beta, October 2025: **gamepad navigation** for the sidebar, library and
    downloads, with a setting to turn it off.
  - 2.0.91 Beta, 2025-12-01: **redesigned Power Search** with prices, discounts, store and
    library in one place, opened with Ctrl/Cmd+F or a gamepad button.
  - 2.0.97 Beta, 2026-04-08: GOG Patrons banner on Discover, and the Patrons hub, settings and
    subscription inside GALAXY.
- **Ownership change, December 2025** (see top) [NA28].

## Techniques worth noting

- **Provenance as a selling point:** a per-game version changelog, "verified" platform, rating
  with review count, 30-day lowest price and a sale end time with time zone [NA24].
- **Programme links in the main nav** (Preservation, Dreamlist, Mods) [NA23].
- **Search as a power tool in the client:** one command-style search across store and library,
  with a keyboard shortcut [NA26].
- **Controller-first navigation added to a desktop client** in 2025 [NA26].

## Relevance to Project Defeat

GOG's product page is the strongest example in this batch of printing context next to data: the
changelog link, the sample size and the time zone each answer "how sure is this?" without a click
[NA24]. GALAXY's Ctrl/Cmd+F Power Search, which mixes store and library results, is a second case
of the search-first pattern [NA26].
