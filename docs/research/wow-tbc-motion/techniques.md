# Building TBC-feeling motion on the web (B2)

Track B, researched 2026-10-04. Target stack: **Three.js r128** (classic script build) and **GSAP**,
as used by `docs/design/prototypes/round4/motion-3d-portal.html`. Sources in `sources-b.md`.

Code sketches below are **illustrative and written for this note**, not copied from any source and
not tested. Colours are placeholders; the palette belongs to track A (`identity.md`). Everything
here is procedural, which keeps it on the "inspiration, our own code" side of `usage-rules.md`.

## 0. What the prototype already does well

Read on 2026-10-04 (lines ~389-505 of the prototype): a 160x160 water plane with vertex-shader
waves and a procedural caustic in the fragment shader; 260 or 520 GPU-animated motes with additive
blending and `depthWrite:false`; a faceted crystal with halo and orbiting shards; fog; pixel ratio
capped at 2; `powerPreference:"low-power"`; render loop paused when the tab is hidden; a
`webglcontextlost` handler; a manual "3D scene" toggle; and a still frame under reduced motion.
The ideas below extend that scene rather than replace it.

## 1. Versions, CDNs and licences

**GSAP is free, including the former Club plugins.** GSAP 3.13 (2025-04-29) made every bonus
plugin, DrawSVG, SplitText and MorphSVG included, free even for commercial use [TB10]. The licence
is the GSAP Standard License, effective 2025-04-30 and last modified 2025-05-30 [TB11]. It allows
any person or entity to use GSAP, and its one prohibited use is building no-code visual animation
tools that compete with Webflow [TB11]. A fan planner is not that. The cdnjs file headers point
to that licence page [TB12].

**But the prototype's version predates it.** cdnjs's newest GSAP is 3.15.0 [TB12].
`DrawSVGPlugin.min.js` returns 200 on cdnjs at 3.13.0 and 3.15.0 and **404 at 3.12.5**, the
version the prototype loads [TB12]. SplitText and MorphSVG are also present at 3.15.0 [TB12].
To use DrawSVG, move every GSAP script tag to one version, 3.13.0 or later, in one change. If the
upgrade is not wanted, section 9 shows a plugin-free stroke draw.

**Three.js r128 on cdnjs has no examples folder.** cdnjs's r128 entry ships only `three.js`,
`three.min.js` and module builds [TB18]. The classic-script post-processing files for r128 (for
example `EffectComposer.js`, `RenderPass.js`, `ShaderPass.js`, `UnrealBloomPass.js`,
`CopyShader.js`, `LuminosityHighPassShader.js`) are served by jsDelivr under
`three@0.128.0/examples/js/` [TB15]. Load them after `three.min.js`; they attach to `THREE`
[TB15].

```html
<!-- order matters: core, then shaders, then passes -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
```

## 2. Shared noise: fBm and domain warping

Almost every effect below (vortex, aurora, fel haze, rock surfaces) is built on one function.
**fBm** sums several octaves of noise, each at a higher frequency (lacunarity) and lower amplitude
(gain) [TB19]. **Domain warping** feeds noise back into its own coordinates, f(p + h(p)), and
nesting it twice gives the swirling, organic look [TB20]. Quilez's article shows the two-level
pattern with fixed offsets to decorrelate the calls [TB20].

```glsl
// value noise + fBm, written for this note (any 2D noise works)
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x),
             mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){                 // 5 octaves; drop to 3 on the low tier
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5; i++){ s += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; }
  return s;
}
float warped(vec2 p, float t){     // one warp level: cheap and already "nether-like"
  vec2 q = vec2(fbm(p + vec2(0.0, t*0.05)), fbm(p + vec2(5.2, 1.3)));
  return fbm(p + 3.0*q);
}
```

Cost multiplies: Quilez's two-level pattern makes five fBm calls [TB20], so with 5 octaves that is
25 noise samples per pixel (our arithmetic). Keep these effects on small screen areas or render them at reduced resolution.

## 3. A swirling portal (Dark Portal-like vortex, our own design)

