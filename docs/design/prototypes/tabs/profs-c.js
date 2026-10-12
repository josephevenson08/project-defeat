/* profs-c.js — Professions design C, "The road to 375": set your skill and see the rest of the climb as one route — the
   trainer stops as waypoints, each step's crafts or the zones to ride, with the steps you've passed folded away — and
   beside it the shopping list from here: what a vendor sells, priced at its fixed cost, and what you farm, counted, with
   who gathers it. The step you're in counts from its start, because the crafts are an expectation over the whole step.
   Your skill in each profession is kept for the session and shared with the other designs; the hash carries the
   profession (#mining). */
(function(){
"use strict";
const K=window.ProfKit;if(!K)return;
const {PROFS,CATS,$,$$,on,esc,plural,fmt}=K;
const ui=$("#profui");
const fromHash=()=>K.bySlug(decodeURIComponent(location.hash.slice(1)));
let cur=fromHash()||K.prof(K.store.get("pd-prof-sel"))||K.prof("Blacksmithing");
let openMap={};

const css=document.createElement("style");
css.textContent=`
.pc{display:grid;gap:16px}
.pc-top .in{display:grid;gap:12px}
.pc-chips{display:flex;flex-wrap:wrap;gap:6px}
.pc-chip{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:3px 12px 3px 3px;border-radius:999px;border:1px solid var(--rim-2);border-left:3px solid var(--pc);background:var(--scrim);color:var(--ink);font:600 var(--t-xs) var(--f-body);cursor:pointer}
.pc-chip .pk-ic{width:32px;height:32px;border-radius:50%}
.pc-chip[aria-pressed="true"]{border-color:var(--glow);box-shadow:0 0 0 2px var(--glow);background:var(--glow-soft)}
@media (max-width:700px){.pc-chip{min-height:44px}}
.pc-facts{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.pc-facts li{font:500 var(--t-xs) var(--f-mono);background:var(--glow-soft);border:1px solid var(--rim);border-radius:999px;padding:3px 10px}
.pc-facts b{font-family:var(--f-body);color:var(--ink-3);margin-right:5px;font-weight:600}
.pc-grid{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.pc-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start}}
.pc-road{list-style:none;margin:0;padding:0 0 0 26px;position:relative;display:grid;gap:8px}
.pc-road::before{content:"";position:absolute;left:10px;top:6px;bottom:6px;width:2px;background:linear-gradient(180deg,var(--amber),rgba(255,181,71,.15))}
.pc-wp{position:relative;padding:8px 10px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim)}
.pc-wp::before{content:"";position:absolute;left:-21px;top:13px;width:10px;height:10px;border-radius:50%;background:#1a1308;border:2px solid var(--amber)}
.pc-wp.here{border-color:var(--glow);box-shadow:0 0 18px -6px var(--glow)}
.pc-wp.here::before{background:var(--glow);border-color:var(--glow);box-shadow:0 0 10px var(--glow)}
.pc-wp.train{border-style:dashed;border-color:rgba(255,181,71,.45);background:rgba(255,181,71,.06)}
.pc-wp.train::before{border-radius:2px;transform:rotate(45deg)}
.pc-wh{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}
.pc-wh .pk-ic{width:30px;height:30px}
.pc-wh b{font-weight:600;font-size:var(--t-sm)}
.pc-wh small{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3);margin-left:auto}
.pc-wm{margin:4px 0 0;font-size:var(--t-xs);color:var(--ink-2)}
.pc-here{font:700 9px/1.5 var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:var(--glow-ink);background:var(--glow);border-radius:4px;padding:0 5px}
.pc-done{font-size:var(--t-xs);color:var(--ink-3);padding:6px 10px;border-radius:10px;border:1px dashed var(--rim-2)}
.pc-mapbtn{font:600 var(--t-xs) var(--f-body);min-height:36px;padding:4px 10px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--glow);cursor:pointer;margin-top:6px}
@media (max-width:700px){.pc-mapbtn{min-height:44px}}
.pc-wp .pk-map{margin-top:8px}
.pc-shop{display:grid;gap:12px}
@media (min-width:980px){.pc-shop{position:sticky;top:66px}}
.pc-list{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.pc-list li{display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 6px;border-radius:8px;border:1px solid var(--rim-2);background:var(--scrim);font-size:var(--t-sm)}
.pc-list .pk-ic{width:28px;height:28px}
.pc-list b{flex:1;min-width:0;font-weight:600}
.pc-list small{font-size:var(--t-xs);color:var(--ink-3)}
.pc-list .q{font:700 var(--t-sm) var(--f-mono);min-width:44px;text-align:right}
.pc-mini{margin:0;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.pc-tot{margin:0;font-size:var(--t-sm);color:var(--amber)}
.pc-note{margin:0;font-size:var(--t-xs);color:var(--ink-3)}
`;
document.head.appendChild(css);

function chipsHTML(){return `<div class="pc-chips" role="group" aria-label="Profession">${PROFS.map(p=>`<button type="button" class="pc-chip pk-cat-${p.cat}" data-prof="${esc(p.n)}" aria-pressed="${p===cur}">${K.icon(p.icon,32)}${esc(p.n)}</button>`).join("")}</div>`;}
function trainWp(s,skill){return `<li class="pc-wp train"><div class="pc-wh"><b>Train ${esc(s.tier)}</b><small>at ${s.at} · level ${s.lvl}</small></div><p class="pc-wm">${esc(s.from)}${skill>=s.at?" · you're past it":""}</p></li>`;}
function roadCraft(p,skill){
  const i=K.stepAt(p.craft,skill),done=skill>=375?p.craft.length:i,stops=p.stops.filter(s=>s.at>=(done<p.craft.length?p.craft[done].range[0]:375));
  let out=done?`<li class="pc-done">${plural(done,"step")} behind you, to skill ${p.craft[done-1].range[1]}</li>`:"";
  p.craft.slice(done).forEach((s,k)=>{
    const idx=done+k;
    while(stops.length&&stops[0].at<s.range[1]&&(stops[0].at>=s.range[0]||k===0))out+=trainWp(stops.shift(),skill);
    const here=idx===i&&skill<375;
    out+=`<li class="pc-wp${here?" here":""}"><div class="pc-wh">${K.icon(s.cIcon,30)}<b>Make ${fmt(s.crafts)} × ${esc(s.name)}</b>${here?`<span class="pc-here">You are here</span>`:""}<small>${s.range[0]}–${s.range[1]}</small></div>`+
      `<p class="pc-wm">${s.mats.slice().sort((a,b)=>b.q-a.q).slice(0,3).map(m=>`${fmt(m.q)} ${esc(m.n)}`).join(" · ")}${s.mats.length>3?` · and ${s.mats.length-3} more`:""}${s.vendor?` · vendor ${K.copper(s.vendor)}`:""}</p></li>`;
  });
  out+=stops.map(s=>trainWp(s,skill)).join("");
  if(skill>=375)out+=`<li class="pc-wp here"><div class="pc-wh"><b>At 375: the climb is done</b></div></li>`;
  return out;
}
function roadGather(p,skill){
  const n=p.gather.length,inAt=r=>r.range;
  let i=p.gather.findIndex((r,k)=>skill>=r.range[0]&&(skill<r.range[1]||k===n-1));if(i<0)i=0;
  const done=skill>=375?n:i,stops=p.stops.filter(s=>s.at>=(done<n?p.gather[done].range[0]:375));
  let out=done?`<li class="pc-done">${plural(done,"range")} behind you, to skill ${p.gather[done-1].range[1]}</li>`:"";
  p.gather.slice(done).forEach((r,k)=>{
    const idx=done+k;
    while(stops.length&&stops[0].at<r.range[1]&&(stops[0].at>=r.range[0]||k===0))out+=trainWp(stops.shift(),skill);
    const here=idx===i&&skill<375,key=p.n+idx,open=!!openMap[key];
    out+=`<li class="pc-wp${here?" here":""}"><div class="pc-wh"><b>${esc(r.mats.slice(0,3).join(", "))}</b>${here?`<span class="pc-here">You are here</span>`:""}<small>${r.range[0]}–${r.range[1]} · level ${esc(r.lvl)}</small></div>`+
      `<p class="pc-wm">${r.zones.slice(0,4).map(esc).join(" · ")}</p>`+
      (r.routes.length?`<button type="button" class="pc-mapbtn" data-map="${idx}" aria-expanded="${open}">${open?"Hide":"Show"} the route in ${esc(r.routes[0].zone)}</button>${open?K.routeSVG(r.routes[0]):""}`:"")+`</li>`;
  });
  out+=stops.map(s=>trainWp(s,skill)).join("");
  return out;
}
function shopHTML(p,skill){
  if(!p.craft){
    const left=p.gather?p.gather.filter((r,k)=>skill<r.range[1]||k===p.gather.length-1&&skill<375):[];
    const mats=[...new Set(left.flatMap(r=>r.mats))];
    return `<section class="box pc-shop" data-enter aria-labelledby="pc-sh"><h2 id="pc-sh">What you'll gather <small>from ${skill}</small></h2><div class="in" style="display:grid;gap:10px">`+
      (p.gather?`<p class="pc-note">A gathering climb costs time, not gold: there is nothing to buy.</p><ul class="pc-list">${mats.map(m=>`<li><b>${esc(m)}</b></li>`).join("")||`<li><b>Nothing left: you're at 375</b></li>`}</ul>`:`<p class="pc-note">No path recorded; the guide covers it.</p>`)+`</div></section>`;
  }
  const s=K.shopping(p,skill),farmTotal=s.farm.reduce((a,m)=>a+m.q,0);
  const by={};s.farm.forEach(m=>{const g=K.gathererOf(m.n)||"Drops or the auction house";by[g]=(by[g]||0)+m.q;});
  return `<section class="box pc-shop" data-enter aria-labelledby="pc-sh"><h2 id="pc-sh">The shopping list <small>from ${s.from}${s.from<skill?` (the start of your step)`:""} to 375</small></h2><div class="in" style="display:grid;gap:10px">`+
    (s.steps.length?`<ul class="pc-facts"><li><b>Crafts</b>${fmt(s.crafts)}</li><li><b>Vendor</b>${K.copper(s.cost)}</li><li><b>To farm</b>${fmt(farmTotal)}</li></ul>`+
      `<p class="pc-mini">Buy from a vendor</p>${s.buy.length?`<ul class="pc-list">${s.buy.map(m=>`<li data-t="${esc(m.n)}: ${K.copper(m.unit)} each">${K.icon(m.ic,28)}<b>${esc(m.n)}</b><small>${K.copper(m.unit)} each</small><span class="q">${fmt(m.q)}</span></li>`).join("")}</ul><p class="pc-tot">${K.copper(s.cost)} in all</p>`:`<p class="pc-note">Nothing: every reagent left is farmed.</p>`}`+
      `<p class="pc-mini">Farm or buy at the auction house</p><p class="pc-note">${Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([g,q])=>`${esc(g)} ${Math.round(q/farmTotal*100)}%`).join(" · ")}</p>`+
      `<ul class="pc-list">${s.farm.map(m=>{const g=K.gathererOf(m.n);return `<li data-t="${esc(m.n)}${m.from.length?`: or make it from ${m.from.map(f=>f.q+" "+f.n).join(", ")}`:""}">${K.icon(m.ic,28)}<b>${esc(m.n)}</b><small>${g?esc(g):""}</small><span class="q">${fmt(m.q)}</span></li>`;}).join("")}</ul>`+
      `<p class="pc-note">Farmed materials aren't priced: that would need auction prices, which vary by realm and week.</p>`:
      `<p class="pc-note">Nothing left to make: you're at 375.</p>`)+`</div></section>`;
}
function draw(focusSel){
  const p=cur,skill=K.getSkill(p.n);
  const stopsLeft=p.stops.filter(s=>s.at>skill).length;
  const steps=p.craft||p.gather||[];
  const left=p.craft?(skill>=375?0:p.craft.length-K.stepAt(p.craft,skill)):p.gather?p.gather.filter((r,k)=>skill<r.range[1]||(k===p.gather.length-1&&skill<375)).length:0;
  ui.innerHTML=`<div class="pc"><section class="box pc-top" data-enter aria-labelledby="pc-th"><h2 id="pc-th">${esc(p.n)} <small>${esc(p.cat)} · to ${p.cap} · <a href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer">step-by-step guide</a></small></h2><div class="in">`+
    chipsHTML()+
    `<div class="pk-skill"><label for="pc-sk">Your skill</label><input type="range" id="pc-sk-r" min="1" max="375" value="${skill}" aria-label="Your skill, slider"><input type="number" id="pc-sk" min="1" max="375" value="${skill}"></div>`+
    `<ul class="pc-facts"><li><b>Left</b>${375-skill} points</li><li><b>${p.craft?"Steps":"Ranges"}</b>${left} of ${steps.length}</li><li><b>Trainer stops</b>${stopsLeft}</li>${p.payoff?`<li><b>At 70</b>${K.kindsOf(p).map(k=>K.KIND_WORD[k]).join(", ")}</li>`:""}</ul>`+
    `</div></section><div class="pc-grid"><section class="box" data-enter aria-labelledby="pc-rh"><h2 id="pc-rh">The road from ${skill} <small>trainer stops are the diamonds</small></h2><div class="in">`+
    (steps.length?`<ol class="pc-road">${p.craft?roadCraft(p,skill):roadGather(p,skill)}</ol>`:`<p class="pc-note">No path recorded for ${esc(p.n)}; the guide above covers it.</p>`)+
    `</div></section>${shopHTML(p,skill)}</div></div>`;
  if(focusSel){const f=$(focusSel);if(f)f.focus({preventScroll:true});}
  K.drawRoutes(ui);
}
function setProf(p){cur=p;K.store.set("pd-prof-sel",p.n);try{history.replaceState(null,"","#"+K.slug(p.n));}catch(e){}}
function setSkillTo(v,focusSel){K.setSkill(cur.n,v);draw(focusSel);const s=K.getSkill(cur.n);const sh=cur.craft?K.shopping(cur,s):null;
  K.say(`Skill ${s}: ${375-s} points left${sh&&sh.cost?`, ${K.copper(sh.cost)} from vendors`:""}.`);}
on(ui,"click",e=>{
  const b=e.target.closest("[data-prof]");if(b){setProf(K.prof(b.dataset.prof));draw(`[data-prof="${CSS.escape(cur.n)}"]`);K.say(`${cur.n}: from ${K.getSkill(cur.n)} to 375.`);if(K.motion())K.rise(ui,true);return;}
  const m=e.target.closest("[data-map]");if(m){const key=cur.n+m.dataset.map;openMap[key]=!openMap[key];draw(`[data-map="${m.dataset.map}"]`);}
});
on(ui,"change",e=>{if(e.target.id==="pc-sk")setSkillTo(+e.target.value,"#pc-sk");});
on(ui,"input",e=>{if(e.target.id==="pc-sk-r"){clearTimeout(on.t);const v=+e.target.value;on.t=setTimeout(()=>setSkillTo(v,"#pc-sk-r"),60);}});
on(window,"hashchange",()=>{const p=fromHash();if(p&&p!==cur){setProf(p);draw();}});

window.PROFS_DESIGN="c";
K.start({render(){draw();}});
})();
