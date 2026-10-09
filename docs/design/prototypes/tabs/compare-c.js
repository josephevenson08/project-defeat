/* compare-c.js — Compare design C, "Shortlist table": every option for the slot at once. Each row is one item from
   Wowhead's ranked list, with its stat changes against what you wear, where it leaves your hit against the cap and an
   example score; pin any two for a head-to-head underneath. Built for "which of these is best for me", not just "this
   or that". */
(function(){
"use strict";
const G=window.GearKit,C=window.CompareKit;if(!G||!C)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("cmpui");if(!mount)return;
const KEY="pd-compare-c";
let ui={slot:"Head",pins:[]};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&G.SLOT[v.slot]&&Array.isArray(v.pins))ui=v;}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};

const css=document.createElement("style");
css.textContent=`
.cc-wrap{overflow-x:auto;border:1px solid var(--rim-2);border-radius:12px;background:var(--scrim)}
.cc-t{width:100%;border-collapse:collapse;font-size:var(--t-sm);min-width:720px}
.cc-t th,.cc-t td{padding:7px 9px;border-top:1px solid var(--rim-2);text-align:right;vertical-align:middle;white-space:nowrap}
.cc-t thead th{border-top:0;font:600 10px var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3)}
.cc-t .it{text-align:left;white-space:normal;min-width:220px}
.cc-t .it .row{display:flex;gap:9px;align-items:center}
.cc-t .it img{width:34px;height:34px;border-radius:5px;border:1.5px solid var(--q,var(--rim));flex:none}
.cc-t .it b{display:block;font-size:var(--t-sm)}.cc-t .it small{display:block;font-size:var(--t-xs);color:var(--ink-3);font-weight:400}
.cc-t .pin{text-align:center;width:44px}
.cc-t .pin input{width:20px;height:20px;accent-color:var(--glow);cursor:pointer;margin:0}
.cc-t .pin label{display:inline-grid;place-items:center;min-width:36px;min-height:36px;cursor:pointer}
.cc-t tr.worn{background:color-mix(in srgb,var(--glow) 7%,transparent)}
.cc-t tr.pinned td,.cc-t tr.pinned th{box-shadow:inset 0 0 0 9999px rgba(255,255,255,.02)}
.cc-t .num{font-family:var(--f-mono)}
.cc-t .hit.warn{color:var(--warn)}.cc-t .hit.ok{color:#7fdc8a}
.cc-t .tag{font:700 9.5px var(--f-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--glow-ink);background:var(--glow);border-radius:4px;padding:1px 5px;margin-left:6px}
.cc-t .eqb{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:999px;padding:5px 12px;cursor:pointer;min-height:32px}
.cc-h2h{margin:14px 0 0;display:grid;gap:8px}
.cc-h2h h4{margin:0;font:400 var(--t-md) var(--f-head)}
.cc-h2h table{border-collapse:collapse;font-size:var(--t-sm);width:100%;max-width:640px}
.cc-h2h th,.cc-h2h td{padding:5px 9px;border-top:1px solid var(--rim-2);text-align:right}
.cc-h2h th:first-child{text-align:left;color:var(--ink-2);font-weight:400}
.cc-h2h thead th{border-top:0;font:600 var(--t-xs) var(--f-body);color:var(--ink)}
.cc-hint{font-size:var(--t-xs);color:var(--ink-3);margin:6px 0 0}
@media (max-width:699px),(pointer:coarse){.cc-t .eqb{min-height:44px}.cc-t .pin input{width:26px;height:26px}.cc-t .pin label{min-width:44px;min-height:44px}}
`;
document.head.appendChild(css);

