# Payload audit: what this app ships, and what it could stop shipping

**Run 2026-09-27 against `c1e23c0`.** An audit of size in two separate senses — the bytes a visitor
downloads, and the lines a developer reads — because in this project they are almost unrelated.

> **Nothing here has been changed yet.** This is the survey. Each item says what it would save, what
> it would cost, and how to check afterwards that it actually saved it.

## The distinction that decides how to read this

`npm run build` runs `tsc -b && vite build`, which minifies the JavaScript and the CSS, strips every
comment, mangles local names and tree-shakes unused exports.

So **this repo's commenting practice costs a visitor nothing.** `global.css` is 189,249 bytes of
source and 108,942 with its comments removed — and the shipped stylesheet is **89,060 bytes either
way**. The same holds for every docblock in `src/`. No item in this audit proposes removing a comment,
shortening a name, or collapsing formatting, because none of that reaches anybody.

What does reach people is code that ships without being reached, data that ships in full when a
fraction is read, and images larger than the box that draws them.

## The baseline

```bash
npm run build
for f in dist/assets/*; do echo "$f raw=$(wc -c < "$f") gz=$(gzip -9 -c "$f" | wc -c)"; done
```

| File | raw | gzip -9 |
|---|---|---|
| `dist/assets/index-*.js` | 3,066,842 | **588,861** |
| `dist/assets/index-*.css` | 89,060 | 15,293 |
| `dist/index.html` | 509 | 313 |

**One chunk.** `grep -rn "React.lazy\|lazy(\|Suspense" src --include=*.tsx` returns **0**, and the
build emits exactly one `.js`. Vite says so itself: *"Some chunks are larger than 500 kB."*

Two framing facts:

1. **On-disk JSON size is mostly pretty-printing, which Vite strips.** `nodeSpawns.json` is 977,231
   bytes in the repo and **175,112** in the bundle. Judge data by its bundle span, never by `ls -l`.
2. **`public/` assets are separate per-screen fetches**, not part of the 588 KB. Image savings are raw
   bytes on the screen that draws them, and JPEG/WebP do not gzip further.

Where the bundle actually goes:

| | raw in chunk | marginal gzip |
|---|---|---|
| `src/domain/gear/itemCatalogue.json` | 1,244,093 (40.6%) | **175,235 (29.8%)** |
| 9 × `*Talents.json` | 268,228 | 44,900 |
| `node_modules/react-dom` | 178,368 | 54,229 |
| `src/domain/professions/nodeSpawns.json` | 175,112 | 53,993 |
| `src/domain/bis/bisRankings.json` | 160,268 | 14,290 |
| `src/domain/icons/icons.json` | 134,841 | 26,270 |
| `src/domain/professions/craftingPaths.json` | 75,710 | 11,400 |
| `node_modules/animejs` | 30,441 | 12,767 |
| `node_modules/lucide-react` | 1,440 | 619 |

## Ranked findings

### 1. Split the panels out of the landing chunk — an estimated 424 KB gzipped, 72% of the download

A visitor who opens the front page and picks nothing currently downloads the entire 4,505-item
catalogue, nine talent trees and 45 herb and mining node sets **before six cards can draw**.

`App.tsx` already gates every panel — `{currentTab === 'raidcomp' && <RaidCompositionPanel />}` — and
returns early for the section picker, so the render sites need no rework. Thirteen static imports
become `lazy(() => import(…))` with one `<Suspense>` in `AppShell`.

| | |
|---|---|
| **Saving** | Entry chunk **588,861 → ~164,000 gzipped**. |
| **Confidence** | The direction is certain; the figure is an **upper bound**. It was measured by removing the panels' byte ranges from the built chunk and re-gzipping, which is not the same as a real split — genuine chunking adds per-chunk overhead and may duplicate shared code. Treat ~164 KB as the floor of what is achievable, not a promise. |
| **Cost** | A loading state per panel transition, and Playwright sequences that click-then-assert will need `await expect(...).toBeVisible()`. |
| **Verify** | `npm run build` prints several chunks; the entry chunk's gzip lands near 164 kB. Then the full suite. |

