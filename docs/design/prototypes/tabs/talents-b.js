/* talents-b.js — Talents design B, "What it gives you": one tree at a time beside a running list of what your points do.
   The list adds the talents up the way the live simulator reads them (+5% melee crit, +25% off-hand damage, +10% attack
   power in Berserker Stance...), marks each talent the simulator doesn't read and says why, and ties Precision to the
   gear: the special-attack hit cap, your gear's hit against it, and the stat bar above all move as you spend points.
   A line that a change moved lights up, and the message says what it now reads. */
(function(){
"use strict";
const T=window.TalentKit;if(!T)return;
const G=window.GearKit||null;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("talui");if(!mount)return;
const S=T.store("planner");
const KEY="pd-talents-b";
let ui={tree:"Fury",sel:null};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&T.TREES.some(t=>t.spec===v.tree))ui=Object.assign(ui,v);}catch(e){}
if(ui.sel&&!T.BY[ui.sel])ui.sel=null;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
let changed=[];
const say=t=>{const m=$("#tb-msg");if(!m)return;m.textContent=t+(changed.length&&changed.length<=3?" "+changed.join(" "):"");changed=[];};

const css=document.createElement("style");
css.textContent=`
.tb-cols{display:grid;gap:14px;grid-template-columns:minmax(0,1fr);align-items:start}
@media (min-width:960px){.tb-cols{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}}
.tb-tree{position:relative;border-radius:10px;border:1px solid var(--rim-2);padding:14px 8px 18px;background:radial-gradient(110% 60% at 50% 0%,var(--glow-soft),transparent 65%),var(--scrim)}
.tb-tree .tk-grid{--cell:46px}
.tb-sel{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:10px 0 0;padding:10px 12px;border:1px solid var(--rim-2);border-radius:10px;background:var(--scrim);font-size:var(--t-sm)}
.tb-sel img{width:36px;height:36px;border-radius:6px;border:1px solid var(--rim)}
.tb-sel .tb-nm{flex:1;min-width:150px}.tb-sel .tb-nm b{display:block;font:400 var(--t-md) var(--f-head)}
.tb-sel .fx{flex-basis:100%;color:var(--ink-2)}.tb-sel .fx .sim{color:#7fe0d4}
.tb-ledger{background:var(--scrim);border:1px solid var(--rim);border-radius:12px;padding:12px 14px}
.tb-ledger h4{font:400 var(--t-lg) var(--f-head);margin:0}
.tb-ledger h5{font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin:14px 0 6px}
.tb-ledger ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.tb-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:6px 8px;border-radius:8px;border:1px solid transparent}
.tb-line b{font:600 var(--t-sm) var(--f-body);color:var(--ink)}
.tb-line .cv{grid-column:1/-1;font-size:var(--t-xs);color:var(--ink-3)}
.tb-line.chg{background:rgba(79,216,200,.12);border-color:var(--glow)}
html.motion .tb-line.chg{animation:tbGlow 1.6s ease-out}
@keyframes tbGlow{0%{box-shadow:0 0 0 0 rgba(79,216,200,.6)}100%{box-shadow:0 0 0 10px rgba(79,216,200,0)}}
.tb-from{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}
.tb-chip{display:inline-flex;align-items:center;gap:5px;font:600 var(--t-xs) var(--f-body);color:var(--ink-2);background:var(--glass-2);border:1px solid var(--rim-2);border-radius:999px;padding:2px 9px 2px 2px;cursor:pointer;white-space:nowrap}
.tb-chip img{width:20px;height:20px;border-radius:50%}
.tb-chip:hover,.tb-chip:focus-visible{border-color:var(--glow);color:var(--ink)}
.tb-nosim li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 8px;align-items:start;font-size:var(--t-xs);color:var(--ink-3);padding:4px 0}
.tb-none{display:flex;flex-wrap:wrap;gap:4px}
.tb-cap{margin:10px 0 0;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,207,122,.3);background:var(--warn-soft);font-size:var(--t-sm)}
.tb-cap .hd{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}.tb-cap .hd b{font:700 var(--t-md) var(--f-body);color:var(--warn)}
.tb-cap .hd span{color:var(--ink-2);font-size:var(--t-xs)}
.tb-gauge{position:relative;height:10px;margin:18px 0 6px;background:rgba(255,255,255,.08);border-radius:5px}
.tb-gauge i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(90deg,#7fdc8a,var(--glow))}
.tb-gauge .mk{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--warn)}
.tb-gauge .mk::after{content:attr(data-l);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);font:600 10px var(--f-body);color:var(--warn);white-space:nowrap;margin-bottom:1px}
.tb-gauge .mk.base{background:var(--ink-3)}.tb-gauge .mk.base::after{color:var(--ink-3);bottom:auto;top:100%;margin:2px 0 0}
.tb-cap p{margin:22px 0 0;color:var(--ink-2)}
.tb-empty{color:var(--ink-3);font-size:var(--t-sm);margin:8px 0 0}
.tb-probs{margin:12px 0 0}
.tb-probs ul{margin:6px 0 0;padding-left:18px;font-size:var(--t-sm);color:var(--ink-2)}
@media (max-width:699px),(pointer:coarse){.tb-chip{min-height:44px;padding-right:12px}.tb-chip img{width:28px;height:28px}}
`;
document.head.appendChild(css);

