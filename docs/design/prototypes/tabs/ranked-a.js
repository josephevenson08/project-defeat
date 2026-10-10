/* ranked-a.js — Ranked Gear design A, "The guide, slot by slot": Wowhead's order for one slot at a time, each item as
   the game's tooltip. Pick a slot from your own gear; its ranked items stand in order with the guide's note ("Best",
   "Great", "P1 BiS"), where they drop, fitted out the way Wowhead gems and enchants them, and an Equip button. What
   you wear is marked. If what you wear isn't on the list at all, it is shown first, so the ranking always reads
   against something. Rings and trinkets share one list for both slots, and a unique one can't go in both. */
(function(){
"use strict";
const R=window.RankedKit;if(!R)return;
const {G}=R;
/* inside the Character Planner (picked 2026-10-10: A with C as a second view) A draws into its own view, under the
   tab's one heading and view switch (ranked-planner.js) */
const IN_PLANNER=/a/.test(window.RANKED_IN_PLANNER||"");
const mount=document.getElementById(IN_PLANNER?"rkui-a":"rkui");if(!mount)return;
const KEY="pd-ranked-a";
let ui={slot:"Head"};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&G.SLOT[v.slot])ui=v;}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=mount.querySelector("#ra-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.ra-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;margin:0 0 8px}
.ra-head h4{font:400 var(--t-lg) var(--f-head);margin:0}
.ra-head small{color:var(--ink-3);font-size:var(--t-xs)}
.ra-cards{list-style:none;margin:0;padding:0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.ra-card{display:flex;flex-direction:column;gap:8px;background:rgba(5,8,12,.88);border:1px solid var(--rim-2);border-radius:10px;padding:10px 12px}
.ra-card.on{border-color:var(--glow);box-shadow:0 0 18px -8px var(--glow)}
.ra-card.off{border-style:dashed}
.ra-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ra-tip{display:flex;gap:10px;align-items:flex-start}
.ra-tip .tt{min-width:0;max-width:none;flex:1}
.ra-act{margin-top:auto;display:flex;justify-content:flex-end}
@media (max-width:699px){.ra-cards{grid-template-columns:minmax(0,1fr)}}`;
document.head.appendChild(css);

function card(slot,list,e,extra){
  const wearing=R.worn(slot)===e.id,other=!wearing&&R.wornIn(list,e.id)[0],blocked=R.blockedBy(slot,e.id);
  const head=e.rank
    ?`<span class="rk-rank" aria-label="Rank ${e.rank}">#${e.rank}</span><span class="rk-note${/^Best/.test(e.note)?" best":""}">${G.esc(e.note)}</span>`
    :`<span class="rk-note">Not on Wowhead's list</span>`;
  const tag=wearing?`<span class="rk-tag wear">You wear this</span>`:other?`<span class="rk-tag wear">In your ${G.esc(other)}</span>`:"";
  const act=wearing?`<button type="button" class="rk-eq" disabled>Equipped</button>`
    :blocked?`<button type="button" class="rk-eq" disabled>Unique: already in ${G.esc(blocked)}</button>`
    :`<button type="button" class="rk-eq" data-eq="${e.id}" aria-label="Equip ${G.esc(e.name)} in ${slot}">Equip in ${slot}</button>`;
  return `<li class="ra-card${wearing?" on":""}${extra||""}"><div class="ra-top">${head}${tag}</div>
    <div class="ra-tip">${R.icon(G.item(e.id),40)}${G.tooltipHTML(e.id,R.guideSide(slot,e.id),slot)}</div>
    <div class="ra-act">${act}</div></li>`;
}

function render(){
  const slot=ui.slot,list=R.listOf(slot),ranked=R.entries(list),cur=R.worn(slot);
  const curRank=cur?G.rankOf(slot,cur):null;
  const pair=list.slots.length>1?` · one list for both ${list.label.toLowerCase()} slots`:"";
  const wear=!cur?"this slot is empty":curRank?`you wear #${curRank}`:"what you wear isn't on the list";
  let h=(IN_PLANNER?"":`<h3>Ranked gear</h3>`)+`<p class="lead">Wowhead's Fury Warrior Phase 2 order for each slot, best first. Pick a slot from your gear. Each item is shown with the enchant and gems the guide uses; Equip changes the Gear tab too.</p>`+R.strip(slot);
  h+=`<div class="ra-head"><h4>${G.esc(slot)}</h4><small>${ranked.length} ranked · ${wear}${pair}</small></div><ol class="ra-cards" aria-label="${G.esc(slot)}, ranked">`;
  if(cur&&!curRank){const it=G.item(cur);h+=card(slot,list,Object.assign({},it,{rank:null,note:""})," off");}
  h+=ranked.map(e=>card(slot,list,e)).join("")+`</ol>`;
  h+=`<p class="okline rk-msg" id="ra-msg" aria-live="polite"></p>`;
  h+=`<p class="prov" style="margin:6px 0 0"><a href="${G.D.source.url}">Wowhead Fury Warrior DPS BiS, Phase 2</a> · tooltips in our own words · item levels and stats: wowsims/tbc catalogue</p>`;
  mount.innerHTML=h;
}

mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.rslot){ui.slot=t.dataset.rslot;save();render();const f=mount.querySelector(`[data-rslot="${ui.slot}"]`);if(f)f.focus();return;}
  if(t.dataset.eq){const id=t.dataset.eq,nm=G.item(id).name;R.equip(ui.slot,id,"ranked-a");render();
    say(`${ui.slot}: equipped ${nm}. The Gear tab shows it too.`);const f=mount.querySelector(`[data-rslot="${ui.slot}"]`);if(f)f.focus();}
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="ranked-a")render();});
render();if(!IN_PLANNER)R.openTab();
})();
