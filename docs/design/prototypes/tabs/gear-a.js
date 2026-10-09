/* gear-a.js — Gear design A, "List and side pane": the live app's model, polished. Two columns of slots; clicking one
   opens a pane beside the list (below it on a phone) with that slot's ranked items to click, its enchants and its
   gems. Nothing edits in the list itself, so it keeps its shape; the row updating is the confirmation. */
(function(){
"use strict";
const G=window.GearKit;if(!G)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const mount=document.getElementById("gearui");if(!mount)return;
const KIT=()=>window.TBCKit||null;
const moving=()=>document.documentElement.classList.contains("motion")&&!matchMedia("(prefers-reduced-motion: reduce)").matches;
const S=G.store("a");
let open=null;

const css=document.createElement("style");
css.textContent=`
.gx-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px}
.gx-set{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:0 0 10px;font-size:var(--t-sm)}
.gx-set .pip{width:10px;height:10px;border:1.5px solid var(--q-epic);border-radius:2px}
.gx-set .pip.on{background:var(--q-epic);box-shadow:0 0 8px var(--q-epic)}
.ga-wrap{display:grid;gap:12px;grid-template-columns:1fr}
.ga-list{list-style:none;margin:0;padding:0;display:grid;gap:6px;grid-template-columns:1fr}
@media (min-width:900px){.ga-wrap:not(.open) .ga-list{grid-template-columns:1fr 1fr;grid-auto-flow:column;grid-template-rows:repeat(9,auto)}
  .ga-wrap.open{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:start}}
.ga-row{width:100%;display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;font:inherit;color:var(--ink);
  background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:6px 10px 6px 6px;cursor:pointer;min-height:54px}
.ga-row:hover,.ga-row:focus-visible{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 8%,var(--scrim))}
.ga-row[aria-expanded="true"]{border-color:var(--glow);box-shadow:0 0 0 1px var(--glow),0 0 18px -6px var(--glow)}
.ga-ico{position:relative;width:42px;height:42px;border-radius:6px;border:2px solid var(--q,var(--rim));background:#0a1418;overflow:hidden;display:grid;place-items:center;font:600 11px var(--f-mono);color:var(--ink-3)}
.ga-ico img{width:100%;height:100%;display:block}
.ga-ico .lv{position:absolute;right:0;bottom:0;font:600 9.5px/1 var(--f-mono);background:rgba(0,0,0,.78);color:#fff;padding:2px 3px;border-top-left-radius:4px}
.ga-txt{min-width:0;display:grid;gap:1px}
.ga-slot{font:500 10px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--ink-3)}
.ga-name{font-weight:700;font-size:var(--t-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ga-ench{font-size:var(--t-xs);color:#7fdc8a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ga-ench.miss{color:var(--warn)}.ga-ench.na{color:var(--ink-3)}
.ga-side{display:grid;justify-items:end;gap:4px}
.ga-gems{display:flex;gap:3px}
.ga-rank{font:600 10px var(--f-mono);padding:1px 6px;border-radius:999px;border:1px solid var(--rim);color:var(--ink-2)}
.ga-rank.best{color:var(--glow-ink);background:var(--glow);border-color:var(--glow)}
.ga-row.empty .ga-name{color:var(--ink-3);font-weight:600}
.ga-pane{background:rgba(4,10,24,.86);border:1px solid var(--rim);border-radius:12px;padding:12px 14px 14px;position:relative}
@media (min-width:900px){.ga-pane{position:sticky;top:70px;max-height:calc(100vh - 90px);overflow:auto}}
.ga-ph{display:flex;gap:12px;align-items:center;margin:0 0 10px;padding-right:44px}
.ga-ph .ga-ico{width:52px;height:52px}
.ga-ph h3{margin:0;font:400 var(--t-lg)/1.15 var(--f-head)}
.ga-x{position:absolute;top:8px;right:8px;width:40px;height:40px;border-radius:8px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink);font-size:20px;cursor:pointer}
.ga-pane h4{margin:12px 0 6px;font:600 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.ga-prompt{font-size:var(--t-sm);color:var(--ink-2);margin:0}
.ga-choices{list-style:none;margin:0;padding:0;display:grid;gap:5px}
.ga-choice{width:100%;display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;font:inherit;color:var(--ink);
  background:var(--scrim);border:1px solid var(--rim-2);border-radius:9px;padding:5px 8px 5px 5px;cursor:pointer;min-height:48px}
.ga-choice:hover,.ga-choice:focus-visible{border-color:var(--glow)}
.ga-choice[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 12%,var(--scrim))}
.ga-choice:disabled{opacity:.5;cursor:not-allowed}
.ga-choice img{width:36px;height:36px;border-radius:5px;border:1.5px solid var(--q,var(--rim))}
.ga-choice b{display:block;font-size:var(--t-sm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ga-choice small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.ga-delta{font:500 10.5px var(--f-mono);text-align:right;display:grid;gap:1px}
.ga-delta .up{color:#7fdc8a}.ga-delta .dn{color:#ff8f86}.ga-delta .eq{color:var(--ink-3)}
.ga-chips{display:flex;flex-wrap:wrap;gap:5px}
.ga-chip{display:inline-flex;align-items:center;gap:6px;font:600 var(--t-xs) var(--f-body);color:var(--ink);background:var(--glass-2);border:1px solid var(--rim);border-radius:999px;padding:5px 11px;cursor:pointer;min-height:34px}
.ga-chip img{width:18px;height:18px;border-radius:3px}
.ga-chip[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink);border-color:var(--glow)}
.ga-chip .rec{font:600 9px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;opacity:.8}
.ga-sock{display:grid;gap:5px;margin:0 0 8px}
.ga-sock>span{font-size:var(--t-xs);color:var(--ink-2)}
.ga-bonus{font-size:var(--t-xs);margin:2px 0 0}.ga-bonus.on{color:#7fdc8a}.ga-bonus.off{color:var(--ink-3)}
.ga-empty{border:1px dashed var(--rim);border-radius:12px;padding:14px;text-align:center;color:var(--ink-2);display:grid;gap:8px;justify-items:center}
@media (max-width:699px),(pointer:coarse){.ga-chip{min-height:44px}.gx-tools .btn{min-height:44px}.ga-x{width:44px;height:44px}}
`;
document.head.appendChild(css);

mount.innerHTML=`
<div class="gx-tools">
  <button class="btn magnet" type="button" id="gx-rec">Equip the recommended set</button>
  <button class="btn ghost" type="button" id="gx-part">Load a part-geared example</button>
  <button class="btn ghost" type="button" id="gx-empty">Empty every slot</button>
  <button class="btn ghost" type="button" id="gx-import">Import your character</button>
</div>
<p class="okline" id="gx-msg" aria-live="polite"></p>
<div class="gx-set" id="gx-set"></div>
<div class="ga-wrap" id="ga-wrap">
  <ol class="ga-list" id="ga-list" aria-label="Equipped gear, 17 slots"></ol>
  <section class="ga-pane" id="ga-pane" hidden aria-labelledby="ga-pane-h" tabindex="-1"></section>
</div>
<p class="prov" style="margin:10px 0 0">Ranks, enchants and gems: Wowhead's Fury Warrior Phase 2 guides · items: the wowsims/tbc catalogue · icons: the files the live app ships.</p>`;

const say=t=>{const m=$("#gx-msg");if(m)m.textContent=t;};
const st=()=>S.get();

function setBar(){
  const host=$("#gx-set");if(!host)return;
  const n=G.setCounts(st())["destroyer-battlegear"]||0;
  host.innerHTML=`<span class="q-epic">Destroyer Battlegear</span>${[0,1,2,3,4].map(i=>`<span class="pip${i<n?" on":""}" aria-hidden="true"></span>`).join("")}<span class="num">${n}/5</span>`+
    `<span class="prov">${n>=4?"2-piece and 4-piece bonuses active":n>=2?"2-piece bonus active; 4-piece at 4":"Set bonuses start at 2 pieces"}</span>`;
}
function rowHTML(slot){
  const s=st()[slot.key],it=G.item(s&&s.item),stt=G.status(slot.key,st());
  if(!it)return `<li><button type="button" class="ga-row empty" data-slot="${slot.key}" aria-expanded="${open===slot.key}" aria-controls="ga-pane">
    <span class="ga-ico" aria-hidden="true">${slot.glyph}</span><span class="ga-txt"><span class="ga-slot">${slot.key}</span><b class="ga-name">Empty</b><span class="ga-ench na">Choose an item</span></span><span class="ga-side"></span></button></li>`;
  const e=G.enchant(s.enchant);
  const ench=e?`<span class="ga-ench">${G.esc(e.name)}</span>`:G.enchantable(slot.key)?`<span class="ga-ench miss">No enchant</span>`:`<span class="ga-ench na">${/^Finger/.test(slot.key)?"No enchant (needs Enchanting)":"Can't be enchanted"}</span>`;
  return `<li><button type="button" class="ga-row" data-slot="${slot.key}" aria-expanded="${open===slot.key}" aria-controls="ga-pane" aria-label="${slot.key}: ${G.esc(it.name)}">
    <span class="ga-ico" style="--q:${G.qVar(it.q)}" aria-hidden="true"><img src="${G.iconUrl(it.icon)}" alt="" loading="lazy" decoding="async"><i class="lv">${it.ilvl}</i></span>
    <span class="ga-txt"><span class="ga-slot">${slot.key}</span><b class="ga-name" style="color:${G.qVar(it.q)}">${G.esc(it.name)}</b>${ench}</span>
    <span class="ga-side"><span class="ga-gems">${G.gemDots(s)}</span>${stt.rank?`<span class="ga-rank${stt.best?" best":""}" title="Rank ${stt.rank} of ${stt.size} on Wowhead's Fury list">#${stt.rank}</span>`:""}</span></button></li>`;
}
function renderList(){
  const host=$("#ga-list");if(!host)return;
  if(!G.filledCount(st())&&!open){
    host.innerHTML=`<li style="grid-column:1/-1"><div class="ga-empty"><b>Nothing equipped yet</b><span>Fill every slot from Wowhead's Fury Phase 2 list in one press, or open any slot below to choose.</span><button class="btn" type="button" data-act="rec">Equip the recommended set</button></div></li>`+G.SLOTS.map(rowHTML).join("");
  }else host.innerHTML=G.SLOTS.map(rowHTML).join("");
  $("#ga-wrap").classList.toggle("open",!!open);
}
const DK=["Str","Agi","AP","Hit","Crit","Haste","Expertise"];
function deltaHTML(cand,cur){
  if(!cur)return `<span class="ga-delta"><span class="up">new</span></span>`;
  if(cand.id===cur.id)return `<span class="ga-delta"><span class="eq">equipped</span></span>`;
  const m=o=>Object.fromEntries(o.stats);const a=m(cand),b=m(cur);
  const d=DK.map(k=>[k,(a[k]||0)-(b[k]||0)]).filter(([,v])=>v).sort((x,y)=>Math.abs(y[1])-Math.abs(x[1])).slice(0,3);
  return `<span class="ga-delta" aria-label="Compared with what you wear: ${d.map(([k,v])=>`${v>0?"+":""}${v} ${k}`).join(", ")||"same key stats"}">`+
    (d.length?d.map(([k,v])=>`<span class="${v>0?"up":"dn"}">${v>0?"+":""}${v} ${k}</span>`).join(""):`<span class="eq">same key stats</span>`)+`</span>`;
}
function renderPane(){
  const pane=$("#ga-pane");if(!pane)return;
  if(!open){pane.hidden=true;pane.innerHTML="";return;}
  const key=open,s=st()[key],it=G.item(s&&s.item),stt=G.status(key,st()),slot=G.SLOT[key];
  const otherKey=/[12]$/.test(key)?key.replace(/[12]$/,m=>m==="1"?"2":"1"):null,other=otherKey?st()[otherKey]:null;
  const list=G.listFor(key);
  let h=`<button type="button" class="ga-x" data-act="close" aria-label="Close ${key} options">×</button>
  <div class="ga-ph">${it?`<span class="ga-ico" style="--q:${G.qVar(it.q)}" aria-hidden="true"><img src="${G.iconUrl(it.icon)}" alt=""><i class="lv">${it.ilvl}</i></span>`:`<span class="ga-ico" aria-hidden="true">${slot.glyph}</span>`}
    <div><span class="ga-slot">${key}</span><h3 id="ga-pane-h" style="color:${it?G.qVar(it.q):"var(--ink)"}">${it?G.esc(it.name):"Empty slot"}</h3>
    <span class="prov">${it?`${stt.rank?`Rank ${stt.rank} of ${stt.size} on Wowhead's list · `:""}${G.esc(it.src.text)}`:"Pick an item below"}</span></div></div>
  <p class="ga-prompt">${it?(stt.best?"This is the best item for the slot. Change the enchant or gems below, or pick another item.":`Upgrade available: <b style="color:${G.qVar(stt.upgrade.q)}">${G.esc(stt.upgrade.name)}</b> (${G.esc(stt.upgrade.src.text)}).`):"Click an item to equip it. The list updates as you choose."}</p>
  <h4 id="ga-h-item">Item · Wowhead's ranking</h4><ul class="ga-choices" role="group" aria-labelledby="ga-h-item">`;
  list.forEach(c=>{const taken=other&&other.item===c.id&&c.unique;
    h+=`<li><button type="button" class="ga-choice" data-pick="${c.id}" aria-pressed="${!!it&&it.id===c.id}" ${taken?`disabled title="Unique: already in ${otherKey}"`:""} style="--q:${G.qVar(c.q)}">
      <img src="${G.iconUrl(c.icon)}" alt="" loading="lazy"><span><b style="color:${G.qVar(c.q)}">${c.rank}. ${G.esc(c.name)}</b><small>${c.ilvl} · ${G.esc(c.note)} · ${G.esc(c.src.text)}${taken?` · already in ${otherKey}`:""}</small></span>${deltaHTML(c,it)}</button></li>`;});
  h+=`</ul>`;
  if(it&&it.id)h+=`<div style="margin-top:6px"><button type="button" class="ga-chip" data-act="unequip">Remove this item</button></div>`;
  if(it){
    if(G.enchantable(key)){
      const best=G.bestEnchant(key);
      h+=`<h4 id="ga-h-ench">Enchant</h4><div class="ga-chips" role="group" aria-labelledby="ga-h-ench">`+
        G.enchantOptions(key).map(e=>`<button type="button" class="ga-chip" data-ench="${e.id}" aria-pressed="${s.enchant===e.id}">${G.esc(e.name)}${e.id===best?` <span class="rec">recommended</span>`:""}</button>`).join("")+
        `<button type="button" class="ga-chip" data-ench="" aria-pressed="${!s.enchant}">No enchant</button></div>`;
    }else if(/^Finger/.test(key))h+=`<h4>Enchant</h4><p class="ga-prompt">Ring enchants need Enchanting, which this character doesn't have.</p>`;
    if(it.sockets.length){
      h+=`<h4>Gems</h4>`;
      it.sockets.forEach((c,i)=>{const cur=s.gems[i];
        h+=`<div class="ga-sock" role="group" aria-label="${c} socket"><span>${c} socket</span><div class="ga-chips">`+
          G.gemOptions(c).map(g=>`<button type="button" class="ga-chip${G.gemMatches(c,g)?"":" nm"}" data-gem="${i}" data-id="${g.id}" aria-pressed="${cur===g.id}" title="${G.esc(g.stats.map(([k,v])=>`+${v} ${k}`).join(", "))}${G.gemMatches(c,g)?"":" · doesn't match the socket colour"}"><img src="${G.iconUrl(g.icon)}" alt="">${G.esc(g.name.replace(/ (Living Ruby|Noble Topaz|Nightseye|Dawnstone|Talasite|Earthstorm Diamond)$/,""))}${G.D.gemFor[c]===g.id?` <span class="rec">recommended</span>`:""}</button>`).join("")+
          `<button type="button" class="ga-chip" data-gem="${i}" data-id="" aria-pressed="${!cur}">Empty</button></div></div>`;});
      const on=G.socketBonusOn(s);
      h+=`<p class="ga-bonus ${on?"on":"off"}">Socket bonus ${it.bonus.map(([k,v])=>`+${v} ${k}`).join(", ")}: ${on?"on":"off, every gem must match its socket's colour"}</p>`;
    }
  }
  pane.innerHTML=h;pane.hidden=false;
}
function renderAll(){renderList();renderPane();setBar();G.updateHit(st());}

function openSlot(key,fromKeyboard){
  open=key;renderAll();
  const pane=$("#ga-pane");
  if(pane){pane.focus({preventScroll:true});
    if(innerWidth<900)pane.scrollIntoView({behavior:moving()?"smooth":"auto",block:"start"});
    const K=KIT();if(K&&moving())K.enter(pane);}
}
function closePane(){
  const k=open;open=null;renderAll();
  const b=$(`#ga-list [data-slot="${k}"]`);if(b)b.focus();
}
function commit(next,msg,lit){
  S.set(next);renderAll();if(msg)say(msg);
  if(lit){const b=$(`#ga-list [data-slot="${lit}"]`);if(b&&moving()){b.animate([{boxShadow:"0 0 0 2px var(--glow),0 0 26px -2px var(--glow)"},{boxShadow:"none"}],{duration:900,easing:"ease-out"});}}
}
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t||!mount.contains(t))return;
  const s=G.clone(st());
  if(t.dataset.slot){open===t.dataset.slot?closePane():openSlot(t.dataset.slot);return;}
  if(t.dataset.act==="close"){closePane();return;}
  if(t.dataset.act==="rec"||t.id==="gx-rec"){commit(G.recommended(),"Equipped the recommended set: Wowhead's rank 1 in every slot (the second ring and trinket take rank 2), with its enchants and gems.");const K=KIT();if(K)K.swell();return;}
  if(t.id==="gx-part"){commit(G.partGeared(),"Loaded a part-geared example: five slots on lower-ranked items, the gloves unenchanted, one empty socket and one mismatched gem.");return;}
  if(t.id==="gx-empty"){open=null;commit(G.empty(),"Emptied every slot.");return;}
  if(t.id==="gx-import"){const b=document.getElementById("t-build");if(b)b.click();return;}
  const key=open;if(!key)return;
  if(t.dataset.pick){const it=G.item(t.dataset.pick);
    s[key]={item:it.id,enchant:G.enchantable(key)?(s[key].enchant||G.bestEnchant(key)):null,gems:it.sockets.map(c=>G.D.gemFor[c]||G.D.gemFor.Red)};
    commit(s,`${key}: equipped ${it.name}.`,key);const f=$(`#ga-pane [data-pick="${it.id}"]`);if(f)f.focus();return;}
  if(t.dataset.act==="unequip"){s[key]={item:null,enchant:null,gems:[]};commit(s,`${key}: removed the item.`,key);const f=$("#ga-pane .ga-choice");if(f)f.focus();return;}
  if(t.dataset.ench!==undefined){s[key].enchant=t.dataset.ench||null;const e=G.enchant(s[key].enchant);commit(s,`${key}: ${e?"enchanted with "+e.name:"enchant removed"}.`,key);const f=$(`#ga-pane [data-ench="${t.dataset.ench}"]`);if(f)f.focus();return;}
  if(t.dataset.gem!==undefined){const i=+t.dataset.gem;s[key].gems[i]=t.dataset.id||null;const g=G.gem(s[key].gems[i]);
    commit(s,`${key}: ${g?g.name+" in":"emptied"} socket ${i+1}.`,key);const f=$(`#ga-pane [data-gem="${i}"][data-id="${t.dataset.id}"]`);if(f)f.focus();return;}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&open){const p=$("#ga-pane");if(p&&!p.hidden){e.preventDefault();closePane();}}});
renderAll();
})();