A flat disc (`CircleGeometry` or a quad) with a `ShaderMaterial` [TB17]. Work in polar
coordinates; add a twist that grows toward the centre so the noise spirals inward; sample the
warped fBm from section 2 along (twisted angle, log radius); map the value through a two-colour
ramp; fade the rim. Additive blending makes it read as light rather than paint. The ingredients are
fBm and warping [TB19][TB20]; the polar twist is a common shader idiom written here from scratch.

```glsl
// fragment shader of the portal disc; vUv in 0..1; uTime, uA (fel), uB (nether) are uniforms
void main(){
  vec2 p = vUv*2.0 - 1.0;
  float r = length(p), a = atan(p.y, p.x);
  float twist = a + 1.6/(r + 0.15) - uTime*0.35;       // inner rings turn faster
  vec2 q = vec2(cos(twist), sin(twist)) * (1.5 - log(r + 0.05));
  float n = warped(q*1.4, uTime);
  vec3 col = mix(uB, uA, smoothstep(0.35, 0.8, n));
  col += uA * pow(1.0 - r, 6.0) * 1.5;                  // hot core
  float alpha = smoothstep(1.0, 0.75, r) * (0.55 + 0.45*n);
  gl_FragColor = vec4(col * alpha, alpha);
}
```

```js
const portal = new THREE.Mesh(new THREE.CircleGeometry(2.2, 64), new THREE.ShaderMaterial({
  uniforms: { uTime:{value:0}, uA:{value:new THREE.Color('#5cff6a')}, uB:{value:new THREE.Color('#5a2a9c')} },
  vertexShader, fragmentShader, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending
}));
// GSAP can open it: scale the disc and push a uniform, not the DOM
gsap.fromTo(portal.scale, {x:0.01, y:0.01}, {x:1, y:1, duration:1.6, ease:'expo.out'});
```

A **stone frame** around it should be simple low-poly geometry of our own (two pillars and a
lintel), not a model of the Dark Portal; see `usage-rules.md` section 5.

## 4. Rising fel embers and sparks (GPU particles)

The prototype's mote system is already the right pattern: positions and a per-particle seed are
uploaded once, and the vertex shader moves them with `uTime`, so the CPU does no per-frame work.
In three.js a `ShaderMaterial` receives custom attributes and uniforms alongside the built-in ones
[TB17]. For embers, change three things:

1. **Motion:** rise faster, with a sideways wobble that grows with height, and wrap with `mod`.
2. **Colour over life:** hot yellow-green at birth, fel green mid-life, dark violet at death.
3. **Shape:** a soft round core with a faint stretched tail (scale `gl_PointCoord.y`).

```glsl
// vertex: life runs 0..1 and wraps; aSeed in 0..1 per particle
float life = fract(uTime*(0.10 + aSeed*0.15) + aSeed);
vec3 p = position;
p.y += life*8.0;
p.x += sin(uTime*1.3 + aSeed*50.0) * life*0.6;          // flicker widens as it rises
vLife = life;
vec4 mv = modelViewMatrix*vec4(p,1.0);
gl_Position = projectionMatrix*mv;
gl_PointSize = (2.0 + aSeed*3.0) * uDpr * (12.0/-mv.z) * (1.0 - life*0.6);
// fragment: colour ramp and fade-in / fade-out
vec3 c = mix(mix(vec3(0.85,1.0,0.5), uFel, smoothstep(0.0,0.4,vLife)), uNether, smoothstep(0.6,1.0,vLife));
float a = smoothstep(0.5,0.0,length(gl_PointCoord-0.5)) * smoothstep(0.0,0.1,vLife) * (1.0-vLife);
gl_FragColor = vec4(c, a);
```

Use `blending: THREE.AdditiveBlending`, `transparent: true`, `depthWrite: false`, as the prototype
does. Additive particles sum, so dense clusters blow out to white; cap the count (the prototype's
260/520 split by viewport is a good default) and keep per-particle alpha low.

## 5. Nether sky and aurora

Draw the sky on a large inside-out sphere or a full-screen quad behind everything. Use warped fBm
[TB19][TB20] for slow-moving nebula clouds, and for aurora curtains run a sine band along x whose
phase is offset by fBm, so the band ripples. Colour by height: deep violet at the horizon,
magenta-violet mid-sky, a thin green fringe on the curtains.