**Do not chase the catalogue below this.** Its 175 KB gzipped is genuinely needed by the gear, BiS,
compare and simulator path. Moving it off the *landing* screen is the whole win; shrinking it further
means dropping items.

### 2. Use the `backdrop.webp` that is already in the repo — 190,131 bytes on the first screen

```bash
ls -l public/backdrop.*      # jpg 525,425   webp 335,294
git ls-files public/backdrop.webp   # tracked
grep -rn "backdrop" src/ index.html # only backdrop.jpg is read
```

`SectionPicker.tsx:97` loads `backdrop.jpg`. The WebP beside it is **36% smaller and 88px wider**
(1536×1024 against 1448×1086), tracked in git, and referenced nowhere. This is a one-line change and
the best bytes-per-risk in the audit.

Two comments go stale with it — `SectionPicker.tsx:112` and `global.css:6257` both name the `.jpg`.

Failure degrades safely: the picker already treats the file as optional and falls back to its drawn
gradient.

### 3. Re-encode `public/raids` as WebP — 2,135,317 raw bytes, 39%

All 18 files re-encoded at q82 as a measurement, not an estimate: **5,438,333 → 3,303,016**. Pixel
dimensions unchanged, so the existing "no image is painted larger than its file" invariant is
untouched. `prepare-boss-art.mjs` already encodes through Playwright's Chromium, which can emit WebP,
so the tool changes rather than the pipeline. `bossArt.json` keys off boss ids, so the extension
change needs a sweep there.

### 4. Crop the boss panels to the shape the card actually shows — 1,615,523 raw, or 2,338,985 with WebP

`.raid-boss-card` is `aspect-ratio: 2.6` painted with `background-size: cover`, and the files are
1195×896 (aspect 1.33). At a ~1040px card, **49% of every file's height is decoded and thrown away.**

This applies only to the 13 encounters that have art; since 2026-09-26 the ones without render as a
text row. Cropping bakes in what `background-position: center 30%` currently chooses at paint time,
so it is the one item here with real composition risk — worth an eye on each of the 13 rather than a
blind batch.

**Related inaccuracy:** `prepare-boss-art.mjs` sets `MAX_WIDTH = 1200`, justified in its comment as
"twice the 582px card". The card is not 582px any more; `global.css` has these running the full width
at roughly 1040px, so 1200 is about 1.15× the box. The constant may still be right — its stated
reason is not.

### 5. Drop `animejs` for `Element.animate()` — 12,767 gzipped

`src/lib/animations.ts` imports one function and uses it six times, for opacity, translateY and scale
tweens of 220–520 ms, all `easeOutQuad`. Every one is a two-keyframe Web Animations call, and the
module already gates on `prefers-reduced-motion` itself. Seven call sites. `easeOutQuad` becomes
`cubic-bezier(0.5, 1, 0.89, 1)`, and `animateStatUpdate` takes a `NodeList`, so that one becomes a
loop.

### 6. Sweep 45 more dead CSS classes — 5,065 raw / 896 gzipped, ~459 source lines

Yesterday's sweep removed 454 lines by checking each class against `src/`. A fresh crop remains, and
one of them exposes the blind spot in that method.

**The only class names built at runtime in this codebase are three:** `socket-${colour}`,
`gem-frame-${quality}` and `stat-${layout}`. Everything else that looks like a runtime prefix —
`profession-${…}`, `raidcomp-${…}`, `talent-${…}`, `creator-option-${…}` — is a **`data-testid`, not
a class**. A sweep that treats those as live class prefixes keeps dead rules forever.

The largest group is the `raid-boss-*` / `raidcomp-*` / `raids-*` cluster, consistent with the raids
and rail reworks orphaning their old markup.

**Honest scale: 896 gzipped bytes is 0.15% of what a visitor downloads.** This is a clarity win, not
a payload one.

### 7. Delete `src/features/stats/StatsPanel.tsx` — 0 shipped bytes, 36 dead source lines

