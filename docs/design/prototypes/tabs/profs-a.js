/* profs-a.js — Professions design A, "The profession window": like the game's own. Pick a profession from its icon; set
   your skill on the bar (trainer stops marked) and every recipe on the path to 375 takes its colour at that skill —
   orange, yellow, green or grey, from each recipe's own thresholds. Pick a recipe for its reagents, what it makes and
   what a vendor charges. A gathering profession lists its ranges instead, with the zones, the guidance and the computed
   route on a plain grid. The hash carries the profession (#mining); your skill in each is kept for the session.
   In the Professions tab (window.PROFS_IN_TAB, decided 2026-10-12) a switch adds design B's view, "Which two": every
   profession by what it gives a level 70 character and what it makes for your spec, and a pair to pick (profs-b.js,
   window.ProfsB). The switch is remembered for the session ("pd-prof-view"), and #which links to that view. */
(function(){
"use strict";
const K=window.ProfKit;if(!K)return;
const {PROFS,CATS,$,$$,on,esc,plural,fmt}=K;
const ui=$("#profui");
/* the tab: a "Level it / Which two" switch above one shared area that this design and design B draw into */
const B=window.PROFS_IN_TAB&&window.ProfsB?window.ProfsB:null;
let view=B&&(location.hash==="#which"||(!K.bySlug(decodeURIComponent(location.hash.slice(1)))&&K.store.get("pd-prof-view")==="which"))?"which":"level";
let host=ui;
if(B){
  ui.innerHTML=`<div class="pk-views" role="group" aria-label="Show"><button type="button" data-view="level" aria-pressed="${view==="level"}">Level it <small>the profession window</small></button>`+
    `<button type="button" data-view="which" aria-pressed="${view==="which"}">Which two <small>what each is worth to you</small></button></div><div id="profhost"></div>`;
  host=$("#profhost");B.setHost(host);
}
function setView(v){view=v;K.store.set("pd-prof-view",v);$$(".pk-views [data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===v)));}
const fromHash=()=>K.bySlug(decodeURIComponent(location.hash.slice(1)));
let cur=fromHash()||K.prof(K.store.get("pd-prof-sel"))||K.prof("Blacksmithing");
let pick={};   /* the chosen step (recipe or range) per profession, by index */
let zoneTab={};

const css=document.createElement("style");
css.textContent=`
.pk-views{display:inline-flex;gap:4px;padding:4px;margin:4px 0 12px;border-radius:999px;border:1px solid var(--rim);background:var(--scrim)}
.pk-views button{font:600 var(--t-sm) var(--f-body);min-height:44px;padding:6px 16px;border-radius:999px;border:0;background:none;color:var(--ink-2);cursor:pointer}
.pk-views button small{font:500 var(--t-xs) var(--f-body);color:var(--ink-3);margin-left:4px}
.pk-views button[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink)}
.pk-views button[aria-pressed="true"] small{color:var(--glow-ink)}
.pk-views button:hover:not([aria-pressed="true"]){color:var(--ink)}
@media (max-width:520px){.pk-views{display:flex}.pk-views button{flex:1;padding:6px 8px}.pk-views button small{display:none}}
.pa{display:grid;gap:16px}
.pa-tabs{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:flex-start}
.pa-grp{display:grid;gap:4px}
.pa-grp>span{font:600 10px var(--f-body);text-transform:uppercase;letter-spacing:.12em;color:var(--ink-3)}
.pa-grp ul{list-style:none;margin:0;padding:0;display:flex;gap:4px;flex-wrap:wrap}
.pa-p{width:52px;height:52px;display:grid;place-items:center;border-radius:12px;border:1px solid var(--rim-2);border-bottom:3px solid var(--pc);background:var(--scrim);cursor:pointer;padding:0}
.pa-p .pk-ic{width:36px;height:36px}
.pa-p[aria-pressed="true"]{border-color:var(--glow);box-shadow:0 0 0 2px var(--glow),0 0 20px -4px var(--glow)}
.pa-win{overflow:hidden}
.pa-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 14px;border-bottom:1px solid var(--rim-2);position:relative}
.pa-head .pk-ic{width:44px;height:44px}
.pa-head h2{margin:0;font:400 var(--t-xl)/1.1 var(--f-head)}
.pa-head small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.pa-head .pa-links{margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;font-size:var(--t-xs)}
.pa-verdict{padding:10px 14px;border-bottom:1px solid var(--rim-2);font-size:var(--t-sm);color:var(--ink-2);display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;position:relative}
.pa-verdict b{color:var(--ink);font-weight:600}
.pa-bar{padding:12px 14px;border-bottom:1px solid var(--rim-2);display:grid;gap:8px;position:relative}
.pa-track{position:relative;height:22px;border-radius:6px;background:linear-gradient(180deg,#1a1308,#0d0904);border:1px solid rgba(255,181,71,.35);overflow:visible}
.pa-fill{position:absolute;inset:0 auto 0 0;border-radius:5px;background:linear-gradient(180deg,#3b8f3a,#1f5e22);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.pa-track b{position:absolute;inset:0;display:grid;place-items:center;font:600 var(--t-xs) var(--f-mono);color:#fff;text-shadow:0 1px 2px #000}
.pa-stop{position:absolute;top:-6px;bottom:-6px;width:2px;background:var(--amber);border-radius:1px}
.pa-stop span{position:absolute;top:-16px;left:50%;transform:translateX(-50%);font:600 9px var(--f-mono);color:var(--amber);white-space:nowrap}
.pa-body{display:grid;grid-template-columns:minmax(0,1fr);position:relative}
@media (min-width:900px){.pa-body{grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)}}
.pa-list{list-style:none;margin:0;padding:8px;display:grid;gap:2px;align-content:start;max-height:640px;overflow:auto;border-right:1px solid var(--rim-2)}
@media (max-width:899px){.pa-list{max-height:360px;border-right:0;border-bottom:1px solid var(--rim-2)}}
.pa-r{width:100%;display:flex;align-items:center;gap:8px;min-height:44px;padding:4px 8px;border-radius:8px;border:1px solid transparent;background:none;color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.pa-r:hover{background:rgba(255,255,255,.04)}
.pa-r[aria-current="true"]{border-color:var(--glow);background:var(--glow-soft)}
.pa-r .pk-ic{width:26px;height:26px}
.pa-r b{flex:1;min-width:0;font-weight:600;font-size:var(--t-sm)}
.pa-r small{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3);white-space:nowrap}
.pa-here{font:700 9px/1.5 var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:var(--glow-ink);background:var(--glow);border-radius:4px;padding:0 5px;margin-left:6px;vertical-align:1px}
.pa-train{display:flex;align-items:center;gap:8px;padding:5px 8px;margin:2px 0;font-size:var(--t-xs);color:var(--amber);border-top:1px dashed rgba(255,181,71,.35);border-bottom:1px dashed rgba(255,181,71,.35)}
.pa-detail{padding:14px;display:grid;gap:12px;align-content:start}
.pa-dh{display:flex;align-items:center;gap:12px}
.pa-dh .pk-ic{width:48px;height:48px}
.pa-dh h3{margin:0;font:400 var(--t-lg)/1.2 var(--f-head)}
.pa-dh p{margin:2px 0 0;font-size:var(--t-sm);color:var(--ink-2)}
.pa-colors{display:grid;gap:4px}
.pa-cbar{position:relative;display:flex;height:14px;border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.pa-cbar i{display:block;height:100%}
.pa-cmark{position:absolute;top:-3px;bottom:-3px;width:3px;background:#fff;box-shadow:0 0 6px #fff;border-radius:2px}
.pa-cnums{display:flex;justify-content:space-between;font:500 10px var(--f-mono);color:var(--ink-3)}
.pa-mats{list-style:none;margin:0;padding:0;display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}
.pa-mats li{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:9px;border:1px solid var(--rim-2);background:var(--scrim);min-height:48px}
.pa-mats .pk-ic{width:34px;height:34px}
.pa-mats b{display:block;font-size:var(--t-sm);font-weight:600}
.pa-mats small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.pa-q{font:700 var(--t-sm) var(--f-mono);color:var(--ink);min-width:36px;text-align:right}
.pa-mini{margin:0;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.pa-note{margin:0;font-size:var(--t-sm);color:var(--ink-2)}
.pa-ztabs{display:flex;flex-wrap:wrap;gap:4px}
.pa-ztabs button{font:600 var(--t-xs) var(--f-body);min-height:36px;padding:5px 11px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink-2);cursor:pointer}
.pa-ztabs button[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
@media (max-width:700px){.pa-ztabs button{min-height:44px}}
.pa-model{font-size:var(--t-xs);color:var(--ink-3);padding:10px 14px;border-top:1px solid var(--rim-2);margin:0;position:relative}
`;
document.head.appendChild(css);

const COL={orange:"#ff8a3d",yellow:"#ffe14d",green:"#4be03c",grey:"#9d9d9d"};
function tabsHTML(){
  return `<nav class="pa-tabs" aria-label="Professions">${CATS.map(c=>`<div class="pa-grp"><span>${c}</span><ul>${PROFS.filter(p=>p.cat===c).map(p=>
    `<li><button type="button" class="pa-p pk-cat-${c}" data-prof="${esc(p.n)}" aria-pressed="${p===cur}" aria-label="${esc(p.n)}" data-t="${esc(p.n)}">${K.icon(p.icon,36)}</button></li>`).join("")}</ul></div>`).join("")}</nav>`;
}
function barHTML(p,skill){
  return `<div class="pa-bar"><div class="pa-track" role="img" aria-label="Skill ${skill} of 375"><span class="pa-fill" style="width:${(skill/375*100).toFixed(1)}%"></span>`+
    p.stops.map(s=>`<span class="pa-stop" style="left:${(s.at/375*100).toFixed(1)}%" data-t="Train ${esc(s.tier)} at ${s.at}: level ${s.lvl}, ${esc(s.from)}"><span>${esc(s.tier[0])}</span></span>`).join("")+
    `<b>${skill} / 375</b></div><div class="pk-skill"><label for="pa-sk">Your skill</label><input type="range" id="pa-sk-r" min="1" max="375" value="${skill}" aria-label="Your skill, slider"><input type="number" id="pa-sk" min="1" max="375" value="${skill}"></div></div>`;
}
function trainRow(s){return `<li class="pa-train" data-t="${esc(s.from)}">Train ${esc(s.tier)} at ${s.at} · level ${s.lvl}</li>`;}
function craftList(p,skill,sel){
  const here=K.stepAt(p.craft,skill);let si=0;const stops=p.stops.slice();
  return p.craft.map((s,i)=>{
    let pre="";while(stops.length&&stops[0].at<s.range[1]&&(stops[0].at>=s.range[0]||i===0)){pre+=trainRow(stops.shift());}
    const c=K.colorAt(s.colors,skill)||"grey",cc=c==="red"?"grey":c;
    return pre+`<li><button type="button" class="pa-r" data-step="${i}" aria-current="${i===sel}" data-t="${esc(s.name)}: ${c==="red"?"not learnable yet":c+" at "+skill+", "+K.COLOR_WORD[c]}">${K.icon(s.cIcon,26)}<b class="pk-c-${cc}">${esc(s.name)}${i===here&&skill<375?`<span class="pa-here">You</span>`:""}<span class="sr"> (${c})</span></b><small>${s.range[0]}–${s.range[1]} · ×${fmt(s.crafts)}</small></button></li>`;
  }).join("")+stops.map(trainRow).join("");
}
function craftDetail(p,s,skill){
  const c=K.colorAt(s.colors,skill),[o,y,g,gr]=s.colors||[0,0,0,0],span=Math.max(gr+15,s.range[1])-o||1;
  const seg=(a,b,col)=>`<i style="width:${((b-a)/span*100).toFixed(1)}%;background:${col}"></i>`;
  return `<div class="pa-dh">${K.icon(s.cIcon,48)}<div><h3 class="pk-c-${c==="red"?"grey":c}">${esc(s.name)}</h3><p>Makes ${esc(s.creates)} · skill ${s.range[0]} to ${s.range[1]} · about ${fmt(s.crafts)} crafts</p></div></div>`+
    (s.colors?`<div class="pa-colors"><p class="pa-mini">Its colours: learned at ${s.learned}, ${c==="red"?"not learnable yet":`<span class="pk-c-${c}">${c}</span> at your ${skill}`}</p>`+
      `<div class="pa-cbar" role="img" aria-label="Orange from ${o}, yellow from ${y}, green from ${g}, grey from ${gr}">${seg(o,y,COL.orange)}${seg(y,g,COL.yellow)}${seg(g,gr,COL.green)}${seg(gr,o+span,COL.grey)}`+
      (skill>=o&&skill<=o+span?`<span class="pa-cmark" style="left:${((skill-o)/span*100).toFixed(1)}%"></span>`:"")+`</div>`+
      `<div class="pa-cnums"><span>${o}</span><span>yellow ${y}</span><span>green ${g}</span><span>grey ${gr}</span></div></div>`:"")+
    `<p class="pa-mini">Reagents for the whole step</p><ul class="pa-mats">${s.mats.map(m=>{const who=m.v?"":K.gathererOf(m.n);
      return `<li data-t="${esc(m.n)}${m.from.length?`: or make it from ${m.from.map(f=>f.q+" "+f.n).join(", ")}`:""}">${K.icon(m.ic,34)}<span style="flex:1;min-width:0"><b>${esc(m.n)}</b><small>${m.v?`Vendor, ${K.copper(m.unit)} each`:who?`Farmed: ${esc(who)}`:m.from.length?`Or from ${m.from.map(f=>esc(f.n)).join(", ")}`:"Farmed or bought"}</small></span><span class="pa-q">${fmt(m.q)}</span></li>`;}).join("")}</ul>`+
    (s.vendor?`<p class="pa-note">A vendor sells part of it: <b>${K.copper(s.vendor)}</b> for the step.</p>`:"");
}
function gatherList(p,skill,sel){
  const stops=p.stops.slice();
  return p.gather.map((r,i)=>{
    let pre="";while(stops.length&&stops[0].at<r.range[1]&&(stops[0].at>=r.range[0]||i===0))pre+=trainRow(stops.shift());
    const inIt=skill>=r.range[0]&&(skill<r.range[1]||(i===p.gather.length-1&&skill<=r.range[1])),done=skill>=r.range[1]&&i<p.gather.length-1;
    return pre+`<li><button type="button" class="pa-r" data-step="${i}" aria-current="${i===sel}"><b class="${done?"pk-c-grey":inIt?"pk-c-orange":""}">${esc(r.mats.slice(0,3).join(", "))}${inIt&&skill<375?`<span class="pa-here">You</span>`:""}</b><small>${r.range[0]}–${r.range[1]}</small></button></li>`;
  }).join("")+stops.map(trainRow).join("");
}
function gatherDetail(p,r,i){
  const z=Math.min(zoneTab[p.n+i]||0,Math.max(0,r.routes.length-1)),rt=r.routes[z];
  return `<div class="pa-dh"><div><h3>${esc(r.mats.join(", "))}</h3><p>Skill ${r.range[0]} to ${r.range[1]} · character level ${esc(r.lvl)}</p></div></div>`+
    `<p class="pa-note">${esc(r.guidance)}</p>`+
    `<p class="pa-mini">Where to ride, best first</p><p class="pa-note">${r.zones.map(esc).join(" · ")}${r.noMap.length?` <span style="color:var(--ink-3)">(no recorded nodes for ${r.noMap.map(esc).join(", ")})</span>`:""}</p>`+
    (r.routes.length?`<div class="pa-ztabs" role="group" aria-label="Zone">${r.routes.map((x,k)=>`<button type="button" data-zone="${k}" aria-pressed="${k===z}">${esc(x.zone)}</button>`).join("")}</div>${K.routeSVG(rt)}`:"")+
    r.notes.filter(n=>!rt||n[0]===rt.zone).map(n=>`<p class="pa-note"><b>${esc(n[0])}:</b> ${esc(n[1])}</p>`).join("");
}
function draw(focusSel){
  const p=cur,skill=K.getSkill(p.n);
  const steps=p.craft||p.gather||[];
  const sel=pick[p.n]!=null?pick[p.n]:(p.craft?K.stepAt(p.craft,skill):Math.max(0,p.gather.findIndex((r,i)=>skill>=r.range[0]&&(skill<r.range[1]||i===p.gather.length-1))));
  const pay=p.payoff;
  host.innerHTML=`<div class="pa">${tabsHTML()}<section class="box pa-win pk-cat-${p.cat}" data-enter aria-labelledby="pa-h">`+
    `<div class="pa-head">${K.icon(p.icon,44)}<div><h2 id="pa-h">${esc(p.n)}</h2><small>${esc(p.cat)} · to ${p.cap}${p.craft?` · ${plural(p.craft.length,"recipe")} on the path`:p.gather?` · ${plural(p.gather.length,"range")}`:""}</small></div>`+
    `<span class="pa-links"><a href="${esc(p.guide)}" target="_blank" rel="noopener noreferrer">Step-by-step on wow-professions.com</a>${p.specUrl?`<a href="${esc(p.specUrl)}" target="_blank" rel="noopener noreferrer">Specializations</a>`:""}</span></div>`+
    (pay?`<div class="pa-verdict"><b>Worth at 70:</b> ${esc(pay.verdict)} ${K.kindsOf(p).map(k=>K.kindTag(k)).join("")}</div>`:"")+
    barHTML(p,skill)+
    (steps.length?`<div class="pa-body"><ol class="pa-list" aria-label="${p.craft?"Recipes on the path":"Ranges"}">${p.craft?craftList(p,skill,sel):gatherList(p,skill,sel)}</ol>`+
      `<div class="pa-detail" aria-live="polite">${p.craft?craftDetail(p,p.craft[sel],skill):gatherDetail(p,p.gather[sel],sel)}</div></div>`:
      `<p class="pa-note" style="padding:14px">No path recorded for ${esc(p.n)}; the guide above covers it.</p>`)+
    (p.craft?`<p class="pa-model">Craft counts are computed, not sourced: each recipe's chance of a point falls from yellow to grey, and the path picks the recipe that needs the least farming per point. Vendor staples are priced at their fixed vendor cost.</p>`:"")+
    `</section></div>`;
  if(focusSel){const f=$(focusSel);if(f)f.focus({preventScroll:true});}
  const curRow=$('.pa-r[aria-current="true"]'),list=$(".pa-list");
  if(curRow&&list){const lr=list.getBoundingClientRect(),rr=curRow.getBoundingClientRect();if(rr.top<lr.top||rr.bottom>lr.bottom)list.scrollTop+=rr.top-lr.top-lr.height/3;}
  K.drawRoutes(ui);
}
function setProf(p){cur=p;K.store.set("pd-prof-sel",p.n);try{history.replaceState(null,"","#"+K.slug(p.n));}catch(e){}}
function setSkillTo(v,focusSel){K.setSkill(cur.n,v);delete pick[cur.n];draw(focusSel);
  const s=K.getSkill(cur.n);if(cur.craft){const st=cur.craft[K.stepAt(cur.craft,s)];K.say(`Skill ${s}: ${st.name} is ${K.colorAt(st.colors,s)}.`);}else K.say(`Skill ${s}.`);}
on(ui,"click",e=>{
  const v=e.target.closest("[data-view]");
  if(v&&B){if(v.dataset.view===view)return;setView(v.dataset.view);K.hideTip();
    if(view==="which"){B.render();try{history.replaceState(null,"","#which");}catch(e){}K.say("Which two: every profession by what it gives a level 70 character.");}
    else{draw();try{history.replaceState(null,"","#"+K.slug(cur.n));}catch(e){}K.say(`Level it: ${cur.n}.`);}
    if(K.motion())K.rise(host,true);return;}
  const b=e.target.closest("[data-prof]");if(b){setProf(K.prof(b.dataset.prof));draw(`[data-prof="${CSS.escape(cur.n)}"]`);K.say(`${cur.n}.`);if(K.motion())K.rise(ui,true);return;}
  const s=e.target.closest("[data-step]");if(s){pick[cur.n]=+s.dataset.step;draw(`.pa-r[data-step="${s.dataset.step}"]`);return;}
  const z=e.target.closest("[data-zone]");if(z){const i=pick[cur.n]!=null?pick[cur.n]:+($('.pa-r[aria-current="true"]')||{dataset:{step:0}}).dataset.step;zoneTab[cur.n+i]=+z.dataset.zone;pick[cur.n]=i;draw(`[data-zone="${z.dataset.zone}"]`);}
});
on(ui,"change",e=>{if(e.target.id==="pa-sk")setSkillTo(+e.target.value,"#pa-sk");});
on(ui,"input",e=>{if(e.target.id==="pa-sk-r"){clearTimeout(on.t);const v=+e.target.value;on.t=setTimeout(()=>setSkillTo(v,"#pa-sk-r"),60);}});
on(window,"hashchange",()=>{
  if(B&&location.hash==="#which"){if(view!=="which"){setView("which");B.render();}return;}
  const p=fromHash();if(p&&(p!==cur||view!=="level")){setProf(p);if(B&&view!=="level")setView("level");draw();}
});

window.PROFS_DESIGN="a";
if(B)window.PROFS_ALSO=["b"];
K.start({render(){if(B&&view==="which")B.render();else draw();}});
})();
