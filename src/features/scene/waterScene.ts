/**
 * The crystal-and-water scene behind every screen (port step 7), loaded on demand by `sceneControl.ts`.
 *
 * **Ported from the prototypes**: the scene each tab page drew (`docs/design/prototypes/tabs/*.html`,
 * one host that differs only in a handful of numbers per tab) and the kit that dressed it
 * (`tbc-kit.js`): the shattered sky with its aurora, a colour per tab crossfading over 1.2 seconds, and
 * each tab's own detail — shafts of light and a water pulse for Home, bubbles for the planner, crystal
 * pillars for Simulation, one light per raid group for Raid Composition, rank rings for the tier lists
 * and ore glints for Professions. Raids lights each raid its own way. Everything is our own geometry
 * and shaders: no game art.
 *
 * **Made to look as it did on three r128.** The prototypes ran r128, which knew nothing of colour
 * management and scaled lights by π; three 0.186 does both differently. So colour management is off,
 * the output stays linear, every light is π times the prototype's number, and the falloff of the two
 * point lights is r128's straight line, put back into the shader.
 *
 * The page tells the scene which screen it is on through `<html>`'s `data-tab`, `data-raid` and
 * `data-raid-id` (the same attributes the still backdrop reads), so no component knows the scene exists.
 */
import { animate, type JSAnimation } from 'animejs'
import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  ColorManagement,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  RGBAFormat,
  RingGeometry,
  Scene,
  ShaderChunk,
  ShaderMaterial,
  TetrahedronGeometry,
  TorusGeometry,
  WebGLRenderTarget,
  WebGLRenderer,
  type IUniform,
  type ShaderMaterialParameters,
} from 'three'
import type { SceneHandle } from './sceneControl'

ColorManagement.enabled = false
ShaderChunk.lights_pars_begin = ShaderChunk.lights_pars_begin.replace(
  /float getDistanceAttenuation\([\s\S]*?return distanceFalloff;\s*\}/,
  `float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
	return 1.0;
}`,
)
const PI = Math.PI
/** r128 scaled every light by π; three 0.186 takes the number as given. */
const LIGHT = Math.PI

/* ---------- each screen's look, from its prototype page ---------- */

type Look = 'home' | 'planner' | 'simulation' | 'raidcomp' | 'tierlists' | 'professions' | 'raids'
type Theme = 'ssc' | 'tk' | 'hellfire' | 'bladesedge' | 'karazhan' | 'planner' | 'raidcomp' | 'tiers' | 'profs'
const LOOK_KEYS: Look[] = ['home', 'planner', 'simulation', 'raidcomp', 'tierlists', 'professions', 'raids']
const THEMES: Theme[] = ['ssc', 'tk', 'hellfire', 'bladesedge', 'karazhan', 'planner', 'raidcomp', 'tiers', 'profs']
const TAB_THEMES = ['planner', 'raidcomp', 'tiers', 'profs'] as const

/*
 * The numbers that differ between the prototypes' scene hosts. `motes` is the share of the motes drawn
 * (Professions drew 340 of 520), `white` what the motes mix towards, and `calm` how slowly the world
 * drifts behind a dense tab. Simulation's stone pillars give way to the kit's crystal ones.
 */
const LOOKS: Record<Look, { lamp: number; ambient: number; ambientI: number; rim: number; rimI: number; crystal: number; shard: number; pillar: number; halo: number; motes: number; white: [number, number, number]; calm: number }> = {
  home: { lamp: 2.2, ambient: 0x1a3038, ambientI: 0.6, rim: 0x9fd8ff, rimI: 0.35, crystal: 0x14303a, shard: 0x10242c, pillar: 0x0a1a20, halo: 0.45, motes: 1, white: [0.85, 1, 0.96], calm: 1 },
  planner: { lamp: 1.3, ambient: 0x1a3038, ambientI: 0.6, rim: 0x9fd8ff, rimI: 0.35, crystal: 0x14303a, shard: 0x10242c, pillar: 0x0a1a20, halo: 0.28, motes: 1, white: [0.85, 1, 0.96], calm: 0.4 },
  simulation: { lamp: 2.2, ambient: 0x2a1a40, ambientI: 0.6, rim: 0xc8a0ff, rimI: 0.35, crystal: 0x24163a, shard: 0x1c1230, pillar: 0x150d24, halo: 0.45, motes: 1, white: [0.85, 1, 0.96], calm: 1 },
  raidcomp: { lamp: 1.6, ambient: 0x2a2216, ambientI: 0.5, rim: 0xffe6b8, rimI: 0.3, crystal: 0x2a2416, shard: 0x241e12, pillar: 0x16110b, halo: 0.45, motes: 1, white: [1, 0.97, 0.9], calm: 0.3 },
  tierlists: { lamp: 1.5, ambient: 0x2a1a40, ambientI: 0.6, rim: 0xc8a0ff, rimI: 0.35, crystal: 0x24163a, shard: 0x1c1230, pillar: 0x150d24, halo: 0.45, motes: 1, white: [0.85, 1, 0.96], calm: 1 },
  professions: { lamp: 1.8, ambient: 0x2a1a40, ambientI: 0.6, rim: 0xc8a0ff, rimI: 0.35, crystal: 0x24163a, shard: 0x1c1230, pillar: 0x1a1009, halo: 0.45, motes: 340 / 520, white: [0.85, 1, 0.96], calm: 0.3 },
  raids: { lamp: 2.2, ambient: 0x2a1a40, ambientI: 0.6, rim: 0xc8a0ff, rimI: 0.35, crystal: 0x24163a, shard: 0x1c1230, pillar: 0x150d24, halo: 0.45, motes: 1, white: [0.85, 1, 0.96], calm: 1 },
}

const RAID_THEMES: Record<string, Theme> = {
  'serpentshrine-cavern': 'ssc',
  'tempest-keep': 'tk',
  'magtheridons-lair': 'hellfire',
  'gruuls-lair': 'bladesedge',
  karazhan: 'karazhan',
}

function screenOf(root: HTMLElement): { look: Look; theme: Theme } {
  switch (root.dataset.tab) {
    case 'planner':
      return { look: 'planner', theme: 'planner' }
    case 'simulation':
      return { look: 'simulation', theme: 'tk' }
    case 'raidcomp':
      return { look: 'raidcomp', theme: 'raidcomp' }
    case 'tierlists':
      return { look: 'tierlists', theme: 'tiers' }
    case 'professions':
      return { look: 'professions', theme: 'profs' }
    case 'raids':
      return { look: 'raids', theme: RAID_THEMES[root.dataset.raidId ?? ''] ?? (root.dataset.raid === 'tk' ? 'tk' : root.dataset.raid === 'p1' ? 'karazhan' : 'ssc') }
    default:
      return { look: 'home', theme: 'ssc' }
  }
}

/* ---------- palettes ---------- */