Referenced by nothing, not even tests; the app renders `StatBar` instead. Rollup already tree-shakes
it, so it costs a visitor nothing — but **it is what kept `.stats-grid` and `.stat-tile*` looking
alive to a class-name grep**, because the names really are present in `src/`, in a file that no import
reaches. Deleting the component is what makes item 6's last entries provably dead.

### 8. Regenerate the item catalogue without `extraStats` — 11,510 raw / ~1,775 gzipped

284 of 4,505 items carry the field. `toGearItem` copies 19 fields and this is not among them, so it is
parsed, retained in memory and never read. Low priority: it is provenance a later feature might want,
and this repo's convention is that recorded data earns its keep.

### 9. Prune 54 stale `icons.json` entries — 1,495 raw / 321 gzipped

Ids matching no entry in any catalogue. Real, negligible, listed for completeness.

### 10. Three unreachable declarations

- `.raidcomp-buff-card` sets `display: grid` and then `display: none` in the same block. The `none` is
  correct and documented; the `grid` above it can never apply, and the reveal rule re-declares it
  anyway.
- `.loading-intro span` sets `font-size: 13px` and then `font-size: var(--label-size)`. Reads like a
  token migration that left the old literal behind.
- Seven properties re-declared with identical values across duplicated selectors, and two
  media-query declarations identical to their base rule.

## Already fine, with the numbers

- **`public/icons` is not bloat and is smaller than it looks.** `du` says 8.8 MB; the real total is
  **3.39 MiB across 1,972 files** — the gap is 4 KB filesystem blocks under ~1.8 KB average files.
  Every file is exactly 56×56, which is what the suite already pins. 1,956 of 1,972 are named in
  `src/`. WebP would save ~400 bytes per lazy-loaded request against churning 1,972 tracked files.
- **`public/maps` is already efficiently encoded.** 41 files, 3,355,353 bytes. Re-encoding five
  samples to WebP gave **97.4% of the original** — one got bigger.
- **`nodeSpawns.json` looks enormous and is not.** 977,231 on disk, 175,112 in the bundle.
  Re-rounding its coordinates changed the minified size by **zero bytes**.
- **`lucide-react` has already tree-shaken to nothing.** 1,440 raw / 619 gzipped for the one icon two
  files import. Inlining the SVG saves ~600 bytes — below noise.
- **All four vendored fonts earn their place.** 93,616 bytes, latin-subset, `font-display: swap`, and
  every weight the stylesheet asks for is used.
- **The stylesheet is already small where it counts.** 7,366 source lines, but **15,293 gzipped** —
  2.6% of the download. `!important` appears four times: three inside a reduced-motion block where it
  is the right tool, and once in a comment explaining why the file avoids it.
- **`react-dom` at 54,229 gzipped is the floor** and not negotiable without changing frameworks.

## How these numbers were arrived at

The audit was run by a `payload-auditor` subagent ([`.claude/agents/payload-auditor.md`](../../.claude/agents/payload-auditor.md))
and then checked. Independently re-measured before publishing:

- the full baseline table — **matches byte for byte**;
- the single-chunk claim (0 lazy imports, 1 emitted `.js`);
- `backdrop.webp`'s size, dimensions, tracked status and absence from the source;
- `StatsPanel.tsx` having no importer anywhere, and `.stat-tile` appearing nowhere else;
- six of the 45 dead classes, including the two the audit itself flagged as risky;
- `extraStats` appearing 284 times in the catalogue and never in `itemCatalogue.ts`;
- both unreachable declarations, and that the buff card's reveal rule re-declares `display: grid`.

**Not independently re-measured:** the image re-encoding figures in items 3 and 4, and the per-module
bundle spans in the table above. Those come from the audit's own runs and are recorded as reported.

**One methodological caveat carried forward:** a raw source-map rollup mis-attributes JSON modules —
it credited 1,436,028 bytes to a 354-byte `Button.tsx`, because a JSON module's bytes fall to the
preceding mapping. The data figures here were measured by locating each blob's content span instead.
Directory rollups for `.ts`/`.tsx` are trustworthy; JSON attributions in a source-map rollup are not.