```glsl
// sky fragment; vDir is the normalised view direction from the vertex shader
float h = clamp(vDir.y, 0.0, 1.0);
vec2 uv = vDir.xz / (vDir.y + 0.3);                       // pseudo-planar projection
float cloud = warped(uv*0.8, uTime*0.3);
float band = exp(-pow((uv.y - 0.6 - 0.25*fbm(uv*1.5 + uTime*0.02))*6.0, 2.0));
band *= 0.5 + 0.5*sin(uv.x*3.0 + fbm(uv*2.0)*4.0 + uTime*0.2);
vec3 col = mix(uHorizon, uZenith, h) + uNether*cloud*0.35 + uFel*band*0.25;
gl_FragColor = vec4(col, 1.0);
```

The sky barely changes frame to frame, so it is the best candidate for a **render-once or
render-at-half-resolution** treatment: draw it into a `WebGLRenderTarget` at half size every few
frames and sample that texture as the background.

## 6. Naaru light: glow and god rays

Three options, cheapest first.

**a. No post-processing (recommended default).** Fake the glow with geometry: a camera-facing quad
(`THREE.Sprite` or a plane that copies the camera's rotation) with an additive radial-gradient
shader behind the crystal, plus a second quad whose alpha is modulated by angular noise to make
soft rays. It costs one or two quads of fill and works on every tier. This is our own suggestion,
not taken from a source.

```glsl
// "ray halo" quad fragment: vUv 0..1
vec2 p = vUv*2.0-1.0; float r = length(p), a = atan(p.y,p.x);
float rays = pow(fbm(vec2(a*3.0, uTime*0.1)), 3.0) * smoothstep(1.0, 0.1, r);
float core = exp(-r*r*12.0);
gl_FragColor = vec4(uGold*(core + rays*0.6), 1.0);    // with AdditiveBlending
```

**b. UnrealBloomPass.** Available for r128 as a classic script [TB15]. It extracts bright pixels
above a threshold, then blurs them through a chain of five mip levels and adds them back [TB15].
The r128 examples include a **selective** bloom variant, so only the crystal and portal glow while
the UI-adjacent water does not [TB15b]. Run the composer at reduced resolution (the pass takes a
resolution argument [TB15]) and enable it only on the high tier (section 11).

```js
const composer = new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene, camera));
const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth/2, innerHeight/2), 0.9, 0.4, 0.82);
composer.addPass(bloom);
// in the loop: composer.render() instead of renderer.render(scene, camera)
gsap.to(bloom, { strength: 1.4, duration: 0.6, yoyo: true, repeat: 1 }); // a "pulse" on phase switch
```

**c. God rays.** The standard method samples the image along a ray from each pixel toward the
light's screen position, accumulating samples with decay, weight and exposure controls, after an
occlusion pre-pass that draws blockers black [TB21]. three.js r128 ships a `GodRaysShader` that
blurs a depth-derived mask along radial lines in three passes of six samples [TB16]. Both need an
extra render target and several full-screen passes, so they belong on the high tier only. For
Serpentshrine shafts, option (d) in section 7 is cheaper.

## 7. Serpentshrine: caustics, light shafts, haze

- **Caustics.** The prototype's procedural caustic (an iterated trig pattern on the water's UVs) is
  already cheap and convincing. Evan Wallace's WebGL Water computes real refracted caustics on a
  simulated heightfield, but it needs float-texture and derivative extensions [TB22]; treat it as
  a reference, not a drop-in. Projecting the caustic onto the pillars too (sample the same
  function with world-space x/z in the pillar shader) makes the cavern feel submerged.
- **(d) Cheap light shafts.** A few tall, open cones or quads hanging from above the water, with an
  additive shader whose alpha is a vertical gradient times a slowly scrolling 1D noise across the
  width. No post-processing; our own suggestion.

```glsl
// shaft fragment: vUv.y = 0 at the bottom, 1 at the top
float streak = fbm(vec2(vUv.x*6.0, uTime*0.08));
float a = smoothstep(0.0, 0.6, vUv.y) * (1.0 - vUv.y) * streak * 0.18;
gl_FragColor = vec4(uLight*a, a);
```

