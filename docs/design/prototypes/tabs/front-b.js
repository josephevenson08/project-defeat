/* front-b.js — Front door design B, "What are you here to do?": goal first, because in the usability study the goal
   chose the first click (USABILITY-STUDY.md). One clear list of jobs, each in its tab's colour and naming the section
   it opens, so visitors still learn the five places: gear my character, simulate my DPS, plan a raid, see where my
   spec stands, find what drops where, level a profession, and bring my character from the game, which opens the
   import right there. The five sections follow as plain links for anyone who knows where they're going. */
(function(){
"use strict";
const X=window.FrontKit;if(!X)return;
const {esc,SECTIONS,BY,glimpse,fact}=X;
const mount=document.getElementById("front");if(!mount)return;
let open=false,err="",pending=null;

const css=document.createElement("style");
css.textContent=`
.fd-b .fd-head{margin-bottom:10px}
.fd-b .fd-head h1{font-size:clamp(1.8rem,4.5vw,2.6rem)}
.fb-q{font:400 clamp(1.5rem,4vw,2.2rem)/1.15 var(--f-head);text-align:center;margin:10px 0 18px}
.fb-goals{list-style:none;margin:0 auto;padding:0;display:grid;gap:8px;max-width:820px}
.fb-goal{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:2px 14px;align-items:center;width:100%;text-align:left;text-decoration:none;color:var(--ink);font:inherit;
  background:var(--glass);border:1px solid rgba(255,255,255,.08);border-left:4px solid var(--a);border-radius:12px;padding:12px 16px;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}
.fb-goal:hover,.fb-goal:focus-visible{background:color-mix(in srgb,var(--a) 12%,var(--glass));border-color:color-mix(in srgb,var(--a) 50%,transparent);border-left-color:var(--a);transform:translateX(3px)}
.fb-goal .ic{grid-row:span 2;width:52px;height:52px;border-radius:10px;border:1.5px solid color-mix(in srgb,var(--a) 60%,transparent);background:#05080b center/cover no-repeat;object-fit:cover}
.fb-goal .t{font:400 var(--t-xl)/1.15 var(--f-head)}
.fb-goal .d{grid-column:2;color:var(--ink-2);font-size:var(--t-sm)}
.fb-goal .w{grid-row:span 2;display:flex;align-items:center;gap:8px;font:600 var(--t-xs) var(--f-body);color:var(--a);white-space:nowrap}
.fb-goal .w::after{content:"→";font-size:1.2rem}
.fb-goal[aria-expanded="true"] .w::after{content:"↓"}
.fb-imp{margin:-2px 0 0;background:var(--glass);border:1px dashed var(--rim);border-radius:0 0 12px 12px;padding:12px 16px}
.fb-or{max-width:820px;margin:18px auto 0;display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;justify-content:center;font-size:var(--t-sm);color:var(--ink-3)}
.fb-or a{color:var(--ink);text-decoration:none;border:1px solid color-mix(in srgb,var(--a) 50%,transparent);border-radius:999px;padding:5px 12px;font-weight:600;font-size:var(--t-xs)}
.fb-or a:hover,.fb-or a:focus-visible{border-color:var(--a);color:var(--a)}
@media (max-width:699px){.fb-goal{grid-template-columns:44px minmax(0,1fr)}.fb-goal .ic{width:44px;height:44px}.fb-goal .w{grid-column:2;grid-row:auto}.fb-goal .t{font-size:var(--t-lg)}}
@media (max-width:699px),(pointer:coarse){.fb-or a{min-height:44px;display:inline-flex;align-items:center}}
@media (prefers-reduced-motion:reduce){.fb-goal:hover,.fb-goal:focus-visible{transform:none}}`;
document.head.appendChild(css);

const raidArt=()=>{const r=glimpse.raids()[0];return r?r.art:null;};
function goalHTML(s){
  const pic=s.id==="raids"?`<span class="ic" style="background-image:url('${raidArt()}')" aria-hidden="true"></span>`:`<img class="ic" src="${X.icon(s.goalIcon)}" alt="">`;
  return `<li><a class="fb-goal" href="${s.href}" style="--a:${s.accent}" aria-labelledby="fb-t-${s.id}" aria-describedby="fb-d-${s.id}">${pic}<span class="t" id="fb-t-${s.id}">${esc(s.goal)}</span>
    <span class="w" aria-hidden="true">${esc(s.label)}</span><span class="d" id="fb-d-${s.id}">${esc(s.goalSub)} <span class="sr">Opens ${esc(s.label)}.</span></span></a></li>`;
}
function importHTML(){
  return `<li><button type="button" class="fb-goal" style="--a:#ece6d8" aria-expanded="${open}" aria-controls="fb-imp" data-act="toggle"><img class="ic" src="${X.icon("inv_misc_note_01")}" alt="">
      <span class="t">Bring my character from the game</span><span class="w" aria-hidden="true">Import</span><span class="d">Paste the addon's /pdexport and the planner opens wearing your character.</span></button>
    ${open?`<div class="fb-imp fd-import" id="fb-imp"><p>${esc(X.importText)}</p><textarea id="fb-paste" aria-label="Paste your character export" placeholder='{"format":"project-defeat-character" …'></textarea>
      ${pending&&pending.specChoice?`<p class="fd-err">${pending.specChoice.reason==="no-points"?"No talent points are spent":"The talent points are evenly split"}, so the export can't say which spec it is. Which is it? ${pending.specChoice.candidates.map(c=>`<button type="button" class="fd-btn" data-spec="${esc(c)}">${esc(c)}</button>`).join(" ")}</p>`:""}
      ${err?`<p class="fd-err" role="alert">${esc(err)}</p>`:""}
      <div class="row"><button type="button" class="fd-btn primary" data-act="load">Load my character</button><button type="button" class="fd-btn" data-act="example">Paste an example</button><span class="fd-ex">example</span></div></div>`:""}</li>`;
}
function render(keep){
  const v=keep?(mount.querySelector("#fb-paste")||{}).value:"";
  mount.innerHTML=X.head+`<h2 class="fb-q" id="fb-q">What are you here to do?</h2><ul class="fb-goals" aria-labelledby="fb-q">`+
    ["planner","simulation","raidcomp","tierlists","raids","professions"].map(id=>goalHTML(BY[id])).join("")+importHTML()+`</ul>`+
    `<nav class="fb-or" aria-label="Or go straight to a section"><span>Or go straight to</span>${SECTIONS.map(s=>`<a href="${s.href}" style="--a:${s.accent}">${esc(s.label)}</a>`).join("")}</nav>`;
  const t=mount.querySelector("#fb-paste");if(t&&v)t.value=v;
}
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  const a=t.dataset.act,box=()=>mount.querySelector("#fb-paste");
  if(a==="toggle"){open=!open;err="";pending=null;render();if(open)box().focus();else mount.querySelector('[data-act="toggle"]').focus();return;}
  if(a==="example"){render(true);box().value=X.exampleExport();box().focus();return;}
  if(a==="load"||t.dataset.spec){const r=await X.arrive(box().value,t.dataset.spec);
    if(!r.ok){err=r.error;pending=null;render(true);box().focus();return;}
    if(r.specChoice&&!t.dataset.spec){pending=r;err="";render(true);const f=mount.querySelector("[data-spec]");if(f)f.focus();}}
});
render();
})();
