/* tiers-common.js — shared by the three Spec Tier Lists designs (tiers-a/b/c.js), over tier-data.js (gen-tier-data.mjs,
   the live app's own data). It keeps what every design shares: the tab's emerald scene, the Motion toggle and intro,
   spec chips with the live app's spec icons in class colours, a spec tooltip on hover, focus or tap, a full spec card,
   and the Raid Composition raid for the browser session. A design calls TierKit.start({render}) once.
   The tier letters stay neutral, as in the live app: quality colour means "this item is epic" everywhere else, so rank
   reads through weight and rule strength, and the colour on a spec is its class colour. */
(function(){
"use strict";
const D=window.TIER_DATA;
if(!D){console.warn("tiers-common.js: tier-data.js is missing");return;}
const $=(s,r=document)=>r?r.querySelector(s):null, $$=(s,r=document)=>r?Array.from(r.querySelectorAll(s)):[];
const on=(el,ev,fn,o)=>{if(el)el.addEventListener(ev,fn,o);};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const plural=(n,one,many)=>n+" "+(n===1?one:(many||one+"s"));
const root=document.documentElement, live=$("#live");
let sayT=0;
const say=t=>{if(!live)return;clearTimeout(sayT);live.textContent="";sayT=setTimeout(()=>{live.textContent=t;},40);};
const store={get(k){try{return sessionStorage.getItem(k);}catch(e){return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}};
const fmt=n=>Number(n).toLocaleString("en-US");
const ord=n=>n+(n%100>10&&n%100<14?"th":({1:"st",2:"nd",3:"rd"})[n%10]||"th");

/* ---------- data ---------- */
const SPECS=D.specs, LISTS=D.lists, ARCHON=D.archonOrder;
const KEYS=Object.keys(SPECS);
const ME="Warrior|Fury"; /* the Character Planner's character */
const PUB=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/":"../../";
const iconUrl=n=>n?PUB+"icons/"+n+".jpg":"";
const label=k=>{const s=SPECS[k];return s?`${s.spec} ${s.cls}`:"";};
const list=role=>LISTS.find(l=>l.role===role)||null;
const archonRank=k=>{const i=ARCHON.indexOf(k);return i<0?null:i+1;};
const tierDepth=(role,lab)=>{const l=list(role);return l?l.tiers.findIndex(t=>t.label===lab):-1;};
const CLASSES=[...new Set(KEYS.map(k=>SPECS[k].cls))];
const ROLE_WORD={DPS:"damage",Healer:"healing",Tank:"tanking"};

/* ---------- the Raid Composition raid (sessionStorage "pd-raidcomp-a:v1"), or its example ---------- */
const BUILD={};KEYS.forEach(k=>SPECS[k].builds.forEach(b=>{BUILD[b.id]=Object.assign({key:k},b);}));
const EX25=[["warrior-protection","paladin-protection","druid-feral-tank","paladin-holy","shaman-restoration"],
  ["warrior-fury","warrior-fury","rogue-combat","shaman-enhancement","druid-feral-cat"],
  ["mage-fire","warlock-destruction","shaman-elemental","priest-shadow","druid-balance"],
  ["hunter-beast-mastery","hunter-marksmanship","hunter-survival","paladin-retribution","rogue-combat"],
  ["priest-holy","priest-discipline","druid-restoration","paladin-holy","mage-arcane"]];
function raid(){
  let groups=null,saved=false;
  try{const raw=JSON.parse(sessionStorage.getItem("pd-raidcomp-a:v1")||"null");
    if(raw&&Array.isArray(raw.groups)&&raw.groups.length){
      const g=raw.groups.map(r=>Array.isArray(r)&&r.length===5?r.map(s=>s&&BUILD[s.id]?{id:s.id,name:s.name?String(s.name).slice(0,24):""}:null):null);
      if(!g.some(r=>!r)&&g.flat().some(Boolean)){groups=g;saved=true;}
    }}catch(e){}
  if(!groups)groups=EX25.map(r=>r.map(id=>({id,name:""})));
  const seats=[];groups.forEach((row,g)=>row.forEach((s,i)=>{if(s)seats.push({g,i,id:s.id,name:s.name,key:BUILD[s.id].key,build:BUILD[s.id]});}));
  return {saved,size:groups.length*5,groups,seats,count:k=>seats.filter(s=>s.key===k).length};
}

/* ---------- pieces ---------- */
const specIcon=(k,size)=>{const s=SPECS[k];size=size||28;return `<img class="tk-ic" src="${iconUrl(s.icon)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" style="--cc:${s.col}">`;};
const placesText=k=>SPECS[k].places.map(p=>`${p.label} for ${ROLE_WORD[p.role]}`).join(", ");
function archonText(k){
  const a=SPECS[k].archon;if(!a)return "";
  return `${fmt(a.dps)} DPS in the logs · archon ${a.tier} · ${ord(archonRank(k))} of ${ARCHON.length}`;
}
function bringsHTML(k,opt){
  opt=opt||{};const b=SPECS[k].brings;
  if(!b.length)return `<span class="tk-none">Nothing the app counts</span>`;
  return b.map(x=>`<span class="tk-b${opt.hl&&opt.hl===x.id?" hl":""}" title="${esc(x.n)} (${x.scope==="party"?"its group":x.scope==="raid"?"whole raid":"boss debuff"})">${x.ic?`<img src="${iconUrl(x.ic)}" alt="" width="${opt.size||22}" height="${opt.size||22}" loading="lazy">`:""}${opt.names?`<span>${esc(x.n)}</span>`:`<span class="sr">${esc(x.n)}</span>`}</span>`).join("");
}
function tipHTML(k){
  const s=SPECS[k];
  return `<span class="tt"><b class="tt-name" style="color:${s.col}">${esc(label(k))}${k===ME?" · your spec":""}</b>`+
    `<span class="tt-grey">${esc(s.role)}${s.ability?" · "+esc(s.ability):""}</span>`+
    `<span>${esc(placesText(k))} on Wowhead's lists</span>`+
    (s.archon?`<span class="tt-arch">${esc(archonText(k))}</span>`:"")+
    (s.brings.length?`<span class="tt-br">${bringsHTML(k,{size:18})}</span>`:"")+`</span>`;
}
/* the full card: every list it is on, what the logs say, what it brings, its signature ability */
function cardHTML(k,opt){
  opt=opt||{};const s=SPECS[k],r=opt.raid;
  const n=r?r.count(k):0;
  return `<div class="tk-card" style="--cc:${s.col}"><div class="tk-ch">${specIcon(k,48)}<div><h3>${esc(label(k))}</h3><p>${esc(s.role)}${s.ability?` · signature ability <b>${esc(s.ability)}</b>`:""}${k===ME?` · <span class="tk-you">Your spec</span>`:""}</p></div></div>`+
    `<dl class="tk-dl">`+
    LISTS.map(l=>{const p=s.places.find(x=>x.role===l.role);return `<div><dt>Wowhead · ${esc(l.role)}</dt><dd>${p?`<span class="tk-tl d${tierDepth(l.role,p.label)}">${esc(p.label)}</span> of ${l.tiers.map(t=>t.label).join(" ")}`:`<span class="tk-none">Not on this list</span>`}</dd></div>`;}).join("")+
    `<div><dt>The logs · archon.gg</dt><dd>${s.archon?`<b>${fmt(s.archon.dps)}</b> DPS average, ${ord(archonRank(k))} of ${ARCHON.length} · archon's tier <span class="tk-tl">${esc(s.archon.tier)}</span>`:`<span class="tk-none">No log numbers in the app for ${s.role==="Tank"?"tanks":"healers"}</span>`}</dd></div>`+
    `</dl><p class="tk-mini">What it brings to a raid</p><div class="tk-brings">${bringsHTML(k,{names:true,size:22})}</div>`+
    (r?`<p class="tk-raidline">${n?`${plural(n,"player")} in ${r.saved?"your raid":"the example raid"}`:`None in ${r.saved?"your raid":"the example raid"}`}</p>`:"")+
    `<p class="tk-src">Tiers: <a href="${esc((list(s.places[0]&&s.places[0].role)||LISTS[0]).url)}" target="_blank" rel="noreferrer noopener">Wowhead's reasoning</a> (their words stay on their page)${s.archon?" · logs: archon.gg, read 2026-08-23":""}</p></div>`;
}

/* ---------- spec tooltip: hover or focus on anything with data-spec; a tap on touch screens ---------- */
const tip=document.createElement("div");tip.id="tk-tip";tip.setAttribute("role","tooltip");tip.hidden=true;document.body.appendChild(tip);
let tipFor=null;
function placeTip(el){
  if(innerWidth<700){tip.classList.add("sheet");tip.style.left=tip.style.top="";return;}
  tip.classList.remove("sheet");
  const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
  let x=r.left+r.width/2-w/2,y=r.top-h-10;
  if(y<8)y=r.bottom+10;
  x=Math.max(8,Math.min(innerWidth-w-8,x));y=Math.max(8,Math.min(innerHeight-h-8,y));
  tip.style.left=Math.round(x)+"px";tip.style.top=Math.round(y)+"px";
}
function showTip(el){const k=el.dataset.spec;if(!SPECS[k]||el.hasAttribute("data-notip"))return;tipFor=el;tip.innerHTML=tipHTML(k);tip.hidden=false;placeTip(el);}
function hideTip(){if(!tip.hidden)tip.hidden=true;tipFor=null;}
const tipEl=t=>t&&t.closest?t.closest("[data-spec]"):null;
on(document,"pointerover",e=>{if(e.pointerType==="touch")return;const el=tipEl(e.target);if(el){if(el!==tipFor)showTip(el);}else if(tipFor&&tipFor!==document.activeElement)hideTip();});
on(document,"focusin",e=>{const el=tipEl(e.target);if(el)showTip(el);else hideTip();});
on(document,"pointerdown",e=>{if(e.pointerType!=="touch")return;const el=tipEl(e.target);if(!el)hideTip();});
on(window,"scroll",()=>{if(tipFor&&innerWidth>=700)hideTip();},{passive:true});
on(document,"keydown",e=>{if(e.key==="Escape")hideTip();});

/* ---------- scene and motion ---------- */
const SC=window.SCENE||{cam:{},mix:{},setMotion(){},render(){},pointer(){}};
const KIT=window.TBCKit||null;
if(KIT)KIT.theme("tiers",{instant:true}); /* the tab's own colour: emerald, three stacked rank rings */
const G=typeof gsap!=="undefined", ST=G&&typeof ScrollTrigger!=="undefined", SPL=G&&typeof SplitText!=="undefined";
const RMQ=matchMedia("(prefers-reduced-motion: reduce)");
const M={on:false};
const moving=()=>!RMQ.matches&&(G?M.on:true);
const ui=$("#tierui");
function safe(a){if(!a)return a;const ms=Math.max(1500,a.totalDuration()*1000+400);setTimeout(()=>{if(a.progress()<1&&!a.scrollTrigger)a.progress(1);},ms);return a;}
let ctx=null;
const A=fn=>ctx?ctx.add(fn):fn();
/* new panels rise into place; boxes marked data-enter open through the kit's small ring of light */
function rise(scope,quick){
  if(!M.on||RMQ.matches||!G||!scope)return;
  A(()=>{
    const boxes=$$(".box",scope).filter(b=>b.offsetParent&&b.getBoundingClientRect().top<innerHeight*1.15).slice(0,10);
    if(!boxes.length)return;
    safe(gsap.fromTo(boxes,{y:quick?12:34,autoAlpha:0},{y:0,autoAlpha:1,duration:quick?.3:.6,stagger:.05,ease:"expo.out",clearProps:"transform,opacity,visibility"}));
    if(KIT&&!quick)boxes.filter(b=>b.hasAttribute("data-enter")).forEach((b,i)=>KIT.enter(b,{delay:i*.06}));
  });
}
/* chips land row by row (a design passes the rows) */
function land(els){
  if(!M.on||RMQ.matches||!G||!els||!els.length)return;
  A(()=>safe(gsap.from(els,{y:10,scale:.86,autoAlpha:0,duration:.35,stagger:.025,ease:"back.out(2.4)",clearProps:"transform,opacity,visibility"})));
}
function splitHero(){
  const h=$("#h-tl");if(!h)return null;
  if(SPL)return SplitText.create(h,{type:"words",wordsClass:"w",mask:"words",aria:"auto"}).words;
  if(h.dataset.split)return null;
  h.dataset.split="1";h.setAttribute("aria-label",h.textContent.replace(/\s+/g," ").trim());
  const words=t=>t.split(/(\s+)/).map(w=>/^\s+$/.test(w)||!w?w:`<span class="w-mask" aria-hidden="true"><span class="w">${w}</span></span>`).join("");
  h.innerHTML=Array.from(h.childNodes).map(n=>n.nodeType===3?words(n.textContent):`<em>${words(n.textContent)}</em>`).join("");
  return $$("#h-tl .w");
}
function intro(){
  const words=splitHero();
  const tl=gsap.timeline({defaults:{ease:"power4.out"}});
  if(SC.cam)tl.fromTo(SC.cam,{intro:1},{intro:0,duration:1.4,ease:"expo.out"},0);
  tl.from("#scene, .fallback",{autoAlpha:0,duration:.8,ease:"power1.out"},0);
  if(words&&words.length)tl.from(words,{yPercent:115,rotate:7,duration:.7,stagger:.04},.1);
  if($(".hero .facts span"))tl.from(".hero .facts span",{y:12,scale:.85,autoAlpha:0,duration:.4,stagger:.06,ease:"back.out(2.6)"},.4);
  if($(".flavor .chip"))tl.from(".flavor .chip",{scale:.6,autoAlpha:0,duration:.35,ease:"back.out(3)"},.3);
  safe(tl);
  setTimeout(()=>rise(ui),350);
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
  if(KIT)KIT.theme("tiers",{instant:true});
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
#tierui{position:relative}
.tk-ic{display:block;flex:none;border-radius:50%;border:2px solid var(--cc,#888);background:#000;box-sizing:content-box}
.tk-b{display:inline-flex;align-items:center;gap:6px;line-height:0;border-radius:6px}
.tk-b img{border-radius:4px;border:1px solid rgba(255,255,255,.18);display:block}
.tk-b>span:not(.sr){line-height:1.3;font-size:var(--t-xs);color:var(--ink-2)}
.tk-b.hl img{outline:2px solid var(--glow);outline-offset:1px}
.tk-none{font-size:var(--t-xs);color:var(--ink-3)}
.tk-tl{display:inline-grid;place-items:center;min-width:24px;height:22px;padding:0 5px;font:400 var(--t-md)/1 var(--f-head);color:var(--ink);border:1.5px solid var(--ink-2);border-radius:5px;background:rgba(255,255,255,.04)}
.tk-tl.d0{border-width:2.5px;border-color:var(--ink);box-shadow:0 0 12px -4px var(--glow)}
.tk-tl.d1{border-width:2px}.tk-tl.d2{color:var(--ink-2)}.tk-tl.d3,.tk-tl.d4{color:var(--ink-3);border-color:var(--ink-3);border-style:dashed}
.tk-you{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--glow-ink);background:var(--glow);border-radius:4px;padding:1px 5px}
.tk-card{display:grid;gap:10px}
.tk-ch{display:flex;gap:12px;align-items:center}
.tk-ch h3{margin:0;font:400 var(--t-xl)/1.1 var(--f-head);color:var(--cc)}
.tk-ch p{margin:2px 0 0;font-size:var(--t-sm);color:var(--ink-2)}
.tk-ch p b{color:var(--ink)}
.tk-dl{margin:0;display:grid;gap:6px}
.tk-dl>div{display:grid;grid-template-columns:150px minmax(0,1fr);gap:8px;align-items:center;padding:6px 8px;border-radius:8px;background:var(--scrim);border:1px solid var(--rim-2)}
@media (max-width:520px){.tk-dl>div{grid-template-columns:minmax(0,1fr)}}
.tk-dl dt{font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3)}
.tk-dl dd{margin:0;font-size:var(--t-sm);color:var(--ink-2)}
.tk-dl dd b{color:var(--ink);font-family:var(--f-mono)}
.tk-mini{margin:4px 0 0;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.tk-brings{display:flex;flex-wrap:wrap;gap:6px 12px}
.tk-raidline{margin:0;font-size:var(--t-sm);color:var(--ink-2)}
.tk-src{margin:0;font-size:var(--t-xs);color:var(--ink-3);border-top:1px solid var(--rim-2);padding-top:8px}
#tk-tip{position:fixed;z-index:60;pointer-events:none;background:linear-gradient(180deg,rgba(6,22,18,.97),rgba(3,10,10,.97));border:1px solid rgba(160,240,210,.4);border-radius:8px;padding:9px 11px;box-shadow:0 12px 40px -8px rgba(0,0,0,.9)}
#tk-tip.sheet{left:8px!important;right:8px;top:auto!important;bottom:8px}
.tt{display:grid;gap:3px;font:400 12.5px/1.38 var(--f-body);color:#fff;min-width:200px;max-width:300px}
#tk-tip.sheet .tt{max-width:none}
.tt-name{font-size:14px;font-weight:700}.tt-grey{color:#a8b5b2}.tt-arch{color:#e8dcbc}
.tt-br{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
`;
document.head.appendChild(css);

function start(design){if(!ui)return;design.render();initMotion();}

window.TierKit={D,SPECS,LISTS,ARCHON,KEYS,ME,CLASSES,ROLE_WORD,$,$$,on,esc,plural,say,store,fmt,ord,iconUrl,label,list,archonRank,tierDepth,
  raid,specIcon,placesText,archonText,bringsHTML,tipHTML,cardHTML,hideTip,rise,land,motion:()=>M.on&&!RMQ.matches,start};
})();
