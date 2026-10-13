/**
 * When the five raids' loot tables were read from Wowhead, as an ISO date, for the source line under
 * the top bar. `tools/ingest/ingest-raid-loot.mjs` records it in each `tools/ingest/data/raid-loot.*.json`
 * (all five were read the same day); a test checks this against those files, so a re-ingest that
 * forgets to move it fails rather than printing an old date.
 */
export const raidLootFetchedAt = '2026-09-13'
