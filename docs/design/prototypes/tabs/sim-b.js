/* sim-b.js — Simulation design B, "The workbench": for trying things. The planner's character is pinned as the
   baseline; changes made here (switch a buff or boss debuff, pick a flask, elixirs or food, try an upgrade from the
   finder) go on a copy, and the live app's model re-runs on every change: the estimate now against the baseline, in DPS
   and %, and per damage source. Nothing reaches the planner until "Keep these on the planner"; "Pin as the baseline"
   makes the current copy the new comparison point. An upgrade that isn't on Wowhead's Fury list can't be kept here,
   so the page offers the live app instead, through a share link. */
(function(){
"use strict";
const S=window.SimKit;if(!S)return;
const {esc,B,K}=S;
const mount=document.getElementById("simui");if(!mount)return;
const IN_TAB=/b/.test(window.SIM_PICKED||"");
let base=null,now=null,pane="buffs",ups=null,tried={},msg="";
const say=t=>{msg=t;const m=mount.querySelector("#sb-msg");if(m)m.textContent=t;};
const clone=o=>JSON.parse(JSON.stringify(o));

const css=document.createElement("style");
css.textContent=`
.sb-wrap{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.sb-wrap{grid-template-columns:minmax(0,1fr) 380px}.sb-res{position:sticky;top:70px;align-self:start}}
.sb-res{background:var(--scrim);border:1px solid var(--rim);border-radius:12px;padding:12px 14px}
.sb-two{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 8px}
.sb-two div{display:grid;gap:2px}
.sb-two b{font:500 clamp(1.6rem,4vw,2.2rem)/1 var(--f-mono)}
.sb-two .now b{color:var(--glow)}
.sb-two span{font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3)}
.sb-delta{font:600 var(--t-md) var(--f-mono);margin:0 0 8px}
.sb-delta.up{color:#7fdc8a}.sb-delta.dn{color:#ff8f86}.sb-delta.eq{color:var(--ink-3)}
.sb-src{width:100%;border-collapse:collapse;font-size:var(--t-xs)}
.sb-src th,.sb-src td{padding:4px 5px;border-bottom:1px solid var(--rim-2);text-align:right;font-family:var(--f-mono)}
.sb-src th:first-child,.sb-src td:first-child{text-align:left;font-family:var(--f-body)}
.sb-src th{color:var(--ink-3);font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.06em}
.sb-panes{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.sb-chips{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0}
.sb-chip{display:inline-flex;align-items:center;gap:6px;font:600 var(--t-xs) var(--f-body);background:var(--glass-2);border:1px solid var(--rim-2);color:var(--ink-2);border-radius:999px;padding:4px 10px 4px 4px;cursor:pointer;min-height:34px}
.sb-chip img{width:24px;height:24px;border-radius:50%}
.sb-chip[aria-pressed="true"]{border-color:var(--glow);color:var(--ink);background:color-mix(in srgb,var(--glow) 14%,var(--glass-2))}
.sb-chip[aria-pressed="false"] img{filter:grayscale(1) brightness(.6)}
.sb-chip.chg{box-shadow:0 0 0 2px var(--warn)}
.sb-cons{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.sb-cons label{display:grid;gap:4px;font:600 var(--t-xs) var(--f-body);color:var(--ink-2)}
.sb-cons select{font:600 var(--t-sm) var(--f-body);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:8px;padding:6px 8px;min-height:36px}
.sb-acts{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}
.sb-note{font-size:var(--t-xs);color:var(--ink-3);margin:6px 0 0}
@media (max-width:699px),(pointer:coarse){.sb-chip{min-height:44px}.sb-cons select{min-height:44px}}`;
document.head.appendChild(css);

const runOf=b=>S.runWith(b);
function pin(b){base={build:clone(b),res:runOf(b)};now={build:clone(b),res:base.res};tried={};ups=null;}
/* what changed between the baseline and now, in words */
function changes(){
  const a=base.build,b=now.build,out=[];
  const ids=x=>new Set([...x.activeBuffIds,...x.activeTargetDebuffIds]);
  const A=ids(a),N=ids(b);
  N.forEach(id=>{if(!A.has(id))out.push(`+ ${B.BY[id]?B.nameOf(B.BY[id]):id}`);});
  A.forEach(id=>{if(!N.has(id))out.push(`− ${B.BY[id]?B.nameOf(B.BY[id]):id}`);});
  const ca=new Set(a.activeConsumableIds),cb=new Set(b.activeConsumableIds);
  cb.forEach(id=>{if(!ca.has(id))out.push(`+ ${B.CON[id]?B.CON[id].name:id}`);});ca.forEach(id=>{if(!cb.has(id))out.push(`− ${B.CON[id]?B.CON[id].name:id}`);});
  Object.values(tried).forEach(c=>out.push(`${c.slot}: ${c.item.name}`));
  return out;
}
function resultHTML(){
  const a=base.res.simulation,b=now.res.simulation,d=b.scoreExact-a.scoreExact,pct=a.scoreExact?d/a.scoreExact*100:0;
  const names=[...new Set([...(a.damageSources||[]).map(s=>s.name),...(b.damageSources||[]).map(s=>s.name)])];
  const dps=(sim,n)=>((sim.damageSources||[]).find(s=>s.name===n)||{dps:0}).dps;
  const vs=S.versus(b.scoreExact);
  return `<div class="sb-two"><div><span>Baseline</span><b class="num">${S.fmt(a.score,1)}</b></div><div class="now"><span>Now</span><b class="num" id="sb-now">${S.fmt(b.score,1)}</b></div></div>
    <p class="sb-delta ${d>0.05?"up":d<-0.05?"dn":"eq"}" aria-live="polite">${Math.abs(d)<0.05?"No change":`${S.sign(d,1)} DPS (${S.sign(pct,1)}%)`}</p>
    <table class="sb-src"><caption class="sr">Damage sources, baseline against now</caption><thead><tr><th scope="col">Source</th><th scope="col">Base</th><th scope="col">Now</th><th scope="col">Change</th></tr></thead><tbody>`+
    names.map(n=>{const x=dps(a,n),y=dps(b,n),z=y-x;return `<tr><td>${esc(n)}</td><td>${S.fmt(x,1)}</td><td>${S.fmt(y,1)}</td><td style="color:${z>0.05?"#7fdc8a":z<-0.05?"#ff8f86":"var(--ink-3)"}">${Math.abs(z)<0.05?"–":S.sign(z,1)}</td></tr>`;}).join("")+`</tbody></table>`+
    (vs?`<p class="sb-note">Now ${esc(vs.text)} (${S.fmt(vs.observed)}, archon.gg).</p>`:"");
}
function buffsHTML(){
  const on=new Set([...now.build.activeBuffIds,...now.build.activeTargetDebuffIds]),was=new Set([...base.build.activeBuffIds,...base.build.activeTargetDebuffIds]);
  const chip=b=>{const o=on.has(b.id);return `<li><button type="button" class="sb-chip${o!==was.has(b.id)?" chg":""}" data-buff="${b.id}" aria-pressed="${o}"><img src="${B.iconUrl(b.icon)}" alt="">${esc(B.nameOf(b))}</button></li>`;};
  return `<p class="sb-note" style="margin:0 0 6px">Raid buffs</p><ul class="sb-chips">${B.D.buffs.map(chip).join("")}</ul>
    <p class="sb-note" style="margin:10px 0 6px">On the boss</p><ul class="sb-chips">${B.D.debuffs.map(chip).join("")}</ul>`;
}
function consHTML(){
  const cur=new Set(now.build.activeConsumableIds);
  return `<div class="sb-cons">`+B.CATS.map(([k,l])=>{const opts=B.conOptions(k),sel=opts.find(c=>cur.has(c.id));
    return `<label>${esc(l)}<select data-cat="${k}"><option value="">None</option>${opts.map(c=>`<option value="${c.id}"${sel&&sel.id===c.id?" selected":""}>${esc(c.name)}</option>`).join("")}</select></label>`;}).join("")+`</div>
    <p class="sb-note">A flask replaces both elixirs, as in the game.</p>`;
}
function gearHTML(){
  if(!ups)return `<p class="sm-busy">Running the upgrade finder on the baseline…</p>`;
  const list=ups.candidates.slice(0,10);if(!list.length)return `<p class="sm-busy">Nothing in the catalogue beats the baseline's gear.</p>`;
  return `<p class="sb-note" style="margin:0 0 6px">The finder's best swaps for the baseline. Try one or several; one per slot.</p><ol class="sm-up">`+list.map((c,i)=>{const on=tried[c.slot]&&tried[c.slot].item.id===c.item.id;
    return `<li>${S.itemIcon(c.item,40)}<span><b style="color:${S.qColor(c.item.quality)}">${esc(c.item.name)}</b> <span class="rk-src">${esc(c.slot)}</span></span><span class="d">${S.sign(c.scoreDelta,1)} DPS<small>alone</small></span>
      <span class="act"><button type="button" class="sm-btn" data-try="${i}" aria-pressed="${!!on}">${on?"Trying":"Try it"}</button></span><span class="meta">replaces ${esc(c.replacesName||"nothing")}${S.canEquip(c)?"":" · not on Wowhead's Fury list"}</span></li>`;}).join("")+`</ol>`;
}
function render(){
  if(!base)pin(S.current());
  const ch=changes(),unknown=Object.values(tried).some(c=>!S.canEquip(c));
  let h=`<h2 class="sm-h">Workbench <small>the live app's model, re-run on every change</small></h2><p class="sm-who">${S.who(base.build)} · <a href="${S.PLANNER}">the Character Planner holds it</a></p>`;
  if(!base.res.ok){mount.innerHTML=h+`<p class="sm-cav">${esc(base.res.error)}</p>`;return;}
  h+=`<div class="sb-wrap"><div><div class="sb-panes" role="tablist" aria-label="What to change">`+[["buffs","Buffs and debuffs"],["cons","Consumables"],["gear","Try an upgrade"]].map(([k,l])=>
    `<button type="button" role="tab" class="sm-btn" aria-selected="${pane===k}" aria-pressed="${pane===k}" data-pane="${k}">${l}</button>`).join("")+`</div>
    <div role="tabpanel">${pane==="buffs"?buffsHTML():pane==="cons"?consHTML():gearHTML()}</div></div>
    <aside class="sb-res" aria-label="Result">${resultHTML()}
      <p class="sb-note">${ch.length?`Changed: ${ch.map(esc).join(", ")}`:"No changes yet: switch something on the left."}</p>
      <div class="sb-acts"><button type="button" class="sm-btn" data-act="pin"${ch.length?"":" disabled"}>Pin as the baseline</button><button type="button" class="sm-btn" data-act="undo"${ch.length?"":" disabled"}>Undo all</button>
      ${unknown?`<button type="button" class="sm-btn" data-act="live">Open these in the live app ↗</button>`:`<button type="button" class="btn magnet" data-act="keep"${ch.length?"":" disabled"}>Keep these on the planner</button>`}</div>
      <p class="okline" id="sb-msg" aria-live="polite">${esc(msg)}</p></aside></div>`;
  mount.innerHTML=h;
}
const rerun=()=>{now.res=runOf(now.build);};
async function loadUps(){if(ups)return;ups=(await S.later(()=>S.runWith(base.build,{upgrades:true}))).upgrades||{candidates:[]};render();}

mount.addEventListener("click",async e=>{
  const t=e.target.closest("button");if(!t||t.disabled)return;
  const focus=sel=>{const f=mount.querySelector(sel);if(f)f.focus();};
  if(t.dataset.pane){pane=t.dataset.pane;render();focus(`[data-pane="${pane}"]`);if(pane==="gear")loadUps();return;}
  if(t.dataset.buff){const id=t.dataset.buff,deb=B.D.debuffs.some(d=>d.id===id),key=deb?"activeTargetDebuffIds":"activeBuffIds",arr=now.build[key];
    const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);else arr.push(id);rerun();render();focus(`[data-buff="${id}"]`);return;}
  if(t.dataset.try){const c=ups.candidates[+t.dataset.try];
    if(tried[c.slot]&&tried[c.slot].item.id===c.item.id){delete tried[c.slot];now.build.gear[c.slot]=clone(base.build.gear[c.slot]||{itemId:"",gemIds:[]});if(!base.build.gear[c.slot])delete now.build.gear[c.slot];}
    else{tried[c.slot]=c;now.build=S.withUpgrade(now.build,c);}
    rerun();render();focus(`[data-try="${t.dataset.try}"]`);return;}
  const a=t.dataset.act;
  if(a==="pin"){pin(now.build);render();say("Pinned: changes now compare against this.");focus('[data-pane="'+pane+'"]');if(pane==="gear")loadUps();return;}
  if(a==="undo"){now={build:clone(base.build),res:base.res};tried={};render();say("Back to the baseline.");focus('[data-pane="'+pane+'"]');return;}
  if(a==="keep"){const r=await K.read(JSON.stringify(now.build));if(r.ok){K.apply(r,"sim");pin(S.current());render();say("Kept: the Character Planner now holds these, with the Buffs tab set by hand.");}else say(r.error);focus('[data-pane="'+pane+'"]');return;}
  if(a==="live"){window.open(await S.liveLink(now.build),"_blank","noopener");say("Opened the live app with these changes.");}
});
mount.addEventListener("change",e=>{
  const s=e.target.closest("select[data-cat]");if(!s)return;
  const cat=s.dataset.cat,list=now.build.activeConsumableIds.filter(id=>!(B.CON[id]&&B.CON[id].cat===cat));
  if(s.value)list.push(s.value);
  /* a flask replaces both elixirs, and an elixir replaces the flask, as in the game */
  const flask=list.find(id=>B.CON[id]&&B.CON[id].cat==="flask");
  now.build.activeConsumableIds=cat==="flask"&&s.value?list.filter(id=>!(B.CON[id]&&/battle|guardian/.test(B.CON[id].cat))):(/battle|guardian/.test(cat)&&s.value&&flask?list.filter(id=>id!==flask):list);
  rerun();render();const f=mount.querySelector(`select[data-cat="${cat}"]`);if(f)f.focus();
});
/* the planner's character changed elsewhere: start again from it */
document.addEventListener("gear:change",e=>{if(e.detail&&e.detail.from==="sim")return;base=null;render();});
render();
})();
