---
type: design
generated: true
tags: [brain/project, project/design]
---

# Prototype Publishing

_The prototypes are published beside the app on GitHub Pages, and checked in a real browser._

**Published (2026-10-10):** the deploy copies the prototypes into the built site after `npm run build` (`tools/publish/copy-prototypes.mjs`), so the gallery is at https://josephevenson08.github.io/project-defeat/prototypes/. It leaves out the checks, the page generators and the notes. The pages pick their icon folder from where they are opened: the repo's `public/icons/`, or the app's own published `/icons/`. The app does not link to the prototypes.

**Checks** live in `docs/design/prototypes/tabs/checks/` and run Playwright on the system's Edge, from the repo root:
- `published.mjs` opens the gallery and every page it links to as the site serves them, and checks every icon comes back as an image. `BASE=` points it at the live site.
- `check-bg.mjs` runs every tab at 1280px, at 400px, with reduced motion and with WebGL off.
- `gear`, `compare`, `talents` and `buffs-handson.mjs` press every control of each design (`p` for the planner's chosen tab); `rc-handson.mjs` and `rc-taps.mjs` do Raid Composition, including phone tap sizes.

**To look at them locally:** the `prototypes` server in `.claude/launch.json` serves the repo on port 8765; open `/docs/design/prototypes/index.html`.

## Documents

- [[docs/design/prototypes/tabs/README|Tab prototypes, with the publishing details]] — `docs/design/prototypes/tabs/README.md`

## Related

- [[UI Refresh]]
- [[Tab Prototypes]]

Up: [[UI Refresh]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
