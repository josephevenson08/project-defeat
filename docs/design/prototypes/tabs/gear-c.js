/* gear-c.js — Gear design C, "Upgrade checklist": the Gear tab as a to-do list. A summary of what is done, then every
   slot marked best in slot, upgrade available (and where it drops), missing enchant, empty socket or socket bonus off,
   each problem with a one-press fix. "Where it drops" regroups the same upgrades by raid and boss, to plan raid nights.
   Any row opens in place to swap the item, enchant or gems: a checklist reads top to bottom, so here the row grows. */
(function(){
"use strict";
const G=window.GearKit;if(!G)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const mount=document.getElementById("gearui-c")||document.getElementById("gearui");if(!mount)return;
const EMBED=mount.id==="gearui-c"; /* inside the Character Planner: the page owns the preset buttons and the message line */
const KIT=()=>window.TBCKit||null;
const moving=()=>document.documentElement.classList.contains("motion")&&!matchMedia("(prefers-reduced-motion: reduce)").matches;
const S=G.store("c");
let view="slot",todoOnly=false,open=null;

const css=document.createElement("style");
css.textContent=`
.gx-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px}
.gc-sum{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:0 0 12px}
.gc-tile{display:grid;gap:2px;text-align:left;font:inherit;color:var(--ink);background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:9px 12px}
.gc-tile b{font:500 var(--t-xl)/1.05 var(--f-mono)}.gc-tile b small{font-size:var(--t-sm);color:var(--ink-3)}
.gc-tile span{font-size:var(--t-xs);color:var(--ink-2)}
.gc-tile.ok{border-color:rgba(127,220,138,.45)}.gc-tile.ok b{color:#7fdc8a}
.gc-tile.todo{border-color:rgba(255,207,122,.45)}.gc-tile.todo b{color:var(--warn)}
.gc-ctrl{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;margin:0 0 10px}
.gc-ctrl .lab{font-size:var(--t-xs);color:var(--ink-3);margin-right:6px}
.gc-seg{display:inline-flex;border:1px solid var(--rim);border-radius:999px;overflow:hidden;background:var(--glass-2)}
.gc-seg button{font:600 var(--t-sm) var(--f-body);background:none;border:0;color:var(--ink-2);padding:7px 14px;cursor:pointer;min-height:36px}
.gc-seg button[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink)}
.gc-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.gc-row{border:1px solid var(--rim-2);border-radius:11px;background:var(--scrim);overflow:hidden}
.gc-row.todo{border-left:3px solid var(--warn)}.gc-row.done{border-left:3px solid #7fdc8a}
.gc-main{display:grid;grid-template-columns:22px 40px minmax(0,1.1fr) minmax(0,1.6fr) auto;gap:10px;align-items:center;padding:7px 10px}
.gc-state{font:700 13px var(--f-mono);text-align:center}.gc-row.done .gc-state{color:#7fdc8a}.gc-row.todo .gc-state{color:var(--warn)}
.gc-ico{width:40px;height:40px;border-radius:6px;border:2px solid var(--q,var(--rim));display:grid;place-items:center;overflow:hidden;background:#0a1418;font:600 10px var(--f-mono);color:var(--ink-3)}
.gc-ico img{width:100%;height:100%;display:block}
.gc-item{min-width:0;display:grid;gap:1px}
.gc-slot{font:500 10px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3)}
.gc-item b{font-size:var(--t-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gc-item small{font-size:var(--t-xs);color:var(--ink-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gc-flags{display:flex;flex-wrap:wrap;gap:5px;min-width:0}
.gc-flag{display:inline-flex;align-items:center;gap:5px;font:600 var(--t-xs) var(--f-body);border-radius:999px;padding:3px 10px;border:1px solid var(--rim-2);color:var(--ink-2);background:rgba(0,0,0,.25);min-height:28px}
.gc-flag.ok{color:#7fdc8a;border-color:rgba(127,220,138,.35)}
.gc-flag.up{color:#bcd9ff;border-color:rgba(90,176,255,.45)}
.gc-flag.warn{color:var(--warn);border-color:rgba(255,207,122,.45)}
button.gc-flag{cursor:pointer;font:inherit;font-size:var(--t-xs);font-weight:600}
button.gc-flag:hover,button.gc-flag:focus-visible{background:rgba(255,207,122,.12)}
button.gc-flag.up:hover,button.gc-flag.up:focus-visible{background:rgba(90,176,255,.14)}
.gc-flag .act{font-weight:700;text-decoration:underline;text-underline-offset:2px}
.gc-flag img{width:16px;height:16px;border-radius:3px}
.gc-open{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:999px;padding:5px 12px;cursor:pointer;min-height:32px;white-space:nowrap}
.gc-open[aria-expanded="true"]{background:var(--glow);color:var(--glow-ink);border-color:var(--glow)}
.gc-drawer{border-top:1px dashed var(--rim-2);padding:8px 12px 12px 42px;display:grid;gap:8px;background:rgba(0,0,0,.2)}
.gc-drawer h4{margin:0;font:600 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.gc-picks{display:flex;flex-wrap:wrap;gap:6px}
.gc-pick{display:inline-flex;align-items:center;gap:7px;font:600 var(--t-xs) var(--f-body);color:var(--ink);background:var(--glass-2);border:1px solid var(--rim-2);border-radius:9px;padding:4px 10px 4px 4px;cursor:pointer;min-height:40px;max-width:100%}
.gc-pick img{width:30px;height:30px;border-radius:5px;border:1.5px solid var(--q,var(--rim))}
.gc-pick small{display:block;font-weight:400;color:var(--ink-3)}
.gc-pick[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 14%,var(--glass-2))}
.gc-pick:disabled{opacity:.45;cursor:not-allowed}
.gc-chip{display:inline-flex;align-items:center;gap:5px;font:600 var(--t-xs) var(--f-body);color:var(--ink);background:var(--glass-2);border:1px solid var(--rim);border-radius:999px;padding:4px 10px;cursor:pointer;min-height:32px}
.gc-chip img{width:16px;height:16px;border-radius:3px}
.gc-chip[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink);border-color:var(--glow)}
.gc-src{display:grid;gap:14px}
.gc-raid h3{margin:0 0 6px;font:400 var(--t-lg) var(--f-head);display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.gc-raid h3 small{font:500 var(--t-xs) var(--f-body);color:var(--ink-3)}
.gc-boss{display:grid;gap:5px;margin:0 0 8px}
.gc-boss h4{margin:0;font:600 var(--t-xs) var(--f-body);color:var(--ink-2)}
.gc-loot{display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;background:var(--scrim);border:1px solid var(--rim-2);border-radius:9px;padding:5px 10px 5px 5px}
.gc-loot img{width:36px;height:36px;border-radius:5px;border:1.5px solid var(--q,var(--rim))}
.gc-loot b{display:block;font-size:var(--t-sm)}.gc-loot small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.gc-loot.have{opacity:.7}.gc-loot .tag{font:600 var(--t-xs) var(--f-body);color:#7fdc8a}
.gc-allgood{border:1px dashed rgba(127,220,138,.5);border-radius:12px;padding:14px;color:#7fdc8a;text-align:center}
@media (max-width:759px){.gc-main{grid-template-columns:18px 40px minmax(0,1fr) auto;grid-template-areas:"s i t o" "f f f f"}
  .gc-main .gc-state{grid-area:s}.gc-main .gc-ico{grid-area:i}.gc-main .gc-item{grid-area:t}.gc-main .gc-flags{grid-area:f}.gc-main .gc-open{grid-area:o}
  .gc-drawer{padding-left:12px}}
@media (max-width:699px),(pointer:coarse){.gc-flag,button.gc-flag,.gc-open,.gc-chip,.gc-pick,.gc-seg button,.gx-tools .btn{min-height:44px}}
`;
document.head.appendChild(css);

const TOOLS=EMBED?"":`<div class="gx-tools">
  <button class="btn magnet" type="button" id="gx-rec">Equip the recommended set</button>
  <button class="btn ghost" type="button" id="gx-part">Load a part-geared example</button>
  <button class="btn ghost" type="button" id="gx-empty">Empty every slot</button>
  <button class="btn ghost" type="button" id="gx-import">Import your character</button>
</div>
<p class="okline" id="gx-msg" aria-live="polite"></p>
`;
mount.innerHTML=TOOLS+`<div class="gc-sum" id="gc-sum" aria-label="Where this gear stands"></div>
<div class="gc-ctrl">
  <span><span class="lab">Show</span><span class="gc-seg" role="group" aria-label="Show"><button type="button" data-show="all" aria-pressed="true">Every slot</button><button type="button" data-show="todo" aria-pressed="false">Only what's left</button></span></span>
  <span><span class="lab">Group by</span><span class="gc-seg" role="group" aria-label="Group by"><button type="button" data-view="slot" aria-pressed="true">Slot</button><button type="button" data-view="src" aria-pressed="false">Where it drops</button></span></span>
</div>
<div id="gc-body"></div>
<p class="prov" style="margin:10px 0 0">"Best" means rank 1 on Wowhead's Fury Warrior Phase 2 list for that slot (the second ring and trinket: the best one the first leaves free). Bosses from the app's raid loot tables; T5 pieces from their tokens.</p>`;

const say=t=>{const m=$("#gx-msg");if(m)m.textContent=t;};
const st=()=>S.get();
const all=()=>G.SLOTS.map(x=>({key:x.key,slot:x,s:st()[x.key],st:G.status(x.key,st())}));
const todo=r=>r.st.empty||!r.st.best||r.st.noEnchant||r.st.emptySockets||r.st.bonusOff;

function summary(){
  const rows=all(),t=G.totals(st());
  const best=rows.filter(r=>r.st.best).length;
  const ench=rows.filter(r=>G.enchantable(r.key)&&!r.st.empty),enchOk=ench.filter(r=>!r.st.noEnchant).length;
  const sockets=rows.reduce((a,r)=>{const it=G.item(r.s.item);return a+(it?it.sockets.length:0);},0),emptyS=rows.reduce((a,r)=>a+(r.st.emptySockets||0),0);
  const withB=rows.filter(r=>{const it=G.item(r.s.item);return it&&it.bonus.length;}),bOn=withB.filter(r=>G.socketBonusOn(r.s)).length;
  const left=rows.filter(todo).length,cap=G.HIT_CAP;
  const tile=(ok,big,of,lab)=>`<div class="gc-tile ${ok?"ok":"todo"}"><b>${big}<small> / ${of}</small></b><span>${lab}</span></div>`;
  $("#gc-sum").innerHTML=tile(best===17,best,17,"slots best on the list")+tile(enchOk===ench.length,enchOk,ench.length,"enchants on")+
    tile(!emptyS,sockets-emptyS,sockets,"sockets filled")+tile(bOn===withB.length,bOn,withB.length,"socket bonuses on")+
    tile(t.Hit>=cap,t.Hit,cap,t.Hit===cap?"hit rating, at the cap":t.Hit>cap?`hit rating, ${t.Hit-cap} over the cap`:`hit rating, ${cap-t.Hit} under the cap`);
  const b=$('.gc-seg [data-show="todo"]');if(b)b.textContent=`Only what's left (${left})`;
}
function flagsHTML(r){
  const f=[];const k=r.key;
  if(r.st.empty){const up=r.st.upgrade;f.push(`<button type="button" class="gc-flag up" data-fix="equip" data-slot="${k}" data-id="${up.id}"><img src="${G.iconUrl(up.icon)}" alt="">Empty · <span class="act">equip ${G.esc(up.name)}</span></button>`);return f.join("");}
  if(r.st.best)f.push(`<span class="gc-flag ok">✓ Best in slot</span>`);
  else{const up=r.st.upgrade;f.push(`<button type="button" class="gc-flag up" data-fix="equip" data-slot="${k}" data-id="${up.id}" title="Equip it once you have it"><img src="${G.iconUrl(up.icon)}" alt="">↑ ${G.esc(up.name)} · ${G.esc(up.src.boss?up.src.boss:up.src.text)}</button>`);}
  if(r.st.noEnchant){const e=G.enchant(G.bestEnchant(k));f.push(`<button type="button" class="gc-flag warn" data-fix="ench" data-slot="${k}">No enchant · <span class="act">add ${G.esc(e?e.name:"one")}</span></button>`);}
  if(r.st.emptySockets)f.push(`<button type="button" class="gc-flag warn" data-fix="gems" data-slot="${k}">${r.st.emptySockets} empty socket${r.st.emptySockets>1?"s":""} · <span class="act">fill</span></button>`);
  if(r.st.bonusOff)f.push(`<button type="button" class="gc-flag warn" data-fix="gems" data-slot="${k}">Socket bonus off · <span class="act">match gems</span></button>`);
  return f.join("");
}
function drawerHTML(k){
  const s=st()[k],it=G.item(s&&s.item);
  const otherKey=/[12]$/.test(k)?k.replace(/[12]$/,m=>m==="1"?"2":"1"):null,other=otherKey?st()[otherKey]:null;
  let h=`<h4>Item · Wowhead's ranking</h4><div class="gc-picks">`+G.listFor(k).map(c=>{const taken=other&&other.item===c.id&&c.unique;
    return `<button type="button" class="gc-pick" data-pick="${c.id}" data-slot="${k}" aria-pressed="${!!it&&it.id===c.id}" ${taken?"disabled":""} style="--q:${G.qVar(c.q)}"><img src="${G.iconUrl(c.icon)}" alt=""><span><span style="color:${G.qVar(c.q)}">${c.rank}. ${G.esc(c.name)}</span><small>${c.ilvl} · ${G.esc(c.src.text)}${taken?` · in ${otherKey}`:""}</small></span></button>`;}).join("")+
    (it?`<button type="button" class="gc-chip" data-unequip="${k}">Remove</button>`:"")+`</div>`;
  if(it&&G.enchantable(k)){const best=G.bestEnchant(k);h+=`<h4>Enchant</h4><div class="gc-picks">`+G.enchantOptions(k).map(e=>`<button type="button" class="gc-chip" data-ench="${e.id}" data-slot="${k}" aria-pressed="${s.enchant===e.id}">${e.id===best?"★ ":""}${G.esc(e.name)}</button>`).join("")+`<button type="button" class="gc-chip" data-ench="" data-slot="${k}" aria-pressed="${!s.enchant}">None</button></div>`;}
  if(it&&it.sockets.length)it.sockets.forEach((c,i)=>{h+=`<h4>${c} socket</h4><div class="gc-picks">`+G.gemOptions(c).map(g=>`<button type="button" class="gc-chip${G.gemMatches(c,g)?"":" nm"}" data-gem="${i}" data-id="${g.id}" data-slot="${k}" aria-pressed="${s.gems[i]===g.id}" title="${G.esc(g.name)}"><img src="${G.iconUrl(g.icon)}" alt="">${G.esc(g.stats.map(([a,v])=>`+${v} ${a}`).join(" "))}${G.D.gemFor[c]===g.id?" ★":""}</button>`).join("")+`<button type="button" class="gc-chip" data-gem="${i}" data-id="" data-slot="${k}" aria-pressed="${!s.gems[i]}">Empty</button></div>`;});
  return h+`<p class="prov" style="margin:0">★ = Wowhead's pick.</p>`;
}
function bySlot(){
  const rows=all().filter(r=>!todoOnly||todo(r));
  if(!rows.length)return `<div class="gc-allgood">Nothing left to do: every slot is best on the list, enchanted and fully gemmed.</div>`;
  return `<ol class="gc-list">`+rows.map(r=>{
    const it=G.item(r.s.item),d=todo(r);
    return `<li class="gc-row ${d?"todo":"done"}" data-row="${r.key}"><div class="gc-main">
      <span class="gc-state" aria-label="${d?"To do":"Done"}">${d?"!":"✓"}</span>
      ${it?`<span class="gc-ico" style="--q:${G.qVar(it.q)}"><img src="${G.iconUrl(it.icon)}" alt="" loading="lazy"></span>`:`<span class="gc-ico">${r.slot.glyph}</span>`}
      <span class="gc-item"><span class="gc-slot">${r.key}</span>${it?`<b style="color:${G.qVar(it.q)}">${G.esc(it.name)}</b><small>${r.st.rank?`Rank ${r.st.rank} of ${r.st.size}`:"Not on the list"} · ${G.esc(it.src.text)}</small>`:`<b style="color:var(--ink-3)">Empty</b><small>Nothing equipped</small>`}</span>
      <span class="gc-flags">${flagsHTML(r)}</span>
      <button type="button" class="gc-open" data-open="${r.key}" aria-expanded="${open===r.key}" aria-controls="gc-d-${r.slot.glyph}">Change</button>
    </div>${open===r.key?`<div class="gc-drawer" id="gc-d-${r.slot.glyph}">${drawerHTML(r.key)}</div>`:""}</li>`;}).join("")+`</ol>`;
}
/* where it drops: each slot's target (its upgrade, or what it already holds when that is best), grouped by raid and boss */
const OTHER=[[/token/i,"Raids"],[/World boss/i,"World bosses"],[/Blacksmith|Engineering|Tailoring|Leatherwork|Jewelcraft/i,"Crafted"],[/Vendor|Badge/i,"Badges of Justice"],[/PvP/i,"PvP"],[/Quest/i,"Quests"],[/Heroic|Slave Pens|Hellfire|Ahn'Qiraj/i,"Dungeons and older raids"],[/./,"Trash and other drops"]];
const RAIDORDER=["Serpentshrine Cavern","Tempest Keep","Karazhan","Gruul's Lair","Magtheridon's Lair"];
function bySource(){
  const groups={};
  all().forEach(r=>{
    const target=r.st.empty||!r.st.best?r.st.upgrade:G.item(r.s.item);if(!target)return;
    const have=!r.st.empty&&r.st.best;
    if(todoOnly&&have)return;
    const raid=target.src.raid&&RAIDORDER.includes(target.src.raid)?target.src.raid:OTHER.find(([re])=>re.test(target.src.text))[1];
    const boss=target.src.boss||(raid===target.src.raid?"Trash and other drops":target.src.text);
    ((groups[raid]=groups[raid]||{})[boss]=groups[raid][boss]||[]).push({r,target,have,order:target.src.order||99});
  });
  const keys=Object.keys(groups).sort((a,b)=>(RAIDORDER.indexOf(a)+1||99)-(RAIDORDER.indexOf(b)+1||99));
  if(!keys.length)return `<div class="gc-allgood">Nothing left to farm: every slot is best on the list.</div>`;
  return `<div class="gc-src">`+keys.map(raid=>{
    const bosses=groups[raid],n=Object.values(bosses).flat().filter(x=>!x.have).length;
    return `<section class="gc-raid" aria-label="${G.esc(raid)}"><h3>${G.esc(raid)} <small>${n?`${n} upgrade${n>1?"s":""} still to get`:"everything here is equipped"}</small></h3>`+
      Object.entries(bosses).sort((a,b)=>a[1][0].order-b[1][0].order).map(([boss,list])=>`<div class="gc-boss"><h4>${G.esc(boss)}</h4>`+list.map(({r,target,have})=>
        `<div class="gc-loot${have?" have":""}" style="--q:${G.qVar(target.q)}"><img src="${G.iconUrl(target.icon)}" alt=""><span><b style="color:${G.qVar(target.q)}">${G.esc(target.name)}</b><small>${r.key}${have?"":r.st.empty?" · slot is empty":` · replaces ${G.esc(G.item(r.s.item).name)} (rank ${r.st.rank})`}</small></span>`+
        (have?`<span class="tag">✓ equipped</span>`:`<button type="button" class="gc-chip" data-fix="equip" data-slot="${r.key}" data-id="${target.id}">Got it · equip</button>`)+`</div>`).join("")+`</div>`).join("")+`</section>`;}).join("")+`</div>`;
}
function render(){
  summary();
  $("#gc-body").innerHTML=view==="slot"?bySlot():bySource();
  $$(".gc-seg [data-view]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.view===view));
  $$(".gc-seg [data-show]").forEach(b=>b.setAttribute("aria-pressed",(b.dataset.show==="todo")===todoOnly));
  G.updateHit(st());
}
function commit(next,msg,focusSel){
  S.set(next,"c");render();if(msg)say(msg);
  if(focusSel){const f=$(focusSel);if(f)f.focus();}
}
const fillGems=(s,k)=>{const it=G.item(s[k].item);if(it)s[k].gems=it.sockets.map((c,i)=>G.gemMatches(c,G.gem(s[k].gems[i]))?s[k].gems[i]:(G.D.gemFor[c]||G.D.gemFor.Red));};
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t||!mount.contains(t))return;
  const s=G.clone(st());
  if(t.id==="gx-rec"){open=null;commit(G.recommended(),"Equipped the recommended set: Wowhead's rank 1 in every slot (the second ring and trinket take rank 2), with its enchants and gems.");const K=KIT();if(K)K.swell();return;}
  if(t.id==="gx-part"){open=null;commit(G.partGeared(),"Loaded a part-geared example: five slots on lower-ranked items, the gloves unenchanted, one empty socket and one mismatched gem.");return;}
  if(t.id==="gx-empty"){open=null;commit(G.empty(),"Emptied every slot.");return;}
  if(t.id==="gx-import"){const b=document.getElementById("t-build");if(b)b.click();return;}
  if(t.dataset.view){view=t.dataset.view;open=null;render();t.focus();return;}
  if(t.dataset.show){todoOnly=t.dataset.show==="todo";render();t.focus();return;}
  if(t.dataset.open){const k=t.dataset.open;open=open===k?null:k;render();const b=$(`[data-open="${k}"]`);if(b)b.focus();
    if(open&&moving()){const d=$("#gc-d-"+G.SLOT[k].glyph);const K=KIT();if(d&&K)K.enter(d);}return;}
  const k=t.dataset.slot;
  if(t.dataset.fix==="equip"&&k){const it=G.item(t.dataset.id);
    s[k]={item:it.id,enchant:G.enchantable(k)?(s[k].enchant||G.bestEnchant(k)):null,gems:it.sockets.map(c=>G.D.gemFor[c]||G.D.gemFor.Red)};
    commit(s,`${k}: equipped ${it.name}.`,view==="slot"?`[data-open="${k}"]`:null);
    if(moving()){const row=$(`[data-row="${k}"]`);if(row)row.animate([{boxShadow:"0 0 0 2px #7fdc8a,0 0 24px -4px #7fdc8a"},{boxShadow:"none"}],{duration:900,easing:"ease-out"});}
    return;}
  if(t.dataset.fix==="ench"&&k){s[k].enchant=G.bestEnchant(k);commit(s,`${k}: enchanted with ${(G.enchant(s[k].enchant)||{}).name}.`,`[data-open="${k}"]`);return;}
  if(t.dataset.fix==="gems"&&k){fillGems(s,k);commit(s,`${k}: sockets filled with Wowhead's gems for their colours; the socket bonus is on.`,`[data-open="${k}"]`);return;}
  if(t.dataset.pick&&k){const it=G.item(t.dataset.pick);
    s[k]={item:it.id,enchant:G.enchantable(k)?(s[k].enchant||G.bestEnchant(k)):null,gems:it.sockets.map(c=>G.D.gemFor[c]||G.D.gemFor.Red)};
    commit(s,`${k}: equipped ${it.name}.`,`[data-pick="${it.id}"][data-slot="${k}"]`);return;}
  if(t.dataset.unequip){const u=t.dataset.unequip;s[u]={item:null,enchant:null,gems:[]};commit(s,`${u}: removed the item.`,`[data-open="${u}"]`);return;}
  if(t.dataset.ench!==undefined&&k){s[k].enchant=t.dataset.ench||null;commit(s,`${k}: ${s[k].enchant?"enchanted with "+G.enchant(s[k].enchant).name:"enchant removed"}.`,`[data-ench="${t.dataset.ench}"][data-slot="${k}"]`);return;}
  if(t.dataset.gem!==undefined&&k){const i=+t.dataset.gem;s[k].gems[i]=t.dataset.id||null;const g=G.gem(s[k].gems[i]);commit(s,`${k}: ${g?g.name+" in":"emptied"} socket ${i+1}.`,`[data-gem="${i}"][data-id="${t.dataset.id}"][data-slot="${k}"]`);return;}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&open){const k=open;open=null;render();const b=$(`[data-open="${k}"]`);if(b)b.focus();}});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="c")render();});
/* the planner's view switch (and the sheet's count links) can ask for "only what's left" */
document.addEventListener("gear:view",e=>{const d=e.detail||{};if(d.view!=="list")return;if(typeof d.todo==="boolean"){todoOnly=d.todo;view="slot";}open=null;render();});
render();
})();
