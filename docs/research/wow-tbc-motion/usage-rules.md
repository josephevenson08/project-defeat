# What Project Defeat may and may not use (B1)

Track B, researched 2026-10-04. Sources are in `sources-b.md`; the search log is in `log-b.md`.
This is a reading of Blizzard's published terms for planning purposes, **not legal advice**. Where
a policy could not be found, that is said plainly rather than filled in.

## The short answer

| Use directly (credited) | Use only as inspiration (recreate in our own code) | Avoid |
|---|---|---|
| The words "World of Warcraft" and "The Burning Crusade" as plain text to say what the tool is for, with ® on first use and Blizzard's credit line | The *feel* of the Dark Portal, fel green, nether purple, naaru light, Serpentshrine water, Tempest Keep crystal: built from our own shaders, geometry and SVG | The Blizzard logo, the WoW logo, the TBC logo, the Classic logo, Blizzard key art and store banners |
| Item icons and zone map art already vendored, with the attribution kept on screen | Rune-circle and sigil *shapes* drawn by us, not traced from game textures | Game music and sound effects |
| Short factual text from the game (item names, stats, boss names) | Colour palettes and lighting moods taken from screenshots by eye | Ripping models, textures or particle sprites from the client |
| | | Any paid tier, ads around Blizzard content, or a name/URL that contains a Blizzard mark |

The rest of this page explains why, and where the evidence is thin. Each cell is argued in
sections 2-5 with sources. One cell rests on no document: no source found addresses short factual
game text (item names, stats), so that cell is our inference, not a cited rule.

## 1. Which document actually governs a fan site?

Blizzard's trademark guidelines say the marks may be used only for activities in the
User Generated Content area of Blizzard.com, and only when that activity's own policy grants the
right [TB1]. The same page names a "fan site" policy as one that grants it [TB1][TB1a]. I could
**not** find a current, standalone Blizzard fan site policy on blizzard.com in this pass; searches
returned the trademark guidelines, the Legal FAQ, the Video Policy and the EULA, but no fan site
document (`log-b.md`, queries Q1, Q2, Q3, Q5). Its existence and current wording are therefore
*unverified*.

What does exist and applies:

- The **Legal FAQ** says fan sites are allowed provided all copyright and trademark notices are
  kept, and not on sites with defamatory, pornographic or inflammatory content [TB2]. It permits
  screenshots on personal websites, and grants images, text and audio for home, non-commercial,
  personal use only [TB2]. It also says Blizzard can revoke these licences at any time [TB2].
- The **Logo and Trademark Guidelines** set the rules for names and logos (section 3) [TB1].
- The **website Terms of Use** cover material taken from Blizzard's own sites: personal use only,
  no downloading beyond page caching, no derivative uses, and notices must stay intact [TB4].
- The **EULA** (updated 2024-03-21) forbids derivative works of the platform except as Blizzard
  expressly allows, and forbids data-mining the platform with unauthorised software [TB5].
- The **Developer API Terms** apply only if the app calls Blizzard's APIs; they forbid Blizzard
  marks in the app's title or URL, require Blizzard to be named as the data source, and forbid
  paid tiers [TB6].

### A correction for the app's current credit line

`src/domain/professions/zoneMaps.json` credits the zone maps as used "under the Game Content Usage
Rules", and `docs/features.md` repeats it. "Game Content Usage Rules" is the name of **Microsoft's**
policy [TB8]. Its text says it covers games "published and owned by Microsoft Studios" and it
does not mention Blizzard [TB8]. The page is marked last updated January 2015 [TB8]. Whether Microsoft's rules now extend to World of Warcraft is *unverified*,
and nothing found on blizzard.com points to them [TB1][TB2]. Suggested wording that relies only
on what Blizzard publishes:

> Zone maps and item icons are Blizzard Entertainment artwork, used in a free, non-commercial fan
> project. World of Warcraft and The Burning Crusade are trademarks or registered trademarks of
> Blizzard Entertainment, Inc. Project Defeat is not affiliated with or endorsed by Blizzard.

(Our own text; the official credit line is in section 3.)

## 2. Art: icons, map art, screenshots, key art

