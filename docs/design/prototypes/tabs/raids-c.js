/* raids-c.js — Raids design C, "From your raid": a loot plan for the raid you built on Raid Composition.
   It reads that tab's raid for the browser session (sessionStorage "pd-raidcomp-a:v1"), or the example raid it starts
   with, and for every drop shows who in it wants it: the specs whose Wowhead Phase 2 list ranks the item, with the
   rank. Drops go most-wanted first, and a drop three or more raiders rank first is marked contested. A tier token is
   wanted by whoever ranks a set piece it buys. Press a raider to see only their wishlist. Feral (Bear) has no
   Wowhead list of its own, so it is said rather than guessed.
   In the Raids tab (window.RAIDS_IN_TAB) it is design A's second view, "For my raid": raids-a.js starts the page and
   hands it the area to draw in (window.RaidsC.setHost). */
(function(){
"use strict";
const R=window.RaidKit;if(!R)return;
const {ITEMS,BUILDS,LISTS,$,$$,on,esc,plural}=R;
const ui=$("#raidui");
let host=ui;
const BUILD=Object.fromEntries(BUILDS.map(b=>[b.id,b]));
/* the example rosters from raid-composition.html (real builds, invented seating; labelled "example" wherever shown) */
const EX={
 25:[["warrior-protection","paladin-protection","druid-feral-tank","paladin-holy","shaman-restoration"],
     ["warrior-fury","warrior-fury","rogue-combat","shaman-enhancement","druid-feral-cat"],
     ["mage-fire","warlock-destruction","shaman-elemental","priest-shadow","druid-balance"],
     ["hunter-beast-mastery","hunter-marksmanship","hunter-survival","paladin-retribution","rogue-combat"],
     ["priest-holy","priest-discipline","druid-restoration","paladin-holy","mage-arcane"]],
 10:[["warrior-protection","paladin-holy","shaman-enhancement","warrior-fury","rogue-combat"],
     ["druid-feral-tank","shaman-restoration","priest-shadow","mage-fire","warlock-destruction"]]};
/* the roster the Raid Composition tab keeps for the browser session, trusted only if every seat is a known build */
function savedRoster(){
  try{const raw=JSON.parse(sessionStorage.getItem("pd-raidcomp-a:v1")||"null");
    if(!raw||!Array.isArray(raw.groups)||!raw.groups.length)return null;
    const groups=raw.groups.map(r=>Array.isArray(r)&&r.length===5?r.map(s=>s&&BUILD[s.id]?(s.name?{id:s.id,name:String(s.name).slice(0,24)}:{id:s.id}):null):null);
    if(groups.some(r=>!r)||!groups.flat().some(Boolean))return null;
    return groups;}catch(e){return null;}
}
/* the raid for a raid size: Raid Composition's if it is that size, else the example */
function rosterFor(size){
  const saved=savedRoster(),want=size===10?2:5;
  const useSaved=saved&&saved.length===want;
  const groups=useSaved?saved:EX[size===10?10:25].map(r=>r.map(id=>({id})));
  const people=[];
  groups.forEach((row,g)=>row.forEach((s,k)=>{if(!s)return;const b=BUILD[s.id];people.push({key:g+"-"+k,g,k,b,li:b.list,name:s.name||""});}));
  const same={};people.forEach(p=>{same[p.b.id]=(same[p.b.id]||0)+1;});
  people.forEach(p=>{p.label=(p.name?p.name+", ":"")+`${p.b.label} ${p.b.cls}`+(!p.name&&same[p.b.id]>1?`, group ${p.g+1}`:"");});
  return {saved:!!useSaved,hadSaved:!!saved,groups:groups.length,people};
}
/* tier token -> the set pieces it buys, from the set pieces' own notes ("redeemed from Gloves of the Vanquished Hero") */
const BUYS={};
ITEMS.forEach((x,i)=>{if(x.k!=="s"||!x.note)return;const m=x.note.match(/redeemed from ([^.]+)\./i);if(!m)return;
  const t=ITEMS.findIndex(y=>y.k==="t"&&y.n===m[1].trim());if(t>=0)(BUYS[t]=BUYS[t]||[]).push(i);});
/* who in the raid wants an item: [{p, rank, via}] best rank first; a token through the best set piece it buys */
function wants(i,ros){
  const out=[];
  ros.people.forEach(p=>{
    if(p.li<0)return;
    let r=R.rankIn(i,p.li),via=null;
    if(!r&&BUYS[i])BUYS[i].forEach(s=>{const q=R.rankIn(s,p.li);if(q&&(!r||q.rank<r.rank)){r=q;via=s;}});
    if(r)out.push({p,rank:r.rank,slot:r.slot,via});
  });
  return out.sort((a,b)=>a.rank-b.rank||a.p.g-b.p.g||a.p.k-b.p.k);
}
const firsts=w=>w.filter(x=>x.rank===1).length;
/* contested: three or more raiders rank it first (two is common: Rogue's three specs share one list) */
const contested=w=>firsts(w)>=3;
let sel=null; /* the raider whose wishlist is shown, by seat key */

const css=document.createElement("style");
css.textContent=`
.jc{display:grid;gap:16px;margin:4px 0 0}
.jc-sum .in{display:grid;gap:12px}
.jc-src{font-size:var(--t-sm);color:var(--ink-2);margin:0}
.jc-src a{color:var(--glow)}
.jc-roster{display:grid;gap:8px;grid-template-columns:repeat(5,minmax(0,1fr))}
.jc-roster.g2{grid-template-columns:repeat(2,minmax(0,1fr));max-width:640px}
@media (max-width:760px){.jc-roster,.jc-roster.g2{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}}
.jc-grp{border:1px solid var(--rim-2);border-radius:10px;padding:6px;background:var(--scrim)}
.jc-grp>span{display:block;font:500 10px var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin:0 0 4px 2px}
.jc-grp ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}
.jc-p{position:relative;width:44px;height:44px;border-radius:50%;border:0;padding:0;background:none;cursor:pointer;display:grid;place-items:center}
.jc-p .rk-spec{width:32px;height:32px}
.jc-p b{position:absolute;right:-3px;bottom:-3px;min-width:18px;height:18px;border-radius:9px;padding:0 4px;font:700 10px/18px var(--f-mono);text-align:center;background:var(--glow);color:var(--glow-ink)}
.jc-p.zero{opacity:.5}.jc-p.zero b{background:var(--glass-2);color:var(--ink-3);border:1px solid var(--rim)}
.jc-p[aria-pressed="true"]{box-shadow:0 0 0 2px var(--glow),0 0 18px -2px var(--glow)}
.jc-p.nolist::after{content:"–";position:absolute;right:0;bottom:-2px;font:700 12px var(--f-mono);color:var(--ink-3)}
.jc-facts{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.jc-facts li{font:500 var(--t-xs) var(--f-mono);background:var(--glow-soft);border:1px solid var(--rim);border-radius:999px;padding:3px 10px}
.jc-facts b{font-family:var(--f-body);color:var(--ink-3);margin-right:5px;font-weight:600}
.jc-top{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
.jc-topi{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim);min-height:52px;color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.jc-topi:hover,.jc-topi:focus-visible{border-color:var(--glow)}
.jc-topi b{display:block;font-size:var(--t-sm);font-weight:600}
.jc-topi small{font-size:var(--t-xs);color:var(--ink-3)}
.jc-selbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:8px 10px;border-radius:10px;border:1px solid var(--glow);background:var(--glow-soft);font-size:var(--t-sm)}
.jc-selbar button{margin-left:auto;font:600 var(--t-xs) var(--f-body);min-height:36px;padding:6px 12px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink);cursor:pointer}
.jc-bosses{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
@media (min-width:1100px){.jc-bosses{grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}}
.jc-boss>h2{justify-content:flex-start;align-items:center;gap:10px}
.jc-boss>h2 small{margin-left:auto;text-align:right}
.jc-port{flex:none;width:34px;height:34px;border-radius:50%;border:2px solid var(--rim);background:#0a1418 center 22%/cover no-repeat;display:grid;place-items:center;font:500 var(--t-xs) var(--f-mono);color:var(--glow)}
.jc-loot{list-style:none;margin:0;padding:0;display:grid;gap:4px;position:relative}
.jc-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:6px 8px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim)}
.jc-row.hot{border-color:color-mix(in srgb,var(--warn) 55%,transparent)}
.jc-ib{display:flex;align-items:center;gap:10px;min-height:44px;min-width:0;border:0;background:none;color:var(--ink);font:inherit;text-align:left;padding:0;cursor:default;border-radius:8px}
.jc-ib:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.jc-ib b{display:block;font-size:var(--t-sm);font-weight:600;overflow-wrap:anywhere}
.jc-ib small{font-size:var(--t-xs);color:var(--ink-3)}
.jc-n{font:600 var(--t-xs) var(--f-mono);color:var(--ink-2);white-space:nowrap;text-align:right}
.jc-hot{display:inline-block;font:700 10px/1.5 var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:var(--warn);border:1px solid rgba(255,207,122,.5);border-radius:4px;padding:0 5px;margin-left:6px}
.jc-who{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;padding-left:2px}
.jc-w{position:relative;display:inline-flex;align-items:center;gap:3px;padding:2px 6px 2px 2px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid var(--rim-2);font:600 10px/1 var(--f-mono);color:var(--ink-2)}
.jc-w.me{border-color:var(--glow);color:var(--ink)}
.jc-w.r1{color:var(--glow)}
.jc-w .rk-spec{width:20px;height:20px;border-width:1.5px}
.q-e{color:var(--q-epic)}.q-r{color:var(--q-rare)}.q-u{color:var(--q-unc)}.q-l{color:var(--q-leg)}.q-n{color:var(--ink-2)}
details.jc-rest{margin-top:8px;border-top:1px solid var(--rim-2)}
details.jc-rest>summary{cursor:pointer;font:600 var(--t-xs) var(--f-body);color:var(--glow);padding:10px 0;min-height:40px;list-style:none}
details.jc-rest>summary::-webkit-details-marker{display:none}
details.jc-rest>summary::before{content:"+ ";font-family:var(--f-mono)}
details.jc-rest[open]>summary::before{content:"− "}
.jc-rl{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px}
.jc-rl button{border:0;padding:0;background:none;min-width:44px;min-height:44px;display:grid;place-items:center;cursor:default;border-radius:8px}
.jc-rl button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.jc-empty{font-size:var(--t-sm);color:var(--ink-3);margin:0}
@media (max-width:700px){.jc-selbar button,details.jc-rest>summary{min-height:44px}}
`;
document.head.appendChild(css);

const portHTML=(b,k)=>b&&b.art?`<span class="jc-port" style="background-image:url('${R.bossArt(b.id)}')" aria-hidden="true"></span>`:`<span class="jc-port" aria-hidden="true">${b?(b.opt?"·":String(b.o||k+1).padStart(2,"0")):"✦"}</span>`;
function whoHTML(w){
  /* one chip per build and rank: "Fury Warrior ×2 #3" */
  const groups=[];
  w.forEach(x=>{const g=groups.find(y=>y.b===x.p.b&&y.rank===x.rank);if(g){g.n++;g.ps.push(x.p);}else groups.push({b:x.p.b,rank:x.rank,n:1,ps:[x.p],via:x.via,slot:x.slot});});
  return groups.map(g=>{
    const me=sel&&g.ps.some(p=>p.key===sel);
    const t=`${g.n>1?g.n+" × ":""}${g.b.label} ${g.b.cls}: #${g.rank} on their list${g.via!=null?` (for ${ITEMS[g.via].n})`:` (${R.slotName(g.slot)})`}`;
    return `<span class="jc-w${g.rank===1?" r1":""}${me?" me":""}" title="${esc(t)}">${R.specIconHTML(g.b,20)}${g.n>1?"×"+g.n+" ":""}#${g.rank}<span class="sr"> ${esc(t)}</span></span>`;
  }).join("");
}
function rowHTML(i,w,ros){
  const x=ITEMS[i],hot=contested(w);
  const meta=[R.slotName(x.slot),x.wt||x.at,R.kindLabel(x)].filter(Boolean).join(" · ");
  return `<li class="jc-row${hot?" hot":""}" data-i="${i}"><button type="button" class="jc-ib" data-tip="${i}">${R.iconHTML(i,34)}<span><b class="q-${x.q||"n"}">${esc(x.n)}</b><small>${esc(meta)}</small></span></button>`+
    `<span class="jc-n">${plural(w.length,"raider")}${firsts(w)?` · ${firsts(w)} first`:""}${hot?`<span class="jc-hot">Contested</span>`:""}</span><span class="jc-who">${whoHTML(w)}</span></li>`;
}
let cur=null;
function draw(r,opts){
  opts=opts||{};cur=r;
  const ros=rosterFor(r.sz);
  if(sel&&!ros.people.some(p=>p.key===sel))sel=null;
  const selP=sel?ros.people.find(p=>p.key===sel):null;
  const parts=r.bosses.map((b,k)=>({b,k,ids:b.loot})).concat(r.trash.length?[{b:null,k:0,ids:r.trash}]:[]);
  const W={};parts.forEach(p=>p.ids.forEach(i=>{if(!W[i])W[i]=wants(i,ros);}));
  const wanted=Object.keys(W).map(Number).filter(i=>W[i].length);
  const hot=wanted.filter(i=>contested(W[i]));
  const countFor=p=>wanted.filter(i=>W[i].some(x=>x.p.key===p.key)).length;
  const noList=ros.people.filter(p=>p.li<0);
  const top=wanted.slice().sort((a,b)=>W[b].length-W[a].length||W[a][0].rank-W[b][0].rank).slice(0,6);
  const src=ros.saved?`Your raid from <a href="raid-composition.html">Raid Composition</a> (this browser session).`:
    `The <strong>example ${r.sz}-player raid</strong> from <a href="raid-composition.html">Raid Composition</a>${ros.hadSaved?`: the raid you built there is a different size, and ${esc(r.n)} is a ${r.sz}-player raid`:`; build your own there and it shows here`}.`;
  let h=`<div class="jc"><section class="box jc-sum" data-enter aria-labelledby="jc-sh"><h2 id="jc-sh">From your raid <small>${plural(ros.people.length,"raider")} · ${esc(r.n)}</small></h2><div class="in">`+
    `<p class="jc-src">${src} Press a raider for their wishlist; the number is how many drops here their list ranks.</p>`+
    `<div class="jc-roster${ros.groups===2?" g2":""}" role="group" aria-label="Your raid">`+
    Array.from({length:ros.groups},(_,g)=>`<div class="jc-grp"><span>Group ${g+1}</span><ul>`+ros.people.filter(p=>p.g===g).map(p=>{
      const n=p.li<0?0:countFor(p);
      return `<li><button type="button" class="jc-p${n?"":" zero"}${p.li<0?" nolist":""}" data-p="${p.key}" aria-pressed="${p.key===sel}" title="${esc(p.label)}: ${p.li<0?"no Wowhead list of its own":plural(n,"drop")+" here"}" aria-label="${esc(p.label)}: ${p.li<0?"no Wowhead list":plural(n,"drop")+" here"}">${R.specIconHTML(p.b,32)}${p.li<0?"":`<b>${n}</b>`}</button></li>`;}).join("")+`</ul></div>`).join("")+`</div>`+
    `<ul class="jc-facts"><li><b>Wanted</b>${wanted.length} of ${R.drops(r)} drops</li><li><b>Contested (3+ rank it first)</b>${hot.length}</li><li><b>Raiders with nothing here</b>${ros.people.filter(p=>p.li>=0&&!countFor(p)).length}</li></ul>`+
    (noList.length?`<p class="prov" style="margin:0">${noList.map(p=>esc(p.label)).join(", ")}: Wowhead's Feral list is for cat DPS, so Bear tanks have no list of their own here.</p>`:"")+
    (selP?`<div class="jc-selbar">${R.specIconHTML(selP.b,24)}<span><strong>${esc(selP.label)}</strong>: ${plural(countFor(selP),"drop")} here on their list, ${wanted.filter(i=>W[i].some(x=>x.p.key===sel&&x.rank===1)).length} of them their first pick.</span><button type="button" data-act="all">Show everyone</button></div>`:
      (top.length?`<div><p class="jb-mini" style="margin:0 0 6px;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)">Most wanted here</p><div class="jc-top">${top.map(i=>`<button type="button" class="jc-topi" data-tip="${i}" data-go="${i}">${R.iconHTML(i,34)}<span><b class="q-${ITEMS[i].q||"n"}">${esc(ITEMS[i].n)}</b><small>${plural(W[i].length,"raider")}${firsts(W[i])?` · ${firsts(W[i])} rank it first`:""}</small></span></button>`).join("")}</div></div>`:""))+
    `</div></section><div class="jc-bosses">`;
  h+=parts.map(p=>{
    const all=R.sortLoot(p.ids);
    let mine=all.filter(i=>W[i].length&&(!sel||W[i].some(x=>x.p.key===sel)));
    mine=mine.sort((a,b)=>(sel?(W[a].find(x=>x.p.key===sel).rank-W[b].find(x=>x.p.key===sel).rank):0)||W[b].length-W[a].length||W[a][0].rank-W[b][0].rank);
    if(sel&&!mine.length)return "";
    const rest=all.filter(i=>!W[i].length);
    const raiders=new Set();mine.forEach(i=>W[i].forEach(x=>raiders.add(x.p.key)));
    const nh=mine.filter(i=>contested(W[i])).length;
    const id=p.b?p.b.id:"trash";
    return `<section class="box jc-boss" data-enter data-boss="${esc(id)}" aria-labelledby="jc-b-${esc(id)}"><h2 id="jc-b-${esc(id)}">${portHTML(p.b,p.k)}<span>${p.b?esc(p.b.n):"Notable trash"}</span><small>${plural(mine.length,"drop")} wanted${sel?"":` · ${plural(raiders.size,"raider")}`}${nh?` · ${nh} contested`:""}</small></h2><div class="in">`+
      (mine.length?`<ul class="jc-loot">${mine.map(i=>rowHTML(i,W[i],ros)).join("")}</ul>`:`<p class="jc-empty">Nothing here is on anyone's list in this raid.</p>`)+
      (!sel&&rest.length?`<details class="jc-rest"><summary>${plural(rest.length,"drop")} nobody here ranks</summary><ul class="jc-rl">${rest.map(i=>`<li><button type="button" data-tip="${i}" data-i="${i}" aria-label="${esc(ITEMS[i].n)}">${R.iconHTML(i,30)}</button></li>`).join("")}</ul></details>`:"")+
      `</div></section>`;
  }).join("");
  h+=`</div><p class="prov">Who wants what: each raider's spec and Wowhead's Phase 2 list for it (27 lists; Rogue's three specs and Priest's two healers share one). A token counts for whoever ranks a set piece it buys.</p></div>`;
  host.innerHTML=h;
  if(opts.item!=null){
    let el=$(`.jc-row[data-i="${opts.item}"]`)||$(`.jc-rl button[data-i="${opts.item}"]`);
    if(el){const det=el.closest("details");if(det)det.open=true;el.scrollIntoView({block:"center",behavior:R.motion()?"smooth":"auto"});el.classList.add("rk-flash");
      const f=el.matches("button")?el:$(".jc-ib",el);if(f)f.focus({preventScroll:true});}
  }
}
on(ui,"click",e=>{
  const p=e.target.closest("[data-p]");
  if(p&&cur){const k=p.dataset.p;sel=sel===k?null:k;draw(cur);const nb=$(`[data-p="${k}"]`);if(nb)nb.focus();
    const ros=rosterFor(cur.sz),who=ros.people.find(x=>x.key===k);
    R.say(sel?`${who.label}'s wishlist in ${cur.n}.`:"Showing everyone.");if(R.motion())R.rise($(".jc-bosses"),true);return;}
  if(e.target.closest('[data-act="all"]')&&cur){const k=sel;sel=null;draw(cur);const nb=$(`[data-p="${k}"]`);if(nb)nb.focus();R.say("Showing everyone.");return;}
  const g=e.target.closest("[data-go]");
  if(g&&cur){const i=+g.dataset.go,el=$(`.jc-row[data-i="${i}"]`);if(el){el.scrollIntoView({block:"center",behavior:R.motion()?"smooth":"auto"});el.classList.remove("rk-flash");void el.offsetWidth;el.classList.add("rk-flash");const f=$(".jc-ib",el);if(f)f.focus({preventScroll:true});}}
});

const api={
  render(r,ctx){if(ctx.changed)sel=null;draw(r,{item:ctx.item});},
  annotate(i){
    const w0=R.WHERE[i][0];if(!w0)return "";
    const w=wants(i,rosterFor(w0.r.sz));
    return w.length?`<span class="jc-n" style="margin-left:auto">${plural(w.length,"raider")} want it</span>`:"";
  },
  open(rid,bid,i){sel=null;R.select(rid,{user:true,item:i,sub:bid});},
  setHost(el){host=el||ui;},
  reset(){sel=null;},
};
window.RaidsC=api;
if(!window.RAIDS_IN_TAB){window.RAIDS_DESIGN="c";R.start(api);}
})();