- **Haze.** The prototype's linear `THREE.Fog` already blends distant geometry; adding a slow
  upward drift of large, very faint additive sprites gives volume without a volumetric pass.

## 8. Floating rock islands (Netherstorm / Tempest Keep mood)

Low-poly is both cheaper and closer to the TBC era's look. Take an `IcosahedronGeometry(1, 1)`,
push its lower vertices down and roughen all vertices with noise once at build time, use
`flatShading: true` like the prototype's pillars, and bob each island on its own phase. For more
than a handful, an `InstancedMesh` keeps it to one draw call (the r128 examples include instancing
demos [TB15b]).

```js
function islandGeo(seed){
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++){
    const x = p.getX(i), z = p.getZ(i); let y = p.getY(i);
    // jitter from the position, not the index: r128 polyhedron geometry is non-indexed [TB42],
    // so each corner is repeated per face and index-based jitter would crack the mesh apart
    const j = 1 + 0.18*Math.sin(seed + x*12.99 + y*78.23 + z*37.71);
    if (y < 0) y *= 2.2;                                       // stalactite underside
    p.setXYZ(i, x*j, y*j, z*j);
  }
  g.computeVertexNormals(); return g;
}
// per frame: island.position.y = base + Math.sin(t*0.4 + phase)*0.15; island.rotation.y += dt*0.02;
```

Add a few ember particles (section 4) falling *off* the underside of each rock and a faint violet
rim light; that is the cue that reads as "Outland" rather than generic fantasy.

## 9. Arcane rune circles (SVG + GSAP)

Draw the ring in SVG ourselves: two or three concentric `<circle>`s, a dashed middle ring, and a
band of simple glyphs made from `<path>` strokes (invent them; do not trace in-game runes, see
`usage-rules.md` section 5). SVG keeps the ring crisp at any DPR and costs nothing on the GPU.

**With DrawSVG (GSAP 3.13 or later).** DrawSVG animates `stroke-dashoffset` and
`stroke-dasharray` to reveal a stroke, works on `<path>`, `<line>`, `<polyline>`, `<polygon>`,
`<rect>` and `<ellipse>`, and requires the element to already have a stroke [TB13]. Values give
the visible segment, so `"50% 50%"` to `"0% 100%"` draws outward from the middle [TB13]. It is free
now [TB10] but not available on cdnjs at 3.12.5 [TB12].

```js
gsap.registerPlugin(DrawSVGPlugin);
const tl = gsap.timeline();
tl.from('#rune .ring',   { drawSVG: 0, duration: 1.2, stagger: 0.15, ease: 'power2.inOut' })
  .from('#rune .glyph',  { drawSVG: '50% 50%', duration: 0.5, stagger: 0.04 }, '-=0.6')
  .to('#rune .spin',     { rotation: 360, transformOrigin: '50% 50%', duration: 60, repeat: -1, ease: 'none' });
```

**Without the plugin (works on 3.12.5).** Measure each path once with `getTotalLength()`, set the
dash array to that length, and tween `strokeDashoffset` with core GSAP. Note that `<circle>` is
not in DrawSVG's element list [TB13]; for either method, drawing rings as two-arc `<path>`s
avoids surprises.

```js
document.querySelectorAll('#rune path').forEach(p => {
  const L = p.getTotalLength();
  gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L },
                 { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' });
});
```

**Into the 3D scene.** To lay the ring on the water under the crystal, draw the SVG into a canvas
once and use it as a `CanvasTexture` on a flat plane with additive blending, then rotate the plane
in the render loop. Redraw the canvas only when the ring's state changes.

## 10. Orchestrating it with GSAP

- **Tween uniforms, not the DOM.** GSAP tweens any numeric property, so
  `gsap.to(mat.uniforms.uOpen, { value: 1 })` opens the portal, and the prototype's existing
  `SC.mix` and `SC.cam` objects are the right pattern.
