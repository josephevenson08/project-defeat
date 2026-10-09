/* buffs-a.js — Buffs design A, "Buff bar": the game's buff row. Raid buffs and boss debuffs are icons you click on and
   off: lit with a gold rim when on, greyed when off, each with a bar in the colour of the class that brings it.
   Buffs the simulator doesn't count sit dimmed at the end of their row with a slash, and say why. Consumables are four
   slots (flask, battle elixir, guardian elixir, food), each opening a chooser like the Gear tab's flyout. Paladins sit
   in their own row, each assigned the Blessing they give; clicking a Blessing's icon hands it to a free Paladin. Hovering shows
   the game-style tooltip; the selected icon's tooltip also sits under the bar for touch. */
(function(){
"use strict";
const B=window.BuffKit;if(!B)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("bufui");if(!mount)return;
const S=B.store("planner");
const KEY="pd-buffs-a";
let ui={sel:null,open:null};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v)ui=Object.assign(ui,v);}catch(e){}
if(ui.sel&&!B.BY[ui.sel]&&!B.CON[ui.sel])ui.sel=null;ui.open=null;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=$("#ba-msg");if(m)m.textContent=t;};
const CLASS_ORDER=["Warrior","Paladin","Priest","Druid","Hunter","Shaman","Warlock","Mage","Rogue"];
const byClass=(a,b)=>CLASS_ORDER.indexOf(a.cls)-CLASS_ORDER.indexOf(b.cls);

const css=document.createElement("style");
css.textContent=`
.ba-row{margin:0 0 14px}
.ba-row h4{display:flex;align-items:baseline;gap:10px;font:400 var(--t-md) var(--f-head);margin:0 0 8px}
.ba-row h4 small{font:600 var(--t-xs) var(--f-body);color:var(--ink-3)}
.ba-slots{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.ba-slot{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 10px;align-items:center;text-align:left;padding:8px 10px;border-radius:10px;border:1px solid var(--rim);background:var(--scrim);color:var(--ink);cursor:pointer;font:600 var(--t-sm) var(--f-body)}
.ba-slot .gl{grid-row:span 2;width:40px;height:40px;display:grid;place-items:center;border-radius:8px;border:2px solid #3a414a;background:#05080b}
.ba-slot .gl svg{width:24px;height:24px}
.ba-slot.on .gl{border-color:#f0c050;box-shadow:0 0 10px -3px rgba(240,192,80,.75)}
.ba-slot small{color:var(--ink-3);font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.06em}
.ba-slot.off b{color:var(--ink-3);font-weight:500}
.ba-slot[aria-expanded="true"]{border-color:var(--glow);box-shadow:inset 3px 0 0 var(--glow)}
.ba-fly{grid-column:1/-1;border:1px solid var(--glow);border-radius:10px;background:rgba(4,10,16,.96);padding:8px}
.ba-fly ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.ba-fly button{width:100%;display:grid;gap:1px;text-align:left;padding:7px 10px;border-radius:8px;border:1px solid var(--rim-2);background:var(--glass-2);color:var(--ink);cursor:pointer;font:600 var(--t-sm) var(--f-body)}
.ba-fly button small{color:var(--ink-3);font:500 var(--t-xs) var(--f-body)}
.ba-fly button[aria-pressed="true"]{border-color:var(--glow);box-shadow:inset 3px 0 0 var(--glow)}
.ba-fly button:hover,.ba-fly button:focus-visible{border-color:var(--glow)}
.ba-sel{display:grid;gap:10px 14px;grid-template-columns:minmax(0,1fr);margin:4px 0 0;align-items:start}
.ba-tipbox{background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:10px 12px}
.ba-tipbox .tt{max-width:none}
@media (max-width:699px),(pointer:coarse){.ba-slot,.ba-fly button{min-height:48px}}
`;
document.head.appendChild(css);

mount.innerHTML=`<h3>Buffs</h3>
<p class="lead">Your buffs as the game shows them. Click an icon to switch it on or off, and a consumable slot to choose what goes in it. Dimmed icons with a slash are buffs the simulator doesn't count. It opens on an example raid setup <span class="bk-ex">example</span></p>
<div class="bk-tools"><span class="bk-count" id="ba-count"></span>
  <button type="button" class="btn ghost" id="ba-example">Example raid setup</button>
  <button type="button" class="btn ghost" id="ba-all">Everything on</button>
  <button type="button" class="btn ghost" id="ba-none">Clear all</button></div>
<p class="okline" id="ba-msg" aria-live="polite"></p>
<div id="ba-body"></div>`;
const body=$("#ba-body");

