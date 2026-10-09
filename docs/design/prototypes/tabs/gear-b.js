/* gear-b.js — Gear design B, "Character sheet": laid out like the in-game character window. Armour down the left,
   jewellery and the rest down the right, weapons along the bottom, the gear's stats in the middle. Hovering or
   focusing a slot shows a game-style tooltip; clicking one opens a flyout of its ranked alternatives (as icons),
   its enchants and its gems. Shirt and Tabard are drawn as in the game but are cosmetic, so they do nothing. */
(function(){
"use strict";
const G=window.GearKit;if(!G)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const mount=document.getElementById("gearui-b")||document.getElementById("gearui");if(!mount)return;
const EMBED=mount.id==="gearui-b"; /* inside the Character Planner: the page owns the preset buttons and the message line */
const KIT=()=>window.TBCKit||null;
const moving=()=>document.documentElement.classList.contains("motion")&&!matchMedia("(prefers-reduced-motion: reduce)").matches;
const S=G.store("b");
let open=null,tipFor=null;
const LEFT=["Head","Neck","Shoulders","Back","Chest","~Shirt","~Tabard","Wrists"];
const RIGHT=["Hands","Waist","Legs","Feet","Finger 1","Finger 2","Trinket 1","Trinket 2"];
const BOTTOM=["Main Hand","Off Hand","Ranged"];

const css=document.createElement("style");
css.textContent=`
.gx-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:0 0 8px}
.gb-sheet{position:relative;display:grid;gap:14px 16px;grid-template-columns:minmax(0,1fr) minmax(220px,1.1fr) minmax(0,1fr);
  grid-template-areas:"left mid right" "bottom bottom bottom";background:radial-gradient(70% 60% at 50% 40%,rgba(90,176,255,.10),transparent 70%),rgba(3,8,20,.55);
  border:1px solid var(--rim);border-radius:14px;padding:14px}
.gb-col{list-style:none;margin:0;padding:0;display:grid;gap:7px;align-content:start}
.gb-left{grid-area:left}.gb-right{grid-area:right}.gb-mid{grid-area:mid}
.gb-bottom{grid-area:bottom;list-style:none;margin:0;padding:6px 0 0;display:flex;gap:18px;justify-content:center;border-top:1px solid var(--rim-2)}
.gb-slot{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;padding:0;font:inherit;color:var(--ink);cursor:pointer;text-align:left;min-height:52px}
.gb-right .gb-slot{flex-direction:row-reverse;text-align:right}
.gb-bottom .gb-slot{flex-direction:column;gap:4px;text-align:center;width:auto}
.gb-ico{position:relative;flex:none;width:52px;height:52px;border-radius:7px;border:2px solid var(--q,rgba(255,255,255,.18));background:linear-gradient(145deg,#132433,#081019);
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),0 0 12px -4px var(--q,transparent);display:grid;place-items:center;overflow:hidden;font:600 10px var(--f-mono);color:var(--ink-3)}
.gb-ico img{width:100%;height:100%;display:block}
.gb-ico .lv{position:absolute;right:0;bottom:0;font:600 9.5px/1 var(--f-mono);background:rgba(0,0,0,.8);color:#fff;padding:2px 3px;border-top-left-radius:4px}
.gb-slot:hover .gb-ico,.gb-slot:focus-visible .gb-ico,.gb-slot[aria-expanded="true"] .gb-ico{border-color:#fff;box-shadow:0 0 0 2px var(--glow),0 0 18px -2px var(--glow)}
.gb-slot:focus-visible{outline:none}
.gb-lab{min-width:0;display:grid;gap:1px}
.gb-lab b{font-size:var(--t-xs);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gb-lab small{font-size:11px;color:var(--ink-3);display:flex;gap:5px;align-items:center;overflow:hidden;white-space:nowrap}
.gb-right .gb-lab small{justify-content:flex-end}
.gb-lab .ok{color:#7fdc8a}.gb-lab .miss{color:var(--warn)}
.gb-bottom .gb-lab{max-width:150px}.gb-bottom .gb-lab small{justify-content:center}
.gb-cos .gb-ico{opacity:.35;border-style:dashed}.gb-cos{cursor:default}
.gb-mid{display:grid;gap:10px;align-content:start;text-align:center;padding:4px 6px}
.gb-crest{width:96px;height:96px;margin:0 auto;display:block}
.gb-mid h3{margin:0;font:400 var(--t-lg) var(--f-head)}
.gb-stats{display:grid;grid-template-columns:1fr auto;gap:3px 12px;text-align:left;font-size:var(--t-sm);background:rgba(0,0,0,.35);border:1px solid var(--rim-2);border-radius:10px;padding:8px 12px}
.gb-stats dt{color:var(--ink-2)}.gb-stats dd{margin:0;font-family:var(--f-mono);text-align:right}
.gb-stats .cap{color:var(--warn)}.gb-stats .capok{color:#7fdc8a}
.gb-sth{margin:0 0 -6px;font:600 10px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.gb-checks{display:grid;gap:3px;font-size:var(--t-xs);color:var(--ink-2);text-align:left}
.gb-checks .ok{color:#7fdc8a}.gb-checks .miss{color:var(--warn)}
.gb-go{font:inherit;background:none;border:0;padding:2px 0;text-align:left;cursor:pointer;color:inherit;text-decoration:underline;text-decoration-style:dotted;text-underline-offset:3px;min-height:26px}
.gb-go:hover,.gb-go:focus-visible{text-decoration-style:solid}
.gb-set{font-size:var(--t-xs);display:flex;gap:5px;justify-content:center;align-items:center;flex-wrap:wrap}
.gb-set .pip{width:9px;height:9px;border:1.5px solid var(--q-epic);border-radius:2px}.gb-set .pip.on{background:var(--q-epic);box-shadow:0 0 8px var(--q-epic)}
.gb-tip{position:fixed;z-index:30;pointer-events:none;background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:9px 11px;box-shadow:0 10px 30px rgba(0,0,0,.7)}
.gb-fly{position:absolute;z-index:20;width:min(380px,calc(100% - 20px));background:rgba(5,12,30,.97);border:1px solid var(--glow);border-radius:12px;padding:12px;box-shadow:0 18px 50px rgba(0,0,0,.75)}
.gb-fly h4{margin:8px 0 6px;font:600 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.gb-fly .hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding-right:40px}
.gb-fly .hd b{font:400 var(--t-md) var(--f-head)}
.gb-x{position:absolute;top:6px;right:6px;width:40px;height:40px;border-radius:8px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink);font-size:20px;cursor:pointer}
.gb-alts{display:flex;flex-wrap:wrap;gap:8px}
.gb-alt{position:relative;width:54px;height:54px;padding:0;border-radius:7px;border:2px solid var(--q,var(--rim));background:#081019;cursor:pointer;overflow:hidden}
.gb-alt img{width:100%;height:100%;display:block}
.gb-alt .rk{position:absolute;left:0;top:0;font:700 10px/1 var(--f-mono);background:rgba(0,0,0,.82);color:#fff;padding:2px 4px;border-bottom-right-radius:5px}
.gb-alt[aria-pressed="true"]{box-shadow:0 0 0 2px #fff,0 0 16px -2px var(--glow)}
.gb-alt:disabled{opacity:.4;cursor:not-allowed}
.gb-alt:hover,.gb-alt:focus-visible{border-color:#fff}
.gb-chips{display:flex;flex-wrap:wrap;gap:5px}
.gb-chip{display:inline-flex;align-items:center;gap:5px;font:600 var(--t-xs) var(--f-body);color:var(--ink);background:var(--glass-2);border:1px solid var(--rim);border-radius:999px;padding:4px 10px;cursor:pointer;min-height:32px}
.gb-chip img{width:18px;height:18px;border-radius:3px}
.gb-chip[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink);border-color:var(--glow)}
.gb-note{font-size:var(--t-xs);color:var(--ink-3);margin:6px 0 0}
.gb-note.on{color:#7fdc8a}
@media (max-width:759px){
  .gb-sheet{grid-template-columns:1fr;grid-template-areas:"mid" "left" "right" "bottom"}
  .gb-col{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 6px}
  .gb-col .gb-slot,.gb-right .gb-slot{flex-direction:column;text-align:center;gap:4px}
  .gb-lab b{white-space:normal;font-size:10.5px;line-height:1.15;max-height:2.3em;overflow:hidden}
  .gb-lab small,.gb-right .gb-lab small{justify-content:center}
  .gb-cos{display:none!important}
  .gb-fly{position:static;width:auto;margin-top:12px}
  .gb-bottom{gap:6px;justify-content:space-around}
}
@media (max-width:699px),(pointer:coarse){.gb-chip{min-height:44px}.gb-go{min-height:44px}.gx-tools .btn{min-height:44px}.gb-x{width:44px;height:44px}}
`;
document.head.appendChild(css);

/* our own crest (not a Blizzard emblem): a crystal over a ring, in the tab's blue */
const CREST=`<svg class="gb-crest" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="gbcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe4ff"/><stop offset="1" stop-color="#2a6fd0"/></linearGradient></defs>
<circle cx="50" cy="56" r="34" fill="none" stroke="rgba(90,176,255,.45)" stroke-width="1.5"/><circle cx="50" cy="56" r="27" fill="none" stroke="rgba(90,176,255,.25)" stroke-width="1" stroke-dasharray="3 4"/>
<path d="M50 8 L66 46 L50 92 L34 46 Z" fill="url(#gbcg)" opacity=".9"/><path d="M50 8 L66 46 L50 50 Z" fill="#fff" opacity=".35"/></svg>`;

const TOOLS=EMBED?"":`<div class="gx-tools">
  <button class="btn magnet" type="button" id="gx-rec">Equip the recommended set</button>
  <button class="btn ghost" type="button" id="gx-part">Load a part-geared example</button>
  <button class="btn ghost" type="button" id="gx-empty">Empty every slot</button>
  <button class="btn ghost" type="button" id="gx-import">Import your character</button>
</div>
<p class="okline" id="gx-msg" aria-live="polite"></p>
`;
mount.innerHTML=TOOLS+`<div class="gb-sheet" id="gb-sheet">
  <ul class="gb-col gb-left" id="gb-left" aria-label="Armour"></ul>
  <div class="gb-mid" id="gb-mid"></div>
  <ul class="gb-col gb-right" id="gb-right" aria-label="Hands, waist, legs, feet, rings and trinkets"></ul>
  <ul class="gb-bottom" id="gb-bottom" aria-label="Weapons"></ul>
  <div class="gb-fly" id="gb-fly" role="dialog" aria-labelledby="gb-fly-h" hidden tabindex="-1"></div>
</div>
<div class="gb-tip" id="gb-tip" role="tooltip" hidden></div>
<p class="prov" style="margin:10px 0 0">Hover or focus a slot for its tooltip; click it to swap. Ranks, enchants and gems: Wowhead's Fury Warrior Phase 2 guides · items: the wowsims/tbc catalogue · icons: the files the live app ships.</p>`;

const say=t=>{const m=$("#gx-msg");if(m)m.textContent=t;};
const st=()=>S.get();

function slotHTML(key){
  if(key[0]==="~"){const n=key.slice(1);return `<li><span class="gb-slot gb-cos" title="${n}: cosmetic, not planned here"><span class="gb-ico" aria-hidden="true">${n.slice(0,2).toUpperCase()}</span><span class="gb-lab"><b style="color:var(--ink-3)">${n}</b><small>cosmetic</small></span></span></li>`;}
  const slot=G.SLOT[key],s=st()[key],it=G.item(s&&s.item),stt=G.status(key,st());
  if(!it)return `<li><button type="button" class="gb-slot" data-slot="${key}" aria-expanded="${open===key}" aria-label="${key}: empty"><span class="gb-ico" aria-hidden="true">${slot.glyph}</span><span class="gb-lab"><b style="color:var(--ink-3)">${key}</b><small>empty</small></span></button></li>`;
  const ench=G.enchantable(key)?(s.enchant?`<span class="ok" title="${G.esc((G.enchant(s.enchant)||{}).name)}">✦ enchanted</span>`:`<span class="miss">✦ no enchant</span>`):"";
  return `<li><button type="button" class="gb-slot" data-slot="${key}" aria-expanded="${open===key}" aria-label="${key}: ${G.esc(it.name)}, item level ${it.ilvl}${stt.rank?`, rank ${stt.rank} of ${stt.size}`:""}">
    <span class="gb-ico" style="--q:${G.qVar(it.q)}" aria-hidden="true"><img src="${G.iconUrl(it.icon)}" alt="" loading="lazy" decoding="async"><i class="lv">${it.ilvl}</i></span>
    <span class="gb-lab"><b style="color:${G.qVar(it.q)}">${G.esc(it.name)}</b><small>${G.gemDots(s)}${ench}</small></span></button></li>`;
}
/* inside the planner each count is a link to the checklist, filtered to what's left */
const chk=(cls,txt)=>EMBED?`<button type="button" class="gb-go ${cls}" data-goto="todo">${txt}</button>`:`<span class="${cls}">${txt}</span>`;
function midHTML(){
  const t=G.totals(st()),n=G.setCounts(st())["destroyer-battlegear"]||0,cap=G.HIT_CAP;
  const stats=G.SLOTS.map(x=>({k:x.key,s:G.status(x.key,st())}));
  const ench=stats.filter(x=>G.enchantable(x.k)&&!x.s.empty),enchOk=ench.filter(x=>!x.s.noEnchant).length;
  const sockets=G.SLOTS.reduce((a,x)=>{const it=G.item(st()[x.key].item);return a+(it?it.sockets.length:0);},0),empty=stats.reduce((a,x)=>a+(x.s.emptySockets||0),0);
  const withBonus=G.SLOTS.filter(x=>{const it=G.item(st()[x.key].item);return it&&it.bonus.length;}),bonusOn=withBonus.filter(x=>G.socketBonusOn(st()[x.key])).length;
  const best=stats.filter(x=>x.s.best).length;
  return `${CREST}<h3>Human Fury Warrior</h3>
  <div class="gb-set"><span class="q-epic">Destroyer Battlegear</span>${[0,1,2,3,4].map(i=>`<span class="pip${i<n?" on":""}" aria-hidden="true"></span>`).join("")}<span class="num">${n}/5</span></div>
  <h4 class="gb-sth">From this gear</h4>
  <dl class="gb-stats" aria-label="Stats from this gear">
    <dt>Strength</dt><dd>${t.Str}</dd><dt>Agility</dt><dd>${t.Agi}</dd><dt>Attack Power</dt><dd>${t.AP}</dd>
    <dt>Hit Rating</dt><dd class="${t.Hit<cap?"cap":"capok"}">${t.Hit} / ${cap}</dd><dt>Crit Rating</dt><dd>${t.Crit}</dd>
    <dt>Haste Rating</dt><dd>${t.Haste}</dd><dt>Expertise Rating</dt><dd>${t.Expertise}</dd>
  </dl>
  <div class="gb-checks">
    ${chk(best===17?"ok":"",`${best} of 17 slots best on Wowhead's list`)}
    ${chk(enchOk===ench.length?"ok":"miss",`${enchOk} of ${ench.length} enchants`)}
    ${chk(empty?"miss":"ok",`${sockets-empty} of ${sockets} sockets filled`)}
    ${chk(bonusOn===withBonus.length?"ok":"miss",`${bonusOn} of ${withBonus.length} socket bonuses on`)}
  </div>`;
}
function flyHTML(key){
  const s=st()[key],it=G.item(s&&s.item),stt=G.status(key,st());
  const otherKey=/[12]$/.test(key)?key.replace(/[12]$/,m=>m==="1"?"2":"1"):null,other=otherKey?st()[otherKey]:null;
  let h=`<button type="button" class="gb-x" data-act="close" aria-label="Close ${key}">×</button>
  <div class="hd"><b id="gb-fly-h">${key}</b><span class="prov">${it?(stt.best?"best on the list":`rank ${stt.rank} of ${stt.size}`):"empty"}</span></div>
  <h4>Swap · Wowhead's ranking</h4><div class="gb-alts" role="group" aria-label="${key} items">`+
    G.listFor(key).map(c=>{const taken=other&&other.item===c.id&&c.unique;
      return `<button type="button" class="gb-alt" data-pick="${c.id}" data-tipitem="${c.id}" aria-pressed="${!!it&&it.id===c.id}" ${taken?"disabled":""} style="--q:${G.qVar(c.q)}" aria-label="Rank ${c.rank}: ${G.esc(c.name)}${taken?`, already in ${otherKey}`:""}"><img src="${G.iconUrl(c.icon)}" alt=""><span class="rk" aria-hidden="true">${c.rank}</span></button>`;}).join("")+
    (it?`<button type="button" class="gb-chip" data-act="unequip" style="align-self:center">Remove</button>`:"")+`</div>`;
  if(it&&G.enchantable(key)){const best=G.bestEnchant(key);
    h+=`<h4>Enchant</h4><div class="gb-chips" role="group" aria-label="${key} enchant">`+G.enchantOptions(key).map(e=>`<button type="button" class="gb-chip" data-ench="${e.id}" aria-pressed="${s.enchant===e.id}"${e.id===best?` title="Wowhead's pick"`:""}>${e.id===best?"★ ":""}${G.esc(e.name)}</button>`).join("")+
      `<button type="button" class="gb-chip" data-ench="" aria-pressed="${!s.enchant}">None</button></div>`;}
  if(it&&it.sockets.length){
    it.sockets.forEach((c,i)=>{h+=`<h4>${c} socket</h4><div class="gb-chips" role="group" aria-label="${key} ${c} socket">`+
      G.gemOptions(c).map(g=>`<button type="button" class="gb-chip${G.gemMatches(c,g)?"":" nm"}" data-gem="${i}" data-id="${g.id}" aria-pressed="${s.gems[i]===g.id}" title="${G.esc(g.name+": "+g.stats.map(([k,v])=>`+${v} ${k}`).join(", "))}"><img src="${G.iconUrl(g.icon)}" alt="">${G.esc(g.stats.map(([k,v])=>`+${v} ${k}`).join(" "))}${G.D.gemFor[c]===g.id?" ★":""}</button>`).join("")+
      `<button type="button" class="gb-chip" data-gem="${i}" data-id="" aria-pressed="${!s.gems[i]}">Empty</button></div>`;});
    const on=G.socketBonusOn(s);h+=`<p class="gb-note ${on?"on":""}">Socket bonus ${it.bonus.map(([k,v])=>`+${v} ${k}`).join(", ")}: ${on?"on":"off (gems must match socket colours)"} · ★ = Wowhead's pick</p>`;}
  return h;
}
function placeFly(){
  const fly=$("#gb-fly"),sheet=$("#gb-sheet");if(!fly||fly.hidden||!open)return;
  if(innerWidth<760){fly.style.left=fly.style.top="";return;}
  const b=$(`#gb-sheet [data-slot="${open}"] .gb-ico`);if(!b)return;
  const sr=sheet.getBoundingClientRect(),r=b.getBoundingClientRect(),fw=fly.offsetWidth,fh=fly.offsetHeight;
  const inRight=!!b.closest(".gb-right"),inBottom=!!b.closest(".gb-bottom");
  let x=inBottom?r.left-sr.left+r.width/2-fw/2:inRight?r.left-sr.left-fw-12:r.right-sr.left+12;
  let y=inBottom?r.top-sr.top-fh-12:r.top-sr.top-10;
  x=Math.max(8,Math.min(x,sr.width-fw-8));y=Math.max(8,Math.min(y,Math.max(8,sr.height-fh-8)));
  fly.style.left=x+"px";fly.style.top=y+"px";
}
function render(){
  $("#gb-left").innerHTML=LEFT.map(slotHTML).join("");
  $("#gb-right").innerHTML=RIGHT.map(slotHTML).join("");
  $("#gb-bottom").innerHTML=BOTTOM.map(slotHTML).join("");
  $("#gb-mid").innerHTML=midHTML();
  const fly=$("#gb-fly");
  if(open){fly.innerHTML=flyHTML(open);fly.hidden=false;placeFly();}else{fly.hidden=true;fly.innerHTML="";}
  G.updateHit(st());
}
/* tooltip: hover or keyboard focus on a slot or an alternative */
function showTip(el){
  const tip=$("#gb-tip");if(!tip||!el)return;
  const key=el.dataset.slot||open,id=el.dataset.tipitem||(st()[key]&&st()[key].item);
  if(!id){tip.hidden=true;return;}
  tip.innerHTML=G.tooltipHTML(id,st()[key],key);tip.hidden=false;tipFor=el;
  const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
  let x=el.closest(".gb-right")?r.left-w-10:r.right+10,y=r.top;
  if(x+w>innerWidth-8)x=r.left-w-10;if(x<8)x=Math.min(innerWidth-w-8,r.left);
  if(y+h>innerHeight-8)y=Math.max(8,innerHeight-h-8);
  tip.style.left=x+"px";tip.style.top=y+"px";
}
const hideTip=()=>{const t=$("#gb-tip");if(t)t.hidden=true;tipFor=null;};
mount.addEventListener("pointerover",e=>{const el=e.target.closest("[data-slot],[data-tipitem]");if(el&&mount.contains(el)&&e.pointerType!=="touch")showTip(el);});
mount.addEventListener("pointerout",e=>{const el=e.target.closest("[data-slot],[data-tipitem]");if(el&&!el.contains(e.relatedTarget))hideTip();});
mount.addEventListener("focusin",e=>{const el=e.target.closest("[data-slot],[data-tipitem]");if(el)showTip(el);else hideTip();});
mount.addEventListener("focusout",e=>{if(!mount.contains(e.relatedTarget))hideTip();});
addEventListener("scroll",()=>{if(tipFor)hideTip();},{passive:true});
addEventListener("resize",()=>{placeFly();hideTip();});

function openSlot(key){
  open=key;hideTip();render();
  const fly=$("#gb-fly");if(fly){fly.focus({preventScroll:true});if(innerWidth<760)fly.scrollIntoView({behavior:moving()?"smooth":"auto",block:"nearest"});const K=KIT();if(K&&moving())K.enter(fly);}
}
function closeFly(){const k=open;open=null;render();const b=$(`#gb-sheet [data-slot="${k}"]`);if(b)b.focus();}
function commit(next,msg,keepFocusSel){
  S.set(next,"b");render();if(msg)say(msg);
  if(keepFocusSel){const f=$(keepFocusSel);if(f)f.focus();}
}
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t||!mount.contains(t))return;
  const s=G.clone(st());
  if(t.dataset.goto){document.dispatchEvent(new CustomEvent("gear:view",{detail:{view:"list",todo:true,focus:true}}));return;}
  if(t.dataset.slot){open===t.dataset.slot?closeFly():openSlot(t.dataset.slot);return;}
  if(t.dataset.act==="close"){closeFly();return;}
  if(t.id==="gx-rec"){open=null;commit(G.recommended(),"Equipped the recommended set: Wowhead's rank 1 in every slot (the second ring and trinket take rank 2), with its enchants and gems.");const K=KIT();if(K)K.swell();return;}
  if(t.id==="gx-part"){open=null;commit(G.partGeared(),"Loaded a part-geared example: five slots on lower-ranked items, the gloves unenchanted, one empty socket and one mismatched gem.");return;}
  if(t.id==="gx-empty"){open=null;commit(G.empty(),"Emptied every slot.");return;}
  if(t.id==="gx-import"){const b=document.getElementById("t-build");if(b)b.click();return;}
  const key=open;if(!key)return;
  if(t.dataset.pick){const it=G.item(t.dataset.pick);
    s[key]={item:it.id,enchant:G.enchantable(key)?(s[key].enchant||G.bestEnchant(key)):null,gems:it.sockets.map(c=>G.D.gemFor[c]||G.D.gemFor.Red)};
    commit(s,`${key}: equipped ${it.name}.`,`#gb-fly [data-pick="${it.id}"]`);return;}
  if(t.dataset.act==="unequip"){s[key]={item:null,enchant:null,gems:[]};commit(s,`${key}: removed the item.`,"#gb-fly .gb-alt");return;}
  if(t.dataset.ench!==undefined){s[key].enchant=t.dataset.ench||null;const e=G.enchant(s[key].enchant);commit(s,`${key}: ${e?"enchanted with "+e.name:"enchant removed"}.`,`#gb-fly [data-ench="${t.dataset.ench}"]`);return;}
  if(t.dataset.gem!==undefined){const i=+t.dataset.gem;s[key].gems[i]=t.dataset.id||null;const g=G.gem(s[key].gems[i]);
    commit(s,`${key}: ${g?g.name+" in":"emptied"} socket ${i+1}.`,`#gb-fly [data-gem="${i}"][data-id="${t.dataset.id}"]`);return;}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(open){e.preventDefault();closeFly();}else hideTip();}});
document.addEventListener("pointerdown",e=>{if(open&&!e.target.closest("#gb-fly")&&!e.target.closest("[data-slot]"))closeFly();});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="b")render();});
document.addEventListener("gear:view",()=>{if(open){open=null;render();}hideTip();});
render();
})();
