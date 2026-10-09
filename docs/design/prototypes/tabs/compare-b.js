/* compare-b.js — Compare design B, "Change chart": what the swap does, as bars. One bar per stat, gains to the right in
   green and losses to the left in red, scaled to the biggest change; a hit gauge shows where the swap leaves you against
   the 142 cap; a headline says the trade in one sentence. Pick the slot from your gear, the item from a list of chips. */
(function(){
"use strict";
const G=window.GearKit,C=window.CompareKit;if(!G||!C)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("cmpui");if(!mount)return;
const KEY="pd-compare-b";
let ui={slot:"Head",other:null};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&G.SLOT[v.slot])ui=v;}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const moving=()=>document.documentElement.classList.contains("motion")&&!matchMedia("(prefers-reduced-motion: reduce)").matches;

const css=document.createElement("style");
css.textContent=`
.cb-pick{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 14px}
.cb-pick .lab{font-size:var(--t-xs);color:var(--ink-3);margin-right:4px}
.cb-opt{display:inline-flex;align-items:center;gap:7px;font:600 var(--t-xs) var(--f-body);color:var(--ink);background:var(--glass-2);border:1px solid var(--rim-2);border-radius:999px;padding:3px 12px 3px 3px;cursor:pointer;min-height:36px}
.cb-opt img{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--q,var(--rim))}
.cb-opt[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 16%,var(--glass-2))}
.cb-opt:disabled{opacity:.5;cursor:default}
.cb-head{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;background:var(--scrim);border:1px solid var(--rim-2);border-radius:12px;padding:10px 12px;margin:0 0 12px}
.cb-head .side{display:flex;gap:10px;align-items:center;min-width:0}
.cb-head img{width:44px;height:44px;border-radius:6px;border:2px solid var(--q,var(--rim))}
.cb-head b{display:block;font-size:var(--t-sm)}.cb-head small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.cb-head .arrow{font:400 22px var(--f-head);color:var(--ink-3);text-align:center}
.cb-sum{font:400 var(--t-md)/1.45 var(--f-body);margin:0 0 12px}
.cb-sum strong{font-weight:700}
.cb-chart{width:100%;border-collapse:separate;border-spacing:0 5px;table-layout:fixed;font-size:var(--t-sm)}
.cb-chart th,.cb-chart td{padding:0 6px;border:0;vertical-align:middle}
.cb-chart .c1{width:11.5em}.cb-chart th[scope=row]{white-space:nowrap}.cb-chart .c4{width:3.6em}
.cb-chart th[scope=row]{color:var(--ink-2);font-weight:400;text-align:left}
.cb-chart .neg,.cb-chart .pos{position:relative;height:16px;background:rgba(255,255,255,.04);padding:0}
.cb-chart .neg{border-right:1px solid var(--rim)}.cb-chart .pos{border-left:1px solid var(--rim)}
.cb-chart .neg i{position:absolute;right:0;top:2px;bottom:2px;background:linear-gradient(270deg,#ff8f86,#c64a42);border-radius:3px 0 0 3px;transform-origin:right}
.cb-chart .pos i{position:absolute;left:0;top:2px;bottom:2px;background:linear-gradient(90deg,#4fbf63,#7fdc8a);border-radius:0 3px 3px 0;transform-origin:left}
.cb-chart .v{font-family:var(--f-mono);text-align:right}
.cb-chart thead th{font:600 10px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);text-align:left}
.cb-cap{margin:16px 0 0;display:grid;gap:6px}
.cb-cap h4{margin:0;font:600 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.cb-gauge{position:relative;height:22px;border-radius:6px;background:rgba(255,255,255,.05);border:1px solid var(--rim-2)}
.cb-gauge .cap{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--warn)}
.cb-gauge .cap::after{content:"cap 142";position:absolute;top:-16px;left:-18px;font:600 10px var(--f-mono);color:var(--warn)}
.cb-gauge .mk{position:absolute;top:3px;bottom:3px;border-radius:4px}
.cb-gauge .mk.now{background:rgba(160,180,210,.5)}
.cb-gauge .mk.then{background:var(--glow);opacity:.85;height:6px;top:auto;bottom:-1px}
.cb-key{display:flex;gap:14px;font-size:var(--t-xs);color:var(--ink-2);flex-wrap:wrap}
.cb-key i{display:inline-block;width:14px;height:8px;border-radius:2px;margin-right:5px;vertical-align:middle}
.cb-act{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0 0}
@media (max-width:599px){.cb-head{grid-template-columns:1fr;}.cb-head .arrow{display:none}.cb-chart .c1{width:6.5em}.cb-chart .c4{width:3.2em}
  .cb-chart{table-layout:auto}.cb-chart th[scope=row]{white-space:normal}}
@media (max-width:699px),(pointer:coarse){.cb-opt{min-height:44px}.cb-act .btn{min-height:44px}}
`;
document.head.appendChild(css);

