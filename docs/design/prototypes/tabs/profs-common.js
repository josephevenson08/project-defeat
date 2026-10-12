/* profs-common.js — shared by the three Professions designs (profs-a/b/c.js), over prof-data.js (gen-prof-data.mjs, the
   live app's own data). It keeps what every design shares: the tab's amber scene and motion, profession icons, payoff
   perk tags, each recipe's skill colour at a given skill, a route on a plain grid (the prototypes don't use the live
   app's zone map art), the shopping-list maths, your skill in each profession for the browser session, and a light
   tooltip. A design calls ProfKit.start({render}) once. */
(function(){
"use strict";
const D=window.PROF_DATA;
if(!D){console.warn("profs-common.js: prof-data.js is missing");return;}
const $=(s,r=document)=>r?r.querySelector(s):null, $$=(s,r=document)=>r?Array.from(r.querySelectorAll(s)):[];
const on=(el,ev,fn,o)=>{if(el)el.addEventListener(ev,fn,o);};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const plural=(n,one,many)=>n+" "+(n===1?one:(many||one+"s"));
const fmt=n=>Number(n).toLocaleString("en-US");
const root=document.documentElement, live=$("#live");
let sayT=0;
const say=t=>{if(!live)return;clearTimeout(sayT);live.textContent="";sayT=setTimeout(()=>{live.textContent=t;},40);};
const store={get(k){try{return sessionStorage.getItem(k);}catch(e){return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}};

/* ---------- data ---------- */
const PROFS=D.profs;
const prof=n=>PROFS.find(p=>p.n===n)||null;
const slug=n=>n.toLowerCase().replace(/ /g,"-");
const bySlug=s=>PROFS.find(p=>slug(p.n)===s)||null;
const PUB=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/":"../../";
const iconUrl=n=>n?PUB+"icons/"+n+".jpg":"";
const icon=(n,size,alt)=>n?`<img class="pk-ic" src="${iconUrl(n)}" alt="${esc(alt||"")}" width="${size||28}" height="${size||28}" loading="lazy" decoding="async">`:`<span class="pk-ic pk-blank" style="width:${size||28}px;height:${size||28}px"></span>`;
const CATS=["Gathering","Crafting","Secondary"];
const specName=k=>{const s=D.specs.find(x=>x.key===k);return s?`${s.spec} ${s.cls}`:k;};
/* copper as a player reads it: trailing zero denominations dropped (the live app's formatCopper) */
function copper(c){if(c<=0)return "0c";const g=Math.floor(c/10000),s=Math.floor(c%10000/100),r=c%100;return [g&&g+"g",s&&s+"s",r&&r+"c"].filter(Boolean).join(" ");}

/* your skill in each profession, for the browser session; shared by every design */
const getSkill=n=>{const v=+store.get("pd-prof-skill:"+n);return v>=1&&v<=375?v:1;};
const setSkill=(n,v)=>store.set("pd-prof-skill:"+n,String(Math.max(1,Math.min(375,Math.round(v)||1))));

/* a recipe's colour at a skill, the game's four: orange always gives a point, yellow usually, green sometimes, grey never */
const COLOR_WORD={orange:"always a point",yellow:"usually a point",green:"sometimes a point",grey:"no more points"};
function colorAt(colors,skill){
  if(!colors)return null;
  const [o,y,g,gr]=colors;
  if(skill<o)return "red";
  if(skill<y)return "orange";if(skill<g)return "yellow";if(skill<gr)return "green";return "grey";
}
/* the step a skill falls in (half-open, the last step includes 375) */
const stepAt=(steps,skill)=>{const i=steps.findIndex((s,k)=>skill>=s.range[0]&&(skill<s.range[1]||(k===steps.length-1&&skill<=s.range[1])));return i<0?(skill>=375?steps.length-1:0):i;};

/* what is left to make from a skill: the step you're in counts from its start (the crafts are an expectation over the
   whole step), every later step in full. Vendor-only reagents are bought at their fixed price; the rest are farmed. */
function shopping(p,skill){
  const steps=p.craft||[];const i=stepAt(steps,skill);const rest=skill>=375?[]:steps.slice(i);
  const farm={},buy={};let cost=0,crafts=0;
  rest.forEach(s=>{crafts+=s.crafts;cost+=s.vendor||0;s.mats.forEach(m=>{const t=m.v?buy:farm;if(!t[m.n])t[m.n]={n:m.n,q:0,ic:m.ic,unit:m.unit,from:m.from};t[m.n].q+=m.q;});});
  const sort=o=>Object.values(o).sort((a,b)=>b.q-a.q);
  return {from:rest.length?rest[0].range[0]:375,steps:rest,crafts,farm:sort(farm),buy:sort(buy),cost};
}
/* who supplies a farmed material, by the gathering profession that gathers it */
/* (gen-prof-data.mjs works it out once: each gatherer's range materials, the bars smelted from Mining's ores, stones and alloys) */
const gathererOf=n=>(D.gatherOf&&D.gatherOf[n])||null;

/* payoff perk tags, as the Step 1 page drew them */
const KIND_WORD={stat:"stat bonus",gear:"own gear",utility:"utility",feeds:"feeds others"};
const kindTag=(k,ph)=>`<span class="kind ${esc(k)}">${esc(KIND_WORD[k]||k)}${ph&&ph>2?` · phase ${ph}`:""}</span>`;
const kindsOf=p=>p.payoff?[...new Set(p.payoff.perks.map(x=>x.kind))]:[];

/* a route on a plain grid: recorded nodes as dots, the computed circuit as a line, zone percentages as coordinates */
const DOT=["#d7fff9","#ffd37a","#b6a6ff","#9be38a","#ff9f8a"];
function routeSVG(rt,opt){
  opt=opt||{};
  const pts=rt.stops.map(p=>p.join(",")).join(" ");
  const grid=Array.from({length:9},(_,i)=>`<line x1="${(i+1)*10}" y1="0" x2="${(i+1)*10}" y2="100"/><line x1="0" y1="${(i+1)*10}" x2="100" y2="${(i+1)*10}"/>`).join("");
  return `<figure class="pk-map"><svg viewBox="0 0 100 100" role="img" aria-label="${esc(rt.zone)}: ${plural(rt.stops.length,"stop")} on a circuit through ${rt.mats.map(m=>m[0]).join(", ")} nodes">`+
    `<rect x="0" y="0" width="100" height="100" class="pk-bg"/><g class="pk-grid">${grid}</g>`+
    rt.spawns.map((s,i)=>`<g fill="${DOT[i%DOT.length]}" class="pk-dots">${s[1].map(c=>`<circle cx="${c[0]}" cy="${c[1]}" r=".75"/>`).join("")}</g>`).join("")+
    (rt.stops.length>1?`<polygon points="${pts}" class="pk-route"/>`:"")+
    (rt.stops.length?`<circle cx="${rt.stops[0][0]}" cy="${rt.stops[0][1]}" r="1.8" class="pk-start"/>`:"")+
    `<text x="2" y="5" class="pk-zone">${esc(rt.zone)}</text></svg>`+
    `<figcaption>${rt.spawns.map((s,i)=>`<span><i style="background:${DOT[i%DOT.length]}"></i>${esc(s[0])} (${fmt(rt.mats.find(m=>m[0]===s[0])?rt.mats.find(m=>m[0]===s[0])[1]:s[1].length)})</span>`).join("")}<span><i class="ln"></i>Suggested circuit, ${rt.len}% of the zone's width</span>${rt.sampled?`<span>Nodes thinned for size; the shape is kept</span>`:""}</figcaption></figure>`;
}

/* ---------- a light tooltip: anything with data-t shows that text on hover, focus or tap ---------- */
const tip=document.createElement("div");tip.id="pk-tip";tip.setAttribute("role","tooltip");tip.hidden=true;document.body.appendChild(tip);
let tipFor=null;
function showTip(el){tipFor=el;tip.textContent=el.dataset.t;tip.hidden=false;
  if(innerWidth<700){tip.classList.add("sheet");tip.style.left=tip.style.top="";return;}tip.classList.remove("sheet");
  const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;let x=r.left+r.width/2-w/2,y=r.top-h-8;if(y<8)y=r.bottom+8;
  tip.style.left=Math.round(Math.max(8,Math.min(innerWidth-w-8,x)))+"px";tip.style.top=Math.round(Math.max(8,Math.min(innerHeight-h-8,y)))+"px";}
function hideTip(){if(!tip.hidden)tip.hidden=true;tipFor=null;}
const tipEl=t=>t&&t.closest?t.closest("[data-t]"):null;
on(document,"pointerover",e=>{if(e.pointerType==="touch")return;const el=tipEl(e.target);if(el){if(el!==tipFor)showTip(el);}else if(tipFor&&tipFor!==document.activeElement)hideTip();});
on(document,"focusin",e=>{const el=tipEl(e.target);if(el)showTip(el);else hideTip();});
on(document,"pointerdown",e=>{if(e.pointerType!=="touch")return;const el=tipEl(e.target);if(el)showTip(el);else hideTip();});
on(window,"scroll",()=>{if(tipFor&&innerWidth>=700)hideTip();},{passive:true});
on(document,"keydown",e=>{if(e.key==="Escape")hideTip();});

/* ---------- scene and motion ---------- */
const SC=window.SCENE||{cam:{},mix:{},setMotion(){},render(){},pointer(){}};
const KIT=window.TBCKit||null;
if(KIT)KIT.theme("profs",{instant:true}); /* the tab's own colour: amber, ore veins up the pillars */
const G=typeof gsap!=="undefined", ST=G&&typeof ScrollTrigger!=="undefined", SPL=G&&typeof SplitText!=="undefined";
const RMQ=matchMedia("(prefers-reduced-motion: reduce)");
const M={on:false};
const moving=()=>!RMQ.matches&&(G?M.on:true);
const ui=$("#profui");
function safe(a){if(!a)return a;const ms=Math.max(1500,a.totalDuration()*1000+400);setTimeout(()=>{if(a.progress()<1&&!a.scrollTrigger)a.progress(1);},ms);return a;}
let ctx=null;
const A=fn=>ctx?ctx.add(fn):fn();
function rise(scope,quick){
  if(!M.on||RMQ.matches||!G||!scope)return;
  A(()=>{
    const boxes=$$(".box",scope).filter(b=>b.offsetParent&&b.getBoundingClientRect().top<innerHeight*1.15).slice(0,10);
    if(!boxes.length)return;
    safe(gsap.fromTo(boxes,{y:quick?12:34,autoAlpha:0},{y:0,autoAlpha:1,duration:quick?.3:.6,stagger:.05,ease:"expo.out",clearProps:"transform,opacity,visibility"}));
    if(KIT&&!quick)boxes.filter(b=>b.hasAttribute("data-enter")).forEach((b,i)=>KIT.enter(b,{delay:i*.06}));
  });
}
/* a route draws itself in when motion is on */
function drawRoutes(scope){
  if(!M.on||RMQ.matches||!G||!scope)return;
  A(()=>$$(".pk-route",scope).forEach(r=>{let L=0;try{L=r.getTotalLength();}catch(e){}if(!L)return;
    safe(gsap.fromTo(r,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:1.1,ease:"power2.inOut",clearProps:"strokeDasharray,strokeDashoffset"}));}));
}
function splitHero(){
  const h=$("#h-prof");if(!h)return null;
  if(SPL)return SplitText.create(h,{type:"words",wordsClass:"w",mask:"words",aria:"auto"}).words;
  if(h.dataset.split)return null;
  h.dataset.split="1";h.setAttribute("aria-label",h.textContent.replace(/\s+/g," ").trim());
  const words=t=>t.split(/(\s+)/).map(w=>/^\s+$/.test(w)||!w?w:`<span class="w-mask" aria-hidden="true"><span class="w">${w}</span></span>`).join("");
  h.innerHTML=Array.from(h.childNodes).map(n=>n.nodeType===3?words(n.textContent):`<em>${words(n.textContent)}</em>`).join("");
  return $$("#h-prof .w");
}
function intro(){
  const words=splitHero();
  const tl=gsap.timeline({defaults:{ease:"power4.out"}});
  if(SC.cam)tl.fromTo(SC.cam,{intro:1},{intro:0,duration:1.4,ease:"expo.out"},0);
  tl.from("#scene, .fallback",{autoAlpha:0,duration:.8,ease:"power1.out"},0);
  if(words&&words.length)tl.from(words,{yPercent:115,rotate:7,duration:.7,stagger:.04},.1);
  if($(".flavor .chip"))tl.from(".flavor .chip",{scale:.6,autoAlpha:0,duration:.35,ease:"back.out(3)"},.3);
  safe(tl);
  setTimeout(()=>{rise(ui);drawRoutes(ui);},350);
}
function scrollStory(){if(SC.cam)gsap.fromTo(SC.cam,{depth:0},{depth:1,ease:"none",immediateRender:false,scrollTrigger:{trigger:"main",start:"top top",end:"bottom bottom",scrub:.8}});}
const tog=$("#mtoggle"), mstate=$("#mstate");
function setLabel(v,why){if(tog)tog.setAttribute("aria-pressed",String(v));if(mstate)mstate.textContent=why||(v?"on":"off");}
function enable(first){if(M.on)return;M.on=true;root.classList.add("motion");SC.setMotion(true);ctx=gsap.context(()=>{if(first)intro();if(ST)scrollStory();});if(ST)ScrollTrigger.refresh();setLabel(true);}
function disable(){
  if(!M.on)return;
  gsap.globalTimeline.getChildren(false,true,true).forEach(t=>{if(t.scrollTrigger)return;if(t.repeat&&t.repeat()===-1)t.kill();else t.progress(1);});
  if(ctx){ctx.revert();ctx=null;}
  M.on=false;root.classList.remove("motion");
  if(SC.cam)Object.assign(SC.cam,{depth:0,dip:0,rise:0,dive:0,intro:0});
  if(KIT)KIT.theme("profs",{instant:true});
  if(SC.render)SC.render();
  setLabel(false);SC.setMotion(false);
}
function initMotion(){
  if(matchMedia("(pointer:fine)").matches)on(window,"pointermove",e=>{if(moving())SC.pointer(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);},{passive:true});
  if(tog)tog.hidden=false;
  if(!G){if(tog)tog.disabled=true;setLabel(false,"unavailable");const sync=()=>SC.setMotion(moving());if(RMQ.addEventListener)RMQ.addEventListener("change",sync);sync();return;}
  gsap.registerPlugin(...[ST&&ScrollTrigger,SPL&&SplitText].filter(Boolean));
  const stored=()=>{try{return localStorage.getItem("pd-motion");}catch(e){return null;}};
  const keep=v=>{try{localStorage.setItem("pd-motion",v?"1":"0");}catch(e){}};
  on(tog,"click",()=>{if(M.on){disable();keep(false);}else{enable(false);keep(true);}});
  const syncRM=()=>{if(RMQ.matches){disable();SC.setMotion(false);if(tog)tog.disabled=true;setLabel(false,"off (reduced motion)");}else{if(tog)tog.disabled=false;setLabel(M.on);}};
  if(RMQ.addEventListener)RMQ.addEventListener("change",syncRM);
  if(RMQ.matches)syncRM();else if(stored()==="0"){setLabel(false);SC.setMotion(false);}else enable(true);
}

/* ---------- shared styles ---------- */
const css=document.createElement("style");
css.textContent=`
#profui{position:relative}
.pk-ic{display:block;flex:none;border-radius:6px;border:1px solid rgba(255,255,255,.18);background:#000}
.pk-blank{display:inline-block}
.pk-cat-Gathering{--pc:#7fd18a}.pk-cat-Crafting{--pc:#ffb547}.pk-cat-Secondary{--pc:#8ab4ff}
.pk-c-orange{color:#ff8a3d}.pk-c-yellow{color:#ffe14d}.pk-c-green{color:#4be03c}.pk-c-grey{color:#9d9d9d}.pk-c-red{color:#ff5f5f}
.pk-map{margin:0;display:grid;gap:6px}
.pk-map svg{width:100%;max-width:520px;aspect-ratio:1;display:block;border-radius:10px;border:1px solid var(--rim)}
.pk-bg{fill:#06120f}.pk-grid line{stroke:rgba(255,181,71,.09);stroke-width:.2}
.pk-dots{opacity:.85}
.pk-route{fill:none;stroke:var(--amber);stroke-width:.7;stroke-linejoin:round;filter:drop-shadow(0 0 1.2px var(--amber))}
.pk-start{fill:var(--amber)}
.pk-zone{font:400 4px var(--f-head);fill:var(--ink-2)}
.pk-map figcaption{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:var(--t-xs);color:var(--ink-3)}
.pk-map figcaption i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:0}
.pk-map figcaption i.ln{width:14px;height:2px;border-radius:1px;background:var(--amber);vertical-align:2px}
#pk-tip{position:fixed;z-index:60;pointer-events:none;max-width:280px;font:400 12.5px/1.4 var(--f-body);color:#fff;background:linear-gradient(180deg,rgba(26,18,8,.97),rgba(10,8,4,.97));border:1px solid rgba(255,200,120,.4);border-radius:8px;padding:7px 10px;box-shadow:0 12px 40px -8px rgba(0,0,0,.9)}
#pk-tip.sheet{left:8px!important;right:8px;top:auto!important;bottom:8px;max-width:none}
.pk-skill{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.pk-skill label{font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.pk-skill input[type=range]{flex:1 1 200px;accent-color:var(--glow);min-height:32px}
.pk-skill input[type=number]{width:84px;font:600 var(--t-md) var(--f-mono);color:var(--ink);background:var(--glass-2);border:1px solid var(--rim);border-radius:8px;padding:6px 8px;min-height:40px}
@media (max-width:700px){.pk-skill input[type=number]{min-height:44px}.pk-skill input[type=range]{min-height:44px}}
`;
document.head.appendChild(css);

function start(design){if(!ui)return;design.render();initMotion();}

window.ProfKit={D,PROFS,CATS,$,$$,on,esc,plural,fmt,say,store,prof,slug,bySlug,iconUrl,icon,specName,copper,getSkill,setSkill,COLOR_WORD,colorAt,stepAt,
  shopping,gathererOf,KIND_WORD,kindTag,kindsOf,routeSVG,hideTip,rise,drawRoutes,motion:()=>M.on&&!RMQ.matches,start};
})();