- **One switch for motion.** `gsap.matchMedia()` runs setup only while a media query matches and
  reverts every tween and ScrollTrigger made inside it when the query stops matching; it accepts
  a `prefers-reduced-motion` condition and was added in GSAP 3.11.0 [TB14]. The prototype uses it
  for width and pointer breakpoints (lines ~702-711) and handles reduced motion with its own
  `matchMedia` listener (`syncRM`, line ~727); either is fine as long as there is one switch.
- **Phase transitions.** When the user switches Serpentshrine to Tempest Keep, crossfade palette
  uniforms over about a second (the prototype uses 1.2 s), and if the portal or bloom pulses on the
  switch, make it a single slow swell, never a strobe (section 12).

## 11. Performance on ordinary and low-power hardware

- **Cap the pixel ratio.** A 3x display renders nine times the pixels of a 1x one, and for heavy
  three.js scenes leaving the ratio at 1 is a common choice [TB23]. `setPixelRatio` exists to stop
  HiDPI blur [TB17], so it trades sharpness for cost. Suggested caps: 1.5 for the full scene, 1.0
  whenever bloom or god rays are on, and render any post-processing at half size [TB15].
- **Ask for the low-power GPU.** `powerPreference` accepts `"high-performance"`, `"low-power"` or
  `"default"` [TB17]; the prototype's `"low-power"` is right for a background scene.
- **Three tiers, picked at runtime.** Our suggestion: start on *medium*, measure the average frame
  time over the first ~2 seconds, and step down if it exceeds about 20 ms or up if it stays under
  about 10 ms. *Low*: no sky shader (CSS gradient instead), 3-octave fBm, 150 particles, DPR 1.
  *Medium*: current prototype plus portal and embers. *High*: add selective bloom [TB15b].
  `navigator.deviceMemory` can seed the first guess, but it is coarse, HTTPS-only and not available
  in every browser [TB25], so never rely on it alone.
- **Stop when nobody is looking.** Keep the prototype's pause on `visibilitychange`, and add an
  `IntersectionObserver` so the loop also stops when the canvas is scrolled away.
- **Stay off the CPU per frame.** Animate particles in the vertex shader (as the prototype does)
  rather than rewriting buffers in JavaScript; tween a handful of uniforms with GSAP.
- **Mobile.** Use the prototype's viewport split (fewer particles under 700 px) and skip
  post-processing below the high tier.

## 12. Accessibility

- **Reduced motion.** Honour `prefers-reduced-motion: reduce`; it exists for people who get
  dizziness or nausea from motion such as parallax [TB26][TB28]. Support is broad: Chrome 74,
  Firefox 63, Safari 10.1 [TB30]. Listen for changes at runtime, not only at load [TB26]. Under
  reduce, render one still frame (the prototype does) and replace the rune draw with an instant
  fade.
- **A visible pause control is required, not optional.** Motion that starts on its own, lasts
  more than five seconds and sits beside other content needs a way to pause, stop or hide it under
  WCAG 2.2.2, Level A [TB27]. The prototype's "Motion" and "3D scene" toggles meet this; keep them
  on every view, and remember the choice.
- **Interaction-triggered motion** (scroll-driven camera, pointer parallax) should be switchable
  off; WCAG 2.3.3 asks for this at Level AAA and uses parallax as its example [TB28].
- **No strobing.** Nothing may flash more than three times in any one second, and saturated red
  flashing has a stricter test [TB29]. Fel flares, bloom pulses and portal "surges" should be slow
  swells (well under one per second), and flicker in the ember shader should be per-particle and
  small, not a whole-screen brightness change.
- **Reduced transparency.** `prefers-reduced-transparency` is experimental and not Baseline [TB24]:
  Chrome 118 and Edge support it, Firefox only behind a flag, Safari not at all [TB30]. Use it to
  make glass panels over the scene opaque where available, but also tie the same change to the
  app's own "3D scene: off" state, since many users' browsers will never report it.
- **Text over the scene.** Additive glow can push the backdrop bright behind text. Keep body text
  on solid or near-solid panels and check contrast against the brightest frame (portal open, bloom
  peak), not the average one.
- **Purpose over decoration.** UI animation helps most when it signals feedback, state changes or
  navigation, and decorative motion easily distracts [TB31]. For a data tool, the background scene
  should stay slow and peripheral, and the data panels themselves should animate only to show a
  change.
