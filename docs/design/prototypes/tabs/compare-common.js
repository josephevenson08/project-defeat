/* compare-common.js — shared logic for the three Compare sub-tab designs (compare-a/b/c.html), over gear-common.js.
   Every design compares against the character the Gear tab holds (the shared "planner" store), and scores each item the
   way the live app does: what you wear counts as worn; an item you don't wear is counted with Wowhead's gem for each
   socket colour and the slot's current enchant. Hit is cap-aware (142 rating for dual-wield specials): rating past the
   cap is wasted. Any single score here is an EXAMPLE with illustrative weights, labelled as such: the prototype has no
   simulator, and the app's real numbers come from its Simulation tab. */
(function(){
"use strict";
const G=window.GearKit;if(!G)return;
const S=G.store("planner");
const ORDER=["Str","Agi","AP","Hit","Crit","Haste","Expertise","ArP","Sta"];
const NAME={Str:"Strength",Agi:"Agility",AP:"Attack Power",Hit:"Hit Rating",Crit:"Crit Rating",Haste:"Haste Rating",Expertise:"Expertise Rating",ArP:"Armor Penetration",Sta:"Stamina"};
/* illustrative weights per point, the prototype's long-standing example values (not the app's simulated weights) */
const XW={Str:2.2,Agi:1.6,AP:1,Hit:2.4,Crit:2.1,Haste:1.6,Expertise:2.5,ArP:.4,Sta:0};
const st=()=>S.get();

/* what an item would look like in a slot: the worn state if it is what you wear, else Wowhead's gems and your enchant */
function sideFor(slot,itemId){
  const cur=st()[slot];
  if(cur&&cur.item===itemId)return G.clone(cur);
  const it=G.item(itemId);if(!it)return {item:null,enchant:null,gems:[]};
  return {item:itemId,enchant:G.enchantable(slot)?(cur&&cur.enchant)||G.bestEnchant(slot):null,gems:it.sockets.map(c=>G.D.gemFor[c]||G.D.gemFor.Red)};
}
/* one slot's contribution (item + enchant + gems + socket bonus when on) */
function slotStats(side){
  const t=Object.fromEntries(ORDER.map(k=>[k,0]));const add=l=>(l||[]).forEach(([k,v])=>{if(k in t)t[k]+=v;});
  const it=G.item(side&&side.item);if(!it)return t;
  add(it.stats);const e=G.enchant(side.enchant);if(e)add(e.stats);
  side.gems.forEach(g=>{const x=G.gem(g);if(x)add(x.stats);});
  if(G.socketBonusOn(side))add(it.bonus);
  return t;
}
/* rows of a vs b, only the stats either side has */
function diff(a,b){return ORDER.filter(k=>a[k]||b[k]).map(k=>({k,name:NAME[k],a:a[k],b:b[k],d:b[k]-a[k]}));}
/* the whole character's hit with this slot holding `side` instead */
function hitWith(slot,side){const all=G.totals(st()).Hit,cur=slotStats(st()[slot]).Hit;return all-cur+slotStats(side).Hit;}
/* example score of swapping `a` for `b` in a slot: weighted stat change, hit only counted up to the cap */
function exampleDelta(slot,a,b){
  const sa=slotStats(a),sb=slotStats(b),cap=G.HIT_CAP;
  const hitA=hitWith(slot,a),hitB=hitWith(slot,b);
  const useful=h=>Math.min(h,cap);
  let s=0;ORDER.forEach(k=>{if(k==="Hit")return;s+=(sb[k]-sa[k])*XW[k];});
  s+=(useful(hitB)-useful(hitA))*XW.Hit;
  return Math.round(s);
}
/* what you can compare in a slot: Wowhead's ranked list, plus what you wear if it is not on it */
function candidates(slot){
  const list=G.listFor(slot),cur=st()[slot];
  if(cur&&cur.item&&!list.some(x=>x.id===cur.item)){const it=G.item(cur.item);if(it)list.push(Object.assign({},it,{rank:null,note:"Not on the list"}));}
  return list;
}
const fmt=n=>(n>0?"+":n<0?"−":"")+Math.abs(n);
/* what a swap does to the hit cap, as a clause that follows "the swap" */
const capNote=(before,after)=>{const cap=G.HIT_CAP;
  if(before>=cap&&after<cap)return {warn:true,text:`drops you ${cap-after} under the hit cap`};
  if(before<cap&&after>=cap)return {warn:false,text:after===cap?"brings you exactly to the hit cap":`takes you ${after-cap} over the hit cap`};
  if(after<cap)return {warn:true,text:`leaves you ${cap-after} under the hit cap`};
  return {warn:false,text:after===cap?"keeps you at the hit cap":`keeps you over the hit cap (${after-cap} rating wasted)`};};
/* equip from Compare: the Gear tab redraws through the shared store */
function equip(slot,itemId,from){const s=G.clone(st());s[slot]=sideFor(slot,itemId);S.set(s,from||"compare");}
/* the slot picker every design shares: one button per slot, showing what you wear there */
function slotStrip(selected){
  return `<div class="cx-slots" role="group" aria-label="Slot to compare">`+G.SLOTS.map(x=>{const it=G.item(st()[x.key]&&st()[x.key].item);
    return `<button type="button" class="cx-slot" data-cslot="${x.key}" aria-pressed="${x.key===selected}" aria-label="${x.key}${it?": "+G.esc(it.name):", empty"}" title="${x.key}${it?": "+G.esc(it.name):""}">`+
      (it?`<img src="${G.iconUrl(it.icon)}" alt="" style="--q:${G.qVar(it.q)}">`:`<span class="g">${x.glyph}</span>`)+`<small>${x.glyph}</small></button>`;}).join("")+`</div>`;
}
/* these pages open on the Compare sub-tab, since that is what they are for */
function openCompareTab(){const t=document.getElementById("t-compare");if(t&&t.getAttribute("aria-selected")!=="true")t.click();}
const st2=document.createElement("style");
st2.textContent=`.cx-slots{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 12px}
.cx-slot{display:grid;justify-items:center;gap:2px;width:46px;padding:3px 0 2px;border-radius:8px;border:1px solid var(--rim-2);background:var(--scrim);color:var(--ink-3);cursor:pointer;font:600 9.5px var(--f-mono)}
.cx-slot img{width:34px;height:34px;border-radius:5px;border:1.5px solid var(--q,var(--rim))}
.cx-slot .g{width:34px;height:34px;display:grid;place-items:center;border:1.5px dashed var(--rim);border-radius:5px}
.cx-slot:hover,.cx-slot:focus-visible{border-color:var(--glow)}
.cx-slot[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 14%,var(--scrim));color:var(--ink)}
.cx-ex{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--warn);border:1px solid rgba(255,207,122,.4);background:var(--warn-soft);border-radius:4px;padding:1px 6px;vertical-align:middle}
.cx-up{color:#7fdc8a}.cx-dn{color:#ff8f86}.cx-eq{color:var(--ink-3)}
@media (max-width:699px),(pointer:coarse){.cx-slot{min-height:48px}}`;
document.head.appendChild(st2);
window.CompareKit={S,ORDER,NAME,XW,sideFor,slotStats,diff,hitWith,exampleDelta,candidates,fmt,capNote,equip,slotStrip,openCompareTab};
})();
