# Project brain (Obsidian vault)

The repo root doubles as an Obsidian vault. `brain/` holds a generated, cross-linked note network that
Obsidian's graph view renders as a live map of the project:

- **Architecture/** — one note per source module with its real import and importer edges, so the graph
  of that folder *is* the dependency graph.
- **Domain/** — the TBC knowledge wiki: classes, specs, roles, races, raids, bosses, attunements,
  professions, and concept notes for the mechanics (attack table, spell coefficients, stat weights).
- **Project/** — roadmap phases, decision log, data provenance, known limitations.

```bash
npm run brain
```

Regenerate any time. The generator reads the actual source tree and the actual domain data, so the
vault cannot drift from the code — for anything it actually derives. Prose written *into* the
generator is not derived and has gone stale before, so counts and coverage figures there are
computed rather than typed. It is idempotent, it fails on a broken wikilink, and anything you
write below the `<!-- brain:manual -->` marker in a note is preserved. Start at
`brain/Project Defeat Brain.md`; see `brain/Project/Vault Guide.md` for the details.

