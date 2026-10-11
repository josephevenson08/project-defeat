/* front-a.js — Front door design A, "Doors with a glimpse": the app's cards, each showing a real glimpse of what is
   behind it (the recommended set's icons, a raid group, the top tier, the raids' own art, the professions) and a fact
   from the data. Character Planner, the door most visitors take (USABILITY-STUDY.md), is the big one; the simulator and
   the import from the game sit beside it. Every door is in its tab's colour. */
(function(){
"use strict";
const X=window.FrontKit;if(!X)return;
const {esc,SECTIONS,BY,glimpse,fact,icons}=X;
const mount=document.getElementById("front");if(!mount)return;
let open=false,err="",pending=null;

const css=document.createElement("style");
css.textContent=`
.fa-grid{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.fa-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.fa-door.big{grid-column:span 2;grid-row:span 2}.fa-side{grid-column:span 2;grid-row:span 2}}
.fa-side{display:grid;gap:14px;align-content:start}
.fa-door{position:relative;display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);background:var(--glass);border:1px solid color-mix(in srgb,var(--a) 45%,transparent);border-radius:14px;padding:16px 18px;
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--a) 25%,transparent);transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease;overflow:hidden}
.fa-door::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:var(--a);opacity:.85}
.fa-door:hover,.fa-door:focus-visible{border-color:var(--a);box-shadow:0 10px 40px -18px var(--a),inset 0 1px 0 color-mix(in srgb,var(--a) 40%,transparent);transform:translateY(-2px)}
.fa-tag{font:500 var(--t-xs) var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--a)}
.fa-t{font:400 var(--t-xl)/1.1 var(--f-head);letter-spacing:.03em}
.fa-door.big .fa-t{font-size:clamp(1.7rem,3.4vw,2.3rem)}
.fa-d{color:var(--ink-2);font-size:var(--t-sm)}
.fa-gl{display:flex;flex-wrap:wrap;gap:4px;margin-top:auto;padding-top:8px}
.fa-gl img{width:30px;height:30px;border-radius:6px;border:1.5px solid var(--q,color-mix(in srgb,var(--a) 50%,transparent));background:#05080b}
.fa-door.big .fa-gl img{width:38px;height:38px}
.fa-fact{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3)}
.fa-specs{display:grid;gap:4px;margin-top:auto;padding-top:8px;list-style:none;margin-left:0;padding-left:0}
.fa-specs li{display:flex;align-items:center;gap:8px;font-size:var(--t-sm)}
.fa-specs img{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--a)}
.fa-art{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-top:auto;padding-top:8px}
.fa-art span{position:relative;aspect-ratio:3/4;border-radius:6px;overflow:hidden;background:#0b0d12 center/cover no-repeat;border:1px solid color-mix(in srgb,var(--a) 35%,transparent)}
.fa-art span::after{content:attr(data-p);position:absolute;left:3px;bottom:2px;font:600 9px var(--f-mono);color:#fff;text-shadow:0 1px 3px #000}
.fa-arrive{background:var(--glass);border:1px dashed var(--rim);border-radius:14px;padding:16px 18px}
.fa-arrive h2{font:400 var(--t-lg) var(--f-head);margin:0 0 4px}
.fa-arrive>p{margin:0 0 10px;color:var(--ink-2);font-size:var(--t-sm)}
@media (prefers-reduced-motion:reduce){.fa-door:hover,.fa-door:focus-visible{transform:none}}`;
document.head.appendChild(css);

const door=(s,cls,inner)=>`<a class="fa-door ${cls||""}" href="${s.href}" style="--a:${s.accent}" aria-labelledby="fa-t-${s.id}" aria-describedby="fa-d-${s.id} fa-f-${s.id}">
  <span class="fa-tag">${esc(s.tagline)}</span><span class="fa-t" id="fa-t-${s.id}">${esc(s.label)}</span><span class="fa-d" id="fa-d-${s.id}">${esc(s.blurb)}</span>${inner}<span class="fa-fact" id="fa-f-${s.id}">${esc(fact[s.id]())}</span></a>`;
const gl={
  planner:()=>`<span class="fa-gl" aria-hidden="true">${icons(glimpse.planner(),38)}</span>`,
  raidcomp:()=>`<span class="fa-gl" aria-hidden="true">${icons(glimpse.raidcomp(),30)}</span>`,
  tierlists:()=>`<ul class="fa-specs" aria-hidden="true">${glimpse.tierlists().map(x=>`<li><img src="${X.icon(x.icon)}" alt="">${esc(x.name)}</li>`).join("")}</ul>`,
  raids:()=>`<span class="fa-art" aria-hidden="true">${glimpse.raids().map(r=>`<span style="background-image:url('${r.art}')" data-p="P${r.phase}" title="${esc(r.name)}"></span>`).join("")}</span>`,
  professions:()=>`<span class="fa-gl" aria-hidden="true">${icons(glimpse.professions(),30)}</span>`,
};
function arriveHTML(){
  if(!open)return `<section class="fa-arrive fd-import" aria-labelledby="fa-arr"><h2 id="fa-arr">Already playing?</h2><p>Bring your character in from the game and skip creating one: the planner opens wearing it.</p>
    <button type="button" class="fd-btn primary" data-act="open">Import your character</button></section>`;
  return `<section class="fa-arrive fd-import" aria-labelledby="fa-arr"><h2 id="fa-arr">Import your character</h2><p>${esc(X.importText)}</p>
    <textarea id="fa-paste" aria-label="Paste your character export" placeholder='{"format":"project-defeat-character" …'></textarea>
    ${pending&&pending.specChoice?`<p class="fd-err">${pending.specChoice.reason==="no-points"?"No talent points are spent":"The talent points are evenly split"}, so the export can't say which spec it is. Which is it? ${pending.specChoice.candidates.map(c=>`<button type="button" class="fd-btn" data-spec="${esc(c)}">${esc(c)}</button>`).join(" ")}</p>`:""}
    ${err?`<p class="fd-err" role="alert">${esc(err)}</p>`:""}
    <div class="row"><button type="button" class="fd-btn primary" data-act="load">Load my character</button><button type="button" class="fd-btn" data-act="example">Paste an example</button><span class="fd-ex">example</span><button type="button" class="fd-btn" data-act="cancel">Cancel</button></div></section>`;
}
function render(keep){
  const v=keep?(mount.querySelector("#fa-paste")||{}).value:"";
  mount.innerHTML=X.head+`<nav class="fa-grid" aria-label="Choose a section">`+door(BY.planner,"big",gl.planner())+
    `<div class="fa-side">`+door(BY.simulation,"","")+arriveHTML()+`</div>`+
    ["raidcomp","tierlists","raids","professions"].map(id=>door(BY[id],"",gl[id]())).join("")+`</nav>`;
  const t=mount.querySelector("#fa-paste");if(t&&v)t.value=v;
}
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t)return;
  const a=t.dataset.act,box=()=>mount.querySelector("#fa-paste");
  if(a==="open"){open=true;err="";pending=null;render();box().focus();return;}
  if(a==="cancel"){open=false;err="";pending=null;render();const o=mount.querySelector('[data-act="open"]');if(o)o.focus();return;}
  if(a==="example"){render(true);box().value=X.exampleExport();box().focus();return;}
  if(a==="load"||t.dataset.spec){const text=box().value;const r=await X.arrive(text,t.dataset.spec);
    if(!r.ok){err=r.error;pending=null;render(true);box().focus();return;}
    if(r.specChoice&&!t.dataset.spec){pending=r;err="";render(true);const f=mount.querySelector("[data-spec]");if(f)f.focus();}}
});
render();
})();