type Palette = { light: Color; deep: Color; fog: Color; acc: Color }
const palette = (light: string, deep: string, fog: string, acc: string): Palette => ({
  light: new Color(light),
  deep: new Color(deep),
  fog: new Color(fog),
  acc: new Color(acc),
})
const PARTS = ['light', 'deep', 'fog', 'acc'] as const
/* Serpentshrine (naga-blue water, coral in the troughs) and Tempest Keep (arcane gold over violet), then each theme's own. */
const SSC = palette('#4fd8c8', '#03161d', '#030c11', '#ff7a5c')
const TK = palette('#ecc06a', '#140b26', '#0b0616', '#9b6bff')
const EXTRA: Partial<Record<Theme, Palette>> = {
  hellfire: palette('#ff8a3a', '#1c0805', '#160504', '#7dff4a'),
  bladesedge: palette('#f0a070', '#140d16', '#1b0f16', '#9b6bff'),
  karazhan: palette('#b48cff', '#0d0a1c', '#0a0714', '#5ad1ff'),
  planner: palette('#5ab0ff', '#031033', '#020a22', '#9fe8ff'),
  raidcomp: palette('#ffe2a6', '#1a1610', '#0f0d09', '#8cc8f0'),
  tiers: palette('#3ee08f', '#03190f', '#020e08', '#e8d25a'),
  profs: palette('#ffb547', '#1a1004', '#0f0903', '#d8ecff'),
}
/* the aurora's two colours and brightness per theme */
const AURORA: Record<Theme, [Color, Color, number]> = {
  ssc: [new Color('#5cf2c0'), new Color('#4a2a90'), 0.55],
  tk: [new Color('#ecc06a'), new Color('#8a5cff'), 1],
  hellfire: [new Color('#ff6a2a'), new Color('#6a1010'), 0.7],
  bladesedge: [new Color('#ff9a6a'), new Color('#4a2a6a'), 0.6],
  karazhan: [new Color('#b48cff'), new Color('#2a1a6a'), 0.75],
  planner: [new Color('#6ab8ff'), new Color('#1a2a7a'), 0.5],
  raidcomp: [new Color('#ffe2a0'), new Color('#3a3a6a'), 0.55],
  tiers: [new Color('#5cf2a0'), new Color('#0e4a3a'), 0.55],
  profs: [new Color('#ffc061'), new Color('#5a2a10'), 0.5],
}
/* the floating rocks take a little of each tab's colour (violet by default, ember for Hellfire and Blade's Edge) */
const ROCK: Record<(typeof TAB_THEMES)[number], Color> = {
  planner: new Color('#0f2a66'),
  raidcomp: new Color('#3a3020'),
  tiers: new Color('#0f3a26'),
  profs: new Color('#4a2808'),
}

/* ---------- shared GLSL ---------- */

