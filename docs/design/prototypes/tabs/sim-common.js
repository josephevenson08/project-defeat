/* sim-common.js — shared logic for the three Simulation designs (sim-a/b/c.html). The numbers are real: the page runs the
   live app's own simulator (sim-engine.js, bundled from src/ by gen-sim-engine.mjs) on the planner's shared character, the
   one the Character Planner's Gear, Talents and Buffs tabs hold for this browser session (build-common.js snapshots it in
   the app's saved-build format). sim-data.js adds archon.gg's observed averages and each DPS spec's best case by the same
   model. What a design does on top:
   - run(opts): the estimate (damage sources, breakdown, caveats), optionally stat weights and the upgrade finder; cached per
     character, since stat weights and upgrades re-run the model dozens of times
   - runWith(build, opts): the same for a changed copy of the character (the workbench's what-ifs)
   - an upgrade can be equipped here only if it is on Wowhead's Fury list (the planner's catalogue); any other item opens the
     live app with the swap made, through a share link */
(function(){
"use strict";
const K=window.BuildKit,P=window.PDSim,D=window.SIM_DATA;if(!K||!P||!D)return;
const {G,B,esc}=K;
const ME={className:"Warrior",spec:"Fury"};
const REF=D.specs.find(s=>s.className===ME.className&&s.spec===ME.spec)||null;
const PLANNER="planner.html";

/* ---------- running the model ---------- */
const keyOf=(b,o)=>JSON.stringify([b.character,b.gear,b.talentPoints,b.activeBuffIds,b.activeConsumableIds,b.activeTargetDebuffIds,!!o.weights,!!o.upgrades]);
const CACHE=new Map();
function runWith(build,opts){
  opts=opts||{};const k=keyOf(build,opts);
  if(CACHE.has(k))return CACHE.get(k);
  /* a full run is a superset of a plain one, so reuse it when we have it */
  const full=keyOf(build,{weights:true,upgrades:true});
  if(!opts.weights&&!opts.upgrades&&CACHE.has(full))return CACHE.get(full);
  const r=P.run(build,opts);if(CACHE.size>40)CACHE.clear();CACHE.set(k,r);return r;
}
const current=()=>K.snapshot();
const run=opts=>runWith(current(),opts);

/* ---------- reading a result ---------- */
const fmt=(n,dp)=>Number(n).toLocaleString("en-US",{minimumFractionDigits:dp||0,maximumFractionDigits:dp||0});
const sign=(n,dp)=>(n>0?"+":n<0?"−":"±")+fmt(Math.abs(n),dp);
/* how far below what players of this spec average the estimate sits */
function versus(score){
  if(!REF||!REF.observed||!score)return null;
  const x=REF.observed/score;
  return {observed:REF.observed,ratio:x,pct:Math.min(100,score/REF.observed*100),
    text:x>=1?`${x.toFixed(2)}× below what ${ME.spec} ${ME.className.toLowerCase()}s average`:`${(1/x).toFixed(2)}× above the observed average, which the model should never be`};
}
const caveats=sim=>[sim.missingWeaponNote,sim.specNote,sim.unmodelledTalentNote].filter(Boolean);
/* the character in one line */
function who(build){
  const s=K.summary(build);
  return `${esc(K.CHARACTER.race)} ${esc(s.spec)} Warrior · ${s.filled} of 17 slots · talents ${s.split.join(" / ")} · ${s.buffs} buffs · ${s.cons} consumables`;
}

/* ---------- the upgrade finder's items ---------- */
const QV={Poor:"--ink-3",Common:"--ink",Uncommon:"--q-unc",Rare:"--q-rare",Epic:"--q-epic",Legendary:"--q-leg"};
const qColor=q=>`var(${QV[q]||"--ink"})`;
function itemIcon(it,size){const n=it&&P.icon(it.wowItemId);size=size||32;
  return n?`<img class="sm-ic" src="${G.iconUrl(n)}" alt="" width="${size}" height="${size}" style="--q:${qColor(it.quality)}">`:`<span class="sm-ic sm-noic" style="width:${size}px;height:${size}px" aria-hidden="true"></span>`;}
/* the build with one slot swapped for an upgrade, as the finder scored it */
function withUpgrade(build,c){const b=JSON.parse(JSON.stringify(build));
  b.gear[c.slot]=Object.assign({itemId:c.item.id,gemIds:[...c.gemIds]},c.enchantId?{enchantId:c.enchantId}:{});return b;}
/* equip on the planner when its catalogue has the item; else the live app gets it through a link */
const canEquip=c=>!!G.item(c.item.id)&&c.gemIds.every(g=>!g||G.gem(g))&&(!c.enchantId||!!G.enchant(c.enchantId));
function equip(c){
  const st=G.clone(K.GS.get());const it=G.item(c.item.id);
  st[c.slot]={item:it.id,enchant:c.enchantId||null,gems:it.sockets.map((_,i)=>c.gemIds[i]||null)};
  K.GS.set(st,"sim");
}
const liveLink=build=>K.linkFor(build);

/* ---------- the trust panel: every DPS spec's best case against what players average ---------- */
function trustHTML(score){
  const max=Math.max(...D.specs.map(s=>s.observed||0));
  const rows=D.specs.map(s=>{const me=s.className===ME.className&&s.spec===ME.spec;
    return `<li class="${me?"me":""}"><span class="sm-nm">${esc(s.spec)} ${esc(s.className)}</span>
      <span class="bars" aria-hidden="true"><i class="obs" style="width:${(s.observed/max*100).toFixed(1)}%"></i><i class="mod" style="width:${(s.best/max*100).toFixed(1)}%"></i></span>
      <span class="num">${fmt(s.best)} / ${fmt(s.observed)}</span><span class="x num">${(s.observed/s.best).toFixed(2)}×</span></li>`;}).join("");
  const lo=Math.min(...D.specs.map(s=>s.observed/s.best)),hi=Math.max(...D.specs.map(s=>s.observed/s.best));
  return `<div class="sm-trust"><p class="sm-key"><span><i class="obs"></i>What players average (archon.gg)</span><span><i class="mod"></i>This model at best case</span></p>
    <ol class="sm-specs" aria-label="Each DPS spec: the model's best case against what players average">${rows}</ol>
    <p class="prov">Best case is the model's own number with rank-1 BiS, every buff and consumable and the sourced talents, the way the app's tests measure it. Across all 20 DPS specs it reads ${lo.toFixed(2)}× to ${hi.toFixed(2)}× low${score&&REF?`; your character's ${fmt(score)} is ${(REF.observed/score).toFixed(2)}× below the ${fmt(REF.observed)} Fury average`:""}. ${esc(D.source)}.</p></div>`;
}

const css=document.createElement("style");
css.textContent=`
.sm-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;font:400 var(--t-lg)/1.2 var(--f-head);margin:0 0 6px}
.sm-h small{font:400 var(--t-xs) var(--f-body);color:var(--ink-3)}
.sm-who{font-size:var(--t-sm);color:var(--ink-2);margin:0 0 10px}
.sm-who a{color:var(--glow)}
.sm-score{display:grid;gap:4px;margin:6px 0 12px}
.sm-score .big{font:500 clamp(2.4rem,7vw,3.8rem)/1 var(--f-mono);color:var(--glow);text-shadow:0 0 28px var(--glow-soft)}
.sm-score .lab{font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.sm-vs{font-size:var(--t-sm);color:var(--ink-2)}
.sm-ref{height:8px;border-radius:4px;background:var(--rim-2);overflow:hidden;max-width:520px}
.sm-ref i{display:block;height:100%;background:var(--glow);border-radius:4px}
.sm-ic{border-radius:5px;border:1.5px solid var(--q,var(--rim));background:#05080b;flex:none;display:inline-block;vertical-align:middle}
.sm-src{width:100%;border-collapse:collapse;font-size:var(--t-sm)}
.sm-src th{font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);text-align:left;padding:4px 6px;border-bottom:1px solid var(--rim)}
.sm-src td{padding:6px;border-bottom:1px solid var(--rim-2);vertical-align:middle}
.sm-src td.num,.sm-src th.num{text-align:right;font-family:var(--f-mono);white-space:nowrap}
.sm-src .sm-bar{display:block;height:8px;border-radius:4px;background:var(--rim-2);min-width:60px;overflow:hidden}
.sm-src .sm-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--glow),color-mix(in srgb,var(--glow) 55%,var(--violet,#b48cff)))}
.sm-kv{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 14px;font-size:var(--t-sm);margin:0}
.sm-kv dt{color:var(--ink-2)}.sm-kv dd{margin:0;font-family:var(--f-mono);text-align:right}
.sm-cav{background:var(--warn-soft);border:1px solid rgba(255,207,122,.3);border-radius:10px;padding:8px 12px;font-size:var(--t-sm);margin:10px 0 0}
.sm-cav p{margin:4px 0}
.sm-w{list-style:none;margin:0;padding:0;display:grid;gap:5px}
.sm-w li{display:grid;grid-template-columns:120px minmax(0,1fr) auto;gap:10px;align-items:center;font-size:var(--t-sm)}
.sm-w .sm-bar{height:10px;border-radius:5px;background:var(--rim-2);overflow:hidden}
.sm-w .sm-bar i{display:block;height:100%;background:var(--glow)}
.sm-w li.off{opacity:.6}
.sm-up{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.sm-up li{display:grid;grid-template-columns:40px minmax(0,1fr) auto auto;gap:2px 10px;align-items:center;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:7px 10px;font-size:var(--t-sm)}
.sm-up li .sm-ic{grid-row:span 2}
.sm-up .d{grid-row:span 2;text-align:right;font-family:var(--f-mono);color:#7fdc8a;white-space:nowrap}
.sm-up .d small{display:block;color:var(--ink-3);font-size:var(--t-xs)}
.sm-up .meta{grid-column:2;color:var(--ink-3);font-size:var(--t-xs)}
.sm-up .dq{color:var(--warn)}
.sm-up .act{grid-row:span 2}
.sm-btn{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer;min-height:34px;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center}
.sm-btn:hover,.sm-btn:focus-visible{border-color:var(--glow);color:var(--glow)}
.sm-btn[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
.sm-busy{color:var(--ink-3);font-size:var(--t-sm)}
.sm-trust .sm-key{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:var(--t-xs);color:var(--ink-2);margin:0 0 6px}
.sm-trust .sm-key i{display:inline-block;width:12px;height:8px;border-radius:2px;margin-right:6px;vertical-align:0}
.sm-trust i.obs{background:color-mix(in srgb,var(--ink) 30%,transparent)}.sm-trust i.mod{background:var(--glow)}
.sm-specs{list-style:none;margin:0;padding:0;display:grid;gap:3px}
.sm-specs li{display:grid;grid-template-columns:150px minmax(0,1fr) auto 52px;gap:8px;align-items:center;font-size:var(--t-xs);padding:2px 4px;border-radius:6px}
.sm-specs li.me{background:var(--glow-soft);outline:1px solid var(--rim)}
.sm-specs .bars{position:relative;height:12px}
.sm-specs .bars i{position:absolute;left:0;border-radius:3px}
.sm-specs .bars i.obs{top:0;height:12px}.sm-specs .bars i.mod{top:3px;height:6px}
.sm-specs .x{text-align:right;color:var(--ink-2)}
@media (max-width:699px){.sm-w li{grid-template-columns:90px minmax(0,1fr) auto}.sm-specs li{grid-template-columns:110px minmax(0,1fr) 46px}.sm-specs li .num:not(.x){display:none}
  .sm-up li{grid-template-columns:36px minmax(0,1fr) auto}.sm-up .act{grid-column:2/-1;grid-row:auto;justify-self:start}}
@media (max-width:699px),(pointer:coarse){.sm-btn{min-height:44px;padding:8px 14px}#simui .btn{min-height:44px}}`;
document.head.appendChild(css);

/* the shared pieces every design draws */
function sourcesHTML(sim){
  const src=sim.damageSources||[];if(!src.length)return `<p class="sm-busy">No damage sources for this result.</p>`;
  return `<table class="sm-src"><caption class="sr">Damage sources</caption><thead><tr><th scope="col">Source</th><th scope="col" class="num">DPS</th><th scope="col" class="num">Share</th><th scope="col"><span class="sr">Share bar</span></th></tr></thead><tbody>`+
    src.map(s=>`<tr><td>${esc(s.name)}</td><td class="num">${fmt(s.dps,1)}</td><td class="num">${fmt(s.share*100,1)}%</td><td style="width:40%"><span class="sm-bar"><i style="width:${(s.share*100).toFixed(1)}%"></i></span></td></tr>`).join("")+`</tbody></table>`;
}
const breakdownHTML=sim=>`<dl class="sm-kv">${(sim.breakdown||[]).map(e=>`<dt>${esc(e.label)}</dt><dd>${fmt(e.value,Math.abs(e.value)<10&&e.value%1?2:Math.abs(e.value)<1000&&e.value%1?1:0)}</dd>`).join("")}</dl>`;
const caveatsHTML=sim=>{const c=caveats(sim);return c.length?`<div class="sm-cav"><b>What this estimate misses for you</b>${c.map(t=>`<p>${esc(t)}</p>`).join("")}</div>`:"";};
function weightsHTML(w){
  if(!w)return `<p class="sm-busy">Working out stat weights…</p>`;
  const rows=w.entries.filter(e=>e.perPoint>0||e.notModeledYet).sort((a,b)=>b.relative-a.relative);
  const max=Math.max(...rows.map(e=>e.relative),1);
  return `<p class="prov" style="margin:0 0 8px">Each stat's worth in ${esc(w.referenceLabel)}, from re-running the model with ${w.probeAmount} more of it. Higher is better.</p><ol class="sm-w">`+
    rows.map(e=>`<li class="${e.notModeledYet?"off":""}"><span>${esc(e.label)}</span><span class="sm-bar" aria-hidden="true"><i style="width:${(Math.max(0,e.relative)/max*100).toFixed(1)}%"></i></span><span class="num">${e.notModeledYet?"not modelled yet":`1 = ${fmt(e.relative,2)} ${esc(w.referenceLabel)}`}</span></li>`).join("")+`</ol>`;
}
function upgradesHTML(u,limit){
  if(!u)return `<p class="sm-busy">Running the upgrade finder…</p>`;
  const list=u.candidates.slice(0,limit||u.candidates.length);
  if(!list.length)return `<p class="sm-busy">Nothing in the catalogue beats what you wear for this spec.</p>`;
  return `<ol class="sm-up">`+list.map((c,i)=>`<li>${itemIcon(c.item,40)}<span><b style="color:${qColor(c.item.quality)}">${esc(c.item.name)}</b> <span class="rk-src">${esc(c.slot)}</span></span>
    <span class="d">${sign(c.scoreDelta,1)} DPS<small>${sign(c.percentDelta,1)}%</small></span>
    <span class="act">${canEquip(c)?`<button type="button" class="sm-btn" data-up="${i}">Equip</button>`:`<button type="button" class="sm-btn" data-live="${i}" title="This item isn't on Wowhead's Fury list, which is all this prototype carries">Try in the live app ↗</button>`}</span>
    <span class="meta">replaces ${esc(c.replacesName||"nothing")}${c.dataQuality&&c.dataQuality!=="sourced"?` · <span class="dq">${c.dataQuality==="skewed"?"compares against an estimated item: likely overstated":"estimated stats: approximate"}</span>`:""}</span></li>`).join("")+`</ol>`;
}
/* the Equip / live-app buttons every upgrade list shares */
async function upgradeClick(t,u,say){
  if(t.dataset.up){const c=u.candidates[+t.dataset.up];equip(c);say(`${c.slot}: equipped ${c.item.name}. The Character Planner wears it too.`);return true;}
  if(t.dataset.live){const c=u.candidates[+t.dataset.live];const url=await liveLink(withUpgrade(current(),c));window.open(url,"_blank","noopener");say(`Opened the live app with ${c.item.name} in ${c.slot}.`);return true;}
  return false;
}
/* let the page paint "working…" before a heavy run */
const later=fn=>new Promise(r=>requestAnimationFrame(()=>setTimeout(()=>r(fn()),20)));

window.SimKit={K,P,D,G,B,esc,ME,REF,PLANNER,run,runWith,current,fmt,sign,versus,caveats,who,itemIcon,qColor,withUpgrade,canEquip,equip,liveLink,
  trustHTML,sourcesHTML,breakdownHTML,caveatsHTML,weightsHTML,upgradesHTML,upgradeClick,later};
})();
