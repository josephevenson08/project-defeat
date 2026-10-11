/* sim-c.js — Simulation design C, "What to do next": guidance first. The live app's model runs on the planner's
   character and the page leads with what to act on: your stat priority from the real weights ("1 Strength is worth 2.0
   Attack Power") and the upgrades ranked by real DPS gain, with Equip. Then the estimate itself, with an honest panel
   on how far to trust it: every DPS spec's best case by this model against what players average.
   As the Simulation tab (picked 2026-10-11: C with A's table), step 3 also shows design A's damage sources and how the
   number was computed, under the estimate. */
(function(){
"use strict";
const S=window.SimKit;if(!S)return;
const {esc}=S;
const mount=document.getElementById("simui");if(!mount)return;
const WITH_TABLE=/c/.test(window.SIM_PICKED||"")&&/a/.test(window.SIM_PICKED||"");
let res=null,msg="",busy=false;
const say=t=>{msg=t;const m=mount.querySelector("#sc-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.sc-steps{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:1000px){.sc-steps{grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)}.sc-steps .wide{grid-column:1/-1}}
.sc-step{background:var(--scrim);border:1px solid var(--rim-2);border-radius:12px;padding:12px 14px}
.sc-step h3{display:flex;align-items:baseline;gap:10px;font:400 var(--t-lg) var(--f-head);margin:0 0 8px}
.sc-step h3 .n{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1px solid var(--rim);color:var(--glow);font:500 var(--t-sm) var(--f-mono);flex:none}
.sc-top{font-size:var(--t-md);margin:0 0 10px}
.sc-top b{color:var(--glow)}
.sc-est{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px}
.sc-est .big{font:500 clamp(2rem,6vw,3rem)/1 var(--f-mono);color:var(--glow)}
.sc-tab{display:grid;gap:14px;grid-template-columns:minmax(0,1fr);margin:12px 0}
@media (min-width:980px){.sc-tab{grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)}}
.sc-tab h4{font:400 var(--t-md) var(--f-head);margin:0 0 6px}`;
document.head.appendChild(css);

function render(){
  const b=S.current();
  let h=`<h2 class="sm-h">What to do next <small>from the live app's model, on your planner character</small></h2><p class="sm-who">${S.who(b)} · <a href="${S.PLANNER}">change it on the Character Planner</a></p>`;
  if(!res){h+=`<p class="sm-busy" aria-live="polite">Running the model, its stat weights and the upgrade finder…</p>`;mount.innerHTML=h;return;}
  if(!res.ok){mount.innerHTML=h+`<p class="sm-cav">${esc(res.error)}</p>`;return;}
  const w=res.weights,u=res.upgrades,sim=res.simulation;
  const top=w?w.entries.filter(e=>!e.notModeledYet&&e.perPoint>0).sort((a,b)=>b.relative-a.relative):[];
  const best=u&&u.candidates[0];
  h+=`<div class="sc-steps"><section class="sc-step" aria-labelledby="sc-h1"><h3 id="sc-h1"><span class="n">1</span>Your stat priority</h3>`+
    (top.length?`<p class="sc-top">Gem and enchant for <b>${esc(top[0].label)}</b>${top[1]?`, then ${esc(top[1].label)}`:""}${top[2]?`, then ${esc(top[2].label)}`:""}.</p>`:"")+S.weightsHTML(w)+`</section>`;
  h+=`<section class="sc-step" aria-labelledby="sc-h2"><h3 id="sc-h2"><span class="n">2</span>Your best upgrades</h3>`+
    (best?`<p class="sc-top">The biggest single gain is <b>${esc(best.item.name)}</b> in ${esc(best.slot)}: ${S.sign(best.scoreDelta,1)} DPS.</p>`:"")+
    S.upgradesHTML(u,8)+`<p class="prov" style="margin:8px 0 0">Every legal item in the catalogue, simulated as a straight swap with the best colour-matched gems, ranked by how much it moves the estimate. Equip works for items on Wowhead's Fury list; any other opens the live app with the swap made.</p></section>`;
  const vs=S.versus(sim.scoreExact);
  h+=`<section class="sc-step wide" aria-labelledby="sc-h3"><h3 id="sc-h3"><span class="n">3</span>The estimate, and how far to trust it</h3>
    <div class="sc-est"><span class="big num">${S.fmt(sim.score,1)}</span><span class="sm-vs">${esc(sim.metricLabel)}${vs?` · ${esc(vs.text)} (${S.fmt(vs.observed)})`:""}</span></div>${S.caveatsHTML(sim)}`+
    (WITH_TABLE?`<div class="sc-tab"><div><h4>Where the damage comes from</h4>${S.sourcesHTML(sim)}</div><div><h4>How the number was computed</h4>${S.breakdownHTML(sim)}</div></div>`:"")+
    `${S.trustHTML(sim.scoreExact)}</section></div>`;
  h+=`<p class="okline" id="sc-msg" aria-live="polite">${esc(msg)}</p>`;
  mount.innerHTML=h;
}
async function refresh(){if(busy)return;busy=true;res=null;render();res=await S.later(()=>S.run({weights:true,upgrades:true}));busy=false;render();}
mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t||t.disabled)return;
  if(res&&await S.upgradeClick(t,res.upgrades,say)){if(t.dataset.up){const m=msg;await refresh();say(m);const f=mount.querySelector("#sc-h2");if(f){f.tabIndex=-1;f.focus();}}}
});
document.addEventListener("gear:change",e=>{if(e.detail&&e.detail.from==="sim")return;refresh();});
refresh();
})();
