/* talents-a.js — Talents design A, "Talent window": the game's talent frame. All three trees side by side (one at a time
   on a phone), each on its own dark ground with the spec's icon behind it; real talent icons with their rank, gold when
   full, green when they can take a point, grey when locked; arrows from each prerequisite. Click learns a point,
   right-click unlearns one; hovering shows the game-style tooltip, and the selected talent's tooltip sits under the
   frame with − and + for touch and keyboard.
   Inside the Character Planner (picked 2026-10-09: A with C's fix list), design C's "What's off" box replaces the folded
   list: each broken rule with a one-press fix or "Show where", and the unspent points. The page keeps opening on Gear. */
(function(){
"use strict";
const T=window.TalentKit;if(!T)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("talui");if(!mount)return;
const S=T.store("planner");
const KEY="pd-talents-a";
const IN_PLANNER=!!window.TALENTS_IN_PLANNER;
let ui={tree:"Fury",sel:null,open:false};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&T.TREES.some(t=>t.spec===v.tree))ui=Object.assign(ui,v);}catch(e){}
if(ui.sel&&!T.BY[ui.sel])ui.sel=null;ui.hint=null;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=$("#ta-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.ta-frame{display:grid;gap:10px;grid-template-columns:minmax(0,1fr);padding:10px;border-radius:12px;background:linear-gradient(180deg,#0b0f14,#05070a);border:1px solid #6b5a36;box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),0 14px 34px -14px rgba(0,0,0,.85)}
@media (min-width:900px){.ta-frame{grid-template-columns:repeat(3,minmax(0,1fr))}.ta-phone{display:none}}
@media (max-width:899px){.ta-tree:not(.on){display:none}}
.ta-tree{position:relative;overflow:hidden;border-radius:9px;border:1px solid rgba(255,255,255,.08);padding:10px 8px 18px;min-width:0}
.ta-tree::before{content:"";position:absolute;left:50%;top:56%;width:78%;aspect-ratio:1;transform:translate(-50%,-50%);background:var(--wm) center/cover no-repeat;border-radius:50%;opacity:.07;filter:blur(1.5px);pointer-events:none}
.ta-arms{background:radial-gradient(120% 60% at 50% 0%,rgba(176,124,64,.30),transparent 62%),linear-gradient(180deg,#1d150c,#0a0705)}
.ta-fury{background:radial-gradient(120% 60% at 50% 0%,rgba(205,64,44,.30),transparent 62%),linear-gradient(180deg,#200b09,#0a0504)}
.ta-protection{background:radial-gradient(120% 60% at 50% 0%,rgba(80,130,205,.30),transparent 62%),linear-gradient(180deg,#0c1424,#05080e)}
.ta-head{position:relative;display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:0 4px}
.ta-head img{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.3)}
.ta-head h4{font:400 var(--t-md) var(--f-head);margin:0;flex:1}
.ta-head .num{font:700 var(--t-md) var(--f-body);font-variant-numeric:tabular-nums;color:#ffd56b}
.ta-tree .tk-grid{--cell:46px}
.ta-sel{display:grid;gap:10px 14px;grid-template-columns:minmax(0,1fr);margin:12px 0 0;align-items:start}
@media (min-width:700px){.ta-sel{grid-template-columns:minmax(0,1fr) auto}}
.ta-tipbox{background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:10px 12px}
.ta-tipbox .tt{max-width:none}
.ta-selact{display:grid;gap:6px;justify-items:start}
.ta-selact small{color:var(--ink-3);font-size:var(--t-xs);max-width:28ch}
.ta-probs{margin:12px 0 0;font-size:var(--t-sm)}
.ta-probs summary{cursor:pointer;color:var(--warn);font-weight:600;list-style:none;display:inline-flex;gap:8px;align-items:center;padding:6px 10px;border:1px solid rgba(255,207,122,.3);background:var(--warn-soft);border-radius:8px}
.ta-probs summary::-webkit-details-marker{display:none}
.ta-probs summary::before{content:"▸";transition:transform .15s}.ta-probs[open] summary::before{transform:rotate(90deg)}
.ta-probs ul{margin:8px 0 0;padding:0 0 0 18px;color:var(--ink-2)}.ta-probs li{margin:3px 0}
.ta-ok{margin:12px 0 0;font-size:var(--t-sm);color:#7fdc8a}
.ta-off{margin:12px 0 0;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:10px 12px}
.ta-off h4{font:400 var(--t-lg) var(--f-head);margin:0 0 2px}
.ta-off .sum{font-size:var(--t-sm);color:var(--ink-2);margin:0 0 8px}
@media (max-width:699px),(pointer:coarse){.ta-probs summary{min-height:44px}}
`;
document.head.appendChild(css);

mount.innerHTML=`<h3>Talents</h3>
<p class="lead">Your talents, laid out like the game's talent window. Click a talent to learn a point; right-click it, or use −, to unlearn one. Arrows show what each talent needs first. It opens on the wowsims Fury preset, shown as stored.</p>
<div class="tk-tools"><span class="tk-left" id="ta-left"></span>${T.toolsHTML("ta")}</div>
<p class="okline" id="ta-msg" aria-live="polite"></p>
<div id="ta-body"></div>`;
const body=$("#ta-body");

function defaultSel(p){
  const pr=T.problems(p).find(x=>x.kind==="req");if(pr)return pr.ids[0];
  const t=T.TREES.find(x=>x.spec===ui.tree)||T.TREES[0];
  const taken=t.talents.filter(x=>T.rank(p,x.id));return (taken.length?taken[taken.length-1]:t.talents[0]).id;
}
function render(){
  const p=S.get();
  if(!ui.sel)ui.sel=defaultSel(p);
  const probs=T.problems(p);
  if(!T.hintLive(p,ui.hint))ui.hint=null;
  const hints=T.hintIds(p,ui.hint);
  const left=$("#ta-left");if(left)left.innerHTML=`Points left <b>${T.left(p)}</b> · <span class="num">${T.split(p)}</span>`;
  T.keepFocus(body,()=>{
    body.innerHTML=T.treeTabsHTML(ui.tree,p,"ta-phone")+
      `<div class="ta-frame">`+T.TREES.map(t=>`<section class="ta-tree ta-${t.spec.toLowerCase()}${t.spec===ui.tree?" on":""}" style="--wm:url('${T.iconUrl(T.SPEC_ICON[t.spec])}')" aria-label="${t.spec} talents">
        <header class="ta-head"><img src="${T.iconUrl(T.SPEC_ICON[t.spec])}" alt=""><h4>${t.spec}</h4><span class="num" aria-label="${T.inTree(t,p)} points">${T.inTree(t,p)}</span></header>
        ${T.treeHTML(t,p,{cls:x=>hints.has(x.id)?"tk-hint":""})}</section>`).join("")+`</div>`+
      `<div class="ta-sel"><div class="ta-tipbox">${T.tooltipHTML(ui.sel,p,{noHint:true})}</div>
        <div class="ta-selact">${T.stepHTML(ui.sel,p)}<small>Right-click a talent to unlearn, or use − here. Arrow keys move around a tree.</small></div></div>`+
      (IN_PLANNER?offBox(p,probs):probs.length?`<details class="ta-probs"${ui.open?" open":""}><summary>This build breaks ${probs.length} of the game's rules</summary><ul>${probs.map(x=>`<li>${T.esc(x.text)}</li>`).join("")}</ul>
        <p class="prov">wowsims lists only the talents its simulator reads, so its presets leave out Enrage and the filler points that open the deeper rows. They're shown as stored, not filled in.</p></details>`
        :`<p class="ta-ok">✓ This build follows every rule of the talent window.</p>`);
    const s=body.querySelector(`.tk-tal[data-tid="${ui.sel}"]`);if(s)s.setAttribute("aria-current","true");
    T.roving(body,ui.sel);
  });
  save();
}
/* the planner's "What's off" (design C's list) */
function offBox(p,probs){
  const n=probs.length,l=T.left(p);
  const sum=n?`This build breaks ${n} of the game's rules${l?` and leaves ${l} points unspent`:""}.`:l?`Every rule holds; ${l} points are unspent.`:`Every rule holds and all ${T.D.total} points are spent.`;
  return `<section class="ta-off" aria-labelledby="ta-offh"><h4 id="ta-offh">What's off</h4><p class="sum">${sum}</p>${T.offHTML(p,ui.hint)}
    ${n?`<p class="prov" style="margin:8px 0 0">wowsims lists only the talents its simulator reads, so its presets leave out Enrage and the filler points that open the deeper rows. They're shown as stored, not filled in.</p>`:""}</section>`;
}
T.bind(body,S,{from:"talents-a",say,select:id=>{ui.sel=id;ui.tree=T.TREE_OF[id].spec;save();},refresh:render});
T.hoverTips(body,()=>S.get());
body.addEventListener("click",e=>{if(IN_PLANNER&&T.offClick(e,body,S,ui,"talents-a",say,render))return;const b=e.target.closest("[data-ttree]");if(b){ui.tree=b.dataset.ttree;const t=T.TREES.find(x=>x.spec===ui.tree);
  if(t&&T.TREE_OF[ui.sel]!==t)ui.sel=null;render();say(`${ui.tree} tree shown.`);}});
body.addEventListener("toggle",e=>{if(e.target.matches&&e.target.matches(".ta-probs")){ui.open=e.target.open;save();}},true);
mount.addEventListener("click",e=>{T.presetClick(e,S,"talents-a",say);});
document.addEventListener("talents:change",render);
render();if(!IN_PLANNER)T.openTalentsTab();
})();
