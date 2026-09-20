---
type: module
layer: domain
source: src/domain/builds/shareLink.ts
lines: 170
generated: true
tags: [brain/architecture, layer/domain]
---

# domain.builds.shareLink

`src/domain/builds/shareLink.ts` · **domain** layer · 170 lines

From the top of the file:

> A whole build in a URL, so a build made on one machine opens on another from a link.
> 
> Builds were browser-local — named saves live in `localStorage`, which does not follow you from the
> desktop to a phone — and the only way across was copying a JSON blob by hand. A link needs no
> server: everything is in the address, which is what keeps this app local-first.
> 
> **It lives in the fragment (`#build=`), not the query string.** A fragment never leaves the browser —
> GitHub Pages is never sent it, so a shared build is not in anyone's access log — and it cannot
> collide with `?simulation=1`.
> 
> **Compressed, because a plain link does not fit where people paste them.** Measured on the fullest
> realistic build — every slot filled, 26 gems, twenty buffs, talents spent — the JSON is 3,171 bytes:
> 4,228 characters as plain base64url and 1,424 deflated. Discord caps a message at 2,000, and sending
> a build to a raid leader is the case this is for. `CompressionStream` is built into every browser
> this app targets, so it costs no dependency.
> 
> The value is `<encoding>.<payload>`. Encoding `1` is deflate; `0` is the same JSON uncompressed,
> written only where `CompressionStream` is missing and always readable. The build inside carries its
> own format version, and decoding goes through `validateBuild` — the same checks a pasted build gets —
> so a link is exactly as trusted as an import, which is to say not at all until it is checked.

## Exports

**function** — `decodeBuildFromLink`, `encodeBuildForLink`, `readShareValue`, `shareUrlFor`

**const** — `SHARE_HASH_KEY`

## Imports

- [[domain.builds.buildSerialization]] — `src/domain/builds/buildSerialization.ts`
- [[domain.builds.buildTypes]] — `src/domain/builds/buildTypes.ts`

## Imported by

- [[App]] — `src/App.tsx`
- [[features.builds.BuildPanel]] — `src/features/builds/BuildPanel.tsx`

## Concepts & phases

- [[Phase 5 - Planner Workflows]]

Up: [[Architecture Map]]

<!-- brain:manual -->

## Notes

_Anything you write below the marker above is kept when the brain is regenerated._
