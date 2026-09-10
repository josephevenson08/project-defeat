# Project Defeat — Hosting & State Architecture

Context doc for anyone (human or Claude) picking up work on Project Defeat's deployment. Covers the decisions around statelessness, hosting, and remote access.

## Summary

Project Defeat is deployed as a **static, backend-free site** on Joseph's home Raspberry Pi (the same Pi running [[TunezBot]]). There is no database, no accounts, and no persistent server-side storage. All in-progress work (e.g. filling out a 25-man raid roster) lives only in the browser for the duration of that browser session.

## Decision: No Backend, No Database

Explicitly ruled out:
- User accounts / sign-in
- A database or any server-side persistence layer
- Anything that requires the Pi to run a stateful process for this app

Reasoning: this keeps the Pi's footprint for the site to "serve some static files," which is trivial to run 24/7 alongside TunezBot, and removes any need to think about backups, migrations, or data retention for user data.

## State Management: Session-Scoped, Browser-Native

**Requirement:** if someone reloads the page mid-way through building a raid roster, their progress should still be there. If they close the browser (or the tab, depending on final implementation), the data should reset — no trace left behind, no opt-in/opt-out needed from the user.

**Mechanism: `sessionStorage`**, not `localStorage`.

| | `sessionStorage` | `localStorage` |
|---|---|---|
| Survives page reload | Yes | Yes |
| Survives closing the tab/browser | No — cleared automatically | Yes — persists indefinitely |
| Scope | Per-tab | Per-origin, shared across tabs |
| Needs manual cleanup / TTL logic | No | Yes |

`sessionStorage` gives the exact "resets when you close the browser" behavior for free — no custom TTL/expiry logic needs to be written or maintained.

**Implementation approach:**
- Wrap the roster/planner state in a `useSessionStorage` hook that mirrors `useState` but reads/writes to `sessionStorage` on every change (same pattern as a `useLocalStorage` hook, just swapping the storage object).
- Every planner surface (raid roster builder, gear planner, etc.) uses this hook instead of plain `useState` for anything the user would be annoyed to lose on reload.
- Known trade-off: `sessionStorage` is per-tab. If someone opens the roster planner in two tabs, the two tabs won't sync. Acceptable for a personal/small-group tool — not worth solving unless it becomes a real complaint.
- No writes to disk, no cookies, no server round-trip involved in any of this — it's 100% client-side JavaScript.

## Hosting Architecture

- Build the app for production: `npm run build` → static HTML/CSS/JS output.
- Serve that static output with **nginx** on the Raspberry Pi.
- No Node process needs to stay running for this app (unlike TunezBot) — nginx serving static files is about as cheap as it gets, RAM- and CPU-wise, so it comfortably shares the Pi 4 1GB with TunezBot's Discord bot process.
- No PM2 entry needed for the site itself; nginx runs as a system service.

## Secure Remote Access

- **Cloudflare Tunnel** (`cloudflared`) runs on the Pi and exposes the nginx site via a subdomain (e.g. `defeat.yourdomain.com`), with Cloudflare handling HTTPS automatically.
- No port forwarding, no exposed IP, no open ports on the home router.
- One `cloudflared` instance on the Pi can host multiple routes if needed later — this doesn't conflict with TunezBot, which only makes outbound calls to Discord and doesn't need a tunnel at all.
- **Current visibility: private.** The link isn't being widely shared yet. Plan is to keep it low-key until the companion in-game addon (for WoW TBC Anniversary) is further along, at which point Joseph may open it up more broadly as a shareable link.

## Future: In-Game Addon Integration

Joseph is planning a companion WoW addon that will interface with this site down the line. No architecture decisions have been locked in for that yet — noting it here so future work on hosting/state doesn't accidentally paint the site into a corner (e.g. don't build anything that assumes the site can *never* talk to an external client — the addon will likely need some kind of read/write path eventually, even if the web roster planner itself stays sessionStorage-only).

## Deployment Notes

- Runs on the same Raspberry Pi 4 (1GB) as TunezBot.
- Static serving requires no meaningful additional RAM/CPU beyond what TunezBot already uses.
- Reuses the same base OS/network setup already done for TunezBot; no new SSH, user, or system-level setup required beyond installing nginx and cloudflared.