/* value noise, fBm (octaves per quality level through the OCT define) and one domain warp */
const NOISE = `
#ifndef OCT
#define OCT 4
#endif
float h21(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<OCT;i++){s+=a*vnoise(p);p=p*2.03+7.1;a*=.5;}return s;}
float warped(vec2 p,float t){vec2 q=vec2(fbm(p+vec2(0.,t*.05)),fbm(p+vec2(5.2,1.3)));return fbm(p+3.*q);}
`
const VUV = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`
const ORE_FS = `uniform vec3 uCol;uniform float uI;varying float vA;
  void main(){float d=length(gl_PointCoord-.5);
    gl_FragColor=vec4(mix(uCol,vec3(1.),smoothstep(.2,0.,d)*.7),smoothstep(.5,0.,d)*vA*uI);}`

type Uniforms = Record<string, IUniform>
const additive = (uniforms: Uniforms, vertexShader: string, fragmentShader: string, extra: ShaderMaterialParameters = {}) =>
  new ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending, vertexShader, fragmentShader, ...extra })

/** A seeded generator, so the rocks and veins land in the same places every visit. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------- quality levels: start on medium, measure about two seconds of real frames, then settle ---------- */

type Tier = 'low' | 'medium' | 'high'
const TIERS: Record<Tier, { rocks: number; embers: number; aurora: number; every: number; oct: number; dpr: number; shafts: number; bubbles: number }> = {
  low: { rocks: 6, embers: 150, aurora: 0, every: 0, oct: 3, dpr: 1, shafts: 2, bubbles: 50 },
  medium: { rocks: 12, embers: 300, aurora: 0.25, every: 3, oct: 4, dpr: 1.5, shafts: 4, bubbles: 100 },
  high: { rocks: 18, embers: 500, aurora: 0.5, every: 2, oct: 5, dpr: 1.5, shafts: 4, bubbles: 160 },
}
const MAX_ROCKS = 18
const MAX_EMBERS = 500
const MAX_BUBBLES = 160
/** Under this many milliseconds a frame on the lowest level, the scene gives way to the still backdrop. */
const TOO_SLOW_MS = 40

export function startScene(options: { force: boolean; onFail: (why: string) => void }): SceneHandle {
  const root = document.documentElement
  const canvas = document.createElement('canvas')
  canvas.className = 'scene-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  canvas.dataset.testid = 'scene-canvas'
  document.body.appendChild(canvas)

  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' })
  renderer.outputColorSpace = LinearSRGBColorSpace
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, 100)
  const small = () => window.innerWidth < 700

  /* ---------- the host: water, motes, lights, the crystal, the pillars ---------- */

  const cur: Palette = { light: SSC.light.clone(), deep: SSC.deep.clone(), fog: SSC.fog.clone(), acc: SSC.acc.clone() }
  const time = { value: 0 }
  const dprU = { value: renderer.getPixelRatio() }
  const U = { uTime: time, uLight: { value: cur.light }, uDeep: { value: cur.deep }, uFog: { value: cur.fog }, uAcc: { value: cur.acc }, uDpr: dprU, uWhite: { value: new Color(0.85, 1, 0.96) } }

  /* water: waves in the vertex shader, caustics and fog in the fragment shader */
  const water = new Mesh(
    new PlaneGeometry(70, 70, 160, 160),
    new ShaderMaterial({
      uniforms: U,
      side: DoubleSide,
      vertexShader: `uniform float uTime;varying vec2 vUv;varying float vH;varying float vD;
  void main(){vUv=uv;vec3 p=position;
    float h=sin(p.x*.35+uTime*.6)*.18+sin(p.y*.5-uTime*.8)*.12+sin((p.x+p.y)*.9+uTime*1.3)*.05;
    p.z+=h;vH=h;vec4 mv=modelViewMatrix*vec4(p,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float uTime;uniform vec3 uLight,uDeep,uFog,uAcc;varying vec2 vUv;varying float vH;varying float vD;
  float caustic(vec2 uv){vec2 p=mod(uv*6.28318,6.28318)-250.;vec2 i=p;float c=1.;float k=.005;
    for(int n=0;n<4;n++){float t=uTime*.3*(1.-(3.5/float(n+1)));
      i=p+vec2(cos(t-i.x)+sin(t+i.y),sin(t-i.y)+cos(t+i.x));
      c+=1./length(vec2(p.x/(sin(i.x+t)/k),p.y/(cos(i.y+t)/k)));}
    c/=4.;c=1.17-pow(c,1.4);return pow(abs(c),8.);}
  void main(){float k=caustic(vUv*5.);
    float g=1.-smoothstep(0.,.22,distance(vUv,vec2(.5,.47)));
    vec3 col=uDeep+uLight*(k*.5+vH*.5+g*.22);
    col+=uAcc*(1.-smoothstep(-.32,-.05,vH))*.12;
    col=mix(col,uFog,smoothstep(6.,34.,vD));gl_FragColor=vec4(col,1.);}`,
    }),
  )
  water.rotation.x = -PI / 2
  scene.add(water)

  /* bioluminescent motes: drift and bob entirely on the GPU */
  const moteCount = small() ? 260 : 520
  const motePos = new Float32Array(moteCount * 3)
  const moteSeed = new Float32Array(moteCount)
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (Math.random() - 0.5) * 36
    motePos[i * 3 + 1] = Math.random() * 7
    motePos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 4
    moteSeed[i] = Math.random()
  }
  const moteGeo = new BufferGeometry()
  moteGeo.setAttribute('position', new BufferAttribute(motePos, 3))
  moteGeo.setAttribute('aSeed', new BufferAttribute(moteSeed, 1))
  scene.add(
    new Points(
      moteGeo,
      additive(
        U,
        `uniform float uTime,uDpr;attribute float aSeed;varying float vA;
  void main(){vec3 p=position;p.y=mod(p.y+uTime*(.08+aSeed*.18),7.)+.05;
    p.x+=sin(uTime*.3+aSeed*40.)*.5;p.z+=cos(uTime*.25+aSeed*30.)*.4;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=(1.5+aSeed*3.5)*uDpr*(14./-mv.z);
    vA=(1.-smoothstep(8.,30.,-mv.z))*(.45+.55*sin(uTime*1.7+aSeed*60.)*.5+.275);}`,
        `uniform vec3 uLight,uWhite;varying float vA;
  void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d)*vA;
    gl_FragColor=vec4(mix(uLight,uWhite,.35),a);}`,
      ),
    ),
  )

  /* lights: the lamp over the pool, ambient, a cool rim and a low accent (coral, violet or ember) */
  const lamp = new PointLight(cur.light.clone(), 2.2 * LIGHT, 18, 1)
  lamp.position.set(0, 3.4, -1)
  const ambient = new AmbientLight(0x2a1a40, 0.6 * LIGHT)
  const rim = new DirectionalLight(0xc8a0ff, 0.35 * LIGHT)
  rim.position.set(-4, 6, 6)
  const accent = new PointLight(cur.acc.clone(), 1.1 * LIGHT, 16, 1)
  accent.position.set(-5, 1.2, -4)
  scene.add(lamp, ambient, rim, accent)

  /* a naaru-like arcane crystal: a faceted prism, a halo ring and three orbiting shards */
  const crystal = new Mesh(
    new OctahedronGeometry(1, 0),
    new MeshStandardMaterial({ color: 0x24163a, emissive: cur.light.clone(), emissiveIntensity: 0.18, metalness: 0.35, roughness: 0.18, flatShading: true }),
  )
  crystal.position.set(2.6, 2.4, -3)
  const halo = new Mesh(new TorusGeometry(1.7, 0.02, 6, 90), new MeshBasicMaterial({ color: cur.light.clone(), transparent: true, opacity: 0.45 }))
  halo.rotation.x = PI / 2.3
  const shardMat = new MeshStandardMaterial({ color: 0x1c1230, emissive: cur.light.clone(), emissiveIntensity: 0.5, flatShading: true })
  const shards = [0, 1, 2].map(() => new Mesh(new TetrahedronGeometry(0.16, 0), shardMat))
  scene.add(crystal, halo, ...shards)

  /* stone pillars receding into the fog; the ore veins run up them on Professions */
  const pillarMat = new MeshStandardMaterial({ color: 0x150d24, roughness: 0.9, flatShading: true })
  const stone = new Group()
  const pillars: Mesh<CylinderGeometry>[] = []
  ;[[-7, -6], [-4.5, -12], [6.5, -8], [9, -15], [-10, -18], [2, -20], [13, -11], [-13, -9]].forEach(([x, z], i) => {
    const pillar = new Mesh(new CylinderGeometry(0.5, 0.75, 9, 7), pillarMat)
    pillar.position.set(x, 3.6, z)
    pillar.rotation.y = i
    stone.add(pillar)
    pillars.push(pillar)
  })
  scene.add(stone)
  scene.fog = new Fog(cur.fog.clone(), 8, 30)
  const fog = scene.fog as Fog
  renderer.setClearColor(cur.fog)

  /* ---------- the kit: weights per theme and per look, crossfaded together ---------- */

  const W = Object.fromEntries(THEMES.map((k) => [k, 0])) as Record<Theme, number>
  const LW = Object.fromEntries(LOOK_KEYS.map((k) => [k, 0])) as Record<Look, number>
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  let tier: Tier = memory !== undefined && memory <= 2 ? 'low' : 'medium'
  const K = { t: 0, frames: 0, every: 3, auroraDirty: true, swell: 0, charge: 0, embersUser: false }
  const tmp = new Color()
  const dummy = new Object3D()

  /* K2, the shattered sky: instanced low-poly rocks and a slow nether aurora */
  const rocks: { x: number; y: number; z: number; s: number; ph: number; rx: number; ry: number; sp: number }[] = []
  {
    const r = rng(1337)
    for (let i = 0; i < MAX_ROCKS; i++) {
      const side = i % 2 ? 1 : -1
      rocks.push({ x: side * (2.5 + r() * 15), y: 4.4 + r() * 3.8, z: -3 - r() * 14, s: 0.3 + r() * 0.85, ph: r() * 6.283, rx: (r() - 0.5) * 0.35, ry: r() * 6.283, sp: (r() - 0.5) * 0.06 })
    }
  }
  const islandGeo = new IcosahedronGeometry(1, 1)
  {
    const p = islandGeo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const z = p.getZ(i)
      let y = p.getY(i)
      // Jitter from position, not index: polyhedra are non-indexed, so shared corners stay shared.
      const j = 1 + 0.22 * Math.sin(x * 12.99 + y * 78.23 + z * 37.71)
      if (y < 0) y *= 2.1
      p.setXYZ(i, x * j, y * j, z * j)
    }
    islandGeo.computeVertexNormals()
  }
  const rockMat = new MeshStandardMaterial({ color: 0x1b1724, emissive: new Color('#2a1450'), emissiveIntensity: 0.35, roughness: 0.95, metalness: 0, flatShading: true })
  const rockMesh = new InstancedMesh(islandGeo, rockMat, MAX_ROCKS)
  rockMesh.frustumCulled = false
  scene.add(rockMesh)
  function updateRocks() {
    for (let i = 0; i < rockMesh.count; i++) {
      const r = rocks[i]
      dummy.position.set(r.x, r.y + Math.sin(K.t * 0.35 + r.ph) * 0.18, r.z)
      dummy.rotation.set(r.rx, r.ry + K.t * r.sp, 0)
      dummy.scale.setScalar(r.s)
      dummy.updateMatrix()
      rockMesh.setMatrixAt(i, dummy.matrix)
    }
    rockMesh.instanceMatrix.needsUpdate = true
  }

  /* the aurora: drawn small into a render target every few frames, shown on one far plane */
  const auroraU = { uTime: time, uA: { value: new Color('#5cf2c0') }, uB: { value: new Color('#4a2a90') }, uI: { value: 0.55 } }
  const auroraMat = new ShaderMaterial({
    defines: { OCT: 4 },
    uniforms: auroraU,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:
      NOISE +
      `uniform float uTime,uI;uniform vec3 uA,uB;varying vec2 vUv;
    void main(){vec2 uv=vec2(vUv.x*4.,vUv.y);float t=uTime*.25;
      float off=.22*fbm(vec2(uv.x*.9+t*.15,t*.1));
      float bd=(vUv.y-.45-off)*5.;float band=exp(-bd*bd);
      float curt=.55+.45*sin(uv.x*3.+fbm(uv*1.6+t*.05)*5.+t*.6);
      float cloud=warped(uv*.8,t);
      vec3 col=uB*cloud*.55*smoothstep(1.,.2,vUv.y)+uA*band*curt*.8+mix(uA,vec3(1.),.3)*band*band*curt*.2;
      float a=clamp(band*curt*.9+cloud*.35,0.,1.)*smoothstep(0.,.25,vUv.y)*smoothstep(1.,.6,vUv.y)*smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
      gl_FragColor=vec4(col*a*uI,1.);}`,
  })
  const auroraScene = new Scene()
  const auroraCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  auroraScene.add(new Mesh(new PlaneGeometry(2, 2), auroraMat))
  const auroraTarget = new WebGLRenderTarget(256, 64, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat, depthBuffer: false })
  const auroraPlane = new Mesh(
    new PlaneGeometry(96, 24),
    new MeshBasicMaterial({ map: auroraTarget.texture, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false, fog: false }),
  )
  auroraPlane.position.set(0, 8.5, -26)
  scene.add(auroraPlane)
  let auroraOn = true
  function updateAurora(dt: number) {
    auroraPlane.visible = auroraOn
    if (!auroraOn) return
    if (!(K.auroraDirty || (dt > 0 && K.every > 0 && K.frames % K.every === 0))) return
    K.auroraDirty = false
    const clear = renderer.getClearColor(tmp).clone()
    renderer.setRenderTarget(auroraTarget)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.render(auroraScene, auroraCam)
    renderer.setRenderTarget(null)
    renderer.setClearColor(clear, 1)
  }

  /* K5, Coilfang water (Home): open light-shaft cones and a slow pump pulse on the water */
  const shaftMat = new ShaderMaterial({
    defines: { OCT: 3 },
    uniforms: { uTime: time, uCol: { value: new Color('#8ff0e6') }, uI: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    vertexShader: VUV,
    fragmentShader:
      NOISE +
      `uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;
    void main(){float s=fbm(vec2(vUv.x*6.,uTime*.08));
      float a=smoothstep(0.,.6,vUv.y)*(1.-vUv.y)*s*.22*uI;gl_FragColor=vec4(uCol,a);}`,
  })
  const shaftGeo = new CylinderGeometry(0.35, 2.1, 14, 18, 1, true)
  const shafts = [[-6, -8, 0.12], [4.5, -12, -0.08], [10, -6, 0.1], [-12, -14, -0.12]].map(([x, z, tilt]) => {
    const shaft = new Mesh(shaftGeo, shaftMat)
    shaft.position.set(x, 7, z)
    shaft.rotation.z = tilt
    shaft.userData.tierOn = true
    scene.add(shaft)
    return shaft
  })
  // One ring wave every 7 seconds spreading from under the crystal, and a slow core breath.
  const pumpMat = additive(
    { uTime: time, uCol: { value: new Color('#4fd8c8') }, uI: { value: 1 } },
    VUV,
    `uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;
    void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float ph=fract(uTime/7.);
      float rd=(r-ph*1.1)*14.;float ring=exp(-rd*rd)*(1.-ph)*smoothstep(1.,.6,r);
      float core=exp(-r*r*30.)*(.5+.5*sin(uTime*.9));
      gl_FragColor=vec4(uCol,(ring*.22+core*.06)*uI);}`,
  )
  const pump = new Mesh(new PlaneGeometry(26, 26), pumpMat)
  pump.rotation.x = -PI / 2
  pump.position.set(crystal.position.x, 0.04, crystal.position.z)
  scene.add(pump)

  /* K6, the crystalline fortress (Simulation, Tempest Keep): crystal pillars */
  const fortressMat = new MeshStandardMaterial({ color: 0x1a1030, emissive: new Color('#9b6bff'), emissiveIntensity: 0.45, metalness: 0.4, roughness: 0.25, flatShading: true, transparent: true, opacity: 0 })
  const fortressGeo = new OctahedronGeometry(1, 0)
  const fortress = [[-8.5, -9, 4.6], [7.5, -10, 5.4], [-3.5, -15, 6], [11, -16, 5], [-12.5, -13, 4.2]].map(([x, z, h], i) => {
    const pillar = new Mesh(fortressGeo, fortressMat)
    pillar.scale.set(0.7, h, 0.7)
    pillar.position.set(x, h * 0.45, z)
    pillar.rotation.y = i * 0.7
    pillar.visible = false
    scene.add(pillar)
    return pillar
  })

  /* K3, the naaru light: a camera-facing glow and soft rays behind the crystal, swelled on events */
  const glowMat = new ShaderMaterial({
    defines: { OCT: 3 },
    uniforms: { uTime: time, uCol: { value: crystal.material.emissive }, uI: { value: 0.12 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: VUV,
    fragmentShader:
      NOISE +
      `uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;
    void main(){vec2 p=vUv*2.-1.;float r=length(p);vec2 d=r>0.?p/r:vec2(1.,0.);
      float rays=pow(fbm(d*2.2+vec2(uTime*.05,0.)),3.)*smoothstep(1.,.1,r);
      float core=exp(-r*r*10.);gl_FragColor=vec4(uCol,clamp((core+rays*.5)*uI,0.,1.));}`,
  })
  const glow = new Mesh(new PlaneGeometry(1, 1), glowMat)
  glow.scale.set(6, 6, 1)
  scene.add(glow)

  /* K4, fel embers: points that rise and wrap, yellow-green to fel to violet over their life */
  const EMBERS = { fel: ['#d9ff80', '#5cff6a', '#5a2a9c'], hellfire: ['#ffd27a', '#ff6a2a', '#4a0f2a'] }
  const emberGeo = new BufferGeometry()
  {
    const r = rng(99)
    const pos = new Float32Array(MAX_EMBERS * 3)
    const seed = new Float32Array(MAX_EMBERS)
    for (let i = 0; i < MAX_EMBERS; i++) {
      pos[i * 3] = (r() - 0.5) * 30
      pos[i * 3 + 1] = r() * 0.6
      pos[i * 3 + 2] = -2 - r() * 16
      seed[i] = r()
    }
    emberGeo.setAttribute('position', new BufferAttribute(pos, 3))
    emberGeo.setAttribute('aSeed', new BufferAttribute(seed, 1))
  }
  const emberU = { uTime: time, uDpr: dprU, uH: { value: 8 }, uOn: { value: 0 }, uHot: { value: new Color(EMBERS.fel[0]) }, uFel: { value: new Color(EMBERS.fel[1]) }, uNether: { value: new Color(EMBERS.fel[2]) } }
  const embers = new Points(
    emberGeo,
    additive(
      emberU,
      `uniform float uTime,uDpr,uH;attribute float aSeed;varying float vLife;
    void main(){float life=fract(uTime*(.06+aSeed*.09)+aSeed*7.3);vec3 p=position;p.y+=life*uH;
      p.x+=sin(uTime*1.1+aSeed*50.)*life*.7;p.z+=cos(uTime*.9+aSeed*31.)*life*.4;vLife=life;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=(2.+aSeed*3.)*uDpr*(12./-mv.z)*(1.-life*.5);}`,
      `uniform vec3 uHot,uFel,uNether;uniform float uOn;varying float vLife;
    void main(){vec2 c=gl_PointCoord-.5;c.y*=.7;float d=length(c);
      vec3 col=mix(mix(uHot,uFel,smoothstep(0.,.4,vLife)),uNether,smoothstep(.6,1.,vLife));
      gl_FragColor=vec4(col,smoothstep(.5,0.,d)*smoothstep(0.,.1,vLife)*(1.-vLife)*.7*uOn);}`,
    ),
  )
  embers.frustumCulled = false
  embers.visible = false
  scene.add(embers)
  let emberCap = 300
  let emberFade: JSAnimation | undefined
  let embersTheme = false
  function syncEmbers() {
    const on = K.embersUser || embersTheme
    const preset = embersTheme ? EMBERS.hellfire : EMBERS.fel
    emberU.uHot.value.set(preset[0])
    emberU.uFel.value.set(preset[1])
    emberU.uNether.value.set(preset[2])
    emberGeo.setDrawRange(0, emberCap)
    emberFade?.cancel()
    if (on) embers.visible = true
    emberFade = animate(emberU.uOn, {
      value: on ? 1 : 0,
      duration: 900,
      ease: 'inOutSine',
      onComplete: () => {
        if (!on) embers.visible = false
      },
    })
  }

  /* ---------- each tab's detail, built the first time its theme shows ---------- */

  type Detail = { U: Uniforms; mesh: Mesh | Points; geo?: BufferGeometry; extra?: (Mesh | Points)[] }
  const details: Partial<Record<(typeof TAB_THEMES)[number], Detail | 'failed'>> = {}
  let bubbleCap = 100
  const groupLights = { f: [0.6, 0.6, 0.6, 0.6, 0.6], n: 5 }

  /* planner: soft hollow bubbles rise from the water, wobble, and fade out high up */
  function buildBubbles(): Detail {
    const r = rng(4242)
    const pos = new Float32Array(MAX_BUBBLES * 3)
    const seed = new Float32Array(MAX_BUBBLES)
    for (let i = 0; i < MAX_BUBBLES; i++) {
      pos[i * 3] = (r() - 0.5) * 24
      pos[i * 3 + 1] = r() * 7
      pos[i * 3 + 2] = -r() * 15
      seed[i] = r()
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1))
    geo.setDrawRange(0, bubbleCap)
    const DU = { uTime: time, uDpr: dprU, uCol: { value: new Color('#bfe4ff') }, uI: { value: 0 } }
    const mesh = new Points(
      geo,
      additive(
        DU,
        `uniform float uTime,uDpr;attribute float aSeed;varying float vA;
    void main(){vec3 p=position;float y=mod(p.y+uTime*(.12+aSeed*.22),7.);p.y=y+.1;
      p.x+=sin(uTime*(.7+aSeed)+aSeed*40.)*.18;p.z+=cos(uTime*.6+aSeed*25.)*.12;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=(8.+aSeed*12.)*uDpr*(10./-mv.z);
      vA=smoothstep(0.,.6,y)*(1.-smoothstep(5.,7.,y))*(1.-smoothstep(10.,30.,-mv.z));}`,
        `uniform vec3 uCol;uniform float uI;varying float vA;
    void main(){vec2 c=gl_PointCoord-.5;float d=length(c);
      float rim=smoothstep(.5,.44,d)*smoothstep(.3,.42,d);
      float hi=smoothstep(.14,0.,length(c-vec2(-.16,-.16)));
      gl_FragColor=vec4(uCol,(rim*.8+hi*.85)*vA*uI);}`,
      ),
    )
    return { U: DU, mesh, geo }
  }

  /* raidcomp: one warm light per raid group orbits the crystal on a faint ring, as bright as its group is covered */
  function buildGroupLights(): Detail {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(15), 3))
    geo.setAttribute('aI', new BufferAttribute(new Float32Array([0, 1, 2, 3, 4]), 1))
    geo.setAttribute('aF', new BufferAttribute(new Float32Array(groupLights.f), 1))
    const DU = { uTime: time, uDpr: dprU, uN: { value: groupLights.n }, uC: { value: crystal.position }, uCol: { value: new Color('#fff0c8') }, uI: { value: 0 } }
    const mesh = new Points(
      geo,
      additive(
        DU,
        `uniform float uTime,uDpr,uN;uniform vec3 uC;attribute float aI,aF;varying float vB;
    void main(){float on=step(aI,uN-.5),a=aI*6.28318/max(uN,1.)+uTime*.12;
      vec3 p=uC+vec3(cos(a)*2.4,-.35+sin(uTime*.45+aI*1.3)*.15,sin(a)*2.4);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      vB=(.5+.5*aF)*(.85+.15*sin(uTime*.5+aI*2.1))*on;
      gl_PointSize=(30.+24.*aF)*uDpr*(12./-mv.z)*on;}`,
        `uniform vec3 uCol;uniform float uI;varying float vB;
    void main(){float d=length(gl_PointCoord-.5);float a=exp(-d*d*60.)+exp(-d*d*12.)*.5;
      gl_FragColor=vec4(mix(uCol,vec3(1.),exp(-d*d*160.)*.7),clamp(a,0.,1.)*vB*uI);}`,
      ),
    )
    const orbit = new Mesh(
      new TorusGeometry(2.4, 0.012, 4, 120),
      new MeshBasicMaterial({ color: new Color('#fff0c8'), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, fog: false }),
    )
    orbit.rotation.x = PI / 2
    return { U: DU, mesh, geo, extra: [orbit] }
  }

  /* tiers: three flat dashed rings of light stepping up under the crystal like a podium, turning slowly in turn */
  function buildRankRings(): Detail {
    const DU = { uTime: time, uI: { value: 0 } }
    const rings = ([[2.7, 0.38, 24, 1], [2, 0.7, 18, -1], [1.3, 1.02, 12, 1]] as const).map(([radius, y, n, dir], i) => {
      const ring = new Mesh(
        new RingGeometry(radius - 0.05, radius + 0.05, 160, 1),
        additive(
          { uTime: time, uI: DU.uI, uCol: { value: new Color(i === 2 ? '#e8d25a' : '#5cf2a8') }, uN: { value: n }, uS: { value: 0.015 * dir * (1 + i * 0.4) } },
          `varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          `uniform float uTime,uI,uN,uS;uniform vec3 uCol;varying vec2 vP;
      void main(){float f=fract(atan(vP.y,vP.x)/6.28318*uN+uTime*uS*uN);
        float dash=smoothstep(0.,.08,f)*smoothstep(.62,.54,f);
        gl_FragColor=vec4(uCol,(.18+.5*dash)*uI);}`,
          { side: DoubleSide },
        ),
      )
      ring.rotation.x = -PI / 2
      ring.userData.y = y
      return ring
    })
    // The first ring stands in as the detail's mesh; all three move together.
    return { U: DU, mesh: rings[0], extra: rings.slice(1) }
  }

  /* profs: veins of ore, dotted up the stone pillars with a glint running up each, and twinkling on the floating rocks */
  function buildOreGlints(): Detail {
    const src = islandGeo.attributes.position
    const faces = src.count / 3
    const per = 8
    const n = MAX_ROCKS * per
    const r = rng(777)
    const pos = new Float32Array(n * 3)
    const aC = new Float32Array(n * 4)
    const aQ = new Float32Array(n * 4)
    const seed = new Float32Array(n)
    const idx = new Float32Array(n)
    const v = (k: number) => [src.getX(k), src.getY(k), src.getZ(k)]
    for (let k = 0; k < MAX_ROCKS; k++) {
      const R = rocks[k]
      for (let vein = 0; vein < 2; vein++) {
        const f = Math.floor(r() * faces)
        const e = Math.floor(r() * 3)
        const A = v(f * 3 + e)
        const B = v(f * 3 + ((e + 1) % 3))
        for (let j = 0; j < 4; j++) {
          const i = k * per + vein * 4 + j
          const t = 0.15 + j * 0.25
          for (let c = 0; c < 3; c++) pos[i * 3 + c] = (A[c] + (B[c] - A[c]) * t) * 1.03
          aC.set([R.x, R.y, R.z, R.s], i * 4)
          aQ.set([R.ph, R.ry, R.sp, R.rx], i * 4)
          seed[i] = r()
          idx[i] = k
        }
      }
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(pos, 3))
    geo.setAttribute('aC', new BufferAttribute(aC, 4))
    geo.setAttribute('aQ', new BufferAttribute(aQ, 4))
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1))
    geo.setAttribute('aIdx', new BufferAttribute(idx, 1))
    const DU = { uTime: time, uDpr: dprU, uCount: { value: 0 }, uCol: { value: new Color('#ffe3a0') }, uI: { value: 0 } }
    const mesh = new Points(
      geo,
      additive(
        DU,
        // The same transform `updateRocks` gives each rock: scale, rotate Y then X, bob.
        `uniform float uTime,uDpr,uCount;attribute vec4 aC,aQ;attribute float aSeed,aIdx;varying float vA;
    void main(){vec3 o=position*aC.w;
      float ay=aQ.y+uTime*aQ.z,cy=cos(ay),sy=sin(ay),cx=cos(aQ.w),sx=sin(aQ.w);
      o=vec3(cy*o.x+sy*o.z,o.y,-sy*o.x+cy*o.z);o=vec3(o.x,cx*o.y-sx*o.z,sx*o.y+cx*o.z);
      vec3 p=aC.xyz+o;p.y+=sin(uTime*.35+aQ.x)*.18;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      float tw=pow(max(0.,sin(uTime*(.5+aSeed*.7)+aSeed*60.)),18.),on=step(aIdx,uCount-.5);
      vA=(.45+tw*.55)*on*(1.-smoothstep(16.,34.,-mv.z));gl_PointSize=(3.5+tw*7.)*uDpr*(14./-mv.z)*on;}`,
        ORE_FS,
      ),
    )
    return { U: DU, mesh, extra: [pillarVeins(DU)] }
  }

  function pillarVeins(DU: Uniforms) {
    const r = rng(31337)
    const pts: number[] = []
    const seeds: number[] = []
    const steps: number[] = []
    const TAU = PI * 2
    stone.updateMatrixWorld(true)
    pillars.forEach((pillar) => {
      const g = pillar.geometry.parameters
      const segment = TAU / g.radialSegments
      const at = (angle: number, y: number) => {
        // A point on the prism's flat face at this angle and height, pushed just outside it.
        const radius = g.radiusBottom + ((g.radiusTop - g.radiusBottom) * (y + g.height / 2)) / g.height
        const th = ((angle % TAU) + TAU) % TAU
        const k = Math.floor(th / segment)
        const s = th / segment - k
        const a0 = k * segment
        const a1 = a0 + segment
        dummy.position.set(radius * (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0)) * s) * 1.03, y, radius * (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0)) * s) * 1.03)
        return dummy.position.applyMatrix4(pillar.matrixWorld)
      }
      for (let vein = 0; vein < 3; vein++) {
        const length = 2.5 + r() * 2
        const y0 = -g.height / 2 + 0.6 + r() * (g.height - length - 1.2)
        const th0 = r() * TAU
        const drift = (r() - 0.5) * 0.5
        const sd = r()
        for (let j = 0; j < 22; j++) {
          const y = y0 + (j * length) / 21
          const p = at(th0 + drift * (y - y0) + (j % 2 ? 0.05 : -0.05), y)
          pts.push(p.x, p.y, p.z)
          seeds.push(sd)
          steps.push(j)
        }
      }
    })
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3))
    geo.setAttribute('aSeed', new BufferAttribute(new Float32Array(seeds), 1))
    geo.setAttribute('aJ', new BufferAttribute(new Float32Array(steps), 1))
    return new Points(
      geo,
      additive(
        DU,
        `uniform float uTime,uDpr;attribute float aSeed,aJ;varying float vA;
    void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
      float tw=pow(max(0.,sin(uTime*.6+aSeed*60.-aJ*.22)),24.);
      vA=(.55+tw*.45)*(1.-smoothstep(16.,34.,-mv.z));
      gl_PointSize=(4.+tw*7.)*uDpr*(14./-mv.z);}`,
        ORE_FS,
      ),
    )
  }

  const BUILD = { planner: buildBubbles, raidcomp: buildGroupLights, tiers: buildRankRings, profs: buildOreGlints }
  function detail(k: (typeof TAB_THEMES)[number]) {
    let d = details[k]
    if (d === undefined) {
      try {
        d = BUILD[k]()
        for (const object of [d.mesh, ...(d.extra ?? [])]) {
          object.frustumCulled = false
          object.visible = false
          scene.add(object)
        }
      } catch {
        d = 'failed'
      }
      details[k] = d
      if (k === 'raidcomp') setGroups(groupLights.f, groupLights.n)
    }
    return d === 'failed' ? undefined : d
  }

  function setGroups(f: readonly number[], n: number) {
    for (let i = 0; i < 5; i++) groupLights.f[i] = Math.max(0, Math.min(1, f[i] ?? 0))
    groupLights.n = Math.max(1, Math.min(5, n | 0))
    const d = details.raidcomp
    if (d && d !== 'failed' && d.geo) {
      const a = d.geo.attributes.aF as BufferAttribute
      for (let i = 0; i < 5; i++) a.array[i] = groupLights.f[i]
      a.needsUpdate = true
      d.U.uN.value = groupLights.n
    }
  }

  /* ---------- the tint: the host palette, then every theme by its weight ---------- */

  const auroraA = auroraU.uA.value
  const auroraB = auroraU.uB.value
  function applyWeights() {
    for (const n of PARTS) {
      cur[n].copy(SSC[n]).lerp(TK[n], W.tk)
      for (const k of THEMES) {
        const extra = EXTRA[k]
        if (extra && W[k] > 0.001) cur[n].lerp(extra[n], W[k])
      }
    }
    auroraA.setRGB(0, 0, 0)
    auroraB.setRGB(0, 0, 0)
    let intensity = 0
    for (const k of THEMES) {
      const w = W[k]
      if (w <= 0) continue
      const [a, b, i] = AURORA[k]
      auroraA.r += a.r * w
      auroraA.g += a.g * w
      auroraA.b += a.b * w
      auroraB.r += b.r * w
      auroraB.g += b.g * w
      auroraB.b += b.b * w
      intensity += i * w
    }
    auroraU.uI.value = intensity
    K.auroraDirty = true
    shaftMat.uniforms.uI.value = W.ssc
    shafts.forEach((shaft) => (shaft.visible = shaft.userData.tierOn && W.ssc > 0.01))
    pumpMat.uniforms.uI.value = W.ssc
    pump.visible = W.ssc > 0.01
    fortressMat.opacity = W.tk * 0.95
    fortress.forEach((pillar) => (pillar.visible = W.tk > 0.01))
    rockMat.emissive.set('#2a1450').lerp(tmp.set('#6a2c14'), W.bladesedge + W.hellfire * 0.6)
    for (const k of TAB_THEMES) if (W[k] > 0) rockMat.emissive.lerp(ROCK[k], W[k])
    rockMat.emissiveIntensity = 0.35 + 0.25 * W.bladesedge + 0.15 * W.profs
    for (const k of TAB_THEMES) {
      const d = W[k] > 0 ? detail(k) : details[k] === 'failed' ? undefined : details[k]
      if (!d) continue
      const on = W[k] > 0.01
      d.U.uI.value = W[k]
      d.mesh.visible = on
      d.extra?.forEach((object) => {
        object.visible = on
        if (object.material instanceof MeshBasicMaterial) object.material.opacity = 0.16 * W[k]
      })
    }
  }

  /* the look's numbers, lerped by the look weights */
  const lookTmp = new Color()
  function look<T extends 'lamp' | 'ambientI' | 'rimI' | 'halo' | 'motes' | 'calm'>(key: T) {
    let sum = 0
    for (const k of LOOK_KEYS) sum += LOOKS[k][key] * LW[k]
    return sum
  }
  function lookColor(key: 'ambient' | 'rim' | 'crystal' | 'shard' | 'pillar', into: Color) {
    into.setRGB(0, 0, 0)
    for (const k of LOOK_KEYS) {
      if (LW[k] <= 0) continue
      lookTmp.setHex(LOOKS[k][key])
      into.r += lookTmp.r * LW[k]
      into.g += lookTmp.g * LW[k]
      into.b += lookTmp.b * LW[k]
    }
  }
  function tint() {
    lamp.color.copy(cur.light)
    crystal.material.emissive.copy(cur.light)
    halo.material.color.copy(cur.light)
    shardMat.emissive.copy(cur.light)
    accent.color.copy(cur.acc)
    fog.color.copy(cur.fog)
    renderer.setClearColor(cur.fog)
    lookColor('ambient', ambient.color)
    lookColor('rim', rim.color)
    lookColor('crystal', crystal.material.color)
    lookColor('shard', shardMat.color)
    lookColor('pillar', pillarMat.color)
    ambient.intensity = look('ambientI') * LIGHT
    rim.intensity = look('rimI') * LIGHT
    const white = U.uWhite.value.setRGB(0, 0, 0)
    for (const k of LOOK_KEYS) {
      const [r, g, b] = LOOKS[k].white
      white.r += r * LW[k]
      white.g += g * LW[k]
      white.b += b * LW[k]
    }
    moteGeo.setDrawRange(0, Math.round(moteCount * look('motes')))
    // Simulation's stone pillars give way to the crystal ones; Raids shows the crystal for Tempest Keep only.
    stone.visible = LW.simulation < 0.5
    // The swell, the kit's K3: the crystal, its halo and the lamp brighten together and settle.
    crystal.material.emissiveIntensity = 0.18 + K.swell * 0.7
    glowMat.uniforms.uI.value = 0.12 + K.swell * 0.5
    halo.material.opacity = look('halo') + K.swell * 0.35
    lamp.intensity = (look('lamp') + K.swell * 1.1) * LIGHT
  }

  /* ---------- the camera: a slow sway, the pointer, the page's scroll and the intro ---------- */

  const cam = { depth: 0, intro: 1 }
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
  function place() {
    camera.position.set(Math.sin(K.t * 0.05) * 1.2 + pointer.sx * 1.4, 3.4 + cam.intro * 2.2 - cam.depth * 0.6 - pointer.sy * 0.5, 11 - cam.depth * 2.5)
    camera.lookAt(pointer.sx * 0.6, 0.8 + cam.intro * 0.6, -2)
  }
  function pose(t: number) {
    const shown = 1 - LW.raids * (1 - W.tk)
    crystal.visible = halo.visible = glow.visible = shown > 0.02
    shards.forEach((shard) => (shard.visible = shown > 0.02))
    crystal.scale.set(0.8 * shown, 1.5 * shown, 0.8 * shown)
    halo.scale.setScalar(Math.max(shown, 0.01))
    crystal.position.y = 2.4 + Math.sin(t * 0.8) * 0.18
    halo.position.copy(crystal.position)
    shards.forEach((shard, i) => {
      const a = t * 0.6 + i * 2.094
      shard.position.set(crystal.position.x + Math.cos(a) * 1.25, crystal.position.y + Math.sin(a * 1.3) * 0.35, crystal.position.z + Math.sin(a) * 1.25)
      shard.rotation.set(a, a * 0.7, 0)
    })
    glow.position.copy(crystal.position)
    glow.quaternion.copy(camera.quaternion)
    const lights = details.raidcomp
    if (lights && lights !== 'failed') lights.extra?.[0].position.set(crystal.position.x, crystal.position.y - 0.35, crystal.position.z)
    const rings = details.tiers
    if (rings && rings !== 'failed') [rings.mesh, ...(rings.extra ?? [])].forEach((ring) => {
      ring.position.set(crystal.position.x, ring.userData.y, crystal.position.z)
      ring.visible = ring.visible && shown > 0.02
    })
    const ore = details.profs
    if (ore && ore !== 'failed') ore.U.uCount.value = rockMesh.count
  }
  function size() {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w < 700 ? 62 : 50
    camera.updateProjectionMatrix()
  }

  /* ---------- quality ---------- */

  const perf = { n: 0, sum: 0, last: 0, start: 0, settled: false, checkedLow: false }
  function setTier(name: Tier) {
    const T = TIERS[name]
    tier = name
    K.every = T.every
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, T.dpr))
    dprU.value = renderer.getPixelRatio()
    size()
    const half = small() ? 0.5 : 1
    rockMesh.count = Math.min(T.rocks, MAX_ROCKS)
    emberCap = Math.round(T.embers * half)
    emberGeo.setDrawRange(0, emberCap)
    bubbleCap = Math.round(T.bubbles * half)
    const bubbles = details.planner
    if (bubbles && bubbles !== 'failed') bubbles.geo?.setDrawRange(0, bubbleCap)
    shafts.forEach((shaft, i) => (shaft.userData.tierOn = i < T.shafts))
    for (const material of [auroraMat, shaftMat, glowMat]) {
      material.defines.OCT = Math.min(T.oct, material === auroraMat ? 4 : 3)
      material.needsUpdate = true
    }
    auroraOn = T.aurora > 0
    if (auroraOn) auroraTarget.setSize(Math.round(1024 * T.aurora), Math.round(256 * T.aurora))
    K.auroraDirty = true
    applyWeights()
    root.dataset.sceneTier = name
  }
  function measure(now: number) {
    if (perf.settled) return
    if (!perf.start) perf.start = now
    if (perf.last) {
      const d = now - perf.last
      if (now - perf.start > 300 && d < 250) {
        perf.sum += d
        perf.n++
      }
    }
    perf.last = now
    if (now - perf.start > 2300 && perf.n > 20) {
      const average = perf.sum / perf.n
      if (tier === 'low' && perf.checkedLow) {
        perf.settled = true
        if (average > TOO_SLOW_MS && !options.force) fail('it ran too slowly here')
        return
      }
      const next: Tier = average > 20 ? 'low' : average < 10 && window.innerWidth >= 700 ? 'high' : 'medium'
      setTier(next)
      // Settled unless it had to drop to the lowest level: that one gets a second look.
      if (next !== 'low') perf.settled = true
      perf.checkedLow = true
      perf.n = perf.sum = perf.start = perf.last = 0
    }
  }

  /* ---------- themes: 1.2 seconds from one screen to the next ---------- */

  let crossfade: JSAnimation | undefined
  let shownTheme: Theme | undefined
  let shownLook: Look | undefined
  function showScreen(instant: boolean) {
    if (frontDoor()) rest()
    else if (!stopped) kick()
    const { look: nextLook, theme } = screenOf(root)
    if (theme === shownTheme && nextLook === shownLook) return
    shownTheme = theme
    shownLook = nextLook
    root.dataset.sceneTheme = theme
    embersTheme = theme === 'hellfire'
    syncEmbers()
    const to: Record<string, number> = {}
    for (const k of THEMES) to[`w_${k}`] = k === theme ? 1 : 0
    for (const k of LOOK_KEYS) to[`l_${k}`] = k === nextLook ? 1 : 0
    crossfade?.cancel()
    if (instant) {
      for (const k of THEMES) W[k] = to[`w_${k}`]
      for (const k of LOOK_KEYS) LW[k] = to[`l_${k}`]
      applyWeights()
      return
    }
    const from: Record<string, number> = {}
    for (const k of THEMES) from[`w_${k}`] = W[k]
    for (const k of LOOK_KEYS) from[`l_${k}`] = LW[k]
    crossfade = animate(from, {
      ...to,
      duration: 1200,
      ease: 'inOutCubic',
      onUpdate: () => {
        for (const k of THEMES) W[k] = from[`w_${k}`]
        for (const k of LOOK_KEYS) LW[k] = from[`l_${k}`]
        applyWeights()
      },
    })
  }
  const watch = new MutationObserver(() => showScreen(false))
  watch.observe(root, { attributes: true, attributeFilter: ['data-tab', 'data-raid', 'data-raid-id'] })

  /* ---------- the loop ---------- */

  let raf = 0
  let last = 0
  let stopped = false
  /*
   * The front door has its own painted art and went in without 3D (the port plan's Decision 1), so
   * the scene rests and fades out while it is shown, and comes back with the first section.
   */
  const frontDoor = () => root.dataset.tab === 'home' && document.querySelector('.section-picker') !== null
  function rest() {
    pause()
    canvas.classList.remove('is-shown')
    root.classList.remove('scene-on')
  }
  function frame(now: number) {
    raf = 0
    if (frontDoor()) {
      rest()
      return
    }
    let dt = Math.min(0.05, (now - (last || now)) / 1000)
    last = now
    measure(now)
    const calm = look('calm')
    const spin = dt
    dt *= calm
    K.t += dt
    K.frames++
    time.value = K.t
    pointer.sx += (pointer.x - pointer.sx) * 0.04
    pointer.sy += (pointer.y - pointer.sy) * 0.04
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    const depth = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0
    cam.depth += (depth - cam.depth) * Math.min(1, spin * 4)
    // A swell also spins the crystal up for a moment, at full speed even behind a calm tab.
    crystal.rotation.y += dt * 0.25 + spin * K.charge * 2.2
    halo.rotation.z += dt * 0.1 + spin * K.charge * 1.4
    updateRocks()
    updateAurora(dt)
    tint()
    place()
    pose(K.t)
    renderer.render(scene, camera)
    if (!canvas.classList.contains('is-shown')) {
      canvas.classList.add('is-shown')
      root.classList.add('scene-on')
    }
    kick()
  }
  function kick() {
    if (!raf && !stopped && !document.hidden && !frontDoor()) raf = requestAnimationFrame(frame)
    else if (!raf) last = 0
  }
  function pause() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    last = 0
    perf.last = 0
  }
  const onVisibility = () => (document.hidden ? pause() : kick())
  const onResize = () => size()
  const finePointer = window.matchMedia('(pointer: fine)').matches
  const onPointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1
  }
  const onLost = (event: Event) => {
    event.preventDefault()
    fail('the graphics context was lost')
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('resize', onResize, { passive: true })
  if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true })
  canvas.addEventListener('webglcontextlost', onLost)

  function stop() {
    if (stopped) return
    stopped = true
    pause()
    watch.disconnect()
    crossfade?.cancel()
    emberFade?.cancel()
    swelling?.cancel()
    intro.cancel()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointer)
    canvas.removeEventListener('webglcontextlost', onLost)
    root.classList.remove('scene-on')
    delete root.dataset.sceneTheme
    delete root.dataset.sceneTier
    renderer.dispose()
    canvas.remove()
  }
  function fail(why: string) {
    stop()
    options.onFail(why)
  }

  let swelling: JSAnimation | undefined
  let embersOff: ReturnType<typeof setTimeout> | undefined

  size()
  setTier(tier)
  showScreen(true)
  // The prototypes' intro: the camera settles from a little above the water as the scene fades in.
  const intro = animate(cam, { intro: 0, duration: 1400, ease: 'outExpo' })
  kick()

  return {
    stop() {
      clearTimeout(embersOff)
      stop()
    },
    swell() {
      // Never restarted mid-swell: at most one every 1.2 seconds, so nothing flashes.
      if (swelling || stopped) return
      swelling = animate(K, {
        swell: [
          { to: 1, duration: 500, ease: 'outSine' },
          { to: 0, duration: 700, ease: 'inOutSine' },
        ],
        charge: [
          { to: 1, duration: 500, ease: 'outSine' },
          { to: 0, duration: 700, ease: 'inOutSine' },
        ],
        onComplete: () => {
          swelling = undefined
        },
      })
    },
    embers() {
      if (stopped) return
      K.embersUser = true
      syncEmbers()
      clearTimeout(embersOff)
      embersOff = setTimeout(() => {
        K.embersUser = false
        syncEmbers()
      }, 1400)
    },
    groups: setGroups,
  }
}