const COLS=["Str","Agi","AP","Hit","Crit","Haste","Expertise","ArP"];
function defaults(list,wornId){
  ui.pins=ui.pins.filter(id=>list.some(x=>x.id===id));
  /* defaults only when nothing is pinned (a new slot, or a first visit), so unpinning one sticks */
  if(ui.pins.length===0){const want=[wornId,...list.map(x=>x.id)].filter(Boolean);for(const id of want){if(ui.pins.length>=2)break;if(!ui.pins.includes(id))ui.pins.push(id);}}
}
function render(){
  const s=C.S.get(),cur=s[ui.slot],wornId=cur&&cur.item,list=C.candidates(ui.slot);
  defaults(list,wornId);save();
  const a=wornId?cur:{item:null,enchant:null,gems:[]},sa=C.slotStats(a);
  const rows=list.map(c=>{const side=C.sideFor(ui.slot,c.id),sb=C.slotStats(side);return {c,side,sb,d:Object.fromEntries(COLS.map(k=>[k,sb[k]-sa[k]])),hit:C.hitWith(ui.slot,side),ex:C.exampleDelta(ui.slot,a,side)};});
  const cols=COLS.filter(k=>rows.some(r=>r.d[k]||r.sb[k]));
  const before=C.hitWith(ui.slot,a);
  let h=`<h3>Every option for one slot</h3><p class="lead">Each item on Wowhead's list for the slot, against what you wear: stat changes, where it leaves your hit, and an <span class="cx-ex">example</span> score. Pin two to compare them head-to-head below.</p>`+C.slotStrip(ui.slot);
  h+=`<div class="cc-wrap"><table class="cc-t"><caption class="sr">${G.esc(ui.slot)}: every ranked item against what you wear</caption><thead><tr><th scope="col" class="pin">Pin</th><th scope="col" class="it">Item</th>${cols.map(k=>`<th scope="col">${k==="Expertise"?"Exp":k}</th>`).join("")}<th scope="col">Hit after</th><th scope="col">Example</th><th scope="col"><span class="sr">Equip</span></th></tr></thead><tbody>`+
    rows.map(r=>{const worn=r.c.id===wornId,pinned=ui.pins.includes(r.c.id),cap=C.capNote(before,r.hit);
      return `<tr class="${worn?"worn":""}${pinned?" pinned":""}"><td class="pin"><label><input type="checkbox" data-pin="${r.c.id}" ${pinned?"checked":""} aria-label="Pin ${G.esc(r.c.name)} for the head-to-head"></label></td>
      <th scope="row" class="it" style="--q:${G.qVar(r.c.q)}"><span class="row"><img src="${G.iconUrl(r.c.icon)}" alt=""><span><b style="color:${G.qVar(r.c.q)}">${r.c.rank?r.c.rank+". ":""}${G.esc(r.c.name)}${worn?`<span class="tag">worn</span>`:""}</b><small>${r.c.ilvl} · ${G.esc(r.c.note||"")} · ${G.esc(r.c.src.text)}</small></span></span></th>`+
      cols.map(k=>{const v=r.d[k];return `<td class="num ${worn?"cx-eq":v>0?"cx-up":v<0?"cx-dn":"cx-eq"}">${worn?r.sb[k]||"·":v?C.fmt(v):"·"}</td>`;}).join("")+
      `<td class="num hit ${r.hit<G.HIT_CAP?"warn":"ok"}" title="The swap ${G.esc(cap.text)}">${r.hit}</td><td class="num ${worn?"cx-eq":r.ex>0?"cx-up":r.ex<0?"cx-dn":"cx-eq"}">${worn?"·":C.fmt(r.ex)}</td>
      <td>${worn?"":`<button type="button" class="eqb" data-equip="${r.c.id}" aria-label="Equip ${G.esc(r.c.name)}">Equip</button>`}</td></tr>`;}).join("")+`</tbody></table></div>
  <p class="cc-hint">The worn row shows the item's own stats; every other row shows the change against it. Hit after is your whole character's hit rating with that item (cap ${G.HIT_CAP}). <span class="okline" id="cc-msg" aria-live="polite"></span></p>`;
  if(ui.pins.length===2){
    const [p1,p2]=ui.pins.map(id=>rows.find(r=>r.c.id===id)).filter(Boolean);
    if(p1&&p2){const d=C.diff(p1.sb,p2.sb);
      h+=`<section class="cc-h2h" aria-labelledby="cc-h2h-h"><h4 id="cc-h2h-h">Head-to-head</h4><table><caption class="sr">${G.esc(p1.c.name)} against ${G.esc(p2.c.name)}</caption><thead><tr><th scope="col">Stat</th><th scope="col" style="color:${G.qVar(p1.c.q)}">${G.esc(p1.c.name)}</th><th scope="col" style="color:${G.qVar(p2.c.q)}">${G.esc(p2.c.name)}</th><th scope="col">Difference</th></tr></thead><tbody>`+
        d.map(r=>`<tr><th scope="row">${r.name}</th><td class="num">${r.a}</td><td class="num">${r.b}</td><td class="num ${r.d>0?"cx-up":r.d<0?"cx-dn":"cx-eq"}">${r.d?C.fmt(r.d):"same"}</td></tr>`).join("")+
        `<tr><th scope="row">Hit after (cap ${G.HIT_CAP})</th><td class="num">${p1.hit}</td><td class="num">${p2.hit}</td><td class="num ${p2.hit-p1.hit>0?"cx-up":p2.hit-p1.hit<0?"cx-dn":"cx-eq"}">${p2.hit-p1.hit?C.fmt(p2.hit-p1.hit):"same"}</td></tr>`+
        `<tr><th scope="row">Example score <span class="cx-ex">example</span></th><td class="num">${p1.ex}</td><td class="num">${p2.ex}</td><td class="num ${p2.ex-p1.ex>0?"cx-up":p2.ex-p1.ex<0?"cx-dn":"cx-eq"}">${p2.ex-p1.ex?C.fmt(p2.ex-p1.ex):"same"}</td></tr></tbody></table></section>`;}
  }else h+=`<p class="cc-hint">Pin two items to compare them head-to-head.</p>`;
  h+=`<p class="prov" style="margin:10px 0 0">Stat changes are real, for this slot (gear, gems, enchant and socket bonus); items you don't wear count with Wowhead's gems and your current enchant. The example score uses illustrative weights and stops counting hit at the cap. It is <span class="cx-ex">example</span> only: run Simulation for real numbers.</p>`;
  mount.innerHTML=h;
}
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.cslot){ui.slot=t.dataset.cslot;ui.pins=[];render();const f=mount.querySelector(`[data-cslot="${ui.slot}"]`);if(f)f.focus();return;}
  if(t.dataset.equip){const id=t.dataset.equip,name=G.item(id).name;C.equip(ui.slot,id,"compare-c");render();const m=$("#cc-msg");if(m)m.textContent=`${ui.slot}: equipped ${name}. The Gear tab shows it too.`;const f=mount.querySelector(`[data-pin="${id}"]`);if(f)f.focus();}
});
mount.addEventListener("change",e=>{
  const t=e.target;if(!t.dataset||!t.dataset.pin)return;const id=t.dataset.pin;
  if(t.checked){ui.pins=ui.pins.filter(x=>x!==id);ui.pins.push(id);if(ui.pins.length>2)ui.pins.shift();}else ui.pins=ui.pins.filter(x=>x!==id);
  render();const f=mount.querySelector(`[data-pin="${id}"]`);if(f)f.focus();
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="compare-c")render();});
render();C.openCompareTab();
})();