mount.innerHTML=`<h3>Talents</h3>
<p class="lead">Spend points in a tree on the left; the list on the right adds up what they give you, the way the simulator reads them, and says which talents it doesn't read. Click to learn; right-click, or use −, to unlearn. It opens on the wowsims Fury preset, shown as stored.</p>
<div class="tk-tools"><span class="tk-left" id="tb-left"></span>${T.toolsHTML("tb")}</div>
<p class="okline" id="tb-msg" aria-live="polite"></p>
<div id="tb-body"></div>`;
const body=$("#tb-body");

const gearHit=()=>{if(!G)return null;try{return G.totals(G.store("planner").get()).Hit;}catch(e){return null;}};
function capHTML(p){
  const prec=T.rank(p,T.PRECISION),cap=T.capFor(prec),base=T.capFor(0),hit=gearHit();
  const top=Math.max(base+20,(hit||0)+15),pc=v=>(Math.min(v,top)/top*100).toFixed(1);
  const d=hit==null?null:hit-cap;
  return `<div class="tb-cap"><div class="hd"><b>Hit cap for special attacks: ${cap} rating</b><span>${prec?`${base} without Precision; Precision ${prec}/3 covers ${prec}% of the 9%`:`Precision would lower it to ${T.capFor(3)} at 3/3`}</span></div>`+
    (hit==null?"":`<div class="tb-gauge" role="img" aria-label="Gear hit rating ${hit}; cap ${cap}${prec?`, ${base} without Precision`:""}"><i style="width:${pc(hit)}%"></i><span class="mk" data-l="cap ${cap}" style="left:${pc(cap)}%"></span>${prec?`<span class="mk base" data-l="${base} without" style="left:${pc(base)}%"></span>`:""}</div>
    <p>Your gear has <b>${hit}</b> hit rating: ${d<0?`<b class="cx-dn">${-d} under the cap</b>, so some special attacks will miss`:d===0?"exactly at the cap":`${d} over the cap. The extra still stops white swings missing`}.</p>`)+`</div>`;
}
function chip(f){return `<button type="button" class="tb-chip" data-tsel="${f.id}" aria-label="Show ${T.esc(f.name)}, ${f.r} of ${f.max}"><img src="${T.iconUrl(f.icon)}" alt="">${T.esc(f.name)} ${f.r}/${f.max}</button>`;}
let prevLines=null;
function ledgerHTML(p){
  const lines=T.ledger(p),now={};lines.forEach(l=>now[l.kind+(l.e.stat||"")]=l.text);
  const chg=new Set();
  if(prevLines){Object.entries(now).forEach(([k,v])=>{if(prevLines[k]!==v){chg.add(k);changed.push(`Now ${v}.`);}});
    Object.entries(prevLines).forEach(([k,v])=>{if(!(k in now))changed.push(`No longer ${v}.`);});}
  prevLines=now;
  let h=`<h4>What your talents give you</h4><p class="prov" style="margin:2px 0 0">Added up from the points you've spent, as the live simulator reads them.</p>`+capHTML(p);
  if(!T.spent(p))return h+`<p class="tb-empty">No points spent yet. Learn a talent to see what it gives.</p>`;
  T.GROUPS.forEach(g=>{const ls=lines.filter(l=>l.g===g);if(!ls.length)return;
    h+=`<h5>${g}</h5><ul>`+ls.map(l=>`<li class="tb-line${chg.has(l.kind+(l.e.stat||""))?" chg":""}"><b>${T.esc(l.text)}</b><span class="tb-from">${l.from.map(chip).join("")}</span>${l.caveats.length?`<span class="cv">${T.esc(l.caveats[0])}</span>`:""}</li>`).join("")+`</ul>`;});
  const taken=T.TREES.flatMap(t=>t.talents.filter(x=>T.rank(p,x.id))).map(x=>({id:x.id,name:x.name,icon:x.icon,r:T.rank(p,x.id),max:x.max,s:T.simStatus(x.id)}));
  const skip=taken.filter(x=>x.s.kind==="skip"),abil=taken.filter(x=>x.s.kind==="ability"),none=taken.filter(x=>x.s.kind==="none");
  if(skip.length)h+=`<h5>Spent, but not simulated</h5><ul class="tb-nosim">`+skip.map(x=>`<li>${chip(x)}<span>${T.esc(x.s.text.replace(/^Not simulated: /,""))}</span></li>`).join("")+`</ul>`;
  if(abil.length)h+=`<h5>Abilities the simulator casts</h5><ul class="tb-nosim">`+abil.map(x=>`<li>${chip(x)}<span>Its ability is in the simulated rotation; the talent point itself isn't read.</span></li>`).join("")+`</ul>`;
  if(none.length)h+=`<h5>Not read by the simulator</h5><div class="tb-none">${none.map(chip).join("")}</div><p class="prov" style="margin:6px 0 0">These change a cost, cooldown, shout or utility the estimate doesn't track.</p>`;
  return h;
}
function selHTML(p){
  const x=T.BY[ui.sel];if(!x)return "";const r=T.rank(p,x.id),s=T.simStatus(x.id),fx=T.effectLines(x.id,Math.max(1,r));
  return `<div class="tb-sel"><img src="${T.iconUrl(x.icon)}" alt=""><span class="tb-nm"><b>${T.esc(x.name)}</b><span class="prov">${T.esc(T.TREE_OF[x.id].spec)} · row ${x.row+1}${T.whyBlocked(x.id,p)&&r<x.max?` · ${T.esc(T.whyBlocked(x.id,p))}`:""}</span></span>${T.stepHTML(x.id,p)}
    <span class="fx">${s.kind==="sim"?`<span class="sim">${r?"Gives":"Each rank gives"}: ${fx.map(l=>T.esc(l.text)).join("; ")}</span>`:T.esc(s.text)}</span></div>`;
}
function render(){
  const p=S.get();
  if(!ui.sel||T.TREE_OF[ui.sel].spec!==ui.tree){const t=T.TREES.find(x=>x.spec===ui.tree);const taken=t.talents.filter(x=>T.rank(p,x.id));ui.sel=(taken.length?taken[taken.length-1]:t.talents[0]).id;}
  const probs=T.problems(p);
  const left=$("#tb-left");if(left)left.innerHTML=`Points left <b>${T.left(p)}</b> · <span class="num">${T.split(p)}</span>`;
  const t=T.TREES.find(x=>x.spec===ui.tree);
  T.keepFocus(body,()=>{
    body.innerHTML=`<div class="tb-cols"><div>${T.treeTabsHTML(ui.tree,p)}<section class="tb-tree" aria-label="${t.spec} talents">${T.treeHTML(t,p)}</section>${selHTML(p)}
      ${probs.length?`<div class="tb-probs"><p class="warnline" style="margin:0">This build breaks ${probs.length} of the game's rules. wowsims lists only the talents its simulator reads, so its presets leave out Enrage and the filler points; they're shown as stored.</p><ul>${probs.map(x=>`<li>${T.esc(x.text)}</li>`).join("")}</ul></div>`:""}</div>
      <aside class="tb-ledger" aria-label="What your talents give you">${ledgerHTML(p)}</aside></div>`;
    const s=body.querySelector(`.tk-tal[data-tid="${ui.sel}"]`);if(s)s.setAttribute("aria-current","true");
    T.roving(body,ui.sel);
  });
  save();
}
T.bind(body,S,{from:"talents-b",say,select:id=>{ui.sel=id;ui.tree=T.TREE_OF[id].spec;save();},refresh:render});
T.hoverTips(body,()=>S.get());
body.addEventListener("click",e=>{
  const b=e.target.closest("[data-ttree]");if(b){ui.tree=b.dataset.ttree;ui.sel=null;render();say(`${ui.tree} tree shown.`);return;}
  const c=e.target.closest("[data-tsel]");if(c){const id=+c.dataset.tsel;ui.sel=id;ui.tree=T.TREE_OF[id].spec;render();
    const n=body.querySelector(`.tk-tal[data-tid="${id}"]`);if(n)n.focus();say(`${T.BY[id].name} shown in the ${ui.tree} tree.`);}
});
mount.addEventListener("click",e=>{T.presetClick(e,S,"talents-b",say);});
document.addEventListener("talents:change",render);
/* the hit callout reads the gear too */
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="talents")render();});
render();T.openTalentsTab();
})();