function pickOther(){const list=C.candidates(ui.slot),cur=C.S.get()[ui.slot];const o=list.find(x=>x.id===ui.other);if(o&&o.id!==(cur&&cur.item))return o.id;const n=list.find(x=>x.id!==(cur&&cur.item));return n?n.id:null;}
function headSide(it,lab){return `<div class="side">`+(it?`<img src="${G.iconUrl(it.icon)}" alt="" style="--q:${G.qVar(it.q)}"><span><small>${lab}</small><b style="color:${G.qVar(it.q)}">${G.esc(it.name)}</b><small>${it.ilvl} · ${G.esc(it.src.text)}</small></span>`:`<span><small>${lab}</small><b>Nothing</b></span>`)+`</div>`;}
function render(){
  ui.other=pickOther();save();
  const s=C.S.get(),cur=s[ui.slot],wornId=cur&&cur.item,list=C.candidates(ui.slot);
  let h=`<h3>What a swap does</h3><p class="lead">Pick a slot, then the item you are thinking of. The bars show what changes against what you wear now; items you don't wear count with Wowhead's gems and your current enchant.</p>`+C.slotStrip(ui.slot);
  h+=`<div class="cb-pick" role="group" aria-label="${ui.slot}: swap to"><span class="lab">Swap to</span>`+list.map(c=>`<button type="button" class="cb-opt" data-other="${c.id}" aria-pressed="${c.id===ui.other}" ${c.id===wornId?"disabled":""} style="--q:${G.qVar(c.q)}"><img src="${G.iconUrl(c.icon)}" alt="">${c.rank?`${c.rank}. `:""}${G.esc(c.name)}${c.id===wornId?" (worn)":""}</button>`).join("")+`</div>`;
  if(!ui.other){mount.innerHTML=h+`<p class="prov">Nothing else to compare in this slot.</p>`;return;}
  const a=wornId?cur:{item:null,enchant:null,gems:[]},b=C.sideFor(ui.slot,ui.other),ia=G.item(a.item),ib=G.item(b.item);
  const rows=C.diff(C.slotStats(a),C.slotStats(b));const changed=rows.filter(r=>r.d);
  const max=Math.max(1,...changed.map(r=>Math.abs(r.d)));
  const before=C.hitWith(ui.slot,a),after=C.hitWith(ui.slot,b),cap=C.capNote(before,after),ex=C.exampleDelta(ui.slot,a,b);
  const gains=changed.filter(r=>r.d>0).sort((x,y)=>y.d-x.d).map(r=>`${C.fmt(r.d)} ${r.name.replace(" Rating","")}`),loss=changed.filter(r=>r.d<0).sort((x,y)=>x.d-y.d).map(r=>`${C.fmt(r.d)} ${r.name.replace(" Rating","")}`);
  h+=`<div class="cb-head">${headSide(ia,"You wear")}<span class="arrow" aria-hidden="true">→</span>${headSide(ib,"Swap to")}</div>`;
  h+=`<p class="cb-sum">${gains.length?`You gain <strong class="cx-up">${gains.join(", ")}</strong>`:"You gain nothing"}${loss.length?` and lose <strong class="cx-dn">${loss.join(", ")}</strong>`:""}. The swap <strong class="${cap.warn?"cx-dn":"cx-up"}">${G.esc(cap.text)}</strong> (${before} → ${after}). Example score: <strong>${C.fmt(ex)}</strong> <span class="cx-ex">example</span></p>`;
  h+=`<table class="cb-chart"><caption class="sr">Stat changes if you swap, ${G.esc(ui.slot)}</caption><thead><tr><th scope="col" class="c1">Stat</th><th scope="col" style="text-align:right">Lose</th><th scope="col">Gain</th><th scope="col" class="c4" style="text-align:right">Change</th></tr></thead><tbody>`+
    rows.map(r=>{const w=(Math.abs(r.d)/max*100).toFixed(1);
      return `<tr><th scope="row">${r.name}</th><td class="neg">${r.d<0?`<i style="width:${w}%"></i>`:""}</td><td class="pos">${r.d>0?`<i style="width:${w}%"></i>`:""}</td><td class="v ${r.d>0?"cx-up":r.d<0?"cx-dn":"cx-eq"}"><span class="sr">${r.a} to ${r.b}, </span>${r.d?C.fmt(r.d):"0"}</td></tr>`;}).join("")+`</tbody></table>`;
  const top=Math.max(G.HIT_CAP+30,before+10,after+10),pct=v=>(Math.min(v,top)/top*100).toFixed(1);
  h+=`<div class="cb-cap"><h4>Hit rating against the cap</h4><div class="cb-gauge" role="img" aria-label="Hit rating ${before} now, ${after} after the swap, cap ${G.HIT_CAP}">
    <span class="mk now" style="left:0;width:${pct(before)}%"></span><span class="mk then" style="left:0;width:${pct(after)}%"></span><span class="cap" style="left:${pct(G.HIT_CAP)}%"></span></div>
    <div class="cb-key"><span><i style="background:rgba(160,180,210,.5)"></i>Now: ${before}</span><span><i style="background:var(--glow)"></i>After the swap: ${after}</span></div></div>`;
  h+=`<div class="cb-act"><button type="button" class="btn" data-act="equip">Equip ${G.esc(ib.name)}</button><span class="okline" id="cb-msg" aria-live="polite"></span></div>
  <p class="prov" style="margin:10px 0 0">Bars and change are real stat differences for this slot (gear, gems, enchant and socket bonus). The example score weighs them with illustrative values and stops counting hit at the cap. It is <span class="cx-ex">example</span> only: run Simulation for real numbers.</p>`;
  mount.innerHTML=h;
  if(moving()&&window.gsap){const bars=mount.querySelectorAll(".cb-chart i");if(bars.length)gsap.from(bars,{scaleX:0,duration:.6,stagger:.04,ease:"power3.out"});}
}
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t||t.disabled)return;
  if(t.dataset.cslot){ui.slot=t.dataset.cslot;ui.other=null;render();const f=mount.querySelector(`[data-cslot="${ui.slot}"]`);if(f)f.focus();return;}
  if(t.dataset.other){ui.other=t.dataset.other;render();const f=mount.querySelector(`[data-other="${ui.other}"]`);if(f)f.focus();return;}
  if(t.dataset.act==="equip"&&ui.other){const name=G.item(ui.other).name;C.equip(ui.slot,ui.other,"compare-b");ui.other=null;render();const m=$("#cb-msg");if(m)m.textContent=`${ui.slot}: equipped ${name}. The Gear tab shows it too.`;}
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="compare-b")render();});
render();C.openCompareTab();
})();
