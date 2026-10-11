/* build-c.js — Build design C, "Bring your character in": paste-first. One big box takes the string from the in-game
   addon's /pdexport, a build link or the build text. Reading it changes nothing: a report says what came in, slot by
   slot (worn, or left empty and why), the talents and the spec, and anything it couldn't place. Only "Load into the
   planner" puts it on the Gear, Talents and Buffs tabs. When the talents don't say which spec it is (an even split,
   or no points), the report asks. Sharing and saving the build in the planner sit to the side. The example export is
   written in the addon's real format from the Gear tab's part-geared example, and labelled as an example. */
(function(){
"use strict";
const K=window.BuildKit;if(!K)return;
const {G,T,esc}=K;
const mount=document.getElementById("bdui");if(!mount)return;
const IN_PLANNER=/c/.test(window.BUILD_IN_PLANNER||"");
let read=null,draft="",msg="",spec=null;
const say=t=>{msg=t;const m=mount.querySelector("#bc2-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.bc2-wrap{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:960px){.bc2-wrap{grid-template-columns:minmax(0,1fr) 300px}}
.bc2-paste textarea{min-height:150px}
.bc2-side{display:grid;gap:10px;align-content:start}
.bc2-side h4{font:400 var(--t-md) var(--f-head);margin:0}`;
document.head.appendChild(css);

function render(){
  let h=(IN_PLANNER?"":`<h3>Build</h3>`)+`<p class="lead">Bring your character in. Paste the string from the addon's <span class="num">/pdexport</span>, a build link or the build text. Reading it changes nothing: you see what came in first, then load it into the planner.</p>`;
  h+=`<div class="bc2-wrap"><div class="bc2-paste"><textarea class="bd-box" id="importbox" aria-label="Paste the addon's export, a link or build text" placeholder="Paste the string from the addon's /pdexport, a build link, or the build text">${esc(draft)}</textarea>
    <div class="bd-row"><button type="button" class="btn" data-act="read">Read it</button><button type="button" class="bc2-sm" data-act="example">Paste an example /pdexport</button><span class="bd-ex">example</span></div>
    ${K.reportHTML(read,spec)}<p class="okline rk-msg" id="bc2-msg" aria-live="polite">${esc(msg)}</p></div>`;
  h+=`<aside class="bc2-side" aria-label="Share or save the build in the planner"><h4>The build in the planner</h4>${K.cardHTML(K.snapshot(),"Now in the planner")}
    <div class="bd-row" style="margin:0"><button type="button" class="bc2-sm" data-act="link">Copy share link</button><button type="button" class="bc2-sm" data-act="text">Copy build text</button></div>
    <div class="bd-row" style="margin:0"><input class="bd-name" id="bc2-name" type="text" maxlength="${K.MAX_NAME}" placeholder="Name, e.g. Fury BiS" aria-label="Name this build"><button type="button" class="bc2-sm" data-act="save">Save</button></div>
    ${K.saves().length?`<p class="rk-src" style="margin:0">Saved in this browser: ${K.saves().map(x=>esc(x.name)).join(", ")}</p>`:""}</aside></div>`;
  mount.innerHTML=h;
}

mount.addEventListener("input",e=>{if(e.target.id==="importbox")draft=e.target.value;});
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t||t.disabled)return;
  const a=t.dataset.act;
  if(a==="example"){draft=K.exampleAddon();read=null;spec=null;render();const b=mount.querySelector("#importbox");if(b)b.focus();say("Pasted an example export, written in the addon's format from the Gear tab's part-geared example.");return;}
  if(a==="read"){read=await K.read(draft);spec=null;render();say(read.ok?"Read. Check what came in, then load it.":"Nothing was changed.");
    const f=mount.querySelector(read.ok?(read.specChoice?"[data-spec]":'[data-act="wear"]'):"#importbox");if(f)f.focus();return;}
  if(t.dataset.spec){spec=t.dataset.spec;read.build.character.spec=spec;render();say(`Set as ${spec}.`);const f=mount.querySelector('[data-act="wear"]');if(f)f.focus();return;}
  if(a==="wear"&&read&&read.ok){K.apply(read,"build-c");const n=Object.keys(read.parts.gear).length;read=null;draft="";spec=null;render();
    say(`Loaded: ${n} of 17 slots and the talents. The Gear, Talents and Buffs tabs show it.`);if(window.TBCKit)window.TBCKit.swell();const f=mount.querySelector("#importbox");if(f)f.focus();return;}
  if(a==="clear"){read=null;draft="";spec=null;render();say("Cleared.");const f=mount.querySelector("#importbox");if(f)f.focus();return;}
  if(a==="link"){const u=await K.linkFor(K.snapshot());say(await K.copy(u)?"Share link copied. It opens this build in the live app.":`The browser wouldn't copy it. The link is: ${u}`);return;}
  if(a==="text"){say(await K.copy(K.textOf(K.snapshot()))?"Build text copied.":"The browser wouldn't copy it.");return;}
  if(a==="save"){const f=mount.querySelector("#bc2-name"),n=K.save(f&&f.value,K.snapshot());render();say(n?`Saved as "${n}" in this browser.`:"Give the build a name first.");const g=mount.querySelector("#bc2-name");if(g&&!n)g.focus();}
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="build-c")render();});
render();if(!IN_PLANNER)K.openTab();
})();
