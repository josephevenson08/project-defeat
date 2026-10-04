# Variant brief: 05 Launcher and 08 Portal in six styles

The owner picked two of the ten directions: **05 · Launcher** and **08 · Portal**. Each is now
redone in six visual styles, keeping its structure and content, for 12 variants:

| Style | What it means here |
| --- | --- |
| **Minimalism** | Few elements, generous space, one typeface family or a quiet pair, almost no ornament. Hierarchy from size, weight and spacing alone. Color used only where it means something (item quality, phase status). |
| **Skeuomorphism** | Surfaces that imitate real materials: tooled leather, brushed metal, parchment-free stone or wood, stitched edges, embossed and debossed text, physical-looking buttons with depth and pressed states. Built with CSS gradients, shadows and inline SVG noise/texture (no image files). |
| **Glassmorphism** | Frosted translucent panels (`backdrop-filter: blur()`) floating over a colorful atmospheric background of soft shapes; thin light borders; layered depth. Provide a solid fallback where `backdrop-filter` is unsupported, and keep text contrast AA on the glass. |
| **Brutalism / Neo-Brutalism** | Raw, loud and honest: thick black borders, hard offset shadows, flat saturated blocks, visible grid, big blunt type, no gradients or softness. Still usable and accessible. |
| **Bauhaus** | Geometric composition: circles, squares and triangles, primary red/blue/yellow plus black and off-white, strict grid, asymmetric balance, geometric sans type (e.g. a Futura-like face from Google Fonts). Form follows function. |
| **Animation / Motion** | The same layout brought to life with purposeful motion: an orchestrated load sequence, staggered list entry, smooth tab/view transitions, hover micro-interactions, number count-ups on stats, a living background. Use a real animation library (GSAP from cdnjs is the recommended choice; anime.js from cdnjs is fine too). **Everything must be fully visible and usable with motion off**: honor `prefers-reduced-motion` by skipping animations, and never leave content at `opacity: 0` waiting for a script. |

## Rules

- **Start from the base file** (`docs/design/prototypes/05-launcher.html` or `08-portal.html`): keep
  its layout idea, sections, navigation, real data and interactions. Change the visual language,
  not the product.
- Follow `docs/design/prototypes/BRIEF.md` for data, quality colors, provenance, accessibility,
  400px + 1280px, and the technical rules. Item quality colors may be adjusted for contrast within
  each style's palette, but epic must still read as purple.
- **Libraries:** use any that genuinely help, loaded from `https://cdnjs.cloudflare.com/ajax/libs/...`
  with an exact pinned version (UMD build, placed before the inline script that uses it). Fonts from
  Google Fonts only, with fallbacks. No other hosts. No images from the web; textures and shapes are
  CSS or inline SVG.
- Each file starts with `<!doctype html>` and its own `<head>` (charset, viewport with
  `viewport-fit=cover`, `<title>`, styles). Title format: "Launcher · Minimalism", "Portal ·
  Bauhaus", etc.
- A small direction line on the page: e.g. "Variant 05-B · Launcher in Skeuomorphism. Prototype
  only, not the live app."
- File names: `docs/design/prototypes/variants/05-launcher-<style>.html` and
  `08-portal-<style>.html`, with style slugs `minimalism`, `skeuomorphism`, `glassmorphism`,
  `brutalism`, `bauhaus`, `motion`.

## What each designer reports back (for the documentation)

1. File path and size.
2. Libraries used (name, exact version, URL, what for), or "none".
3. Fonts used and why.
4. The palette tokens and the three to five key design decisions that make it this style.
5. Accessibility notes (contrast choices, reduced motion, focus).
6. Anything from the base prototype that was dropped or changed, and why.