function tile(b,st){
  const bl=B.isBless(b.id),on=(!b.out||bl)&&B.isOn(st,b.id),sw=!b.out||bl;
  return B.tileHTML(b,{pressed:sw?on:undefined,current:ui.sel===b.id,
    label:`${sw?(on?"on":"off")+(b.out?", not counted":""):"not counted"}: ${b.out?b.does:B.effectText(b)}, from ${B.whoA(b)}`});
}
function slotHTML(cat,label,st){
  const id=st.cons[cat],c=id?B.CON[id]:null,open=ui.open===cat;
  let h=`<button type="button" class="ba-slot ${c?"on":"off"}" data-slot="${cat}" aria-expanded="${open}" aria-controls="ba-fly-${cat}"><span class="gl bk-g bk-${cat}">${B.GLYPH[cat]}</span><small>${label}</small><b>${c?B.esc(c.name):"Empty"}</b></button>`;
  if(open)h+=`<div class="ba-fly" id="ba-fly-${cat}" role="group" aria-label="Choose a ${label.toLowerCase()}"><ul>
    <li><button type="button" data-ccat="${cat}" data-cid="" aria-pressed="${!id}">Empty<small>${cat==="flask"?"Leaves room for two elixirs":"Nothing in this slot"}</small></button></li>`+
    B.conOptions(cat).map(o=>`<li><button type="button" data-ccat="${cat}" data-cid="${o.id}" aria-pressed="${id===o.id}">${B.esc(o.name)}<small>${B.esc(B.conWords(o))}</small></button></li>`).join("")+`</ul></div>`;
  return h;
}
function render(){
  const st=S.get();
  const raid=B.D.buffs.slice().sort(byClass),raidOut=B.D.uncounted.slice().sort(byClass);
  const nOn=raid.filter(b=>B.isOn(st,b.id)).length,dOn=B.D.debuffs.filter(b=>B.isOn(st,b.id)).length,cons=B.consumed(st);
  const cnt=$("#ba-count");if(cnt)cnt.innerHTML=`<b>${nOn}</b> buffs · <b>${dOn}</b> on the boss · <b>${cons.length}</b> consumable${cons.length===1?"":"s"}`;
  const selB=ui.sel&&B.BY[ui.sel];
  B.keepFocus(body,()=>{
    body.innerHTML=`<section class="ba-row" aria-labelledby="ba-h1"><h4 id="ba-h1">Raid buffs <small>${nOn} of ${raid.length} on</small></h4>
      <div class="bk-bar" role="group" aria-label="Raid buffs">${raid.map(b=>tile(b,st)).join("")}<span class="bk-sep" aria-hidden="true"></span>${raidOut.map(b=>tile(b,st)).join("")}</div></section>
      <section class="ba-row" aria-labelledby="ba-hp"><h4 id="ba-hp">Paladin Blessings <small>${(st.pals||[]).length} Paladin${(st.pals||[]).length===1?"":"s"}</small></h4>${B.palsHTML(st)}</section>
      <section class="ba-row" aria-labelledby="ba-h2"><h4 id="ba-h2">On the boss <small>${dOn} of ${B.D.debuffs.length} on</small></h4>
      <div class="bk-bar" role="group" aria-label="Debuffs on the boss">${B.D.debuffs.map(b=>tile(b,st)).join("")}<span class="bk-sep" aria-hidden="true"></span>${B.D.uncountedDebuffs.map(b=>tile(b,st)).join("")}</div></section>
      <section class="ba-row" aria-labelledby="ba-h3"><h4 id="ba-h3">Consumables <small>a flask takes both elixir slots</small></h4>
      <div class="ba-slots">${B.CATS.map(([k,l])=>slotHTML(k,l,st)).join("")}</div></section>`+
      (selB?`<div class="ba-sel"><div class="ba-tipbox">${B.tooltipHTML(ui.sel,st)}</div></div>`:"");
  });
  save();
}
body.addEventListener("click",e=>{
  const t=e.target.closest("[data-bid]");
  if(t){const id=t.dataset.bid,b=B.BY[id];ui.sel=id;const r=B.toggle(S.get(),id);
    if(r.why){render();say(r.why);return;}
    S.set(r.st,"buffs-a");const on=B.isOn(S.get(),id);
    say(r.msg||`${B.nameOf(b)} ${on?"on":"off"}${on?`: ${B.effectText(b)}`:""}.`);
    if(on&&b.hit&&window.TBCKit)window.TBCKit.swell(); /* K3: the hit cap just moved */
    return;}
  if(B.palsClick(e,S,"buffs-a",say))return;
  const sl=e.target.closest("[data-slot]");
  if(sl){ui.open=ui.open===sl.dataset.slot?null:sl.dataset.slot;render();
    if(ui.open){const f=body.querySelector(`#ba-fly-${ui.open} [aria-pressed="true"]`);if(f)f.focus();}return;}
  const c=e.target.closest("[data-ccat]");
  if(c){const cat=c.dataset.ccat;ui.open=null;B.conClick(e,S,"buffs-a",say);const back=body.querySelector(`[data-slot="${cat}"]`);if(back)back.focus();return;}
});
body.addEventListener("keydown",e=>{if(e.key==="Escape"&&ui.open){const cat=ui.open;ui.open=null;render();const b=body.querySelector(`[data-slot="${cat}"]`);if(b)b.focus();}});
mount.addEventListener("click",e=>{
  const id=e.target.id;
  if(id==="ba-example"){S.set(B.example(),"buffs-a");say("Loaded the example raid setup: what a melee group commonly gets in a 25-man.");}
  else if(id==="ba-all"){S.set(B.everything(S.get()),"buffs-a");say("Every counted buff, Blessing and debuff is on.");}
  else if(id==="ba-none"){S.set(B.empty(),"buffs-a");say("Cleared: no buffs, Paladins, debuffs or consumables.");}
});
B.hoverTips(body,()=>S.get());
document.addEventListener("buffs:change",render);
render();B.openBuffsTab();
})();
