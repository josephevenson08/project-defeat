/* compare-a.js — Compare design A, "Side-by-side tooltips": the in-game shift-compare. Your item's tooltip and the other
   item's sit next to each other; under the other one, the stat changes if you made the swap, green for gains and red for
   losses, then what it does to the hit cap. Pick the slot from your gear, the other item from that slot's ranked list. */
(function(){
"use strict";
const G=window.GearKit,C=window.CompareKit;if(!G||!C)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("cmpui");if(!mount)return;
const KEY="pd-compare-a";
/* inside the Character Planner (picked 2026-10-09: A with B's summary): a one-sentence summary of the trade sits above the
   tooltips, and the page keeps opening on the Gear tab */
const IN_PLANNER=!!window.COMPARE_IN_PLANNER;
let ui={slot:"Head",other:null};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&G.SLOT[v.slot])ui=v;}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=$("#ca-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.ca-pick{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 12px}
.ca-pick .lab{font-size:var(--t-xs);color:var(--ink-3);margin-right:4px}
.ca-alt{position:relative;width:52px;height:52px;padding:0;border-radius:7px;border:2px solid var(--q,var(--rim));background:#081019;cursor:pointer;overflow:hidden}
.ca-alt img{width:100%;height:100%;display:block}
.ca-alt .rk{position:absolute;left:0;top:0;font:700 10px/1 var(--f-mono);background:rgba(0,0,0,.82);color:#fff;padding:2px 4px;border-bottom-right-radius:5px}
.ca-alt .worn{position:absolute;right:0;bottom:0;font:700 8.5px/1 var(--f-mono);background:var(--glow);color:var(--glow-ink);padding:2px 3px;border-top-left-radius:4px;text-transform:uppercase}
.ca-alt[aria-pressed="true"]{box-shadow:0 0 0 2px #fff,0 0 16px -2px var(--glow)}
.ca-alt:hover,.ca-alt:focus-visible{border-color:#fff}
.ca-tips{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));align-items:start}
.ca-tip{background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:10px 12px;box-shadow:0 10px 30px rgba(0,0,0,.55)}
.ca-tip .hd{font:600 10px var(--f-mono);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin:0 0 6px}
.ca-tip .tt{max-width:none}
.ca-chg{margin-top:10px;padding-top:8px;border-top:1px solid rgba(154,167,199,.35);display:grid;gap:3px;font:400 12.5px/1.35 var(--f-body)}
.ca-chg b{font:600 11.5px var(--f-body);color:#ffd100}
.ca-chg .cap{margin-top:4px;font-weight:600}.ca-chg .cap.warn{color:var(--warn)}.ca-chg .cap.ok{color:#7fdc8a}
.ca-act{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:12px 0 0}
.ca-same{border:1px dashed var(--rim);border-radius:8px;padding:12px;color:var(--ink-2);font-size:var(--t-sm)}
.ca-sum{font:400 var(--t-md)/1.45 var(--f-body);margin:0 0 12px;padding:10px 12px;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px}
.ca-sum strong{font-weight:700}
@media (max-width:699px),(pointer:coarse){.ca-act .btn{min-height:44px}}
`;
document.head.appendChild(css);

function pickOther(){const list=C.candidates(ui.slot),cur=C.S.get()[ui.slot];const o=list.find(x=>x.id===ui.other);if(o&&o.id!==(cur&&cur.item))return o.id;const n=list.find(x=>x.id!==(cur&&cur.item));return n?n.id:null;}
function render(){
  ui.other=pickOther();save();
  const s=C.S.get(),cur=s[ui.slot],wornId=cur&&cur.item,list=C.candidates(ui.slot);
  let h=`<h3>Compare with what you wear</h3><p class="lead">Hold your item against another for the same slot, as the game does when you hover with Shift. Items you don't wear count with Wowhead's gems and your current enchant.</p>`+C.slotStrip(ui.slot);
  h+=`<div class="ca-pick" role="group" aria-label="${ui.slot} items"><span class="lab">Compare with</span>`+list.map(c=>`<button type="button" class="ca-alt" data-other="${c.id}" aria-pressed="${c.id===ui.other}" style="--q:${G.qVar(c.q)}" aria-label="${c.rank?`Rank ${c.rank}: `:""}${G.esc(c.name)}${c.id===wornId?", what you wear":""}" title="${G.esc(c.name)}"><img src="${G.iconUrl(c.icon)}" alt="">${c.rank?`<span class="rk" aria-hidden="true">${c.rank}</span>`:""}${c.id===wornId?`<span class="worn" aria-hidden="true">worn</span>`:""}</button>`).join("")+`</div>`;
  if(!wornId&&!ui.other){mount.innerHTML=h+`<div class="ca-same">Nothing to compare in this slot.</div>`;return;}
  const a=cur&&cur.item?cur:{item:null,enchant:null,gems:[]},b=ui.other?C.sideFor(ui.slot,ui.other):null;
  const left=a.item?`<div class="ca-tip"><p class="hd">Currently equipped</p>${G.tooltipHTML(a.item,a,ui.slot)}</div>`:`<div class="ca-tip"><p class="hd">Currently equipped</p><span class="tt"><b>Nothing in this slot</b></span></div>`;
  let right="",summary="";
  if(b){
    const rows=C.diff(C.slotStats(a),C.slotStats(b)).filter(r=>r.d);
    const before=C.hitWith(ui.slot,a),after=C.hitWith(ui.slot,b),cap=C.capNote(before,after);
    const bc=list.find(x=>x.id===b.item);
    right=`<div class="ca-tip"><p class="hd">${bc&&bc.rank?`Rank ${bc.rank} · ${G.esc(bc.note)}`:"Not on Wowhead's list"}</p>${G.tooltipHTML(b.item,b,ui.slot)}
      <div class="ca-chg" aria-label="If you replace your item"><b>If you replace your item, these stats change:</b>`+
      (rows.length?rows.map(r=>`<span class="${r.d>0?"cx-up":"cx-dn"}">${C.fmt(r.d)} ${r.name}</span>`).join(""):`<span class="cx-eq">No stat changes</span>`)+
      (IN_PLANNER?"":`<span class="cap ${cap.warn?"warn":"ok"}">Hit ${before} → ${after}: the swap ${G.esc(cap.text)}.</span>
      <span class="cx-eq">Example score change: <b style="color:inherit">${C.fmt(C.exampleDelta(ui.slot,a,b))}</b> <span class="cx-ex">example</span></span>`)+`</div></div>`;
    if(IN_PLANNER){ /* B's summary: the trade in one sentence */
      const ex=C.exampleDelta(ui.slot,a,b),word=r=>`${C.fmt(r.d)} ${r.name.replace(" Rating","")}`;
      const gains=rows.filter(r=>r.d>0).sort((x,y)=>y.d-x.d).map(word),loss=rows.filter(r=>r.d<0).sort((x,y)=>x.d-y.d).map(word);
      summary=`<p class="ca-sum">${gains.length?`You gain <strong class="cx-up">${gains.join(", ")}</strong>`:"You gain nothing"}${loss.length?` and lose <strong class="cx-dn">${loss.join(", ")}</strong>`:""}. The swap <strong class="${cap.warn?"cx-dn":"cx-up"}">${G.esc(cap.text)}</strong> (${before} → ${after}). Example score: <strong>${C.fmt(ex)}</strong> <span class="cx-ex">example</span></p>`;
    }
  }
  h+=summary+`<div class="ca-tips">${left}${right||`<div class="ca-same">Pick an item above to compare.</div>`}</div>`;
  if(b)h+=`<div class="ca-act"><button type="button" class="btn" data-act="equip">Equip ${G.esc(G.item(b.item).name)}</button><span class="okline" id="ca-msg" aria-live="polite"></span></div>`;
  h+=`<p class="prov" style="margin:10px 0 0">The example score weighs each stat with illustrative values and stops counting hit at the cap. It is <span class="cx-ex">example</span> only: run Simulation for real numbers.</p>`;
  mount.innerHTML=h;
}
mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.cslot){ui.slot=t.dataset.cslot;ui.other=null;render();const f=mount.querySelector(`[data-cslot="${ui.slot}"]`);if(f)f.focus();return;}
  if(t.dataset.other){ui.other=t.dataset.other;render();const f=mount.querySelector(`[data-other="${ui.other}"]`);if(f)f.focus();return;}
  if(t.dataset.act==="equip"&&ui.other){const name=G.item(ui.other).name;C.equip(ui.slot,ui.other,"compare-a");ui.other=null;render();say(`${ui.slot}: equipped ${name}. The Gear tab shows it too.`);}
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="compare-a")render();});
render();if(!IN_PLANNER)C.openCompareTab();
})();
