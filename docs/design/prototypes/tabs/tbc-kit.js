/* tbc-kit.js — the shared "TBC motion kit" for the Project Defeat tab prototypes (K1–K10 + lift).
   Plan: docs/research/wow-tbc-motion/recommendations.md · techniques: techniques.md.
   Everything here is procedural (our own shaders, geometry and SVG): no Blizzard assets, logos,
   textures, music or sound. There is no audio anywhere in this kit.

   LOADING ORDER (classic scripts, no modules)
     three.min.js r128 → gsap 3.13.0 (+ DrawSVGPlugin optional) → the page's scene script that
     defines window.SCENE → <script src="tbc-kit.js"> → the page's motion script.
     The kit calls TBCKit.init(window.SCENE) on load. A page whose scene is created later calls
     TBCKit.init(window.SCENE) itself. Without THREE, GSAP, WebGL or a SCENE every call is a safe no-op
     (or a CSS-only fallback), so pages never need to guard.

   window.SCENE CONTRACT (what a tab's scene script exposes; everything past `ok` is optional)
     ok            boolean   true once WebGL is running
     mix           object    palette weights the host lerps in its tint step; the kit tweens mix.tk
     speed         number    host multiplies its frame dt by this (the "lift" slows the world)
     render()      fn        draw one still frame now if the loop is not running
     isMoving()    fn→bool   host's loop is animating (Motion toggle on, not reduced motion)
     isEnabled()   fn→bool   the "3D scene" toggle is on and the context is not lost
     setVisible(b) fn        host pauses its loop while false (kit calls it from an IntersectionObserver)
     setDpr(v)     fn        host sets renderer pixel ratio + its uDpr uniform and resizes
     onFrame(f)    fn        host calls f(dt, t) every frame BEFORE rendering; dt = 0 for still frames
     onTint(f)     fn        host calls f(cur) after computing its palette {light,deep,fog,acc: THREE.Color}
                             and BEFORE applying it to lights/fog, so f may lerp those colours further
     onState(f)    fn        host calls f(SCENE) whenever motion / enabled / lost changes
     three         object    { scene, camera, renderer, uniforms, crystal, halo, lamp, water }
                             crystal: Mesh with MeshStandardMaterial (emissive); halo: Mesh with opacity;
                             lamp: PointLight. Missing members just switch the matching effect off.
   The kit OWNS the crystal's emissiveIntensity, the halo's opacity and the lamp's intensity (K3 swell
   writes them outright). Hosts must not write those every frame; animate rotation/scale instead.
   The host owns the render loop (rAF, visibilitychange pause, context loss). The kit never starts
   its own WebGL loop; it renders only inside onFrame. A page with no SCENE can still call
   TBCKit.setMotion(on) so the DOM effects (K7–K10, lift) know whether to move.

   API (window.TBCKit)
     init(scene)                 attach to a SCENE (called automatically if window.SCENE exists)
     ignite({force})             K1 portal ignition; once per browser session; skippable (click / Esc)
     swell()                     K3 naaru swell, ~1.2s soft brightness rise and fall, never restarts mid-swell
     embers(on, {count,height,preset:'fel'|'hellfire'})   K4 fel embers
     theme(name, {instant})      'ssc' (K5) | 'tk' (K6) | 'hellfire' | 'bladesedge' | 'karazhan'; 1.2s crossfade
     runeRing(el, {size,glyphs,seed,spin})  K7 SVG rune ring into el → {svg, remove()}
     enter(el, {delay})          K8 light-portal entry ring for a panel
     rebirth(x, y)               K9 gold-orange sparks scatter and re-form (viewport px; default centre)
     taint(el, on)               K10 slow teal → sickly-green state tint (text/icon stay the real cue)
     lift({targets})             the rare Gravity Lapse "lift" (17/17 recommended gear)
     setMotion(on)               only for pages without a SCENE
     tier / ok / themeName       read-only: 'low'|'medium'|'high', 3D extras built, current theme
   K2 (shattered sky: instanced rocks + nether aurora) is built by init and runs under every theme.

   ACCESSIBILITY: reduced motion → still frame, no ignition, no swells, rings drawn static.
   Every pulse is a single slow swell (< 1 per second); nothing flashes 3 times a second.
   Motion off or 3D off ends any running effect at its rest state. */
