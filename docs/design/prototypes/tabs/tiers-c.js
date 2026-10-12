/* tiers-c.js — Spec Tier Lists design C, "What each spec brings": the tier lists as a raid-building tool. Every spec as
   a card with its tier and the buffs and debuffs it brings to a raid (raidcomp seatContributions, the same data Raid
   Composition counts), grouped by Wowhead's tiers. Pick a buff or debuff to see who brings it. The specs in your Raid
   Composition raid (or its example) are counted on their cards, and "Would add" lists who would bring something your
   raid has nobody for. The app's buff data does not cover every spec's utility yet, and the page says so. */
(function(){
"use strict";
const K=window.TierKit;if(!K)return;
const {SPECS,LISTS,ME,$,$$,on,esc,plural}=K;
const ui=$("#tierui");
/* every buff and debuff any spec brings, once, grouped by reach */
const ALL={};
K.KEYS.forEach(k=>SPECS[k].brings.forEach(b=>{if(!ALL[b.id])ALL[b.id]=Object.assign({who:[]},b);ALL[b.id].who.push(k);}));
const SCOPES=[["raid","Whole raid"],["party","Its group"],["debuff","Boss debuffs"]];
let pickId=null;

const css=document.createElement("style");
css.textContent=`
.tc{display:grid;gap:16px}
.tc-pick .in{display:grid;gap:10px}
.tc-grp{display:grid;grid-template-columns:110px minmax(0,1fr);gap:8px;align-items:start}
@media (max-width:600px){.tc-grp{grid-template-columns:minmax(0,1fr)}}
.tc-grp>span{font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);padding-top:12px}
.tc-icons{display:flex;flex-wrap:wrap;gap:4px}
.tc-bf{position:relative;width:44px;height:44px;display:grid;place-items:center;border-radius:9px;border:1px solid var(--rim-2);background:var(--scrim);cursor:pointer;padding:0}
.tc-bf img{width:32px;height:32px;border-radius:5px;display:block}
.tc-bf b{position:absolute;right:-4px;bottom:-4px;min-width:16px;height:16px;border-radius:8px;padding:0 3px;font:700 10px/16px var(--f-mono);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink-2)}
.tc-bf[aria-pressed="true"]{border-color:var(--glow);box-shadow:0 0 0 2px var(--glow)}
.tc-bf.miss{border-style:dashed;border-color:var(--warn)}
.tc-bf.miss::after{content:"";position:absolute;inset:3px;border-radius:6px;background:rgba(3,9,13,.45)}
.tc-now{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:8px 10px;border-radius:10px;border:1px solid var(--glow);background:var(--glow-soft);font-size:var(--t-sm)}
.tc-now img{width:28px;height:28px;border-radius:5px}
.tc-now button{margin-left:auto;font:600 var(--t-xs) var(--f-body);min-height:36px;padding:5px 12px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink);cursor:pointer}
@media (max-width:700px){.tc-now button{min-height:44px}}
.tc-legend{font-size:var(--t-xs);color:var(--ink-3);margin:0}
.tc-raid .in{display:grid;gap:10px}
.tc-add{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.tc-addi{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim);min-height:52px}
.tc-addi b{display:block;font-size:var(--t-sm)}
.tc-addi small{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.tc-addi small img{width:20px;height:20px;border-radius:4px}
.tc-sec{display:grid;gap:10px}
.tc-sec>h3{margin:4px 0 0;font:400 var(--t-lg)/1.2 var(--f-head);display:flex;align-items:center;gap:10px}
.tc-cards{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.tc-card{position:relative;display:grid;gap:6px;padding:9px 10px;border-radius:12px;border:1px solid var(--rim-2);border-left:3px solid var(--cc);background:var(--scrim);transition:opacity .2s}
.tc-card.dim{opacity:.25}
.tc-card.hit{border-color:var(--glow);box-shadow:0 0 18px -6px var(--glow)}
.tc-card.me{box-shadow:inset 0 0 0 1px var(--glow)}
.tc-ch{display:flex;align-items:center;gap:8px;border:0;background:none;color:var(--ink);font:inherit;text-align:left;padding:0;min-height:40px;cursor:default;border-radius:8px}
.tc-ch .tk-ic{width:34px;height:34px}
@media (max-width:700px){.tc-ch{min-height:44px}}
.tc-ch b{display:block;font-size:var(--t-sm);font-weight:600}
.tc-ch small{font-size:var(--t-xs);color:var(--ink-3)}
.tc-tags{position:absolute;top:8px;right:8px;display:flex;gap:4px;align-items:center}
.tc-in{font:700 10px/1.5 var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:var(--glow-ink);background:var(--glow);border-radius:4px;padding:0 5px}
.tc-br{display:flex;flex-wrap:wrap;gap:4px}
.tc-arch{font-size:var(--t-xs);color:var(--ink-3);margin:0}
.tc-gap{font-size:var(--t-sm);background:var(--warn-soft);color:var(--ink);border:1px solid rgba(255,207,122,.25);border-left:3px solid var(--warn);border-radius:8px;padding:8px 11px;margin:0}
.tc-gap strong{color:var(--warn)}
`;
document.head.appendChild(css);

const icon=(b,size)=>b.ic?`<img src="${K.iconUrl(b.ic)}" alt="" width="${size}" height="${size}" loading="lazy">`:"";
function raidBrings(r){const set=new Set();r.seats.forEach(s=>SPECS[s.key].brings.forEach(b=>set.add(b.id)));return set;}
function pickHTML(r){
  const have=raidBrings(r),cur=pickId?ALL[pickId]:null;
  return `<section class="box tc-pick" data-enter aria-labelledby="tc-ph"><h2 id="tc-ph">Who brings… <small>${Object.keys(ALL).length} buffs and debuffs</small></h2><div class="in">`+
    SCOPES.map(([sc,lab])=>`<div class="tc-grp"><span>${lab}</span><div class="tc-icons" role="group" aria-label="${lab}">`+
      Object.values(ALL).filter(b=>b.scope===sc).map(b=>`<button type="button" class="tc-bf${have.has(b.id)?"":" miss"}" data-b="${esc(b.id)}" aria-pressed="${b.id===pickId}" title="${esc(b.n)}: ${plural(b.who.length,"spec")}${have.has(b.id)?"":"; nobody in "+(r.saved?"your":"the example")+" raid"}" aria-label="${esc(b.n)}, ${plural(b.who.length,"spec")}${have.has(b.id)?"":", missing from the raid"}">${icon(b,32)}<b>${b.who.length}</b></button>`).join("")+`</div></div>`).join("")+
    (cur?`<div class="tc-now">${icon(cur,28)}<span><strong>${esc(cur.n)}</strong> (${cur.scope==="party"?"reaches its group":cur.scope==="raid"?"reaches the whole raid":"a boss debuff"}): ${cur.who.map(k=>esc(K.label(k))).join(", ")}.</span><button type="button" data-act="clear">Show every spec</button></div>`:
      `<p class="tc-legend">Press an icon to light the specs that bring it. The number is how many specs do; a dashed icon is one nobody in ${r.saved?"your":"the example"} raid brings.</p>`)+
    `</div></section>`;
}
function raidHTML(r){
  const have=raidBrings(r);
  const add=K.KEYS.map(k=>({k,miss:SPECS[k].brings.filter(b=>!have.has(b.id))})).filter(x=>x.miss.length).sort((a,b)=>b.miss.length-a.miss.length).slice(0,6);
  const missing=Object.values(ALL).filter(b=>!have.has(b.id));
  return `<section class="box tc-raid" data-enter aria-labelledby="tc-rh"><h2 id="tc-rh">${r.saved?"Your raid":"The example raid"} <small>${plural(r.seats.length,"player")} · from <a href="raid-composition.html">Raid Composition</a></small></h2><div class="in">`+
    `<p style="margin:0;font-size:var(--t-sm);color:var(--ink-2)">${r.saved?"The raid you built on Raid Composition this session.":"The example 25-player raid; build your own on Raid Composition and it shows here."} It brings ${Object.keys(ALL).length-missing.length} of the ${Object.keys(ALL).length}${missing.length?`; nobody brings ${missing.map(b=>esc(b.n)).join(", ")}`:""}.</p>`+
    (add.length?`<p class="tk-mini" style="margin:0">Would add something nobody brings</p><div class="tc-add">${add.map(x=>`<div class="tc-addi" data-spec="${esc(x.k)}">${K.specIcon(x.k,32)}<span><b>${esc(K.label(x.k))}</b><small>${x.miss.map(b=>`<span title="${esc(b.n)}">${icon(b,20)}<span class="sr">${esc(b.n)}</span></span>`).join("")}</small></span></div>`).join("")}</div>`:"")+
    `</div></section>`;
}
function cardHTML(k,r,role,lab){
  const s=SPECS[k],n=r.count(k),hit=pickId&&s.brings.some(b=>b.id===pickId);
  return `<div class="tc-card${pickId&&!hit?" dim":""}${hit?" hit":""}${k===ME?" me":""}" data-k="${esc(k)}" style="--cc:${s.col}">`+
    `<button type="button" class="tc-ch" data-spec="${esc(k)}">${K.specIcon(k,34)}<span><b>${esc(K.label(k))}</b><small>${esc(role)} ${esc(lab)}${s.places.length>1?" · "+s.places.filter(p=>p.role!==role).map(p=>`${p.role} ${p.label}`).join(", "):""}</small></span></button>`+
    `<span class="tc-tags">${k===ME?`<span class="tk-you">You</span>`:""}${n?`<span class="tc-in" title="${plural(n,"player")} in ${r.saved?"your":"the example"} raid">×${n} in raid</span>`:""}</span>`+
    `<div class="tc-br">${K.bringsHTML(k,{size:24,hl:pickId})}</div>`+
    (s.archon&&role==="DPS"?`<p class="tc-arch">${esc(K.archonText(k))}</p>`:"")+`</div>`;
}
function draw(focusSel){
  const r=K.raid();
  const secs=LISTS.map(l=>`<section class="box tc-sec-box" data-enter aria-labelledby="tc-${l.role}"><h2 id="tc-${l.role}">${esc(l.role)} <small>Wowhead's tiers · <a href="${esc(l.url)}" target="_blank" rel="noreferrer noopener">their reasoning</a></small></h2><div class="in tc-sec">`+
    l.tiers.map((t,d)=>`<h3><span class="tk-tl d${d}">${esc(t.label)}</span><small class="prov">${plural(t.specs.length,"spec")}</small></h3><div class="tc-cards">${t.specs.map(k=>cardHTML(k,r,l.role,t.label)).join("")}</div>`).join("")+`</div></section>`).join("");
  ui.innerHTML=`<div class="tc">${pickHTML(r)}${raidHTML(r)}`+
    `<p class="tc-gap"><strong>Not every spec's utility is counted yet.</strong> This is the buff data Raid Composition uses, and it is built around what a raid gives its damage dealers: caster-side debuffs and mana (Shadow Priest's, for one) are not in it, so those specs bring more than their cards show.</p>`+
    secs+`</div>`;
  if(focusSel){const f=$(focusSel);if(f)f.focus({preventScroll:true});}
}
on(ui,"click",e=>{
  const b=e.target.closest("[data-b]");
  if(b){const id=b.dataset.b;pickId=pickId===id?null:id;draw(`[data-b="${CSS.escape(id)}"]`);
    const x=ALL[id];K.say(pickId?`${x.n}: ${x.who.map(K.label).join(", ")}.`:"Showing every spec.");
    if(pickId&&K.motion())K.land($$(".tc-card.hit"));return;}
  if(e.target.closest('[data-act="clear"]')){const id=pickId;pickId=null;draw(`[data-b="${CSS.escape(id)}"]`);K.say("Showing every spec.");}
});

window.TIERS_DESIGN="c";
K.start({render(){draw();}});
})();
