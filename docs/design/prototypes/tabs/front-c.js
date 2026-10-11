/* front-c.js — Front door design C, "Game menu": like a game's main menu over the owner's backdrop, the Launcher the
   owner picked in round 1. A rail of big entries on the left (the five sections and the simulator, then "Continue as
   your character"); a large preview on the right that follows the entry you point at or move to with the keyboard:
   what is inside, a real glimpse of it, and the way in. Up and down arrows move along the rail. On a phone the preview
   folds into the rail, so each entry carries its own sentence. */
(function(){
"use strict";
const X=window.FrontKit;if(!X)return;
const {esc,SECTIONS,BY,glimpse,fact,icons}=X;
const mount=document.getElementById("front");if(!mount)return;
const ORDER=["planner","simulation","raidcomp","tierlists","raids","professions","arrive"];
let sel="planner",err="",pending=null;

const css=document.createElement("style");
css.textContent=`
.fd-c main{max-width:1240px}
.fc-wrap{display:grid;gap:18px;grid-template-columns:minmax(0,1fr);min-height:calc(100vh - 140px)}
@media (min-width:900px){.fc-wrap{grid-template-columns:320px minmax(0,1fr);align-items:start}}
.fc-rail .fd-head{text-align:left;margin:0 0 16px}
.fc-rail .fd-head h1{font-size:clamp(2rem,3.4vw,2.6rem)}
.fc-menu{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.fc-item{display:grid;grid-template-columns:4px minmax(0,1fr);gap:0 12px;align-items:center;text-decoration:none;color:var(--ink-2);padding:10px 12px 10px 0;border-radius:8px;width:100%;text-align:left;font:inherit;background:none;border:0;cursor:pointer}
.fc-item::before{content:"";align-self:stretch;border-radius:2px;background:transparent}
.fc-item .t{font:400 clamp(1.25rem,2.2vw,1.5rem)/1.15 var(--f-head);letter-spacing:.03em}
.fc-item .g{grid-column:2;font:500 var(--t-xs) var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.fc-item .m{grid-column:2;display:none;color:var(--ink-2);font-size:var(--t-sm);margin-top:4px}
.fc-item[aria-current="true"],.fc-item:hover,.fc-item:focus-visible{color:var(--ink);background:linear-gradient(90deg,color-mix(in srgb,var(--a) 18%,transparent),transparent)}
.fc-item[aria-current="true"]::before{background:var(--a);box-shadow:0 0 14px var(--a)}
.fc-item[aria-current="true"] .g{color:var(--a)}
.fc-sep{height:1px;background:var(--rim-2);margin:8px 0}
.fc-fact{display:block;font:500 var(--t-xs) var(--f-mono);color:var(--ink-3);margin-top:4px}
.fc-pre{position:relative;border-radius:16px;overflow:hidden;background:var(--glass);border:1px solid color-mix(in srgb,var(--a) 40%,transparent);min-height:380px;display:flex;flex-direction:column;justify-content:flex-end}
.fc-pre .bg{position:absolute;inset:0;background:var(--art,none) center/cover no-repeat;opacity:.55}
.fc-pre .bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,8,11,.1),rgba(6,8,11,.92) 70%)}
.fc-pre .in{position:relative;padding:24px 26px}
.fc-pre .g{font:500 var(--t-xs) var(--f-mono);letter-spacing:.16em;text-transform:uppercase;color:var(--a)}
.fc-pre h2{font:400 clamp(2rem,4vw,3rem)/1.05 var(--f-head);margin:6px 0 10px}
.fc-pre p.d{max-width:58ch;color:var(--ink-2);margin:0 0 14px}
.fc-pre .gl{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.fc-pre .gl img{width:40px;height:40px;border-radius:7px;border:1.5px solid var(--q,color-mix(in srgb,var(--a) 50%,transparent));background:#05080b}
.fc-pre .specs{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 12px;list-style:none;padding:0}
.fc-pre .specs li{display:flex;align-items:center;gap:8px}
.fc-pre .specs img{width:34px;height:34px;border-radius:50%;border:1.5px solid var(--a)}
.fc-pre .raids{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:0 0 12px}
.fc-pre .raids span{display:grid;gap:2px;font-size:var(--t-xs);color:var(--ink-2)}
.fc-pre .raids b{font:400 var(--t-md) var(--f-head);color:var(--ink)}
.fc-pre .fact{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3);margin:0 0 14px}
.fc-go{display:inline-flex;align-items:center;gap:10px;font:600 var(--t-md) var(--f-body);background:var(--a);color:#0b0d10;border-radius:999px;padding:11px 22px;text-decoration:none;min-height:44px}
.fc-go:hover,.fc-go:focus-visible{filter:brightness(1.1)}
@media (max-width:899px){.fc-pre{display:none}.fc-item .m{display:block}.fc-item{padding:12px}}
@media (min-width:900px){.fc-arrive{display:none}}
@media (max-width:699px),(pointer:coarse){.fc-item{min-height:56px}}`;
document.head.appendChild(css);

const accent=id=>id==="arrive"?"#ece6d8":BY[id].accent;
function itemHTML(id){
  if(id==="arrive")return `<li class="fc-sep" role="presentation"></li><li><button type="button" class="fc-item" data-k="arrive" style="--a:${accent(id)}" aria-current="${sel===id}" aria-labelledby="fc-t-arrive" aria-describedby="fc-m-arrive">
    <span class="t" id="fc-t-arrive">Continue as your character</span><span class="g">Import from the game</span><span class="m" id="fc-m-arrive">Paste the addon's /pdexport and the planner opens wearing your character.</span></button></li>`;
  const s=BY[id];
  return `<li><a class="fc-item" href="${s.href}" data-k="${id}" style="--a:${s.accent}" aria-current="${sel===id}" aria-labelledby="fc-t-${id}" aria-describedby="fc-m-${id}"><span class="t" id="fc-t-${id}">${esc(s.label)}</span><span class="g">${esc(s.tagline)}</span><span class="m" id="fc-m-${id}">${esc(s.blurb)} <span class="fc-fact">${esc(fact[id]())}</span></span></a></li>`;
}
function importHTML(id){
  return `<div class="fd-import" id="${id}"><p>${esc(X.importText)}</p><textarea class="fc-paste" aria-label="Paste your character export" placeholder='{"format":"project-defeat-character" …'></textarea>
    ${pending&&pending.specChoice?`<p class="fd-err">${pending.specChoice.reason==="no-points"?"No talent points are spent":"The talent points are evenly split"}, so the export can't say which spec it is. Which is it? ${pending.specChoice.candidates.map(c=>`<button type="button" class="fd-btn" data-spec="${esc(c)}">${esc(c)}</button>`).join(" ")}</p>`:""}
    ${err?`<p class="fd-err" role="alert">${esc(err)}</p>`:""}
    <div class="row"><button type="button" class="fd-btn primary" data-act="load">Load my character</button><button type="button" class="fd-btn" data-act="example">Paste an example</button><span class="fd-ex">example</span></div></div>`;
}
function previewHTML(){
  if(sel==="arrive")return `<section class="fc-pre" style="--a:${accent("arrive")}" aria-label="Continue as your character"><div class="in"><span class="g">Import from the game</span><h2>Continue as your character</h2>
    <p class="d">Skip creating a character: bring yours in from the game and the planner opens wearing it.</p>${importHTML("fc-imp")}</div></section>`;
  const s=BY[sel],raids=glimpse.raids(),art=sel==="raids"&&raids[0]?raids[0].art:sel==="planner"||sel==="simulation"?null:null;
  let gl="";
  if(sel==="planner")gl=`<div class="gl" aria-hidden="true">${icons(glimpse.planner(),40)}</div>`;
  if(sel==="raidcomp")gl=`<div class="gl" aria-hidden="true">${icons(glimpse.raidcomp(),40)}</div>`;
  if(sel==="professions")gl=`<div class="gl" aria-hidden="true">${icons(glimpse.professions(),40)}</div>`;
  if(sel==="tierlists")gl=`<ul class="specs" aria-label="The top tier">${glimpse.tierlists().map(x=>`<li><img src="${X.icon(x.icon)}" alt="">${esc(x.name)}</li>`).join("")}</ul>`;
  if(sel==="raids")gl=`<div class="raids">${raids.map(r=>`<span><b>${esc(r.name)}</b>Phase ${r.phase} · ${r.bosses} bosses · ${r.drops} drops</span>`).join("")}</div>`;
  return `<section class="fc-pre" style="--a:${s.accent};${art?`--art:url('${art}')`:""}" aria-label="${esc(s.label)}"><span class="bg" aria-hidden="true"></span><div class="in"><span class="g">${esc(s.tagline)}</span><h2>${esc(s.label)}</h2>
    <p class="d">${esc(s.blurb)}</p>${gl}<p class="fact">${esc(fact[sel]())}</p><a class="fc-go" href="${s.href}">Enter ${esc(s.label)} <span aria-hidden="true">→</span></a></div></section>`;
}
/* the rail is drawn once; moving along it only marks the current entry and redraws the preview, so neither the
   keyboard focus nor the element under the pointer is ever replaced */
function render(){
  mount.innerHTML=`<div class="fc-wrap"><div class="fc-rail">${X.head}<nav aria-label="Choose a section"><ul class="fc-menu">${ORDER.map(itemHTML).join("")}</ul></nav>
    <div class="fc-arrive"${sel==="arrive"?"":" hidden"}>${importHTML("fc-imp-rail")}</div></div><div class="fc-side">${previewHTML()}</div></div>`;
}
function redraw(){
  const v=(mount.querySelector(".fc-paste:not([hidden])")||{}).value||"";
  mount.querySelectorAll(".fc-item").forEach(x=>x.setAttribute("aria-current",x.dataset.k===sel));
  const side=mount.querySelector(".fc-side");if(side)side.innerHTML=previewHTML();
  const rail=mount.querySelector(".fc-arrive");if(rail){rail.hidden=sel!=="arrive";rail.innerHTML=importHTML("fc-imp-rail");}
  mount.querySelectorAll(".fc-paste").forEach(t=>{if(v)t.value=v;});
}
const pick=k=>{if(k===sel)return;sel=k;err="";pending=null;redraw();};
mount.addEventListener("pointerover",e=>{const t=e.target.closest(".fc-item");if(t&&matchMedia("(min-width:900px)").matches)pick(t.dataset.k);});
mount.addEventListener("focusin",e=>{const t=e.target.closest(".fc-item");if(t)pick(t.dataset.k);});
mount.addEventListener("keydown",e=>{
  const t=e.target.closest(".fc-item");if(!t||(e.key!=="ArrowDown"&&e.key!=="ArrowUp"))return;
  e.preventDefault();const i=ORDER.indexOf(t.dataset.k),n=ORDER[(i+(e.key==="ArrowDown"?1:ORDER.length-1))%ORDER.length];
  const f=mount.querySelector(`.fc-item[data-k="${n}"]`);if(f)f.focus();
});
/* the paste box in view: the preview's on a wide screen, the rail's on a phone */
const liveBox=()=>[...mount.querySelectorAll(".fc-paste")].find(t=>t.offsetParent);
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.k==="arrive"){pick("arrive");const b=liveBox();if(b&&!matchMedia("(min-width:900px)").matches)b.focus();return;}
  const box=()=>(t.closest(".fd-import")&&t.closest(".fd-import").querySelector(".fc-paste"))||liveBox();
  if(t.dataset.act==="example"){box().value=X.exampleExport();box().focus();return;}
  if(t.dataset.act==="load"||t.dataset.spec){const r=await X.arrive(box().value,t.dataset.spec);
    if(!r.ok){err=r.error;pending=null;redraw();const b=liveBox();if(b)b.focus();return;}
    if(r.specChoice&&!t.dataset.spec){pending=r;err="";redraw();const f=[...mount.querySelectorAll("[data-spec]")].find(x=>x.offsetParent);if(f)f.focus();}}
});
render();
})();