(function(){
"use strict";
if(window.TBCKit)return;
const doc=document,root=doc.documentElement;
const RMQ=window.matchMedia?matchMedia("(prefers-reduced-motion: reduce)"):{matches:false};
const hasG=()=>typeof window.gsap!=="undefined";
const hasT=()=>typeof window.THREE!=="undefined";
const hasDraw=()=>hasG()&&typeof window.DrawSVGPlugin!=="undefined";
const THEMES=["ssc","tk","hellfire","bladesedge","karazhan"];
const SKEY="pd-tbc-ignited";
let S=null,GL=false,hostMotion=null;
const K={t:0,frames:0,tier:"medium",theme:"ssc",every:3,auDirty:true,emUser:false,emTheme:false,igniting:null};
const W={ssc:1,tk:0,hellfire:0,bladesedge:0,karazhan:0};
const live=new Set();

function motionOn(){
  if(RMQ.matches)return false;
  if(S&&typeof S.isMoving==="function")return !!S.isMoving();
  return hostMotion==null?true:hostMotion;
}
function glOn(){return GL&&!!S&&S.ok&&(typeof S.isEnabled!=="function"||S.isEnabled());}
function rerender(){if(S&&typeof S.render==="function")S.render();}
function sGet(k){try{return sessionStorage.getItem(k);}catch(e){return null;}}
function sSet(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
/* one-shot animations are tracked so Motion off can end them at rest; each also self-finishes */
function track(a){
  if(!a)return a;live.add(a);
  const prev=a.eventCallback("onComplete");
  a.eventCallback("onComplete",function(){live.delete(a);if(prev)prev.apply(this,arguments);});
  const wait=(a.totalDuration()+(a.delay?a.delay():0))*1000+600;
  setTimeout(()=>{if(live.has(a)&&a.progress()<1)a.progress(1);},Math.max(1500,wait));
  return a;
}
function finishAll(){live.forEach(a=>{if(a.progress()<1)a.progress(1);});live.clear();}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function css(){
  if(doc.getElementById("tbc-kit-css"))return;
  const st=doc.createElement("style");st.id="tbc-kit-css";
  st.textContent=
`.tbc-rune{display:inline-block;color:var(--glow,#4fd8c8);line-height:0;vertical-align:middle}
.tbc-rune svg{display:block;overflow:visible}
.tbc-ring{position:fixed;left:0;top:0;border-radius:50%;pointer-events:none;z-index:40;border:1.5px solid var(--glow,#4fd8c8);box-shadow:0 0 18px var(--glow,#4fd8c8),inset 0 0 12px var(--glow,#4fd8c8);opacity:0}
.tbc-burst{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60}
.tbc-taint::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:var(--tbc-taint,0);background:linear-gradient(135deg,rgba(150,205,50,.18),rgba(110,150,30,.07));box-shadow:inset 0 0 0 1px rgba(170,215,70,.55),0 0 18px -6px rgba(150,205,50,.6)}
@media (prefers-reduced-motion:reduce){.tbc-ring,.tbc-burst{display:none!important}}`;
  (doc.head||root).appendChild(st);
}

/* shared GLSL: value noise, fBm (octaves set per tier through the OCT define) and one domain warp */
const NOISE=`
#ifndef OCT
#define OCT 4
#endif
float h21(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<OCT;i++){s+=a*vnoise(p);p=p*2.03+7.1;a*=.5;}return s;}
float warped(vec2 p,float t){vec2 q=vec2(fbm(p+vec2(0.,t*.05)),fbm(p+vec2(5.2,1.3)));return fbm(p+3.*q);}
`;
const VUV=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

/* ---------- performance tiers: start on medium, measure ~2s of real frames, then settle ---------- */
const TIERS={
  low:   {rocks:6, embers:150,aurora:0,  every:0,oct:3,dpr:1,  shafts:2},
  medium:{rocks:12,embers:300,aurora:.25,every:3,oct:4,dpr:1.5,shafts:4},
  high:  {rocks:18,embers:500,aurora:.5, every:2,oct:5,dpr:1.5,shafts:4}};
const MAXROCKS=18,MAXEMB=500;
const perf={n:0,sum:0,last:0,start:0,done:false};
function seedTier(){const dm=navigator.deviceMemory;return dm&&dm<=2?"low":"medium";}
function measure(){
  if(perf.done)return;
  const now=performance.now();
  if(!perf.start)perf.start=now;
  if(perf.last){const d=now-perf.last;if(now-perf.start>300&&d<250){perf.sum+=d;perf.n++;}}
  perf.last=now;
  if(now-perf.start>2300&&perf.n>20){
    perf.done=true;const avg=perf.sum/perf.n;
    setTier(avg>20?"low":avg<10&&innerWidth>=700?"high":"medium");
  }
}
function setTier(name){
  const T=TIERS[name];if(!T)return;K.tier=name;K.every=T.every;
  if(S&&typeof S.setDpr==="function")S.setDpr(Math.min(window.devicePixelRatio||1,T.dpr));
  if(!GL)return;
  const small=innerWidth<700;
  if(G3.rocks)G3.rocks.count=Math.min(T.rocks,MAXROCKS);
  G3.emCap=Math.round(T.embers*(small?.5:1));
  if(G3.emGeo)G3.emGeo.setDrawRange(0,Math.min(G3.emWant||G3.emCap,G3.emCap));
  G3.shafts.forEach((m,i)=>{m.userData.tierOn=i<T.shafts;});
  [G3.auMat,G3.shaftMat,G3.glowMat].forEach(m=>{if(m){m.defines.OCT=Math.min(T.oct,m.userData.maxOct||5);m.needsUpdate=true;}});
  if(G3.auPlane){
    G3.auPlane.userData.tierOn=T.aurora>0;
    if(T.aurora>0&&G3.rt)G3.rt.setSize(Math.round(1024*T.aurora),Math.round(256*T.aurora));
  }
  K.auDirty=true;applyTheme();rerender();
  try{root.dataset.tbcTier=name;}catch(e){}
}

/* ---------- attach to the host scene ---------- */
const G3={shafts:[],pillars:[],emCap:300,emWant:0};
function init(scn){
  css();
  if(!scn||S===scn)return api;
  S=scn;
  if(typeof S.onState==="function")S.onState(onState);
  if(!S.ok||!hasT()||!S.three||!S.three.scene||!S.three.renderer)return api;
  try{build();GL=true;}catch(e){GL=false;if(window.console)console.warn("TBCKit: 3D extras unavailable",e);return api;}
  if(typeof S.onFrame==="function")S.onFrame(frame);
  if(typeof S.onTint==="function")S.onTint(tintHook);
  if("IntersectionObserver" in window&&typeof S.setVisible==="function"){
    try{new IntersectionObserver(es=>S.setVisible(es[es.length-1].isIntersecting)).observe(S.three.renderer.domElement);}catch(e){}
  }
  setTier(seedTier());
  return api;
}
function build(){
  buildSky();buildWater();buildFortress();buildGlow();buildEmbers();
}
const KU={uTime:{value:0}};
function frame(dt){
  if(!GL)return;
  if(dt>0){K.t+=dt;K.frames++;measure();}
  KU.uTime.value=K.t;
  const cam=S.three.camera,cr=S.three.crystal;
  updateRocks();
  updateAurora(dt);
  if(G3.glow&&cr){G3.glow.visible=cr.visible!==false;G3.glow.position.copy(cr.position);if(cam)G3.glow.quaternion.copy(cam.quaternion);}
  if(G3.portal&&cam)G3.portal.quaternion.copy(cam.quaternion);
}
function onState(){
  const m=motionOn(),g=glOn();
  if(!m||!g)endIgnite();
  /* Motion off ends user-triggered embers (e.g. a Simulate charge); theme embers stay as part of the still frame. */
  if(!m){finishAll();stopSpins();if(K.emUser){K.emUser=false;syncEmbers({});}}
  if(!m||!g)perf.last=0;
}
/* ---------- K2 shattered sky: instanced low-poly rock fragments + a slow nether aurora band ---------- */
const RD=[];let dummy=null,tmpC=null;
function islandGeo(){
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i);let y=p.getY(i);
    /* jitter from position, not index: r128 polyhedra are non-indexed, so shared corners stay shared */
    const j=1+.22*Math.sin(x*12.99+y*78.23+z*37.71);
    if(y<0)y*=2.1;
    p.setXYZ(i,x*j,y*j,z*j);
  }
  g.computeVertexNormals();return g;
}
function buildSky(){
  const T=S.three;dummy=new THREE.Object3D();tmpC=new THREE.Color();
  const r=rng(1337);
  for(let i=0;i<MAXROCKS;i++){
    const side=i%2?1:-1;
    RD.push({x:side*(2.5+r()*15),y:4.4+r()*3.8,z:-3-r()*14,s:.3+r()*.85,ph:r()*6.283,
      rx:(r()-.5)*.35,ry:r()*6.283,sp:(r()-.5)*.06});
  }
  G3.rockMat=new THREE.MeshStandardMaterial({color:0x1b1724,emissive:new THREE.Color("#2a1450"),emissiveIntensity:.35,roughness:.95,metalness:0,flatShading:true});
  G3.rocks=new THREE.InstancedMesh(islandGeo(),G3.rockMat,MAXROCKS);
  G3.rocks.frustumCulled=false;
  T.scene.add(G3.rocks);updateRocks();
  /* aurora: drawn at reduced size into a render target every few frames, shown on one far plane */
  G3.auU={uTime:KU.uTime,uA:{value:new THREE.Color("#5cf2c0")},uB:{value:new THREE.Color("#4a2a90")},uI:{value:.55}};
  G3.auMat=new THREE.ShaderMaterial({defines:{OCT:4},uniforms:G3.auU,depthTest:false,depthWrite:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:NOISE+`uniform float uTime,uI;uniform vec3 uA,uB;varying vec2 vUv;
    void main(){vec2 uv=vec2(vUv.x*4.,vUv.y);float t=uTime*.25;
      float off=.22*fbm(vec2(uv.x*.9+t*.15,t*.1));
      float bd=(vUv.y-.45-off)*5.;float band=exp(-bd*bd);
      float curt=.55+.45*sin(uv.x*3.+fbm(uv*1.6+t*.05)*5.+t*.6);
      float cloud=warped(uv*.8,t);
      vec3 col=uB*cloud*.55*smoothstep(1.,.2,vUv.y)+uA*band*curt*.8+mix(uA,vec3(1.),.3)*band*band*curt*.2;
      float a=clamp(band*curt*.9+cloud*.35,0.,1.)*smoothstep(0.,.25,vUv.y)*smoothstep(1.,.6,vUv.y)*smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x);
      gl_FragColor=vec4(col*a*uI,1.);}`});
  G3.auMat.userData.maxOct=4;
  G3.auScene=new THREE.Scene();G3.auCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  G3.auScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),G3.auMat));
  G3.rt=new THREE.WebGLRenderTarget(256,64,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:false});
  G3.auPlane=new THREE.Mesh(new THREE.PlaneGeometry(96,24),new THREE.MeshBasicMaterial({map:G3.rt.texture,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  G3.auPlane.position.set(0,8.5,-26);G3.auPlane.userData.tierOn=true;
  T.scene.add(G3.auPlane);
}
function updateRocks(){
  const m=G3.rocks;if(!m)return;const t=K.t;
  for(let i=0;i<m.count;i++){
    const r=RD[i];
    dummy.position.set(r.x,r.y+Math.sin(t*.35+r.ph)*.18,r.z);
    dummy.rotation.set(r.rx,r.ry+t*r.sp,0);dummy.scale.setScalar(r.s);dummy.updateMatrix();
    m.setMatrixAt(i,dummy.matrix);
  }
  m.instanceMatrix.needsUpdate=true;
}
function updateAurora(dt){
  const p=G3.auPlane;if(!p)return;
  p.visible=!!p.userData.tierOn;if(!p.visible)return;
  if(!(K.auDirty||(dt>0&&K.every>0&&K.frames%K.every===0)))return;
  K.auDirty=false;
  const R=S.three.renderer,prevRT=R.getRenderTarget(),cc=R.getClearColor(tmpC).clone(),ca=R.getClearAlpha();
  R.setRenderTarget(G3.rt);R.setClearColor(0x000000,0);R.clear();R.render(G3.auScene,G3.auCam);
  R.setRenderTarget(prevRT);R.setClearColor(cc,ca);
}
/* ---------- K5 Coilfang water: open light-shaft cones + a slow pump pulse on the water ---------- */
function buildWater(){
  const T=S.three;
  G3.shaftMat=new THREE.ShaderMaterial({defines:{OCT:3},uniforms:{uTime:KU.uTime,uCol:{value:new THREE.Color("#8ff0e6")},uI:{value:1}},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,vertexShader:VUV,
    fragmentShader:NOISE+`uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;
    void main(){float s=fbm(vec2(vUv.x*6.,uTime*.08));
      float a=smoothstep(0.,.6,vUv.y)*(1.-vUv.y)*s*.22*uI;gl_FragColor=vec4(uCol,a);}`});
  G3.shaftMat.userData.maxOct=3;
  const geo=new THREE.CylinderGeometry(.35,2.1,14,18,1,true);
  [[-6,-8,.12],[4.5,-12,-.08],[10,-6,.1],[-12,-14,-.12]].forEach(([x,z,tilt])=>{
    const m=new THREE.Mesh(geo,G3.shaftMat);m.position.set(x,7,z);m.rotation.z=tilt;m.userData.tierOn=true;
    T.scene.add(m);G3.shafts.push(m);});
  /* the pump: one ring wave every 7s spreading from under the crystal, plus a slow core breath */
  G3.pumpMat=new THREE.ShaderMaterial({uniforms:{uTime:KU.uTime,uCol:{value:new THREE.Color("#4fd8c8")},uI:{value:1}},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:VUV,
    fragmentShader:`uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;
    void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float ph=fract(uTime/7.);
      float rd=(r-ph*1.1)*14.;float ring=exp(-rd*rd)*(1.-ph)*smoothstep(1.,.6,r);
      float core=exp(-r*r*30.)*(.5+.5*sin(uTime*.9));
      gl_FragColor=vec4(uCol,(ring*.22+core*.06)*uI);}`});
  G3.pump=new THREE.Mesh(new THREE.PlaneGeometry(26,26),G3.pumpMat);
  G3.pump.rotation.x=-Math.PI/2;
  const cp=T.crystal?T.crystal.position:{x:0,z:-3};
  G3.pump.position.set(cp.x,.04,cp.z);T.scene.add(G3.pump);
}
/* ---------- K6 crystalline fortress: crystal pillars (gold-over-violet palette comes from the host mix.tk) ---------- */
function buildFortress(){
  const T=S.three;
  G3.pilMat=new THREE.MeshStandardMaterial({color:0x1a1030,emissive:new THREE.Color("#9b6bff"),emissiveIntensity:.45,metalness:.4,roughness:.25,flatShading:true,transparent:true,opacity:0});
  const geo=new THREE.OctahedronGeometry(1,0);
  [[-8.5,-9,4.6],[7.5,-10,5.4],[-3.5,-15,6],[11,-16,5],[-12.5,-13,4.2]].forEach(([x,z,h],i)=>{
    const m=new THREE.Mesh(geo,G3.pilMat);m.scale.set(.7,h,.7);m.position.set(x,h*.45,z);m.rotation.y=i*.7;
    m.visible=false;T.scene.add(m);G3.pillars.push(m);});
}
/* ---------- themes: weights W crossfade over 1.2s; the host palette lerps through onTint ---------- */
const EXTRA_HEX={hellfire:{light:"#ff8a3a",deep:"#1c0805",fog:"#160504",acc:"#7dff4a"},
  bladesedge:{light:"#f0a070",deep:"#140d16",fog:"#1b0f16",acc:"#9b6bff"},
  karazhan:{light:"#b48cff",deep:"#0d0a1c",fog:"#0a0714",acc:"#5ad1ff"}};
const AUC={ssc:["#5cf2c0","#4a2a90",.55],tk:["#ecc06a","#8a5cff",1],hellfire:["#ff6a2a","#6a1010",.7],
  bladesedge:["#ff9a6a","#4a2a6a",.6],karazhan:["#b48cff","#2a1a6a",.75]};
let EXTRA=null,AUCOL=null;
function colors(){
  if(EXTRA||!hasT())return;
  EXTRA={};Object.keys(EXTRA_HEX).forEach(k=>{EXTRA[k]={};Object.keys(EXTRA_HEX[k]).forEach(n=>EXTRA[k][n]=new THREE.Color(EXTRA_HEX[k][n]));});
  AUCOL={};THEMES.forEach(k=>AUCOL[k]=[new THREE.Color(AUC[k][0]),new THREE.Color(AUC[k][1]),AUC[k][2]]);
}
function tintHook(cur){
  colors();
  ["hellfire","bladesedge","karazhan"].forEach(k=>{const w=W[k];if(w>.001)["light","deep","fog","acc"].forEach(n=>{if(cur&&cur[n])cur[n].lerp(EXTRA[k][n],w);});});
}
function applyTheme(){
  if(!GL)return;colors();
  const a=G3.auU.uA.value.setRGB(0,0,0),b=G3.auU.uB.value.setRGB(0,0,0);let I=0;
  THEMES.forEach(k=>{const w=W[k];if(w<=0)return;const c=AUCOL[k];
    a.r+=c[0].r*w;a.g+=c[0].g*w;a.b+=c[0].b*w;b.r+=c[1].r*w;b.g+=c[1].g*w;b.b+=c[1].b*w;I+=c[2]*w;});
  G3.auU.uI.value=I;K.auDirty=true;
  G3.shaftMat.uniforms.uI.value=W.ssc;
  G3.shafts.forEach(m=>{m.visible=m.userData.tierOn&&W.ssc>.01;});
  G3.pumpMat.uniforms.uI.value=W.ssc;G3.pump.visible=W.ssc>.01;
  G3.pilMat.opacity=W.tk*.95;G3.pillars.forEach(m=>{m.visible=W.tk>.01;});
  G3.rockMat.emissive.set("#2a1450").lerp(tmpC.set("#6a2c14"),W.bladesedge+W.hellfire*.6);
  G3.rockMat.emissiveIntensity=.35+.25*W.bladesedge;
}
function theme(name,opts){
  if(THEMES.indexOf(name)<0)return null;
  opts=opts||{};K.theme=name;
  try{root.dataset.tbcTheme=name;}catch(e){}
  const to={};THEMES.forEach(k=>to[k]=k===name?1:0);
  const anim=hasG()&&motionOn()&&glOn()&&!opts.instant;
  const tk=name==="tk"?1:0;
  if(S&&S.mix){
    if(anim)gsap.to(S.mix,{tk,duration:1.2,ease:"power2.inOut",overwrite:"auto"});
    else{if(hasG())gsap.killTweensOf(S.mix,"tk");S.mix.tk=tk;}
  }
  let tw=null;
  if(anim)tw=track(gsap.to(W,Object.assign(to,{duration:1.2,ease:"power2.inOut",overwrite:"auto",onUpdate:()=>{applyTheme();rerender();}})));
  else{if(hasG())gsap.killTweensOf(W);Object.assign(W,to);applyTheme();rerender();}
  K.emTheme=name==="hellfire";syncEmbers({preset:K.emTheme?"hellfire":"fel"});
  return tw;
}
/* ---------- K3 naaru light: a camera-facing glow + soft rays behind the crystal, swelled on events ---------- */
const BASE={e:.18,o:.45,l:2.2,g:.12};
function buildGlow(){
  const T=S.three;if(!T.crystal)return;
  const m=T.crystal.material;BASE.e=m.emissiveIntensity!=null?m.emissiveIntensity:BASE.e;
  if(T.halo)BASE.o=T.halo.material.opacity;if(T.lamp)BASE.l=T.lamp.intensity;
  G3.glowMat=new THREE.ShaderMaterial({defines:{OCT:3},uniforms:{uTime:KU.uTime,uCol:{value:m.emissive||new THREE.Color("#4fd8c8")},uI:{value:BASE.g}},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:VUV,
    fragmentShader:NOISE+`uniform float uTime,uI;uniform vec3 uCol;varying vec2 vUv;
    void main(){vec2 p=vUv*2.-1.;float r=length(p);vec2 d=r>0.?p/r:vec2(1.,0.);
      float rays=pow(fbm(d*2.2+vec2(uTime*.05,0.)),3.)*smoothstep(1.,.1,r);
      float core=exp(-r*r*10.);gl_FragColor=vec4(uCol,clamp((core+rays*.5)*uI,0.,1.));}`});
  G3.glowMat.userData.maxOct=3;
  G3.glow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),G3.glowMat);G3.glow.scale.set(6,6,1);
  T.scene.add(G3.glow);
}
let swellTl=null;
function swell(){
  if(!hasG()||!motionOn())return null;
  if(swellTl)return swellTl; /* never restart mid-swell: at most one swell per ~1.2s, so no flashing */
  const st={k:0};let onU;
  if(glOn()&&S.three.crystal){
    const T=S.three,c=T.crystal.material,h=T.halo&&T.halo.material,L=T.lamp;
    onU=()=>{c.emissiveIntensity=BASE.e+st.k*.7;if(G3.glowMat)G3.glowMat.uniforms.uI.value=BASE.g+st.k*.5;
      if(h)h.opacity=BASE.o+st.k*.35;if(L)L.intensity=BASE.l+st.k*1.1;rerender();};
  }else{
    const fb=doc.querySelector(".fallback");if(!fb)return null;
    onU=()=>{fb.style.filter=st.k>0?"brightness("+(1+st.k*.3).toFixed(3)+")":"";};
  }
  swellTl=gsap.timeline({onUpdate:onU,onComplete:()=>{st.k=0;onU();swellTl=null;}});
  swellTl.to(st,{k:1,duration:.5,ease:"sine.out"}).to(st,{k:0,duration:.7,ease:"sine.inOut"});
  return track(swellTl);
}
/* ---------- K1 portal ignition: a polar-twisted fBm vortex, cool blue crossfading to fel green ---------- */
function ignite(opts){
  opts=opts||{};
  if(K.igniting)return K.igniting;
  if(!opts.force&&sGet(SKEY))return null;
  if(!hasG()||!motionOn()||!glOn())return null;
  sSet(SKEY,"1");
  const T=S.three;
  const U={uTime:KU.uTime,uMix:{value:0},uOpen:{value:0},uBlue:{value:new THREE.Color("#3a8cff")},
    uFel:{value:new THREE.Color("#5cff6a")},uNether:{value:new THREE.Color("#5a2a9c")}};
  const mat=new THREE.ShaderMaterial({defines:{OCT:K.tier==="low"?3:4},uniforms:U,transparent:true,depthWrite:false,depthTest:false,
    blending:THREE.AdditiveBlending,vertexShader:VUV,
    fragmentShader:NOISE+`uniform float uTime,uMix,uOpen;uniform vec3 uBlue,uFel,uNether;varying vec2 vUv;
    void main(){vec2 p=vUv*2.-1.;float r=length(p);if(r>1.)discard;float a=atan(p.y,p.x);
      float tw=a+1.6/(r+.15)-uTime*.35;
      vec2 q=vec2(cos(tw),sin(tw))*(1.5-log(r+.05));
      float n=warped(q*1.4,uTime);
      vec3 hot=mix(uBlue,uFel,uMix);
      vec3 col=mix(uNether,hot,smoothstep(.35,.8,n))+hot*pow(max(1.-r,0.),6.)*1.2;
      gl_FragColor=vec4(col,smoothstep(1.,.72,r)*(.45+.55*n)*uOpen*.8);}`});
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1,64),mat);
  disc.position.set(0,2.4,-2.5);disc.scale.set(.01,.01,1);disc.renderOrder=5;
  T.scene.add(disc);G3.portal=disc;
  const cp=T.crystal?T.crystal.position.clone():new THREE.Vector3(2.6,2.4,-3);
  let done=false;
  const cleanup=()=>{
    if(done)return;done=true;
    removeEventListener("pointerdown",skip,true);removeEventListener("keydown",skip,true);
    T.scene.remove(disc);disc.geometry.dispose();mat.dispose();
    if(G3.portal===disc)G3.portal=null;K.igniting=null;rerender();
  };
  const tl=gsap.timeline({onComplete:cleanup});
  function skip(e){if(e.type==="keydown"&&e.key!=="Escape")return;tl.kill();cleanup();}
  addEventListener("pointerdown",skip,true);addEventListener("keydown",skip,true);
  tl.to(disc.scale,{x:3.2,y:3.2,duration:1.6,ease:"expo.out"},0)
    .to(U.uOpen,{value:1,duration:.7,ease:"power1.out"},0)
    .to(U.uMix,{value:1,duration:1.8,ease:"sine.inOut"},.5)
    .to(disc.position,{x:cp.x,y:cp.y,z:cp.z,duration:1.2,ease:"power2.inOut"},2.6)
    .to(disc.scale,{x:.6,y:.6,duration:1.2,ease:"power2.inOut"},2.6)
    .to(U.uOpen,{value:0,duration:1,ease:"power1.in"},2.8)
    .add(()=>{if(!done)swell();},3.4);
  K.igniting=tl;K.igniteEnd=()=>{tl.kill();cleanup();};
  setTimeout(()=>{if(!done){tl.kill();cleanup();}},6000);
  return tl;
}
function endIgnite(){if(K.igniting&&K.igniteEnd)K.igniteEnd();}
/* ---------- K4 fel embers: GPU points that rise and wrap; yellow-green → fel → violet over life ---------- */
const EMP={fel:["#d9ff80","#5cff6a","#5a2a9c"],hellfire:["#ffd27a","#ff6a2a","#4a0f2a"]};
function buildEmbers(){
  const T=S.three,r=rng(99),pos=new Float32Array(MAXEMB*3),seed=new Float32Array(MAXEMB);
  for(let i=0;i<MAXEMB;i++){pos[i*3]=(r()-.5)*30;pos[i*3+1]=r()*.6;pos[i*3+2]=-2-r()*16;seed[i]=r();}
  G3.emGeo=new THREE.BufferGeometry();
  G3.emGeo.setAttribute("position",new THREE.BufferAttribute(pos,3));
  G3.emGeo.setAttribute("aSeed",new THREE.BufferAttribute(seed,1));
  const dpr=T.uniforms&&T.uniforms.uDpr?T.uniforms.uDpr:{value:Math.min(window.devicePixelRatio||1,1.5)};
  G3.emU={uTime:KU.uTime,uDpr:dpr,uH:{value:8},uOn:{value:0},
    uHot:{value:new THREE.Color(EMP.fel[0])},uFel:{value:new THREE.Color(EMP.fel[1])},uNether:{value:new THREE.Color(EMP.fel[2])}};
  G3.embers=new THREE.Points(G3.emGeo,new THREE.ShaderMaterial({uniforms:G3.emU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float uTime,uDpr,uH;attribute float aSeed;varying float vLife;
    void main(){float life=fract(uTime*(.06+aSeed*.09)+aSeed*7.3);vec3 p=position;p.y+=life*uH;
      p.x+=sin(uTime*1.1+aSeed*50.)*life*.7;p.z+=cos(uTime*.9+aSeed*31.)*life*.4;vLife=life;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
      gl_PointSize=(2.+aSeed*3.)*uDpr*(12./-mv.z)*(1.-life*.5);}`,
    fragmentShader:`uniform vec3 uHot,uFel,uNether;uniform float uOn;varying float vLife;
    void main(){vec2 c=gl_PointCoord-.5;c.y*=.7;float d=length(c);
      vec3 col=mix(mix(uHot,uFel,smoothstep(0.,.4,vLife)),uNether,smoothstep(.6,1.,vLife));
      gl_FragColor=vec4(col,smoothstep(.5,0.,d)*smoothstep(0.,.1,vLife)*(1.-vLife)*.7*uOn);}`}));
  G3.embers.frustumCulled=false;G3.embers.visible=false;
  T.scene.add(G3.embers);
}
let emTw=null;
function syncEmbers(opts){
  if(!GL||!G3.embers)return null;
  opts=opts||{};
  const on=K.emUser||K.emTheme,E=G3.emU;
  if(opts.preset&&EMP[opts.preset]){E.uHot.value.set(EMP[opts.preset][0]);E.uFel.value.set(EMP[opts.preset][1]);E.uNether.value.set(EMP[opts.preset][2]);}
  if(opts.height)E.uH.value=opts.height;
  G3.emWant=opts.count?Math.min(opts.count,MAXEMB):G3.emWant;
  G3.emGeo.setDrawRange(0,Math.min(G3.emWant||G3.emCap,G3.emCap));
  if(emTw){emTw.kill();emTw=null;}
  const target=on?1:0;
  if(on)G3.embers.visible=true;
  if(hasG()&&motionOn()&&glOn()&&E.uOn.value!==target){
    emTw=gsap.to(E.uOn,{value:target,duration:.9,ease:"sine.inOut",onUpdate:rerender,
      onComplete:()=>{emTw=null;if(!target)G3.embers.visible=false;rerender();}});
  }else{E.uOn.value=target;G3.embers.visible=on;rerender();}
  return emTw;
}
function embers(on,opts){K.emUser=!!on;return syncEmbers(opts||{preset:K.emTheme?"hellfire":"fel"});}
/* ---------- K7 rune ring: our own SVG (rings as two-arc paths, invented glyphs), drawn with DrawSVG ---------- */
const SVGNS="http://www.w3.org/2000/svg",spins=new Set();
const f1=n=>(Math.round(n*100)/100).toString();
function mk(tag,attrs){const e=doc.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
function circ(r){return `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0`;}
function dashRing(r,n,frac){
  let d="";for(let i=0;i<n;i++){const a0=i/n*Math.PI*2,a1=a0+frac*Math.PI*2/n;
    d+=`M${f1(r*Math.cos(a0))} ${f1(r*Math.sin(a0))}A${r} ${r} 0 0 1 ${f1(r*Math.cos(a1))} ${f1(r*Math.sin(a1))}`;}
  return d;
}
function star(r){ /* two interlaced triangles */
  const p=k=>{const a=-Math.PI/2+k*Math.PI*2/6;return f1(r*Math.cos(a))+" "+f1(r*Math.sin(a));};
  return `M${p(0)}L${p(2)}L${p(4)}ZM${p(1)}L${p(3)}L${p(5)}Z`;
}
function glyph(r){ /* an invented glyph: a stem plus one or two strokes on a 3×4 grid */
  const xs=[-2.2,0,2.2],ys=[-3.2,-1,1.2,3.2],pick=a=>a[Math.floor(r()*a.length)];
  const sx=pick(xs);let d=`M${sx} ${ys[0]}L${sx} ${pick(ys.slice(2))}`;
  const extra=1+(r()<.5?1:0);
  for(let i=0;i<extra;i++){
    const x1=pick(xs),y1=pick(ys),x2=pick(xs.filter(x=>x!==x1)),y2=pick(ys);
    d+=r()<.3?`M${x1} ${y1}Q0 ${f1((y1+y2)/2+2)} ${x2} ${y2}`:`M${x1} ${y1}L${x2} ${y2}`;
  }
  return d;
}
function runeRing(el,opts){
  css();
  opts=Object.assign({size:96,glyphs:12,seed:7,spin:true,spinDur:40},opts||{});
  const r=rng(opts.seed),line={fill:"none",stroke:"currentColor","stroke-linecap":"round","stroke-linejoin":"round"};
  const P=(d,w,o)=>mk("path",Object.assign({d,"stroke-width":w,opacity:o},line));
  const svg=mk("svg",{viewBox:"-50 -50 100 100",width:opts.size,height:opts.size,"aria-hidden":"true",focusable:"false"});
  const spinG=mk("g",{class:"spin"}),counterG=mk("g",{class:"counter"});
  const rings=[P(circ(47),1.1,.9),P(dashRing(41,24,.45),1.6,.7),P(circ(30),.8,.8),P(star(28),.7,.55)];
  const glyphs=[];
  for(let i=0;i<opts.glyphs;i++){const g=P(glyph(r),.9,.95);g.setAttribute("transform",`rotate(${f1(i*360/opts.glyphs)}) translate(0 -35.5)`);glyphs.push(g);}
  spinG.appendChild(rings[0]);spinG.appendChild(rings[1]);glyphs.forEach(g=>spinG.appendChild(g));
  counterG.appendChild(rings[2]);counterG.appendChild(rings[3]);
  svg.appendChild(spinG);svg.appendChild(counterG);
  const wrap=doc.createElement("span");wrap.className="tbc-rune";wrap.setAttribute("aria-hidden","true");wrap.appendChild(svg);
  if(el)el.appendChild(wrap);
  const ctl={svg,el:wrap,tl:null,spin:null,spin2:null,
    remove(){if(this.tl)this.tl.kill();if(this.spin)this.spin.kill();if(this.spin2)this.spin2.kill();spins.delete(this);wrap.remove();}};
  if(!hasG()||!motionOn())return ctl; /* static ring when motion is off */
  const tl=gsap.timeline(),all=rings.concat(glyphs);
  if(hasDraw()){
    tl.from(rings,{drawSVG:0,duration:1.1,stagger:.15,ease:"power2.inOut"})
      .from(glyphs,{drawSVG:"50% 50%",duration:.45,stagger:.035,ease:"power1.out"},"-=.6");
  }else if(wrap.isConnected&&rings[0].getTotalLength){ /* plugin-free fallback: dash offset */
    all.forEach((p,i)=>{const L=p.getTotalLength();
      tl.fromTo(p,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:i<rings.length?1.1:.45,ease:"power2.inOut",clearProps:"strokeDasharray,strokeDashoffset"},i<rings.length?i*.15:.6+(i-rings.length)*.035);});
  }
  ctl.tl=track(tl);
  if(opts.spin){
    ctl.spin=gsap.to(spinG,{rotation:360,svgOrigin:"0 0",duration:opts.spinDur,repeat:-1,ease:"none"});
    ctl.spin2=gsap.to(counterG,{rotation:-360,svgOrigin:"0 0",duration:opts.spinDur*1.5,repeat:-1,ease:"none"});
    spins.add(ctl);
  }
  return ctl;
}
function stopSpins(){spins.forEach(c=>{if(c.spin)c.spin.kill();if(c.spin2)c.spin2.kill();c.spin=c.spin2=null;});spins.clear();}
/* ---------- K8 light-portal entry: a small ring of light expands where a panel appears ---------- */
function enter(el,opts){
  if(!el||!hasG()||!motionOn())return null;
  css();opts=opts||{};
  const ring=doc.createElement("div");ring.className="tbc-ring";ring.setAttribute("aria-hidden","true");doc.body.appendChild(ring);
  const place=()=>{const b=el.getBoundingClientRect(),s=Math.max(40,Math.min(b.width,b.height)*.9);
    ring.style.width=ring.style.height=s+"px";gsap.set(ring,{x:b.left+b.width/2-s/2,y:b.top+b.height/2-s/2});};
  const tl=gsap.timeline({delay:opts.delay||0,onStart:place,onComplete:()=>ring.remove()});
  tl.fromTo(el,{clipPath:"circle(18% at 50% 50%)"},{clipPath:"circle(120% at 50% 50%)",duration:.7,ease:"power2.out",clearProps:"clipPath"},0)
    .fromTo(ring,{scale:.15,opacity:0},{scale:1.2,opacity:.7,duration:.35,ease:"power2.out"},0)
    .to(ring,{scale:1.7,opacity:0,duration:.45,ease:"power1.in"},.35);
  return track(tl);
}
/* ---------- K9 rebirth burst: gold-orange sparks scatter, then swirl back and re-form, once ---------- */
function rebirth(x,y){
  if(!hasG()||!motionOn())return null;
  css();
  const cv=doc.createElement("canvas"),c=cv.getContext&&cv.getContext("2d");if(!c)return null;
  const dpr=Math.min(window.devicePixelRatio||1,1.5),w=innerWidth,h=innerHeight;
  cv.className="tbc-burst";cv.setAttribute("aria-hidden","true");cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
  doc.body.appendChild(cv);c.scale(dpr,dpr);
  const cx=x==null?w/2:x,cy=y==null?h/2:y,n={low:36,medium:60,high:90}[K.tier]||60,r=rng((Math.random()*1e9)|0),P=[];
  for(let i=0;i<n;i++)P.push({a:r()*6.283,d:50+r()*120,s:1+r()*2.2,hue:28+r()*20,l:55+r()*15,sw:(r()-.5)*1.4});
  const st={p:0};
  const draw=()=>{
    c.clearRect(0,0,w,h);c.globalCompositeOperation="lighter";
    const p=st.p;let k,sw=0;
    if(p<.4)k=1-Math.pow(1-p/.4,3);else{const q=(p-.4)/.6;k=1-q*q*(3-2*q);sw=q;}
    const fade=p<.85?1:Math.max(0,(1-p)/.15);
    P.forEach(o=>{const a=o.a+o.sw*sw;
      c.fillStyle=`hsla(${o.hue.toFixed(0)},100%,${o.l.toFixed(0)}%,${(.8*fade).toFixed(3)})`;
      c.beginPath();c.arc(cx+Math.cos(a)*o.d*k,cy+Math.sin(a)*o.d*k-(p<.4?k*10:0),o.s,0,6.283);c.fill();});
    if(p>.55){ /* the re-formed core: one soft rise and fall, small and dim (no flash) */
      const g=Math.sin(Math.min(1,(p-.55)/.45)*Math.PI)*.35,grd=c.createRadialGradient(cx,cy,0,cx,cy,46);
      grd.addColorStop(0,`rgba(255,200,110,${g.toFixed(3)})`);grd.addColorStop(1,"rgba(255,160,60,0)");
      c.fillStyle=grd;c.beginPath();c.arc(cx,cy,46,0,6.283);c.fill();}
  };
  const tl=gsap.timeline({onComplete:()=>cv.remove()});
  tl.to(st,{p:1,duration:1.6,ease:"none",onUpdate:draw});
  return track(tl);
}
/* ---------- K10 purity / taint: a slow teal → sickly-green tint on one element ---------- */
function taint(el,on){
  if(!el)return null;
  css();
  if(!el.classList.contains("tbc-taint")){
    if(getComputedStyle(el).position==="static")el.style.position="relative";
    el.classList.add("tbc-taint");el.style.setProperty("--tbc-taint","0");
  }
  const v=on?1:0;
  if(hasG()&&motionOn())return track(gsap.to(el,{"--tbc-taint":v,duration:1.6,ease:"sine.inOut",overwrite:"auto"}));
  if(hasG())gsap.killTweensOf(el,"--tbc-taint");
  el.style.setProperty("--tbc-taint",String(v));
  return null;
}
/* ---------- the rare "lift": cards rise gently while the world slows (17/17 recommended gear) ---------- */
let liftTl=null;
function lift(opts){
  if(!hasG()||!motionOn())return null;
  if(liftTl)return liftTl;
  opts=opts||{};
  const els=opts.targets?gsap.utils.toArray(opts.targets):Array.from(doc.querySelectorAll(".box"))
    .filter(b=>{const q=b.getBoundingClientRect();return q.bottom>0&&q.top<innerHeight;}).slice(0,10);
  const tl=gsap.timeline({onComplete:()=>{liftTl=null;}});
  if(els.length)tl.to(els,{y:-14,duration:1.4,ease:"sine.out",stagger:.06},0)
    .to(els,{y:0,duration:1.6,ease:"sine.inOut",stagger:.04,clearProps:"transform"},2.2);
  if(S&&typeof S.speed==="number")tl.to(S,{speed:.3,duration:.9,ease:"sine.out"},0).to(S,{speed:1,duration:1.4,ease:"sine.inOut"},2.4);
  tl.add(()=>swell(),2.6);
  liftTl=track(tl);return liftTl;
}

/* ---------- public API ---------- */
const api={
  version:"1.0.0",init,ignite,swell,embers,theme,runeRing,enter,rebirth,taint,lift,
  setMotion(on){hostMotion=!!on;onState();},
  get tier(){return K.tier;},get ok(){return GL;},get themeName(){return K.theme;},
  motion:motionOn
};
window.TBCKit=api;
if(hasG()&&window.DrawSVGPlugin){try{gsap.registerPlugin(window.DrawSVGPlugin);}catch(e){}}
if(RMQ.addEventListener)RMQ.addEventListener("change",onState);else if(RMQ.addListener)RMQ.addListener(onState);
if(window.SCENE)init(window.SCENE);else css();
})();
