/* build-b.js — Build design B, "Character select": like the game's character-select screen. A column of builds on the
   left: what is in the planner now, then every build saved in this browser (spec icon, item level, hit against the cap).
   The selected one is shown on the right as a card with a paperdoll of its gear, and its actions: load it into the
   planner, save the current build over it, share its link, or delete it. "Save the current build" adds a new entry;
   "Add from a paste" reads a link, build text or the addon's /pdexport into a new entry without touching the planner.
   An empty browser can take two example builds (the recommended set and the part-geared example) to try it with. */
(function(){
"use strict";
const K=window.BuildKit;if(!K)return;
const {G,esc}=K;
const mount=document.getElementById("bdui");if(!mount)return;
const IN_PLANNER=/b/.test(window.BUILD_IN_PLANNER||"");
let sel="__now",msg="",result=null,adding=false;
const say=t=>{msg=t;const m=mount.querySelector("#bb-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.bb-wrap{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:860px){.bb-wrap{grid-template-columns:280px minmax(0,1fr)}}
.bb-list{list-style:none;margin:0;padding:0;display:grid;gap:6px;align-content:start}
.bb-pick{display:grid;grid-template-columns:40px minmax(0,1fr);gap:1px 10px;align-items:center;width:100%;text-align:left;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:8px 10px;color:var(--ink);cursor:pointer;font:inherit}
.bb-pick img{width:40px;height:40px;border-radius:7px;grid-row:span 2;border:1.5px solid var(--rim)}
.bb-pick b{font:400 var(--t-md) var(--f-head);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bb-pick small{color:var(--ink-3);font-size:var(--t-xs)}
.bb-pick[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 12%,var(--scrim));box-shadow:0 0 16px -8px var(--glow)}
.bb-pick[aria-pressed="true"] img{border-color:var(--glow)}
.bb-pick:hover,.bb-pick:focus-visible{border-color:var(--glow)}
.bb-new{display:grid;gap:6px;margin-top:4px}
.bb-detail{display:grid;gap:10px;align-content:start}
.bb-doll{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px}
.bb-doll span{display:flex;align-items:center;gap:6px;font-size:var(--t-xs);color:var(--ink-2);background:var(--scrim);border:1px solid var(--rim-2);border-radius:8px;padding:3px 6px;min-width:0}
.bb-doll img{width:24px;height:24px;border-radius:4px;border:1.5px solid var(--q,var(--rim));flex:none}
.bb-doll em{font-style:normal;color:var(--ink-3);font:600 9.5px var(--f-mono);width:20px;flex:none}
.bb-doll .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bb-acts{display:flex;flex-wrap:wrap;gap:8px}
.bb-sm{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink);border-radius:999px;padding:7px 12px;cursor:pointer;min-height:34px}
.bb-sm:hover,.bb-sm:focus-visible{border-color:var(--glow);color:var(--glow)}
.bb-sm.danger:hover,.bb-sm.danger:focus-visible{border-color:#ff8f86;color:#ff8f86}
@media (max-width:699px),(pointer:coarse){.bb-sm{min-height:44px}.bb-pick{min-height:56px}}`;
document.head.appendChild(css);

const entries=()=>[{name:"__now",label:"Now in the planner",build:K.snapshot(),now:true}].concat(K.saves().map(x=>({name:x.name,label:x.name,build:x.build})));
function pickHTML(x){const s=K.summary(x.build);
  return `<li><button type="button" class="bb-pick" data-sel="${esc(x.name)}" aria-pressed="${x.name===sel}">${s.icon?`<img src="${G.iconUrl(s.icon)}" alt="">`:"<span></span>"}<b>${esc(x.label)}</b>
    <small>${esc(s.spec)} · ilvl ${s.ilvl||"–"} · hit ${s.hit}/${s.cap}${x.now?" · unsaved":""}</small></button></li>`;}
function dollHTML(build){const s=K.summary(build);
  return `<div class="bb-doll" aria-label="Gear">`+G.SLOTS.map(({key,glyph})=>{const it=G.item(s.st[key].item);
    return `<span title="${esc(key)}"><em>${glyph}</em>${it?`<img src="${G.iconUrl(it.icon)}" alt="" style="--q:${G.qVar(it.q)}"><span class="nm" style="color:${G.qVar(it.q)}">${esc(it.name)}</span>`:`<span class="nm">Empty</span>`}</span>`;}).join("")+`</div>`;}

function render(){
  const list=entries();if(!list.some(x=>x.name===sel))sel="__now";
  const cur=list.find(x=>x.name===sel);
  let h=(IN_PLANNER?"":`<h3>Build</h3>`)+`<p class="lead">Your builds, like the game's character select. Nothing is saved automatically: save the build in the planner under a name to keep it in this browser, or share its link, which opens it in the live app on any device.</p>`;
  h+=`<div class="bb-wrap"><div><ul class="bb-list" aria-label="Builds">${list.map(pickHTML).join("")}</ul>
    <div class="bb-new"><input class="bd-name" id="bb-name" type="text" maxlength="${K.MAX_NAME}" placeholder="Name, e.g. Fury BiS" aria-label="Name for the current build">
    <button type="button" class="bb-sm" data-act="save">Save the current build</button>
    <button type="button" class="bb-sm" data-act="adding" aria-expanded="${adding}">Add from a paste</button>
    ${list.length<2?`<button type="button" class="bb-sm" data-act="examples">Add two example builds</button>`:""}</div></div>`;
  h+=`<div class="bb-detail">${K.cardHTML(cur.build,cur.now?"Now in the planner":cur.label)}${dollHTML(cur.build)}<div class="bb-acts">`+
    (cur.now?`<button type="button" class="btn magnet" data-act="link">Copy share link</button>`
      :`<button type="button" class="btn magnet" data-act="wear">Load into the planner</button><button type="button" class="bb-sm" data-act="link">Copy share link</button><button type="button" class="bb-sm" data-act="over">Save the current build over it</button><button type="button" class="bb-sm danger" data-act="del">Delete</button>`)+
    `</div><p class="okline rk-msg" id="bb-msg" aria-live="polite">${esc(msg)}</p>`;
  if(adding)h+=`<div><textarea class="bd-box" id="importbox" aria-label="Paste a link, build text or the addon's export" placeholder="Paste a build link, the build text, or the string from the addon's /pdexport"></textarea>
    <div class="bd-row"><button type="button" class="bb-sm" data-act="add">Add it to the list</button></div><div aria-live="polite">${result&&!result.ok?K.resultHTML(result):""}</div></div>`;
  h+=`</div></div>`;
  mount.innerHTML=h;
}
const focusSel=()=>{const f=mount.querySelector(`[data-sel="${CSS.escape(sel)}"]`);if(f)f.focus();};

mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.sel){sel=t.dataset.sel;msg="";render();focusSel();return;}
  const a=t.dataset.act,list=entries(),cur=list.find(x=>x.name===sel);
  if(a==="save"){const f=mount.querySelector("#bb-name"),n=K.save(f&&f.value,K.snapshot());
    if(!n){say(f&&f.value.trim()?"This browser wouldn't save it.":"Give the build a name first.");if(f)f.focus();return;}
    sel=n;render();say(`Saved as "${n}".`);focusSel();return;}
  if(a==="adding"){adding=!adding;result=null;render();const b=mount.querySelector(adding?"#importbox":'[data-act="adding"]');if(b)b.focus();return;}
  if(a==="examples"){K.save("Part-geared example",K.snapshot(G.partGeared()));K.save("Fury BiS (recommended set)",K.snapshot(G.recommended()));
    sel="Fury BiS (recommended set)";render();say("Added two example builds, made from the planner's talents and buffs.");focusSel();return;}
  if(a==="add"){const box=mount.querySelector("#importbox"),r=await K.read(box?box.value:"");result=r;
    if(!r.ok){const v=box.value;render();const b=mount.querySelector("#importbox");if(b){b.value=v;b.focus();}say("Nothing was added.");return;}
    const base=r.kind==="addon"?"From the addon":"Pasted build";let n=base,i=2;while(K.saves().some(x=>x.name===n))n=`${base} ${i++}`;
    K.save(n,r.build);sel=n;adding=false;render();
    say(`Added "${n}"${r.issues.length?`, with ${r.issues.length} note${r.issues.length===1?"":"s"}: ${r.issues[0]}`:""}. Load it to wear it.`);focusSel();return;}
  if(a==="link"){const u=await K.linkFor(cur.build);say(await K.copy(u)?`Share link copied for ${cur.now?"the build in the planner":`"${cur.label}"`}.`:`The browser wouldn't copy it. The link is: ${u}`);return;}
  if(a==="wear"){const r=await K.read(JSON.stringify(cur.build));if(r.ok){K.apply(r,"build-b");render();say(`Loaded "${cur.label}". The Gear, Talents and Buffs tabs show it.`);if(window.TBCKit)window.TBCKit.swell();}return;}
  if(a==="over"){K.save(cur.name,K.snapshot());render();say(`"${cur.label}" now holds the build in the planner.`);focusSel();return;}
  if(a==="del"){const n=cur.label;K.removeSave(cur.name);sel="__now";render();say(`Deleted "${n}".`);focusSel();}
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="build-b"){const keep=mount.querySelector("#importbox"),v=keep?keep.value:"";render();const b=mount.querySelector("#importbox");if(b)b.value=v;}});
/* the Gear tab's "Import your character" lands on the paste box */
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#gx-import")&&!adding){adding=true;result=null;render();}});
render();if(!IN_PLANNER)K.openTab();
})();
