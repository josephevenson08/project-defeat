/* build-a.js — Build design A, "Share card": the build you are about to share comes first, as a card (spec, slots
   filled, item level, talents, hit against the cap, buffs, set pieces, and the gear's icons). Under it, the link to the
   live app, ready to copy or hand to the system's share sheet, and the build text. Then named saves in this browser,
   and one box to load a link, build text or the addon's /pdexport. Nothing is saved automatically.
   Inside the Character Planner (picked 2026-10-10: A with C's report), the box reads first: design C's report shows
   what came in, slot by slot, and asks the spec when the talents can't say; only "Load into the planner" changes
   anything. The box also offers C's example export. */
(function(){
"use strict";
const K=window.BuildKit;if(!K)return;
const {esc}=K;
const mount=document.getElementById("bdui");if(!mount)return;
const IN_PLANNER=/a/.test(window.BUILD_IN_PLANNER||"");
const REPORT=IN_PLANNER;
let link="",result=null,msg="",lmsg="",pending=null,spec=null,draft="";
const say=t=>{msg=t;const m=mount.querySelector("#ba-msg");if(m)m.textContent=t;};
/* what happened to a paste is said beside the paste box, not up by the share link */
const sayLoad=t=>{lmsg=t;const m=mount.querySelector("#ba-lmsg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.ba-sec{margin:16px 0 0}
.ba-sec h4{font:400 var(--t-lg) var(--f-head);margin:0 0 6px}
.ba-saves{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px}
.ba-saves li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:center;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:8px 10px}
.ba-saves li small{color:var(--ink-3);font-size:var(--t-xs)}
.ba-saves .acts{grid-row:span 2;grid-column:2;display:flex;gap:6px}
.ba-none{color:var(--ink-3);font-size:var(--t-sm)}
.ba-sm{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer;min-height:32px}
.ba-sm:hover,.ba-sm:focus-visible{border-color:var(--glow);color:var(--glow)}
@media (max-width:699px),(pointer:coarse){.ba-sm{min-height:44px}}`;
document.head.appendChild(css);

function savesHTML(){
  const list=K.saves();
  if(!list.length)return `<p class="ba-none">No saved builds yet in this browser.</p>`;
  return `<ul class="ba-saves">`+list.map(x=>{const s=K.summary(x.build);
    return `<li><b>${esc(x.name)}</b><span class="acts"><button type="button" class="ba-sm" data-load="${esc(x.name)}">Load</button><button type="button" class="ba-sm" data-del="${esc(x.name)}" aria-label="Delete ${esc(x.name)}">Delete</button></span>
      <small>${esc(s.spec)} · ${s.filled} of 17 slots · item level ${s.ilvl||"–"} · talents ${s.split.join(" / ")} · hit ${s.hit} / ${s.cap}</small></li>`;}).join("")+`</ul>`;
}

function render(){
  const build=K.snapshot();
  let h=(IN_PLANNER?"":`<h3>Build</h3>`)+`<p class="lead">Nothing is saved automatically. Share this build as a link: it opens the same character in the live app on any device, and nothing is uploaded, since the build is in the link.</p>`;
  h+=K.cardHTML(build,"This build");
  h+=`<div class="bd-row"><button type="button" class="btn magnet" data-act="copy">Copy share link</button>`+
    (navigator.share?`<button type="button" class="btn ghost" data-act="share">Share…</button>`:"")+
    `<button type="button" class="btn ghost" data-act="text">Copy build text</button></div>`;
  h+=`<label class="bfield">Link to this build in the live app<input class="bd-link" id="ba-link" type="text" readonly value="${esc(link)}"></label>`;
  h+=`<p class="okline rk-msg" id="ba-msg" aria-live="polite">${esc(msg)}</p>`;
  h+=`<section class="ba-sec" aria-label="Saved builds"><h4>Saved builds</h4><div class="bd-row" style="margin:0"><input class="bd-name" id="ba-name" type="text" maxlength="${K.MAX_NAME}" placeholder="Name this build, e.g. Fury BiS" aria-label="Name this build"><button type="button" class="ba-sm" data-act="save">Save in this browser</button></div>${savesHTML()}</section>`;
  const box=`<textarea class="bd-box" id="importbox" aria-label="Paste a link, build text or the addon's export" placeholder="Paste a build link, the build text, or the string from the addon's /pdexport">${esc(draft)}</textarea>`;
  h+=REPORT
    ?`<section class="ba-sec" aria-label="Load a build"><h4>Load a build</h4><p class="rk-src" style="margin:0 0 6px">Reading it changes nothing: you see what came in first, then load it.</p>${box}
      <div class="bd-row"><button type="button" class="ba-sm" data-act="read">Read it</button><button type="button" class="ba-sm" data-act="example">Paste an example /pdexport</button><span class="bd-ex">example</span></div>${K.reportHTML(pending,spec)}<p class="okline" id="ba-lmsg" aria-live="polite">${esc(lmsg)}</p></section>`
    :`<section class="ba-sec" aria-label="Load a build"><h4>Load a build</h4>${box}
      <div class="bd-row"><button type="button" class="ba-sm" data-act="load">Load pasted build</button></div><div id="ba-result" aria-live="polite">${K.resultHTML(result)}</div><p class="okline" id="ba-lmsg" aria-live="polite">${esc(lmsg)}</p></section>`;
  h+=`<details class="ba-sec"><summary>Show build text</summary><textarea class="bd-box" readonly aria-label="This build as text">${esc(K.textOf(build))}</textarea></details>`;
  mount.innerHTML=h;
  K.linkFor(build).then(u=>{link=u;const f=mount.querySelector("#ba-link");if(f)f.value=u;});
}

mount.addEventListener("input",e=>{if(e.target.id==="importbox")draft=e.target.value;});
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t||t.disabled)return;
  const a=t.dataset.act;
  /* the planner's two-step load (design C's report) */
  if(a==="example"){draft=K.exampleAddon();pending=null;spec=null;render();const b=mount.querySelector("#importbox");if(b)b.focus();sayLoad("Pasted an example export, written in the addon's format from the Gear tab's part-geared example.");return;}
  if(a==="read"){pending=await K.read(draft);spec=null;render();sayLoad(pending.ok?"Read. Check what came in, then load it.":"Nothing was changed.");
    const f=mount.querySelector(pending.ok?(pending.specChoice?"[data-spec]":'[data-act="wear"]'):"#importbox");if(f)f.focus();return;}
  if(t.dataset.spec&&pending&&pending.ok){spec=t.dataset.spec;pending.build.character.spec=spec;render();sayLoad(`Set as ${spec}.`);const f=mount.querySelector('[data-act="wear"]');if(f)f.focus();return;}
  if(a==="wear"&&pending&&pending.ok){K.apply(pending,"build-a");const n=Object.keys(pending.parts.gear).length;pending=null;draft="";spec=null;render();
    sayLoad(`Loaded: ${n} of 17 slots and the talents. The Gear, Talents and Buffs tabs show it.`);if(window.TBCKit)window.TBCKit.swell();const f=mount.querySelector("#importbox");if(f)f.focus();return;}
  if(a==="clear"){pending=null;draft="";spec=null;render();sayLoad("Cleared.");const f=mount.querySelector("#importbox");if(f)f.focus();return;}
  if(a==="copy"){const u=await K.linkFor(K.snapshot());link=u;const f=mount.querySelector("#ba-link");if(f)f.value=u;
    say(await K.copy(u)?"Share link copied. Anyone who opens it gets this build in the live app.":"The browser wouldn't copy it, so select the link above and copy it by hand.");
    if(window.TBCKit)window.TBCKit.swell();return;}
  if(a==="share"){try{await navigator.share({title:"Project Defeat build",url:await K.linkFor(K.snapshot())});say("Shared.");}catch(err){say("Not shared.");}return;}
  if(a==="text"){say(await K.copy(K.textOf(K.snapshot()))?"Build text copied.":"The browser wouldn't copy it; open \"Show build text\" below.");return;}
  if(a==="save"){const f=mount.querySelector("#ba-name"),n=K.save(f&&f.value,K.snapshot());
    if(!n){say(f&&f.value.trim()?"This browser wouldn't save it.":"Give the build a name first.");if(f)f.focus();return;}
    render();say(`Saved as "${n}" in this browser.`);const l=mount.querySelector(`[data-load="${CSS.escape(n)}"]`);if(l)l.focus();return;}
  if(a==="load"){const box=mount.querySelector("#importbox"),r=await K.read(box?box.value:"");result=r;
    if(r.ok){K.apply(r,"build-a");draft="";render();sayLoad("Build loaded. The Gear, Talents and Buffs tabs show it.");}
    else{render();const b=mount.querySelector("#importbox");if(b)b.focus();sayLoad("Nothing was changed.");}return;}
  if(t.dataset.load){const x=K.saves().find(s=>s.name===t.dataset.load);if(!x)return;const r=await K.read(JSON.stringify(x.build));
    if(r.ok){K.apply(r,"build-a");result=null;render();say(`Loaded "${x.name}". The Gear, Talents and Buffs tabs show it.`);}return;}
  if(t.dataset.del){const n=t.dataset.del;K.removeSave(n);render();say(`Deleted "${n}".`);const f=mount.querySelector("#ba-name");if(f)f.focus();}
});
/* keep the card and the link true to the build as it changes on the other tabs */
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="build-a")render();});
render();if(!IN_PLANNER)K.openTab();
})();