- **Item icons and zone maps (already in the app).** The Legal FAQ's grant for images is personal
  and non-commercial [TB2], and fan sites are allowed if notices are kept [TB2]. A free GitHub Pages
  planner with no ads, visible credit and no claim of endorsement is the closest fit to that grant
  available; it is not an explicit licence for vendoring icon files, and that gap is *unverified*
  either way. Keep the credit on every screen that shows the art, keep the tool free, and remove
  the art promptly if Blizzard asks, since the licences are revocable [TB2].
- **How the icons were obtained matters.** The EULA bars mining the platform with unauthorised
  software [TB5]. `docs/features.md` says the icon *names* come from a pinned WoWSims commit and
  the artwork is vendored, but does not say where the image files themselves were downloaded from;
  record that provenance next to the attribution. Do not add a client-extraction step to the build.
- **Blizzard's web art** (wallpapers, key art, store and promotional banners, site backgrounds) is
  covered by the website Terms of Use: personal use only, no derivative uses [TB4]. Do not put it
  behind the 3D scene, and do not sample it for textures.
- **Screenshots** taken by the owner in game may appear on a personal website [TB2]. Using one as
  a still fallback for the WebGL scene is the least risky way to show real game imagery, with the
  credit line attached.

## 3. Names, logos and the credit line

- The **marks** (names such as World of Warcraft, The Burning Crusade) may be used by fan sites
  under the guidelines, non-commercially and only with high-quality material [TB1].
- Put the **® symbol** on the first appearance of each mark, e.g. World of Warcraft® [TB1].
- Use Blizzard's **credit line** for each mark used [TB1]. The guideline lists a TBC line naming
  The Burning Crusade, World of Warcraft and Warcraft as Blizzard trademarks [TB1]. Copy it
  verbatim from TB1 rather than retyping it. The copyright notice for TBC is dated ©2006 [TB3].
- **Logos.** Even where use is permitted, a logo may not be altered except to resize it [TB1]. A
  logo inside a glowing, animated, colour-shifted portal is an alteration, so **the TBC, WoW,
  Classic and Blizzard logos must not be animated or re-coloured** [TB1]. Because no current fan
  site policy was found to grant logo use at all (section 1), the safer line is: **no Blizzard
  logos anywhere in the app**.
- **Do not combine** a mark with our own name ("Project Defeat Warcraft") or use it in a domain
  [TB1][TB2]. The current name and the `github.io/project-defeat` URL contain no Blizzard mark.
- **No merchandise** with marks or confusingly similar marks [TB1].
- **No implied endorsement.** Say plainly that the project is not affiliated with Blizzard
  [TB1][TB6]. Icy Veins does this in its footer [TB34].

## 4. Music and sound effects

The Legal FAQ limits music and samples to personal use and creative exploration, not
distribution [TB2]. The Video Policy is the one document that clearly licenses music and sound in
community work, and its scope is videos only [TB7]. Microsoft's rules separately warn that game
soundtracks may carry third-party rights [TB8]. **Do not ship game music or sound effects.** If
the app ever gets audio, it should be original or properly licensed, off by default.

## 5. Motion that only *evokes* TBC (our own code)

Nothing in the documents above covers colours, moods or generic fantasy shapes, so a vortex
shader, ember particles, a green and violet palette or a hand-drawn rune ring written from scratch
is our own work (this is an inference from the absence of any such restriction in TB1-TB5, not a
statement any source makes). Three cautions:

1. **Don't trace.** A rune ring traced from a game texture or a portal silhouette traced from
   key art is a derivative of that art, which the website terms and EULA forbid [TB4][TB5].
2. **Don't imitate the logo.** A green-fire wordmark styled to look like the TBC logo risks being
   a "confusingly similar" mark [TB1].
3. **Stay recognisably a fan tool.** The guidelines bar uses that confuse Blizzard with another
   brand or imply sponsorship [TB1]; a scene that reads as an official Blizzard splash page works
   against that.

## 6. Checklist for the motion work

- [ ] No Blizzard, WoW, TBC or Classic logo, static or animated [TB1].
- [ ] No Blizzard web key art or wallpapers as textures or backdrops [TB4].
- [ ] No game music or SFX [TB2][TB7].
- [ ] Every texture in the scene is procedural or drawn by us.
- [ ] Footer: credit line for each mark used, ® on first use, non-affiliation line [TB1].
- [ ] Map/icon credit reworded so it no longer cites Microsoft's Game Content Usage Rules [TB8].
- [ ] Tool stays free, with no paid tier and no ads near Blizzard art [TB1][TB2][TB6].
