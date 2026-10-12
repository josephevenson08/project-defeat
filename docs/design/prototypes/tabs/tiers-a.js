/* tiers-a.js — Spec Tier Lists design A, "The tier board": Wowhead's three lists as the familiar tier-list board, S to
   D rows of spec icons in their class colours, damage on top with healing and tanking beside each other below. Press a
   spec for its card: its place on every list, what the logs say (archon.gg), what it brings to a raid and its signature
   ability. Your spec (the planner's Fury Warrior) starts selected; a class filter dims the rest.
   In the Spec Tier Lists tab (window.TIERS_IN_TAB, decided 2026-10-12) a switch adds design B's view, "Against the
   logs": Wowhead's tiers against archon.gg's observed DPS (tiers-b.js, window.TiersB). The switch is remembered for the
   browser session ("pd-tiers-view"), and #logs links to that view. */
(function(){
"use strict";
const K=window.TierKit;if(!K)return;
const {SPECS,LISTS,CLASSES,ME,$,$$,on,esc,plural}=K;
const ui=$("#tierui");
/* the tab: a "The board / Against the logs" switch above one shared area that this design and design B draw into */
const B=window.TIERS_IN_TAB&&window.TiersB?window.TiersB:null;
let view=B&&(location.hash==="#logs"||(location.hash!=="#board"&&K.store.get("pd-tiers-view")==="logs"))?"logs":"board";
let host=ui;
if(B){
  ui.innerHTML=`<div class="tk-views" role="group" aria-label="Show"><button type="button" data-view="board" aria-pressed="${view==="board"}">The board <small>Wowhead's three lists</small></button>`+
    `<button type="button" data-view="logs" aria-pressed="${view==="logs"}">Against the logs <small>what players parse</small></button></div><div id="tierhost"></div>`;
  host=$("#tierhost");B.setHost(host);
}
function setView(v){view=v;K.store.set("pd-tiers-view",v);$$(".tk-views [data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===v)));
  try{history.replaceState(null,"","#"+v);}catch(e){}}
let sel=K.store.get("pd-tiers-sel")||ME; if(!SPECS[sel])sel=ME;
let cls="all";

const css=document.createElement("style");
css.textContent=`
.tk-views{display:inline-flex;gap:4px;padding:4px;margin:4px 0 12px;border-radius:999px;border:1px solid var(--rim);background:var(--scrim)}
.tk-views button{font:600 var(--t-sm) var(--f-body);min-height:44px;padding:6px 16px;border-radius:999px;border:0;background:none;color:var(--ink-2);cursor:pointer}
.tk-views button small{font:500 var(--t-xs) var(--f-body);color:var(--ink-3);margin-left:4px}
.tk-views button[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink)}
.tk-views button[aria-pressed="true"] small{color:var(--glow-ink)}
.tk-views button:hover:not([aria-pressed="true"]){color:var(--ink)}
@media (max-width:520px){.tk-views{display:flex}.tk-views button{flex:1;padding:6px 8px}.tk-views button small{display:none}}
.ta{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:1000px){.ta{grid-template-columns:minmax(0,1fr) 360px;align-items:start}}
.ta-boards{display:grid;gap:16px;min-width:0}
.ta-pair{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:700px){.ta-pair{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ta-card{padding:14px}
@media (min-width:1000px){.ta-card{position:sticky;top:66px}}
.ta-filter{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 4px}
.ta-filter button{font:600 var(--t-xs) var(--f-body);min-height:36px;padding:5px 11px;border-radius:999px;border:1px solid var(--rim);border-bottom:2px solid var(--cc,var(--rim));background:var(--glass-2);color:var(--ink-2);cursor:pointer}
.ta-filter button[aria-pressed="true"]{background:var(--glow-soft);border-color:var(--glow);color:var(--ink)}
@media (max-width:700px){.ta-filter button{min-height:44px}}
.ta-board{list-style:none;margin:0;padding:0}
.ta-row{display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;padding:10px 0;border-top:1px solid var(--rim-2);align-items:stretch}
.ta-row:first-child{border-top:0}
.ta-l{display:grid;place-items:center;font:400 1.6rem/1 var(--f-head);color:var(--ink);border:1.5px solid var(--ink-2);border-radius:8px;background:rgba(255,255,255,.04);min-height:64px}
.ta-row[data-depth="0"] .ta-l{border-width:3px;border-color:var(--ink);box-shadow:0 0 18px -4px var(--glow)}
.ta-row[data-depth="1"] .ta-l{border-width:2px}
.ta-row[data-depth="2"] .ta-l{color:var(--ink-2)}
.ta-row[data-depth="3"] .ta-l,.ta-row[data-depth="4"] .ta-l{color:var(--ink-3);border-color:var(--ink-3);border-style:dashed}
.ta-tiles{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0;align-content:center}
.ta-t{position:relative;width:84px;min-height:84px;display:grid;justify-items:center;align-content:start;gap:4px;padding:8px 4px 6px;border-radius:12px;border:1px solid var(--rim-2);border-bottom:3px solid var(--cc);background:var(--scrim);color:var(--ink);font:inherit;cursor:pointer;transition:opacity .2s,transform .15s}
.ta-t:hover{border-color:var(--cc);transform:translateY(-2px)}
.ta-t .tk-ic{width:40px;height:40px}
.ta-t b{font-size:11px;font-weight:600;line-height:1.15;text-align:center}
.ta-t small{font-size:10px;color:var(--ink-3);line-height:1}
.ta-t[aria-pressed="true"]{border-color:var(--glow);box-shadow:0 0 0 2px var(--glow),0 0 22px -4px var(--glow);background:var(--glow-soft)}
.ta-t.dim{opacity:.28}
.ta-t .tk-you{position:absolute;top:-8px;left:50%;transform:translateX(-50%);white-space:nowrap}
@media (max-width:520px){.ta-t{width:72px;min-height:76px}.ta-t .tk-ic{width:34px;height:34px}.ta-row{grid-template-columns:40px minmax(0,1fr)}.ta-l{font-size:1.25rem}}
.ta-src{margin:10px 0 0;font-size:var(--t-xs);color:var(--ink-3);border-top:1px solid var(--rim-2);padding-top:8px}
.ta-cross{margin:8px 0 0;font-size:var(--t-xs);color:var(--ink-2)}
`;
document.head.appendChild(css);

function boardHTML(l){
  const n=l.tiers.reduce((m,t)=>m+t.specs.length,0);
  return `<section class="box" data-enter aria-labelledby="ta-h-${l.role}"><h2 id="ta-h-${l.role}">${esc(l.role)} tier list <small>${l.tiers.length} tiers · ${plural(n,"spec")}</small></h2><div class="in">`+
    (l.role==="DPS"?`<div class="ta-filter" role="group" aria-label="Show a class">${["all",...CLASSES].map(c=>`<button type="button" data-cls="${c}" aria-pressed="${c===cls}"${c==="all"?"":` style="--cc:${SPECS[K.KEYS.find(k=>SPECS[k].cls===c)].col}"`}>${c==="all"?"All":esc(c)}</button>`).join("")}</div>`:"")+
    `<ul class="ta-board">`+l.tiers.map((t,d)=>`<li class="ta-row" data-depth="${d}"><span class="ta-l" aria-label="Tier ${esc(t.label)}">${esc(t.label)}</span><ul class="ta-tiles">`+
      t.specs.map(k=>{const s=SPECS[k];return `<li><button type="button" class="ta-t${cls!=="all"&&s.cls!==cls?" dim":""}" data-spec="${esc(k)}" data-sel="${esc(k)}" aria-pressed="${k===sel}" style="--cc:${s.col}" aria-label="${esc(K.label(k))}, tier ${esc(t.label)}${k===ME?", your spec":""}">${k===ME?`<span class="tk-you">You</span>`:""}${K.specIcon(k,40)}<b>${esc(s.spec)}</b><small>${esc(s.cls)}</small></button></li>`;}).join("")+`</ul></li>`).join("")+`</ul>`+
    (l.role!=="DPS"&&!SPECS[ME].places.some(p=>p.role===l.role)?`<p class="ta-cross">${esc(K.label(ME))} is not on this list: it ranks only ${l.role==="Healer"?"healers":"tanks"}.</p>`:"")+
    `<p class="ta-src"><span class="srcbadge">Wowhead · Phase 2</span><a href="${esc(l.url)}" target="_blank" rel="noreferrer noopener">${esc(l.title.replace(/ - Wowhead$/,""))}</a> · tier letters and placements only</p></div></section>`;
}
function draw(){
  const [dps,heal,tank]=["DPS","Healer","Tank"].map(K.list);
  host.innerHTML=`<div class="ta"><div class="ta-boards">${boardHTML(dps)}<div class="ta-pair">${boardHTML(heal)}${boardHTML(tank)}</div></div>`+
    `<aside class="box ta-card" data-enter aria-label="${esc(K.label(sel))}" aria-live="polite" id="ta-card">${K.cardHTML(sel,{raid:K.raid()})}</aside></div>`;
}
function pick(k,focus){
  sel=k;K.store.set("pd-tiers-sel",k);
  $$(".ta-t").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.sel===k)));
  const card=$("#ta-card");if(card){card.innerHTML=K.cardHTML(k,{raid:K.raid()});card.setAttribute("aria-label",K.label(k));}
  if(K.motion()&&card)K.rise(card.parentNode,true);
  if(innerWidth<1000&&card)card.scrollIntoView({block:"nearest",behavior:K.motion()?"smooth":"auto"});
  if(focus){const b=$(`.ta-t[data-sel="${CSS.escape(k)}"]`);if(b)b.focus({preventScroll:true});}
}
on(ui,"click",e=>{
  const v=e.target.closest("[data-view]");
  if(v&&B){if(v.dataset.view===view)return;setView(v.dataset.view);K.hideTip();
    if(view==="logs"){B.render();K.say("Against the logs: Wowhead's tiers and archon.gg's observed DPS for the 20 damage specs.");}
    else{draw();K.say("The board: Wowhead's three lists.");}
    if(K.motion())K.rise(host,true);return;}
  const t=e.target.closest(".ta-t");if(t){pick(t.dataset.sel);K.say(`${K.label(t.dataset.sel)}: ${K.placesText(t.dataset.sel)}.`);return;}
  const c=e.target.closest("[data-cls]");
  if(c){cls=c.dataset.cls;$$("[data-cls]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.cls===cls)));
    $$(".ta-t").forEach(b=>b.classList.toggle("dim",cls!=="all"&&SPECS[b.dataset.sel].cls!==cls));
    const n=K.KEYS.filter(k=>SPECS[k].cls===cls).length;
    K.say(cls==="all"?"Showing every class.":`${cls}: ${plural(n,"spec")} lit.`);}
});
/* arrow keys move through the tiles of a board */
on(ui,"keydown",e=>{
  const t=e.target.closest(".ta-t");if(!t)return;
  const d={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!d)return;
  const all=$$(".ta-t",t.closest(".ta-board")),nx=all[all.indexOf(t)+d];if(nx){e.preventDefault();nx.focus();}
});

window.TIERS_DESIGN="a";
if(B)window.TIERS_ALSO=["b"];
K.start({render(){if(B&&view==="logs")B.render();else{draw();K.land($$(".ta-t"));}}});
})();
