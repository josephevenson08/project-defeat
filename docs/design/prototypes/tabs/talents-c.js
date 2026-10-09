/* talents-c.js — Talents design C, "Against the preset": your build laid over a wowsims preset (Fury or Arms). Every
   talent the preset takes carries its rank in a violet badge; a talent short of the preset gets a dashed violet ring,
   one past it a solid one. Under the trees: "What's off" (each broken rule, with a one-press fix where the rule names
   one, or a "show where" for rows short of points) and "Against the preset" (every difference, each with Match). */
(function(){
"use strict";
const T=window.TalentKit;if(!T)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("talui");if(!mount)return;
const S=T.store("planner");
const KEY="pd-talents-c";
let ui={tree:"Fury",sel:null,vs:"Fury",hint:null};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&T.TREES.some(t=>t.spec===v.tree))ui=Object.assign(ui,v);}catch(e){}
if(ui.sel&&!T.BY[ui.sel])ui.sel=null;if(!T.PRESETS[ui.vs])ui.vs="Fury";ui.hint=null;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=$("#tc-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.tc-vs{display:inline-flex;border:1px solid var(--rim);border-radius:999px;overflow:hidden;background:var(--glass-2)}
.tc-vs .lab{font:600 var(--t-xs) var(--f-body);color:var(--ink-3);padding:0 6px 0 12px;align-self:center}
.tc-vs button{font:600 var(--t-sm) var(--f-body);background:none;border:0;color:var(--ink-2);padding:7px 14px;cursor:pointer}
.tc-vs button[aria-pressed="true"]{background:#a77bff;color:#140a26}
.tc-sum{font:400 var(--t-md)/1.45 var(--f-body);margin:0 0 12px;padding:10px 12px;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px}
.tc-sum strong{font-weight:700}
.tc-frame{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.tc-frame{grid-template-columns:repeat(3,minmax(0,1fr))}.tc-phone{display:none}}
@media (max-width:899px){.tc-tree:not(.on){display:none}}
.tc-tree{border:1px solid var(--rim-2);border-radius:10px;background:var(--scrim);padding:10px 8px 18px;min-width:0}
.tc-tree h4{display:flex;align-items:center;gap:8px;font:400 var(--t-md) var(--f-head);margin:0 0 12px;padding:0 4px}
.tc-tree h4 img{width:26px;height:26px;border-radius:50%}
.tc-tree h4 span{margin-left:auto;font:600 var(--t-xs) var(--f-body);color:var(--ink-3)}
.tc-tree h4 span b{font:700 var(--t-sm) var(--f-body);color:var(--ink)}.tc-tree h4 span i{font-style:normal;color:#c9b0ff}
.tc-tree .tk-grid{--cell:44px}
.tk-tal .tc-p{position:absolute;right:-6px;top:-7px;font:700 9.5px/1 var(--f-body);font-variant-numeric:tabular-nums;background:#2a1650;color:#e4d6ff;border:1px solid #a77bff;border-radius:5px;padding:2px 3px;pointer-events:none;z-index:2}
.tk-tal.tc-under{outline:2px dashed #a77bff;outline-offset:3px}
.tk-tal.tc-over{outline:2px solid #a77bff;outline-offset:3px}
.tc-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:var(--t-xs);color:var(--ink-3);margin:8px 0 0}
.tc-legend i{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-2px;margin-right:5px}
.tc-cols{display:grid;gap:12px;grid-template-columns:minmax(0,1fr);margin:12px 0 0}
@media (min-width:900px){.tc-cols{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tc-box{background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:10px 12px}
.tc-box h4{font:400 var(--t-lg) var(--f-head);margin:0 0 8px}
.tc-box ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.tc-box li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 10px;align-items:center;font-size:var(--t-sm);padding:6px 0;border-top:1px solid var(--rim-2)}
.tc-box li:first-child{border-top:0}
.tc-box li img{width:30px;height:30px;border-radius:5px}
.tc-box li small{display:block;color:var(--ink-3);font-size:var(--t-xs)}
.tc-box .btn{padding:7px 12px;white-space:nowrap}
.tc-box .ok{color:#7fdc8a;font-size:var(--t-sm);margin:0}
.tc-d-up{color:#7fdc8a}.tc-d-dn{color:#c9b0ff}
@media (max-width:699px),(pointer:coarse){.tc-vs button,.tc-box .btn{min-height:44px}.tc-box li{grid-template-columns:auto minmax(0,1fr)}.tc-box li .btn{grid-column:2;justify-self:start}}
`;
document.head.appendChild(css);

mount.innerHTML=`<h3>Talents</h3>
<p class="lead">Your build laid over a wowsims preset, so you can see where you differ and what breaks the game's rules. Click to learn; right-click, or use −, to unlearn. It opens on the Fury preset, shown as stored.</p>
<div class="tk-tools"><span class="tk-left" id="tc-left"></span><span class="tc-vs" role="group" aria-label="Compare with"><span class="lab">Compare with</span><button type="button" data-tvs="Fury">Fury preset</button><button type="button" data-tvs="Arms">Arms preset</button></span>${T.toolsHTML("tc")}</div>
<p class="okline" id="tc-msg" aria-live="polite"></p>
<div id="tc-body"></div>`;
const body=$("#tc-body");

const pre=()=>T.preset(ui.vs);
function diffs(p){const q=pre(),ids=new Set([...Object.keys(p),...Object.keys(q)].map(Number));
  return T.TREES.flatMap(t=>t.talents.filter(x=>ids.has(x.id)&&T.rank(p,x.id)!==T.rank(q,x.id)).map(x=>({x,you:T.rank(p,x.id),them:T.rank(q,x.id)})));}
function render(){
  const p=S.get(),q=pre(),ds=diffs(p),probs=T.problems(p);
  if(!T.hintLive(p,ui.hint))ui.hint=null;
  const hints=T.hintIds(p,ui.hint);
  if(!ui.sel){const pr=probs.find(x=>x.kind==="req");ui.sel=pr?pr.ids[0]:null;}
  const left=$("#tc-left");if(left)left.innerHTML=`Points left <b>${T.left(p)}</b> · <span class="num">${T.split(p)}</span>`;
  mount.querySelectorAll("[data-tvs]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.tvs===ui.vs));
  const more=ds.reduce((a,d)=>a+Math.max(0,d.you-d.them),0),fewer=ds.reduce((a,d)=>a+Math.max(0,d.them-d.you),0);
  const sum=ds.length?`Your build differs from the ${ui.vs} preset in <strong>${ds.length} talent${ds.length>1?"s":""}</strong>: ${more?`<strong class="tc-d-up">${more} point${more>1?"s":""} more</strong>`:""}${more&&fewer?" and ":""}${fewer?`<strong class="tc-d-dn">${fewer} fewer</strong>`:""}. `
    :`Your build matches the ${ui.vs} preset exactly. `;
  const off=probs.length?`It breaks <strong class="cx-dn">${probs.length} rule${probs.length>1?"s":""}</strong>${T.left(p)?` and leaves <strong>${T.left(p)} points</strong> unspent`:""}.`
    :T.left(p)?`It follows every rule, with <strong>${T.left(p)} points</strong> unspent.`:`It follows every rule and spends all ${T.D.total} points.`;
  const tree=t=>{const me=T.inTree(t,p),them=T.inTree(t,q);
    return `<section class="tc-tree${t.spec===ui.tree?" on":""}" aria-label="${t.spec} talents"><h4><img src="${T.iconUrl(T.SPEC_ICON[t.spec])}" alt="">${t.spec}<span>you <b>${me}</b> · preset <i>${them}</i></span></h4>
      ${T.treeHTML(t,p,{
        extra:x=>T.rank(q,x.id)?`<span class="tc-p" aria-hidden="true">P${T.rank(q,x.id)}</span>`:"",
        cls:x=>{const a=T.rank(p,x.id),b=T.rank(q,x.id);return (a<b?"tc-under":a>b?"tc-over":"")+(hints.has(x.id)?" tk-hint":"");},
        label:x=>{const b=T.rank(q,x.id),a=T.rank(p,x.id);return a!==b?`, preset ${b}`:b?", matches the preset":"";}})}</section>`;};
  const diffList=ds.map(d=>`<li><img src="${T.iconUrl(d.x.icon)}" alt=""><span><b>${T.esc(d.x.name)}</b><small>you ${d.you}/${d.x.max} · preset ${d.them}/${d.x.max} · ${T.esc(T.TREE_OF[d.x.id].spec)}</small></span><button type="button" class="btn ghost" data-tmatch="${d.x.id}" aria-label="Match the preset: ${T.esc(d.x.name)} to ${d.them}">Match</button></li>`).join("");
  T.keepFocus(body,()=>{
    body.innerHTML=`<p class="tc-sum">${sum}${off}</p>`+T.treeTabsHTML(ui.tree,p,"tc-phone")+
      `<div class="tc-frame">${T.TREES.map(tree).join("")}</div>
      <div class="tc-legend"><span><i style="background:#2a1650;border:1px solid #a77bff"></i>P = the preset's rank</span><span><i style="outline:2px dashed #a77bff;outline-offset:-2px"></i>fewer than the preset</span><span><i style="outline:2px solid #a77bff;outline-offset:-2px"></i>more than the preset</span><span><i style="background:#ff6b5e;border-radius:50%"></i>breaks a rule</span></div>`+
      (ui.sel&&T.BY[ui.sel]?`<div class="tb-selrow" style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:10px 0 0;font-size:var(--t-sm)"><img src="${T.iconUrl(T.BY[ui.sel].icon)}" alt="" width="28" height="28" style="border-radius:5px"><b>${T.esc(T.BY[ui.sel].name)}</b><span class="prov">preset ${T.rank(q,ui.sel)}/${T.BY[ui.sel].max}</span>${T.stepHTML(ui.sel,p)}</div>`:"")+
      `<div class="tc-cols"><section class="tc-box" aria-labelledby="tc-off"><h4 id="tc-off">What's off</h4>${T.offHTML(p,ui.hint)}</section>
      <section class="tc-box" aria-labelledby="tc-dh"><h4 id="tc-dh">Against the ${ui.vs} preset</h4>${diffList?`<ul>${diffList}</ul>`:`<p class="ok">✓ No differences: you match the preset talent for talent.</p>`}
      <p class="prov" style="margin:8px 0 0">${T.esc(T.presetNote(ui.vs))}</p></section></div>`;
    if(ui.sel){const s=body.querySelector(`.tk-tal[data-tid="${ui.sel}"]`);if(s)s.setAttribute("aria-current","true");}
    T.roving(body,ui.sel);
  });
  save();
}
T.bind(body,S,{from:"talents-c",say,select:id=>{ui.sel=id;ui.tree=T.TREE_OF[id].spec;save();},refresh:render});
T.hoverTips(body,()=>S.get());
body.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.ttree){ui.tree=b.dataset.ttree;render();say(`${ui.tree} tree shown.`);return;}
  if(T.offClick(e,body,S,ui,"talents-c",say,render))return;
  if(b.dataset.tmatch){const id=+b.dataset.tmatch,to=T.rank(pre(),id),r=T.setTo(id,to,S.get());
    if(r.pts===S.get()){say(`Can't match ${T.BY[id].name}: ${r.why}`);return;}
    ui.sel=id;ui.tree=T.TREE_OF[id].spec;S.set(r.pts,"talents-c");
    say(r.why?`${T.BY[id].name} moved to ${T.rank(S.get(),id)}/${T.BY[id].max}, not the preset's ${to}: ${r.why}`:`${T.BY[id].name} now matches the preset: ${to}/${T.BY[id].max}.`);return;}
});
mount.addEventListener("click",e=>{
  const v=e.target.closest("[data-tvs]");if(v){ui.vs=v.dataset.tvs;render();say(`Comparing with the ${ui.vs} preset.`);return;}
  T.presetClick(e,S,"talents-c",say);
});
document.addEventListener("talents:change",render);
render();T.openTalentsTab();
})();
