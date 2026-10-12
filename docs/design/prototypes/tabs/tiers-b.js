/* tiers-b.js — Spec Tier Lists design B, "Two opinions": Wowhead's tier against what the logs say. The 20 damage specs
   as one chart ranked by archon.gg's observed average DPS (Serpentshrine and Tempest Keep, read 2026-08-23), each row
   carrying Wowhead's tier and archon's own, with the disagreements called out. Sort by the logs or by Wowhead, or show
   only where they disagree. Healers and tanks have only Wowhead's lists in the app, and the page says so. Press a row
   for the spec's full card.
   In the Spec Tier Lists tab (window.TIERS_IN_TAB) it is design A's second view, "Against the logs": tiers-a.js starts
   the page and hands it the area to draw in (window.TiersB.setHost). */
(function(){
"use strict";
const K=window.TierKit;if(!K)return;
const {SPECS,ARCHON,ME,$,$$,on,esc,plural,fmt,ord}=K;
const ui=$("#tierui");
let host=ui;
const ORDER=["S","A","B","C","D"];
const dpsList=K.list("DPS");
const wTier=k=>{const p=SPECS[k].places.find(x=>x.role==="DPS");return p?p.label:null;};
const aTier=k=>SPECS[k].archon?SPECS[k].archon.tier:null;
/* how far apart the two letters are: + when the logs' tier is higher than Wowhead's */
const gap=k=>ORDER.indexOf(wTier(k))-ORDER.indexOf(aTier(k));
const ROWS=ARCHON.slice();
const MAX=Math.max(...ROWS.map(k=>SPECS[k].archon.dps));
let sort=K.store.get("pd-tiers-sort")==="wowhead"?"wowhead":"logs";
let only=false, open=null;

const css=document.createElement("style");
css.textContent=`
.tb{display:grid;gap:16px}
.tb-sum .in{display:grid;gap:10px}
.tb-facts{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.tb-facts li{font:500 var(--t-xs) var(--f-mono);background:var(--glow-soft);border:1px solid var(--rim);border-radius:999px;padding:3px 10px}
.tb-facts b{font-family:var(--f-body);color:var(--ink-3);margin-right:5px;font-weight:600}
.tb-notes{margin:0;padding:0 0 0 18px;font-size:var(--t-sm);color:var(--ink-2);display:grid;gap:3px}
.tb-notes b{color:var(--ink)}
.tb-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0 0 10px}
.tb-seg{display:inline-flex;gap:3px;padding:3px;border-radius:999px;border:1px solid var(--rim);background:var(--scrim)}
.tb-seg button{font:600 var(--t-sm) var(--f-body);min-height:40px;padding:5px 14px;border-radius:999px;border:0;background:none;color:var(--ink-2);cursor:pointer}
.tb-seg button[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink)}
.tb-only{display:inline-flex;align-items:center;gap:8px;font-size:var(--t-sm);color:var(--ink-2);cursor:pointer;min-height:40px}
.tb-only input{width:18px;height:18px;accent-color:var(--glow)}
@media (max-width:700px){.tb-seg button,.tb-only{min-height:44px}}
.tb-legend{font-size:var(--t-xs);color:var(--ink-3);margin-left:auto}
.tb-chart{list-style:none;margin:0;padding:0;display:grid;gap:4px;position:relative}
.tb-row{border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim)}
.tb-row.me{border-color:var(--glow);box-shadow:0 0 18px -6px var(--glow)}
.tb-rb{width:100%;display:grid;grid-template-columns:34px minmax(150px,1.1fr) minmax(0,2fr) 92px;gap:10px;align-items:center;min-height:52px;padding:5px 10px;border:0;background:none;color:var(--ink);font:inherit;text-align:left;cursor:pointer;border-radius:10px}
.tb-rb:hover{background:var(--glow-soft)}
.tb-n{font:500 var(--t-sm) var(--f-mono);color:var(--ink-3);text-align:right}
.tb-who{display:flex;align-items:center;gap:8px;min-width:0}
.tb-who .tk-ic{width:30px;height:30px}
.tb-who b{display:block;font-size:var(--t-sm);font-weight:600}
.tb-who small{font-size:var(--t-xs);color:var(--ink-3)}
.tb-bar{position:relative;height:22px;border-radius:6px;background:rgba(255,255,255,.05);overflow:hidden}
.tb-bar i{position:absolute;inset:0 auto 0 0;border-radius:6px;background:linear-gradient(90deg,color-mix(in srgb,var(--cc) 35%,transparent),color-mix(in srgb,var(--cc) 75%,transparent));border-right:2px solid var(--cc)}
.tb-bar span{position:absolute;right:8px;top:50%;transform:translateY(-50%);font:600 var(--t-xs) var(--f-mono);color:var(--ink)}
.tb-tiers{display:flex;align-items:center;gap:6px;justify-content:flex-end}
.tb-tiers small{font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.06em}
.tb-diff{font-size:var(--t-xs);color:var(--warn);margin:-4px 0 6px;padding:0 12px 0 92px}
.tb-diff.up{color:var(--glow)}
.tb-open{padding:4px 12px 12px}
@media (max-width:700px){
  .tb-rb{grid-template-columns:26px minmax(0,1fr) 84px;grid-template-areas:"n who tiers" ". bar bar"}
  .tb-n{grid-area:n}.tb-who{grid-area:who}.tb-tiers{grid-area:tiers}.tb-bar{grid-area:bar}
  .tb-diff{padding-left:46px}
}
.tb-two{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:800px){.tb-two{grid-template-columns:repeat(2,minmax(0,1fr))}}
.tb-plain{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.tb-plain li{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.tb-plain .tk-tl{flex:none}
.tb-plain button{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:3px 10px 3px 3px;border-radius:999px;border:1px solid var(--rim-2);border-left:3px solid var(--cc);background:var(--scrim);color:var(--ink);font:600 var(--t-sm) var(--f-body);cursor:pointer}
.tb-plain .tk-ic{width:28px;height:28px}
.tb-plain-open{margin-top:10px}
@media (max-width:700px){.tb-plain button{min-height:44px}}
`;
document.head.appendChild(css);

function diffText(k){
  const g=gap(k),w=wTier(k),a=aTier(k);
  if(!g)return "";
  if(w==="D")return `Wowhead's D tier; archon has no D, and puts it in ${a}.`;
  return g>0?`The logs rate it higher: archon ${a}, Wowhead ${w}.`:`Wowhead rates it higher: Wowhead ${w}, archon ${a}.`;
}
function rowsInOrder(){
  let r=ROWS.slice();
  if(sort==="wowhead")r.sort((a,b)=>ORDER.indexOf(wTier(a))-ORDER.indexOf(wTier(b))||SPECS[b].archon.dps-SPECS[a].archon.dps);
  if(only)r=r.filter(k=>gap(k));
  return r;
}
function rowHTML(k){
  const s=SPECS[k],d=diffText(k),w=wTier(k);
  return `<li class="tb-row${k===ME?" me":""}" data-k="${esc(k)}"><button type="button" class="tb-rb" data-spec="${esc(k)}" data-row="${esc(k)}" aria-expanded="${open===k}" style="--cc:${s.col}">`+
    `<span class="tb-n">${K.archonRank(k)}</span><span class="tb-who">${K.specIcon(k,30)}<span><b>${esc(s.spec)}${k===ME?` <span class="tk-you">You</span>`:""}</b><small>${esc(s.cls)}</small></span></span>`+
    `<span class="tb-bar" aria-label="${fmt(s.archon.dps)} DPS observed"><i style="width:${(s.archon.dps/MAX*100).toFixed(1)}%"></i><span>${fmt(s.archon.dps)}</span></span>`+
    `<span class="tb-tiers"><small>W</small><span class="tk-tl d${ORDER.indexOf(w)}" title="Wowhead's tier">${esc(w)}</span><small>A</small><span class="tk-tl" title="archon.gg's tier">${esc(aTier(k))}</span></span></button>`+
    (d?`<p class="tb-diff${gap(k)>0?" up":""}">${esc(d)}</p>`:"")+
    (open===k?`<div class="tb-open">${K.cardHTML(k)}</div>`:"")+`</li>`;
}
function summaryHTML(){
  const agree=ROWS.filter(k=>!gap(k)).length;
  const up=ROWS.filter(k=>gap(k)>0&&wTier(k)!=="D"),down=ROWS.filter(k=>gap(k)<0);
  /* the biggest gaps between a spec's DPS rank and where Wowhead's tier puts it */
  const wRank=k=>1+ROWS.filter(o=>ORDER.indexOf(wTier(o))<ORDER.indexOf(wTier(k))).length;
  const notes=[];
  const ret=ROWS.filter(k=>K.archonRank(k)<wRank(k)).sort((a,b)=>(wRank(b)-K.archonRank(b))-(wRank(a)-K.archonRank(a)))[0];
  if(ret)notes.push(`<b>${esc(K.label(ret))}</b> averages the ${ord(K.archonRank(ret))}-highest DPS of 20, yet sits in Wowhead's ${esc(wTier(ret))} tier.`);
  const hi=ROWS.filter(k=>ORDER.indexOf(aTier(k))<ORDER.indexOf(wTier(k))&&K.archonRank(k)>10)[0];
  if(hi)notes.push(`<b>${esc(K.label(hi))}</b> is only ${ord(K.archonRank(hi))} by DPS, but archon puts it in ${esc(aTier(hi))}: archon's tiers are not DPS order alone.`);
  notes.push(`<b>${esc(K.label(ME))}</b>, your spec: Wowhead ${esc(wTier(ME))}, archon ${esc(aTier(ME))}, ${ord(K.archonRank(ME))} by DPS at ${fmt(SPECS[ME].archon.dps)}.`);
  return `<section class="box tb-sum" data-enter aria-labelledby="tb-sh"><h2 id="tb-sh">Two opinions <small>20 damage specs</small></h2><div class="in">`+
    `<ul class="tb-facts"><li><b>Agree</b>${agree} of 20</li><li><b>Logs higher</b>${up.length}</li><li><b>Wowhead higher</b>${down.length}</li><li><b>Wowhead D, archon C</b>${ROWS.filter(k=>wTier(k)==="D").length}</li></ul>`+
    `<ul class="tb-notes">${notes.map(n=>`<li>${n}</li>`).join("")}</ul>`+
    `<p class="prov" style="margin:0">Wowhead's tiers are their guide writers' judgement (${esc(dpsList.title.replace(/ - Wowhead$/,""))}). archon.gg averages uploaded Warcraft Logs parses for Serpentshrine Cavern and Tempest Keep, all bosses, read 2026-08-23; its tier letters are its own.</p></div></section>`;
}
function chartHTML(){
  const rows=rowsInOrder();
  return `<section class="box" data-enter aria-labelledby="tb-ch"><h2 id="tb-ch">Damage, by ${sort==="logs"?"what the logs say":"Wowhead's tier"} <small>${only?`${plural(rows.length,"disagreement")}`:"bars: observed average DPS"}</small></h2><div class="in">`+
    `<div class="tb-ctl"><div class="tb-seg" role="group" aria-label="Sort"><button type="button" data-sort="logs" aria-pressed="${sort==="logs"}">By the logs</button><button type="button" data-sort="wowhead" aria-pressed="${sort==="wowhead"}">By Wowhead's tier</button></div>`+
    `<label class="tb-only"><input type="checkbox" id="tb-only"${only?" checked":""}> Only where they disagree</label><span class="tb-legend">W Wowhead · A archon.gg · the number is the DPS rank</span></div>`+
    `<ol class="tb-chart" id="tb-chart">${rows.map(rowHTML).join("")}</ol></div></section>`;
}
function plainHTML(role){
  const l=K.list(role);
  return `<section class="box" data-enter aria-labelledby="tb-${role}"><h2 id="tb-${role}">${esc(role)} tier list <small>Wowhead only</small></h2><div class="in"><ul class="tb-plain">`+
    l.tiers.map((t,d)=>`<li><span class="tk-tl d${d}">${esc(t.label)}</span>${t.specs.map(k=>`<button type="button" data-spec="${esc(k)}" data-plain="${esc(k)}" aria-expanded="${open===k}" style="--cc:${SPECS[k].col}">${K.specIcon(k,28)}${esc(K.label(k))}</button>`).join("")}</li>`).join("")+
    `</ul>${l.tiers.some(t=>t.specs.includes(open))?`<div class="tb-plain-open">${K.cardHTML(open)}</div>`:""}`+
    `<p class="ta-src" style="margin:10px 0 0;font-size:var(--t-xs);color:var(--ink-3)">The app has no log numbers for ${role==="Healer"?"healers":"tanks"}, so this is Wowhead's opinion alone. <a href="${esc(l.url)}" target="_blank" rel="noreferrer noopener">Wowhead's reasoning</a></p></div></section>`;
}
function draw(){host.innerHTML=`<div class="tb">${summaryHTML()}${chartHTML()}<div class="tb-two">${plainHTML("Healer")}${plainHTML("Tank")}</div></div>`;}
/* re-sort with Flip when motion is on, so each row slides to its new place */
function resort(){
  const F=typeof Flip!=="undefined"&&K.motion();
  const state=F?Flip.getState("#tb-chart .tb-row"):null;
  const chart=$("#tb-chart").closest(".box");
  const tmp=document.createElement("div");tmp.innerHTML=chartHTML();chart.replaceWith(tmp.firstElementChild);
  if(F){gsap.registerPlugin(Flip);Flip.from(state,{duration:.55,ease:"power2.inOut",targets:"#tb-chart .tb-row",onEnter:els=>gsap.fromTo(els,{autoAlpha:0},{autoAlpha:1,duration:.3}),onLeave:els=>gsap.to(els,{autoAlpha:0,duration:.2})});}
}
on(ui,"click",e=>{
  const s=e.target.closest("[data-sort]");
  if(s){if(s.dataset.sort===sort)return;sort=s.dataset.sort;K.store.set("pd-tiers-sort",sort);resort();const b=$(`[data-sort="${sort}"]`);if(b)b.focus();K.say(sort==="logs"?"Sorted by observed DPS.":"Sorted by Wowhead's tier.");return;}
  const r=e.target.closest("[data-row]");
  if(r){const k=r.dataset.row;open=open===k?null:k;const li=r.closest(".tb-row"),tmp=document.createElement("div");tmp.innerHTML=rowHTML(k);li.replaceWith(tmp.firstElementChild);
    const nb=$(`[data-row="${CSS.escape(k)}"]`);if(nb)nb.focus();if(open)K.say(`${K.label(k)}: ${K.archonText(k)}.`);return;}
  const p=e.target.closest("[data-plain]");
  if(p){const k=p.dataset.plain;open=open===k?null:k;draw();const nb=$(`[data-plain="${CSS.escape(k)}"]`);if(nb)nb.focus();}
});
on(ui,"change",e=>{if(e.target.id==="tb-only"){only=e.target.checked;resort();const c=$("#tb-only");if(c)c.focus();K.say(only?`${ROWS.filter(k=>gap(k)).length} specs where Wowhead and the logs disagree.`:"Showing all 20.");}});

window.TiersB={render(){draw();},setHost(el){host=el||ui;}};
if(!window.TIERS_IN_TAB){window.TIERS_DESIGN="b";K.start({render(){draw();}});}
})();
