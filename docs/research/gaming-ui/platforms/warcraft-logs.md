# Warcraft Logs / Archon

Looked at: 2026-10-01. Source IDs refer to `../sources.md`.

## What I saw (2026-10-01)

- **Could not load.** `www.warcraftlogs.com` redirected to a "Human Verification" challenge page,
  and `www.archon.gg/wow` did the same [WL1]. Completing or bypassing a bot check is out of bounds
  for this research, so I stopped there. WebFetch of `fresh.warcraftlogs.com` returned HTTP 403.
- **I therefore have no 2026 observation of the Warcraft Logs UI** and do not describe its layout.

## Changes since 2024 (from dated sources)

- **Uploader replaced by the Archon App, June 2026.** The old Warcraft Logs uploader was retired on
  June 29, 2026 in favour of the Archon desktop app, which can record gameplay video and sync it to
  the combat log for faster review after each pull; a "Lite" version keeps the plain upload-only
  workflow [WL2, 2026-06-07].
- The team said a fresh visual identity and new MMO tools were coming, without an immediate change
  to the log sites (as summarized by search results around the rebrand; the Wowhead article body
  did not load) — *unverified* detail.

## Background (pre-2024, context only)

- The parent company RPG Logs rebranded as Archon in October 2023 [WL3, 2023-10-03].

## Techniques worth noting

- **Full and Lite modes** of the same tool, so heavy features do not burden users who want the
  basics.
- **Video synced to data** (replay next to the numbers) as the new review surface.

## Relevance to Project Defeat

The full/Lite split is a known pattern for keeping a dense tool approachable. Beyond that, this
platform contributes little evidence to the trends because the site itself could not be inspected.
