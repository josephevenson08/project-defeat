/* ranked-common.js — shared logic for the three Ranked Gear designs (ranked-a/b/c.html), over gear-common.js and
   compare-common.js. Every design reads the Gear tab's character (the shared "planner" store), so "what you wear" is
   always the real thing, and Equip changes the Gear tab too.
   - the guide's lists: Wowhead's Fury Warrior Phase 2 order, 15 lists over 17 slots (rings and trinkets each share one)
   - what a swap does: the stat rows, the hit before and after against the cap, and Compare's example score
   - where an item comes from: raid and boss (in kill order), world boss, crafted, or elsewhere
   - how an item stands against what you wear: wearing it, ranked above yours, or not
   No Blizzard art beyond the item icons the live app ships. */
(function(){
"use strict";
const G=window.GearKit,C=window.CompareKit;if(!G||!C)return;
const S=C.S,st=()=>S.get();

/* the guide's lists in paperdoll order; a list names every slot it feeds */
const LISTS=[];
G.SLOTS.forEach(s=>{const l=LISTS.find(x=>x.list===s.list);if(l)l.slots.push(s.key);else LISTS.push({list:s.list,slots:[s.key]});});
LISTS.forEach(l=>{l.label=l.slots.length<2?l.list:/^Finger/.test(l.list)?"Rings":"Trinkets";});
const listOf=slot=>LISTS.find(l=>l.slots.includes(slot))||null;
const entries=list=>G.listFor(list.slots[0]);
const total=LISTS.reduce((n,l)=>n+entries(l).length,0);

/* what you wear, and where */
const worn=slot=>(st()[slot]&&st()[slot].item)||null;
const wornIn=(list,itemId)=>list.slots.filter(s=>worn(s)===itemId);
/* a unique item can't go in a slot while the other slot of its pair holds it; returns that slot */
function blockedBy(slot,itemId){
  const it=G.item(itemId),l=listOf(slot);if(!it||!it.unique||!l)return null;
  return l.slots.find(s=>s!==slot&&worn(s)===itemId)||null;
}
/* the rank of what a slot holds on the guide's list (Infinity when empty or not on the list) */
const wornRank=slot=>{const id=worn(slot);return id?(G.rankOf(slot,id)||Infinity):Infinity;};

/* where an item stands for you: "wearing", "above" (ranked above what you wear in the slot it would replace), "below" */
function standing(list,e){
  if(wornIn(list,e.id).length)return "wearing";
  const weakest=Math.max(...list.slots.map(wornRank));
  return e.rank<weakest?"above":"below";
}

/* what a swap does to the character */
function change(slot,itemId){
  const cur=st()[slot],a=cur&&cur.item?cur:{item:null,enchant:null,gems:[]},b=C.sideFor(slot,itemId);
  const rows=C.diff(C.slotStats(a),C.slotStats(b)).filter(r=>r.d);
  const before=C.hitWith(slot,a),after=C.hitWith(slot,b);
  return {slot,itemId,replaces:a.item,rows,before,after,cap:C.capNote(before,after),ex:C.exampleDelta(slot,a,b)};
}
/* for a ring or trinket, the slot it would do most for (skipping one it can't go in) */
function bestSlot(list,itemId){
  const open=list.slots.filter(s=>worn(s)!==itemId&&!blockedBy(s,itemId));
  if(!open.length)return null;
  return open.map(s=>change(s,itemId)).sort((x,y)=>y.ex-x.ex)[0];
}
/* the trade in words, gains first: "+8 Strength, +12 Crit · −8 Hit" */
function tradeHTML(ch){
  const w=r=>`${C.fmt(r.d)} ${r.name.replace(" Rating","")}`;
  const up=ch.rows.filter(r=>r.d>0).sort((x,y)=>y.d-x.d).map(w),dn=ch.rows.filter(r=>r.d<0).sort((x,y)=>x.d-y.d).map(w);
  if(!up.length&&!dn.length)return `<span class="cx-eq">No stat changes</span>`;
  return [up.length?`<span class="cx-up">${up.join(", ")}</span>`:"",dn.length?`<span class="cx-dn">${dn.join(", ")}</span>`:""].filter(Boolean).join(" · ");
}

/* an item as the guide fits it out: the slot's best enchant and Wowhead's gem for each socket colour (what you wear is
   shown as you wear it) */
function guideSide(slot,itemId){
  if(worn(slot)===itemId)return G.clone(st()[slot]);
  const it=G.item(itemId);if(!it)return {item:null,enchant:null,gems:[]};
  return {item:itemId,enchant:G.bestEnchant(slot),gems:it.sockets.map(c=>G.D.gemFor[c]||G.D.gemFor.Red)};
}

/* the slot picker: your 17 slots, each showing what you wear */
function strip(selected){
  return `<div class="rk-slots" role="group" aria-label="Slot">`+G.SLOTS.map(x=>{const it=G.item(worn(x.key));
    return `<button type="button" class="rk-slot" data-rslot="${x.key}" aria-pressed="${x.key===selected}" aria-label="${x.key}${it?": "+G.esc(it.name):", empty"}" title="${x.key}${it?": "+G.esc(it.name):""}">`+
      (it?`<img src="${G.iconUrl(it.icon)}" alt="" style="--q:${G.qVar(it.q)}">`:`<span class="g">${x.glyph}</span>`)+`<small>${x.glyph}</small></button>`;}).join("")+`</div>`;
}

/* where an item comes from, for grouping */
const CRAFT=/smithing|Engineering|Tailoring|Leatherworking|Jewelcrafting|Alchemy/i;
function where(it){
  const s=it.src||{},t=s.text||"Unknown source";
  if(s.raid)return {kind:"raid",raid:s.raid,boss:s.boss||null,order:s.order||99,token:!!s.token,text:t};
  if(/world boss/i.test(t))return {kind:"world",text:t};
  if(CRAFT.test(t))return {kind:"craft",text:t};
  return {kind:"other",text:t};
}
/* the raids in the order a Phase 2 raider meets them: this tier first, then last tier's */
const RAID_ORDER=["Serpentshrine Cavern","Tempest Keep","Karazhan","Gruul's Lair","Magtheridon's Lair"];
const PHASE1=new Set(["Karazhan","Gruul's Lair","Magtheridon's Lair"]);

/* one entry per item: every list it is ranked on, where it stands for you overall, where Equip would put it, and where
   it comes from (an item ranked for two slots, like a one-hander for either hand, is one entry naming both) */
function byItem(){
  const by=new Map();
  LISTS.forEach(l=>entries(l).forEach(e=>{
    const x=by.get(e.id)||{id:e.id,it:G.item(e.id),on:[]};
    x.on.push({l,rank:e.rank,note:e.note,size:entries(l).length,standing:standing(l,e)});by.set(e.id,x);
  }));
  return [...by.values()].map(x=>{
    const s=x.on.map(o=>o.standing);
    x.standing=s.includes("wearing")?"wearing":s.includes("above")?"above":"below";
    /* Equip goes to the slot it would do most for, on the first list it ranks above what you wear */
    const up=x.on.find(o=>o.standing==="above");
    x.target=up?(up.l.slots.length>1?(bestSlot(up.l,x.id)||{}).slot:up.l.slots[0]):null;
    x.where=where(x.it);return x;
  });
}
const upgradesLeft=()=>byItem().filter(x=>x.standing==="above").length;

/* equip through the shared character; the Gear tab and Compare redraw from gear:change */
const equip=(slot,itemId,from)=>C.equip(slot,itemId,from||"ranked");
/* the Gear tab's part-geared example, so a fully geared character can see the lists do their job */
const loadExample=from=>S.set(G.partGeared(),from||"ranked");
const fullyRanked=()=>G.SLOTS.every(s=>G.status(s.key,st()).best);

/* outside the planner these pages open on the Ranked Gear sub-tab, since that is what they are for */
function openTab(){const t=document.getElementById("t-ranked");if(t&&t.getAttribute("aria-selected")!=="true")t.click();}

/* a small icon with its quality border */
const icon=(it,size)=>it?`<img class="rk-ic" src="${G.iconUrl(it.icon)}" alt="" width="${size||34}" height="${size||34}" style="--q:${G.qVar(it.q)}">`:"";
const name=it=>`<b class="rk-nm" style="color:${G.qVar(it.q)}">${G.esc(it.name)}</b>`;

const css=document.createElement("style");
css.textContent=`
.rk-ic{border-radius:6px;border:1.5px solid var(--q,var(--rim));background:#05080b;flex:none}
.rk-nm{font-weight:700}
.rk-rank{display:inline-grid;place-items:center;min-width:28px;height:28px;padding:0 6px;border-radius:999px;font:400 var(--t-md)/1 var(--f-head);color:var(--glow);border:1px solid var(--rim);background:var(--glow-soft)}
.rk-note{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-2);border:1px solid var(--rim-2);border-radius:4px;padding:1px 6px;vertical-align:middle}
.rk-note.best{color:var(--glow);border-color:var(--rim)}
.rk-tag{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.08em;border-radius:4px;padding:1px 6px;vertical-align:middle}
.rk-tag.wear{color:var(--glow-ink);background:var(--glow)}
.rk-tag.up{color:#7fdc8a;border:1px solid rgba(127,220,138,.45)}
.rk-tag.tok{color:#ffd100;border:1px solid rgba(255,209,0,.4)}
.rk-src{color:var(--ink-3);font-size:var(--t-xs)}
.rk-eq{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer;min-height:32px;white-space:nowrap}
.rk-eq:hover,.rk-eq:focus-visible{border-color:var(--glow);color:var(--glow)}
.rk-eq:disabled{opacity:.55;cursor:default;color:var(--ink-3);border-color:var(--rim-2)}
.rk-msg{min-height:1.3em}
.rk-slots{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 12px}
.rk-slot{display:grid;justify-items:center;gap:2px;width:46px;padding:3px 0 2px;border-radius:8px;border:1px solid var(--rim-2);background:var(--scrim);color:var(--ink-3);cursor:pointer;font:600 9.5px var(--f-mono)}
.rk-slot img{width:34px;height:34px;border-radius:5px;border:1.5px solid var(--q,var(--rim))}
.rk-slot .g{width:34px;height:34px;display:grid;place-items:center;border:1.5px dashed var(--rim);border-radius:5px}
.rk-slot:hover,.rk-slot:focus-visible{border-color:var(--glow)}
.rk-slot[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 14%,var(--scrim));color:var(--ink)}
@media (max-width:699px),(pointer:coarse){.rk-eq{min-height:44px;padding:8px 14px}.rk-slot{min-height:48px}}`;
document.head.appendChild(css);

window.RankedKit={G,C,S,LISTS,listOf,entries,total,worn,wornIn,blockedBy,wornRank,standing,change,bestSlot,tradeHTML,guideSide,
  strip,where,RAID_ORDER,PHASE1,byItem,upgradesLeft,equip,loadExample,fullyRanked,openTab,icon,name};
})();
