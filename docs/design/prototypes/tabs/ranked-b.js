/* ranked-b.js — Ranked Gear design B, "What each one does for you": every item on Wowhead's list that you don't wear, in
   one list sorted by what it would change on your character, as the simulator's Upgrade Finder does. Each row says
   what it replaces, the stats you gain and lose, what it does to your hit against the cap, and Compare's example
   score (labelled as an example: the prototype has no simulator). A ring or trinket is weighed against whichever of
   your two it would do most for. Items that would not help sit in a closed list below. Filter to one slot if you like.
   With Wowhead's top pick in every slot nothing helps, so the page offers the Gear tab's part-geared example. */
(function(){
"use strict";
const R=window.RankedKit;if(!R)return;
const {G,C}=R;
const mount=document.getElementById("rkui");if(!mount)return;
const IN_PLANNER=window.RANKED_IN_PLANNER==="b";
const KEY="pd-ranked-b";
let ui={list:"all",open:false};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&(v.list==="all"||R.LISTS.some(l=>l.list===v.list)))ui=v;}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=mount.querySelector("#rb-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.rb-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0 0 10px}
.rb-bar label{font:600 var(--t-sm) var(--f-body);color:var(--ink-2);display:flex;align-items:center;gap:8px}
.rb-bar select{font:600 var(--t-sm) var(--f-body);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:8px;padding:6px 10px;min-height:36px}
.rb-count{color:var(--ink-3);font-size:var(--t-xs)}
.rb-note{background:var(--glow-soft);border:1px solid var(--rim);border-radius:10px;padding:9px 12px;margin:0 0 10px;font-size:var(--t-sm);display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px}
.rb-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.rb-row{display:grid;grid-template-columns:64px 40px minmax(0,1fr) auto;gap:4px 12px;align-items:center;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:8px 10px}
.rb-score{display:grid;justify-items:center;gap:2px;grid-row:span 2}
.rb-score b{font:500 var(--t-lg)/1 var(--f-mono)}
.rb-row .rk-ic{grid-row:span 2}
.rb-what{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 8px;min-width:0}
.rb-what .rk-src{flex-basis:100%}
.rb-trade{grid-column:3;font-size:var(--t-sm);min-width:0}
.rb-trade .cap{display:block;font-size:var(--t-xs);color:var(--ink-2)}
.rb-trade .cap.warn{color:var(--warn)}
.rb-row .rk-eq{grid-row:span 2;grid-column:4}
.rb-more{margin:10px 0 0}
.rb-more summary{cursor:pointer;font:600 var(--t-sm) var(--f-body);color:var(--ink-2);padding:8px 0;min-height:36px}
.rb-more[open] summary{margin-bottom:6px}
.rb-empty{color:var(--ink-3);font-size:var(--t-sm);padding:6px 0}
@media (max-width:699px),(pointer:coarse){.rb-bar select,.rb-more summary{min-height:44px}}
@media (max-width:699px){.rb-row{grid-template-columns:52px 36px minmax(0,1fr)}.rb-trade{grid-column:2/-1}.rb-row .rk-eq{grid-column:1/-1;grid-row:auto;justify-self:start}}`;
document.head.appendChild(css);

/* every ranked item you don't wear, with the swap it would make (rings and trinkets: the slot it does most for) */
function rows(){
  const out=[];
  R.LISTS.filter(l=>ui.list==="all"||l.list===ui.list).forEach(l=>{
    R.entries(l).forEach(e=>{
      if(R.wornIn(l,e.id).length)return;
      const ch=l.slots.length>1?R.bestSlot(l,e.id):R.change(l.slots[0],e.id);
      if(ch)out.push({l,e,ch});
    });
  });
  return out.sort((a,b)=>b.ch.ex-a.ch.ex||a.e.rank-b.e.rank);
}

function row(x){
  const {e,ch}=x,it=G.item(e.id),rep=G.item(ch.replaces),repRank=ch.replaces?G.rankOf(ch.slot,ch.replaces):null;
  const ex=ch.ex,cls=ex>0?"cx-up":ex<0?"cx-dn":"cx-eq";
  return `<li class="rb-row"><span class="rb-score"><b class="${cls}">${C.fmt(ex)}</b><span class="cx-ex">example</span></span>${R.icon(it,40)}
    <div class="rb-what">${R.name(it)}<span class="rk-rank" aria-label="Rank ${e.rank} for ${G.esc(x.l.label)}">#${e.rank}</span><span class="rk-note${/^Best/.test(e.note)?" best":""}">${G.esc(e.note)}</span>
      <span class="rk-src">${G.esc(ch.slot)} · replaces ${rep?`${G.esc(rep.name)}${repRank?` (#${repRank})`:" (not on the list)"}`:"nothing (empty slot)"} · ${G.esc(it.src.text)}</span></div>
    <div class="rb-trade">${R.tradeHTML(ch)}<span class="cap${ch.cap.warn?" warn":""}">Hit ${ch.before} → ${ch.after}: ${G.esc(ch.cap.text)}.</span></div>
    <button type="button" class="rk-eq" data-eq="${e.id}" data-slot="${G.esc(ch.slot)}" aria-label="Equip ${G.esc(it.name)} in ${G.esc(ch.slot)}">Equip in ${G.esc(ch.slot)}</button></li>`;
}

function render(){
  const all=rows(),good=all.filter(x=>x.ch.ex>0),rest=all.filter(x=>x.ch.ex<=0);
  let h=`<h3>Ranked gear</h3><p class="lead">Every item on Wowhead's Fury Warrior Phase 2 list that you don't wear, sorted by what it would do for your character: the stats you'd gain and lose, your hit against the cap (${G.HIT_CAP} rating with your talents and buffs), and an example score.</p>`;
  h+=`<div class="rb-bar"><label for="rb-list">Slot <select id="rb-list"><option value="all"${ui.list==="all"?" selected":""}>All slots</option>`+
    R.LISTS.map(l=>`<option value="${G.esc(l.list)}"${ui.list===l.list?" selected":""}>${G.esc(l.label)}</option>`).join("")+`</select></label>
    <span class="rb-count">${all.length} you don't wear · ${good.length} would help by the example score</span></div>`;
  if(!good.length&&R.fullyRanked())h+=`<p class="rb-note">You wear Wowhead's top pick in every slot, so nothing here beats your gear. <button type="button" class="rk-eq" data-act="example">Try the part-geared example</button></p>`;
  h+=good.length?`<ol class="rb-list" aria-label="Would help, best first">${good.map(row).join("")}</ol>`:`<p class="rb-empty">Nothing on the list would help ${ui.list==="all"?"anywhere":"in this slot"} by the example score.</p>`;
  if(rest.length)h+=`<details class="rb-more"${ui.open?" open":""}><summary>${rest.length} that would not help right now</summary><ol class="rb-list" aria-label="Would not help">${rest.map(row).join("")}</ol></details>`;
  h+=`<p class="okline rk-msg" id="rb-msg" aria-live="polite"></p>`;
  h+=`<p class="prov" style="margin:6px 0 0">Items you don't wear count with Wowhead's gems and your current enchant. The example score weighs each stat with illustrative values, counting hit past the cap at half weight since it only helps white swings. It is <span class="cx-ex">example</span> only: run Simulation for real numbers. Order and notes: <a href="${G.D.source.url}">Wowhead Fury Warrior DPS BiS, Phase 2</a>.</p>`;
  mount.innerHTML=h;
}

mount.addEventListener("change",e=>{if(e.target.id==="rb-list"){ui.list=e.target.value;save();render();const f=mount.querySelector("#rb-list");if(f)f.focus();}});
mount.addEventListener("toggle",e=>{if(e.target.classList&&e.target.classList.contains("rb-more")){ui.open=e.target.open;save();}},true);
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.act==="example"){R.loadExample("ranked-b");render();say("Loaded the part-geared example. The Gear tab shows it too.");return;}
  if(t.dataset.eq){const id=t.dataset.eq,slot=t.dataset.slot,nm=G.item(id).name;R.equip(slot,id,"ranked-b");render();
    say(`${slot}: equipped ${nm}. The list is sorted again against your new gear.`);const f=mount.querySelector("#rb-list");if(f)f.focus();}
});
/* talents and buffs fire gear:change too when they move the hit cap */
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="ranked-b")render();});
render();if(!IN_PLANNER)R.openTab();
})();
