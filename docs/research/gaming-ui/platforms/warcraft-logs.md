# Warcraft Logs / Archon

Looked at: 2026-10-01 (session 1; Archon sources re-checked in the merge step). Source IDs refer to
`../sources.md`.

## What I saw (2026-10-01)

- **Could not load.** `www.warcraftlogs.com` redirected to a "Human Verification" challenge page,
  and `www.archon.gg/wow` did the same [WL1]. Completing or bypassing a bot check is out of bounds
  for this research, so I stopped there. WebFetch of `fresh.warcraftlogs.com` returned HTTP 403. In
  the merge step an archon.gg news article also showed the verification page.
- **I therefore have no 2026 observation of the Warcraft Logs UI** and do not describe its layout.

## Changes since 2024 (from dated sources)

- **Archon App, 2026.** Wowhead reported in March 2026 that the Archon App records gameplay for
  review [WL4], and in June 2026 that the Warcraft Logs uploader would move to the Archon App on
  2026-06-29 [WL5]. Both Wowhead article bodies did not load, so these are headline-level claims.
- A fan blog adds that the recording is synced to the combat log and that a "Lite" version keeps the
  plain upload-only workflow; those details are *unverified* [WL2].

## Background (pre-2024, context only)

- The parent company RPG Logs rebranded as Archon in October 2023 [WL3].

## Techniques worth noting

- **Full and Lite modes** of the same tool, so heavy features do not burden users who want the
  basics (*unverified*) [WL2].
- **Gameplay recording beside the data** as a review surface [WL4].

## Relevance to Project Defeat

This platform contributes little evidence to the trends because the site itself could not be
inspected [WL1].
