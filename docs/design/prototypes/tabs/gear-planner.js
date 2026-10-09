/* gear-planner.js — the Character Planner's Gear tab, as picked by the owner on 2026-10-09: design B's character sheet,
   with design C's checklist as a second view ("What's left"). This file owns what the two share: the preset buttons,
   the message line, the view switch and one shared character (window.GEAR_STORE_KEY). gear-b.js and gear-c.js draw the
   views into #gearui-b and #gearui-c, so this file must load before them. */
(function(){
"use strict";
window.GEAR_STORE_KEY="planner";
const G=window.GearKit,mount=document.getElementById("gearui");if(!G||!mount)return;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const KIT=()=>window.TBCKit||null;
const VKEY="pd-gear-planner-view";
let view="sheet";try{if(sessionStorage.getItem(VKEY)==="list")view="list";}catch(e){}

const css=document.createElement("style");
css.textContent=`
.gp-views{display:inline-flex;border:1px solid var(--rim);border-radius:999px;overflow:hidden;background:var(--glass-2);margin:0 0 12px}
.gp-views button{font:600 var(--t-sm) var(--f-body);background:none;border:0;color:var(--ink-2);padding:8px 16px;cursor:pointer;min-height:38px}
.gp-views button[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink)}
.gp-views .n{font:500 var(--t-xs) var(--f-mono);opacity:.85;margin-left:4px}
@media (max-width:699px),(pointer:coarse){.gp-views button{min-height:44px}}`;
document.head.appendChild(css);

mount.innerHTML=`
<div class="gx-tools">
  <button class="btn magnet" type="button" id="gx-rec">Equip the recommended set</button>
  <button class="btn ghost" type="button" id="gx-part">Load a part-geared example</button>
  <button class="btn ghost" type="button" id="gx-empty">Empty every slot</button>
  <button class="btn ghost" type="button" id="gx-import">Import your character</button>
</div>
<p class="okline" id="gx-msg" aria-live="polite"></p>
<div class="gp-views" role="group" aria-label="Gear view">
  <button type="button" data-gview="sheet" aria-pressed="true">Character sheet</button>
  <button type="button" data-gview="list" aria-pressed="false">What's left<span class="n" id="gp-n"></span></button>
</div>
<div id="gearui-b"></div>
<div id="gearui-c" hidden></div>`;

const S=G.store("planner");
const say=t=>{const m=$("#gx-msg");if(m)m.textContent=t;};
function count(){
  const n=G.SLOTS.filter(s=>G.todo(s.key,S.get())).length,el=$("#gp-n");
  if(el)el.textContent=n?` (${n})`:" (none)";
}
function show(v,focusList){
  view=v==="list"?"list":"sheet";
  const b=$("#gearui-b"),c=$("#gearui-c");if(b)b.hidden=view!=="sheet";if(c)c.hidden=view!=="list";
  $$(".gp-views [data-gview]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.gview===view));
  try{sessionStorage.setItem(VKEY,view);}catch(e){}
  if(focusList){const f=$('#gearui-c [data-show="todo"]');if(f)f.focus();}
}
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.gview){document.dispatchEvent(new CustomEvent("gear:view",{detail:{view:t.dataset.gview}}));t.focus();return;}
  if(t.id==="gx-rec"){S.set(G.recommended(),"planner");say("Equipped the recommended set: Wowhead's rank 1 in every slot (the second ring and trinket take rank 2), with its enchants and gems.");const K=KIT();if(K)K.swell();return;}
  if(t.id==="gx-part"){S.set(G.partGeared(),"planner");say("Loaded a part-geared example: five slots on lower-ranked items, the gloves unenchanted, one empty socket and one mismatched gem.");return;}
  if(t.id==="gx-empty"){S.set(G.empty(),"planner");say("Emptied every slot.");return;}
  if(t.id==="gx-import"){const b=document.getElementById("t-build");if(b)b.click();return;}
});
document.addEventListener("gear:view",e=>{const d=e.detail||{};if(d.view)show(d.view,!!d.focus);});
document.addEventListener("gear:change",count);
show(view);count();
})();
