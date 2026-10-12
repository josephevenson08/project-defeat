/* profs-b.js — Professions design B, "Which two to take": every profession by what it gives a level 70 character,
   led by your spec — which items on its Wowhead Phase 2 list the profession makes (bisRankings.json, with the
   specialisation and whether it binds on pickup). Pick two primary professions to see the pair: what you get, how many
   of your spec's places it covers, and whether one feeds the other (the share of the crafter's farmed materials the
   gatherer brings in, from the crafting paths). The secondary three are open to everyone.
   In the Professions tab (window.PROFS_IN_TAB) it is design A's second view, "Which two": profs-a.js starts the page
   and hands it the area to draw in (window.ProfsB.setHost). */
(function(){
"use strict";
const K=window.ProfKit;if(!K)return;
const {D,PROFS,$,$$,on,esc,plural}=K;
const ui=$("#profui");
let host=ui;
let spec=K.store.get("pd-prof-spec")||D.me; if(!D.specs.some(s=>s.key===spec))spec=D.me;
let pair=(()=>{try{const v=JSON.parse(K.store.get("pd-prof-pair")||"[]");return Array.isArray(v)?v.filter(n=>K.prof(n)&&K.prof(n).cat!=="Secondary").slice(0,2):[];}catch(e){return [];}})();
const savePair=()=>K.store.set("pd-prof-pair",JSON.stringify(pair));
const PRIMARY=PROFS.filter(p=>p.cat!=="Secondary"), SECONDARY=PROFS.filter(p=>p.cat==="Secondary");
const KORD={stat:0,gear:1,utility:2,feeds:3};
const forSpec=p=>p.wh.filter(w=>w.spec===spec).sort((a,b)=>a.rank-b.rank);
/* who a gatherer supplies, and how much of each crafter's farmed materials */
const supplies=g=>Object.entries(D.feeds).map(([c,by])=>[c,by[g]||0]).filter(x=>x[1]>=10).sort((a,b)=>b[1]-a[1]);
const fedBy=c=>Object.entries(D.feeds[c]||{}).filter(x=>x[1]>=10).sort((a,b)=>b[1]-a[1]);
function order(list){return list.slice().sort((a,b)=>forSpec(b).length-forSpec(a).length||Math.min(...K.kindsOf(a).map(k=>KORD[k]))-Math.min(...K.kindsOf(b).map(k=>KORD[k]))||a.n.localeCompare(b.n));}

const css=document.createElement("style");
css.textContent=`
.pb{display:grid;gap:16px}
.pb-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}
.pb-ctl label{font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);display:flex;align-items:center;gap:8px}
.pb-ctl select{min-height:40px;font-weight:600;font-size:var(--t-sm);text-transform:none;letter-spacing:0}
@media (max-width:700px){.pb-ctl select{min-height:44px}}
.pb-pair .in{display:grid;gap:12px}
.pb-slots{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media (max-width:600px){.pb-slots{grid-template-columns:minmax(0,1fr)}}
.pb-slot{display:flex;align-items:center;gap:10px;min-height:64px;padding:8px 10px;border-radius:12px;border:1px dashed var(--rim);background:var(--scrim)}
.pb-slot.full{border-style:solid;border-color:var(--pc,var(--rim));border-left:3px solid var(--pc)}
.pb-slot .pk-ic{width:40px;height:40px}
.pb-slot b{display:block;font:400 var(--t-lg)/1.1 var(--f-head)}
.pb-slot small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.pb-slot button{margin-left:auto;font:600 var(--t-xs) var(--f-body);min-height:36px;padding:5px 11px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink-2);cursor:pointer}
@media (max-width:700px){.pb-slot button{min-height:44px}}
.pb-sum{margin:0;padding:0 0 0 18px;display:grid;gap:4px;font-size:var(--t-sm);color:var(--ink-2)}
.pb-sum b{color:var(--ink)}
.pb-grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.pb-card{display:grid;gap:8px;padding:12px;border-radius:14px;border:1px solid var(--rim-2);border-top:3px solid var(--pc);background:var(--scrim);align-content:start}
.pb-card.on{border-color:var(--glow);box-shadow:0 0 0 1px var(--glow),0 0 24px -8px var(--glow)}
.pb-ch{display:flex;align-items:center;gap:10px}
.pb-ch .pk-ic{width:40px;height:40px}
.pb-ch b{display:block;font:400 var(--t-lg)/1.1 var(--f-head)}
.pb-ch small{display:block;font-size:var(--t-xs);color:var(--ink-3)}
.pb-pick{margin-left:auto;font:600 var(--t-xs) var(--f-body);min-height:40px;padding:6px 12px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink);cursor:pointer;white-space:nowrap}
.pb-pick[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
.pb-pick:disabled{opacity:.45;cursor:not-allowed}
@media (max-width:700px){.pb-pick{min-height:44px}}
.pb-v{margin:0;font-size:var(--t-sm);color:var(--ink-2)}
.pb-tags{display:flex;flex-wrap:wrap;gap:4px}
.pb-for{display:grid;gap:4px;padding:8px;border-radius:10px;background:rgba(255,255,255,.03);border:1px solid var(--rim-2)}
.pb-for>span{font:600 10px var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.pb-items{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.pb-items li{display:flex;align-items:center;gap:8px;font-size:var(--t-sm)}
.pb-items .pk-ic{width:26px;height:26px}
.pb-items b{font-weight:600;color:var(--q-epic)}
.pb-items small{font-size:var(--t-xs);color:var(--ink-3)}
.pb-rank{font:700 10px/1 var(--f-mono);padding:3px 5px;border-radius:999px;border:1px solid var(--rim);color:var(--ink-2)}
.pb-rank.r1{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
.pb-none{font-size:var(--t-xs);color:var(--ink-3)}
.pb-feed{margin:0;font-size:var(--t-xs);color:var(--ink-2)}
.pb-feed b{color:var(--ink)}
.pb-perks{margin:0;padding:0;list-style:none;display:grid;gap:4px}
.pb-perks li{font-size:var(--t-xs);color:var(--ink-2)}
.pb-perks li b{color:var(--ink);font-weight:600}
details.pb-more>summary{cursor:pointer;font:600 var(--t-xs) var(--f-body);color:var(--glow);min-height:36px;display:flex;align-items:center;list-style:none}
details.pb-more>summary::-webkit-details-marker{display:none}
details.pb-more>summary::before{content:"+ ";font-family:var(--f-mono);margin-right:2px}
details.pb-more[open]>summary::before{content:"− "}
@media (max-width:700px){details.pb-more>summary{min-height:44px}}
`;
document.head.appendChild(css);

const itemLi=w=>`<li>${K.icon(w.ic,26)}<span class="pb-rank${w.rank===1?" r1":""}" title="Rank ${w.rank} on the list">#${w.rank}</span><span><b>${esc(w.n)}</b> <small>${esc(w.slot.replace(/ [12]$/,""))}${w.bop?" · binds on pickup":""}${w.via?` · ${esc(w.via)}`:""}</small></span></li>`;
function cardHTML(p,primary){
  const items=forSpec(p),on=pair.includes(p.n),full=pair.length>=2&&!on;
  const sup=p.gather?supplies(p.n):[],fed=p.craft?fedBy(p.n):[];
  return `<article class="pb-card pk-cat-${p.cat}${on?" on":""}" data-card="${esc(p.n)}"><div class="pb-ch">${K.icon(p.icon,40)}<span><b>${esc(p.n)}</b><small>${esc(p.cat)}</small></span>`+
    (primary?`<button type="button" class="pb-pick" data-pick="${esc(p.n)}" aria-pressed="${on}"${full?` disabled title="You have two: drop one first"`:""}>${on?"Picked":"Pick"}</button>`:"")+`</div>`+
    (p.payoff?`<p class="pb-v">${esc(p.payoff.verdict)}</p><div class="pb-tags">${[...new Map(p.payoff.perks.map(x=>[x.kind+(x.ph||""),x])).values()].sort((a,b)=>KORD[a.kind]-KORD[b.kind]).map(x=>K.kindTag(x.kind,x.ph)).join("")}</div>`:"")+
    `<div class="pb-for"><span>For ${esc(K.specName(spec))}, from Wowhead's list</span>${items.length?`<ul class="pb-items">${items.slice(0,4).map(itemLi).join("")}</ul>${items.length>4?`<span class="pb-none">and ${items.length-4} more</span>`:""}`:`<span class="pb-none">Makes nothing on its list</span>`}</div>`+
    (sup.length?`<p class="pb-feed">Supplies ${sup.map(([c,v])=>`<b>${esc(c)}</b> (${v}% of its farmed materials)`).join(", ")}.</p>`:"")+
    (fed.length?`<p class="pb-feed">Fed by ${fed.map(([g,v])=>`<b>${esc(g)}</b> (${v}% of its farmed materials)`).join(", ")}.</p>`:p.craft?`<p class="pb-feed">No gathering profession supplies it: its materials drop or are bought.</p>`:"")+
    (p.payoff&&p.payoff.perks.length?`<details class="pb-more"><summary>What you get, in full</summary><ul class="pb-perks">${p.payoff.perks.map(x=>`<li><b>${esc(x.n)}</b>${x.skill?` (skill ${x.skill})`:""}${x.ph?` · phase ${x.ph}`:""}: ${esc(x.d)}</li>`).join("")}</ul></details>`:"")+`</article>`;
}
function pairHTML(){
  const ps=pair.map(K.prof);
  const slot=(p,i)=>p?`<div class="pb-slot full pk-cat-${p.cat}">${K.icon(p.icon,40)}<span><b>${esc(p.n)}</b><small>${esc(p.cat)}</small></span><button type="button" data-drop="${esc(p.n)}" aria-label="Drop ${esc(p.n)}">Drop</button></div>`:
    `<div class="pb-slot"><span><b style="color:var(--ink-3)">${i?"Second":"First"} profession</b><small>Press Pick on a card below</small></span></div>`;
  let sum="";
  if(ps.length){
    const items=ps.flatMap(forSpec),stat=ps.filter(p=>K.kindsOf(p).includes("stat"));
    const lines=[];
    lines.push(items.length?`<b>${plural(items.length,"place")}</b> on the ${esc(K.specName(spec))} list made by ${ps.length===2?"this pair":"it"}${items.some(w=>w.rank===1)?`, including a first pick: ${items.filter(w=>w.rank===1).map(w=>esc(w.n)).join(", ")}`:""}.`:`Nothing on the ${esc(K.specName(spec))} list is made by ${ps.length===2?"either":"it"}.`);
    if(stat.length)lines.push(`<b>${esc(stat[0].n)}</b> is the one profession that puts a permanent stat on your character sheet.`);
    if(ps.length===2){
      const [a,b]=ps,ab=(D.feeds[b.n]||{})[a.n]||0,ba=(D.feeds[a.n]||{})[b.n]||0;
      if(ab>=10)lines.push(`<b>${esc(a.n)}</b> feeds <b>${esc(b.n)}</b>: ${ab}% of its farmed materials.`);
      else if(ba>=10)lines.push(`<b>${esc(b.n)}</b> feeds <b>${esc(a.n)}</b>: ${ba}% of its farmed materials.`);
      else if(a.craft&&b.craft)lines.push("Two crafters: neither gathers for the other, so every material is farmed elsewhere or bought.");
      else if(a.gather&&b.gather)lines.push("Two gatherers: no crafting, so the payoff is gold rather than anything on your character.");
      else lines.push("Neither feeds the other.");
    }
    sum=`<ul class="pb-sum">${lines.map(l=>`<li>${l}</li>`).join("")}</ul>`;
  }
  return `<section class="box pb-pair" data-enter aria-labelledby="pb-ph"><h2 id="pb-ph">Your two <small>everyone gets two primary professions; the secondary three are open to all</small></h2><div class="in">`+
    `<div class="pb-ctl"><label for="pb-spec">For <select id="pb-spec">${D.specs.map(s=>`<option value="${esc(s.key)}"${s.key===spec?" selected":""}>${esc(s.spec)} ${esc(s.cls)}</option>`).join("")}</select></label></div>`+
    `<div class="pb-slots">${slot(ps[0],0)}${slot(ps[1],1)}</div>${sum}</div></section>`;
}
function draw(focusSel){
  host.innerHTML=`<div class="pb">${pairHTML()}`+
    `<section class="box" data-enter aria-labelledby="pb-gh"><h2 id="pb-gh">Primary professions <small>${PRIMARY.length} · best for ${esc(K.specName(spec))} first</small></h2><div class="in"><div class="pb-grid">${order(PRIMARY).map(p=>cardHTML(p,true)).join("")}</div></div></section>`+
    `<section class="box" data-enter aria-labelledby="pb-sh"><h2 id="pb-sh">Secondary professions <small>open to every character, on top of your two</small></h2><div class="in"><div class="pb-grid">${SECONDARY.map(p=>cardHTML(p,false)).join("")}</div></div></section>`+
    `<p class="prov">Payoffs from the live app's <code>professionPayoffs.ts</code> (icy-veins.com, wowhead.com); the items from Wowhead's Phase 2 lists for 27 specs; who feeds whom from the crafting paths' materials.</p></div>`;
  if(focusSel){const f=$(focusSel);if(f)f.focus({preventScroll:true});}
}
on(ui,"click",e=>{
  const pk=e.target.closest("[data-pick]");
  if(pk&&!pk.disabled){const n=pk.dataset.pick;pair=pair.includes(n)?pair.filter(x=>x!==n):[...pair,n].slice(0,2);savePair();draw(`[data-pick="${CSS.escape(n)}"]`);
    K.say(pair.includes(n)?`${n} picked.${pair.length===2?" Your pair: "+pair.join(" and ")+".":""}`:`${n} dropped.`);if(K.motion())K.rise($(".pb-pair").parentNode,true);return;}
  const d=e.target.closest("[data-drop]");if(d){const n=d.dataset.drop;pair=pair.filter(x=>x!==n);savePair();draw("#pb-spec");K.say(`${n} dropped.`);}
});
on(ui,"change",e=>{if(e.target.id==="pb-spec"){spec=e.target.value;K.store.set("pd-prof-spec",spec);draw("#pb-spec");K.say(`Professions for ${K.specName(spec)}.`);}});

window.ProfsB={render(){draw();},setHost(el){host=el||ui;}};
if(!window.PROFS_IN_TAB){window.PROFS_DESIGN="b";K.start({render(){draw();}});}
})();
