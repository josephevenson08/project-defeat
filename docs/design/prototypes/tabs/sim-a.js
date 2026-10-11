/* sim-a.js — Simulation design A, "The log": the result reads like a Warcraft Logs report. Press Run and the live app's
   model runs on the planner's character: the estimate against what Fury warriors average, the damage sources as a
   table with bars, how the number was computed, and what the estimate misses for you. Stat priority and the upgrade
   finder sit in tabs underneath and are worked out when opened, since each re-runs the model dozens of times. */
(function(){
"use strict";
const S=window.SimKit;if(!S)return;
const {esc}=S;
const mount=document.getElementById("simui");if(!mount)return;
const IN_TAB=/a/.test(window.SIM_PICKED||"");
let res=null,tab="sources",extra=null,msg="";
const say=t=>{msg=t;const m=mount.querySelector("#sa-msg");if(m)m.textContent=t;};
const KIT=()=>window.TBCKit||null;

const css=document.createElement("style");
css.textContent=`
.sa-top{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:0 0 6px}
.sa-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0 10px;border-bottom:1px solid var(--rim-2);padding-bottom:8px}
.sa-grid{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.sa-grid{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)}}
.sa-grid h3{font:400 var(--t-md) var(--f-head);margin:0 0 6px}`;
document.head.appendChild(css);

function body(){
  if(tab==="weights")return S.weightsHTML(extra&&extra.weights);
  if(tab==="upgrades")return S.upgradesHTML(extra&&extra.upgrades,12);
  const sim=res.simulation;
  return `<div class="sa-grid"><div><h3>Damage sources</h3>${S.sourcesHTML(sim)}</div><div><h3>How the number was computed</h3>${S.breakdownHTML(sim)}</div></div>`;
}
function render(){
  const b=S.current();
  let h=`<h2 class="sm-h">Simulate <small>the live app's model, on your planner character</small></h2>`;
  h+=`<p class="sm-who">${S.who(b)} · <a href="${S.PLANNER}">change it on the Character Planner</a></p>`;
  h+=`<div class="sa-top"><button type="button" class="btn big magnet" data-act="run">${res?"Run it again":"Run simulation"}</button><span class="okline" id="sa-msg" aria-live="polite">${esc(msg)}</span></div>`;
  if(!res){h+=`<p class="sm-busy">No run yet. Press Run simulation to estimate DPS for the character on the planner.</p>`;mount.innerHTML=h;return;}
  if(!res.ok){h+=`<p class="sm-cav">${esc(res.error)}</p>`;mount.innerHTML=h;return;}
  const sim=res.simulation,vs=S.versus(sim.scoreExact);
  h+=`<div class="sm-score"><span class="lab">${esc(sim.metricLabel)}</span><strong class="big num" id="sa-score">${S.fmt(sim.score,1)}</strong>`+
    (vs?`<span class="sm-vs">against <b class="num">${S.fmt(vs.observed)}</b> that Fury warriors average (archon.gg): ${esc(vs.text)}</span><span class="sm-ref" aria-hidden="true"><i style="width:${vs.pct.toFixed(1)}%"></i></span>`:"")+`</div>`;
  h+=S.caveatsHTML(sim);
  h+=`<div class="sa-tabs" role="tablist" aria-label="Report">`+[["sources","Damage sources"],["weights","Stat priority"],["upgrades","Upgrade finder"]].map(([k,l])=>
    `<button type="button" role="tab" class="sm-btn" id="sa-t-${k}" aria-selected="${tab===k}" aria-pressed="${tab===k}" data-tab="${k}">${l}</button>`).join("")+`</div>`;
  h+=`<div role="tabpanel" aria-labelledby="sa-t-${tab}" id="sa-body">${body()}</div>`;
  mount.innerHTML=h;
}
async function runNow(){
  say("Running…");const b=mount.querySelector('[data-act="run"]');if(b)b.disabled=true;
  if(KIT())KIT().embers&&KIT().embers(true);
  res=await S.later(()=>S.run());extra=null;
  render();say(res.ok?`Estimated ${S.fmt(res.simulation.score,1)} DPS.`:"The model couldn't run this character.");
  if(KIT()){KIT().embers&&KIT().embers(false);KIT().swell&&KIT().swell();}
  if(tab!=="sources")await openTab(tab);
}
async function openTab(k){
  tab=k;render();
  if(k!=="sources"&&!(extra&&extra[k])){extra=await S.later(()=>S.run({weights:true,upgrades:true}));render();}
  const f=mount.querySelector(`[data-tab="${k}"]`);if(f)f.focus();
}
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t||t.disabled)return;
  if(t.dataset.act==="run"){await runNow();const f=mount.querySelector('[data-act="run"]');if(f)f.focus();return;}
  if(t.dataset.tab){await openTab(t.dataset.tab);return;}
  if(await S.upgradeClick(t,extra&&extra.upgrades,say)){if(t.dataset.up){await runNow();}}
});
/* the character changed (here, or on the planner in another visit): the old result no longer describes it */
document.addEventListener("gear:change",e=>{if(e.detail&&e.detail.from==="sim")return;if(res){res=null;extra=null;render();say("The character changed. Run it again.");}});
render();
})();
