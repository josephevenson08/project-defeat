/* raids-b.js — Raids design B, "The way in": progression first, the way the community's Attune addon reads.
   Five doors, one per raid, each saying whether it is open to you. Tick off the attunement steps you have done and the
   doors open; the chosen raid's chain says what to do next, and which other raid a step needs (Serpentshrine's
   Blazing Signet comes from Karazhan, so it waits on Karazhan's own key). Under it, what is waiting inside for your
   spec, boss by boss, and the drops an attunement asks you to loot. The ticks are kept in this browser
   (localStorage "pd-attune:v1"). In Phase 2 all three chains are required; that is the phase the app targets. */
(function(){
"use strict";
const R=window.RaidKit;if(!R)return;
const {RAIDS,ITEMS,$,$$,on,esc,plural}=R;
const ui=$("#raidui");
const KEY="pd-attune:v1";
const load=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"null");return v&&typeof v==="object"?v:{};}catch(e){return {};}};
let done=load();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(done));}catch(e){}};
const CHAINS=RAIDS.filter(r=>r.ch);
/* a raid named at the start of a step's location ("Karazhan (Deadwind Pass)", "Gruul's Lair (...)", "Magtheridon's Lair, ...") */
const raidAt=loc=>RAIDS.find(o=>loc.indexOf(o.n.split(":")[0])===0)||null;
const isDone=(r,o)=>!!(done[r.ch.id]&&done[r.ch.id].includes(o));
const count=r=>r.ch?r.ch.steps.filter(s=>isDone(r,s.o)).length:0;
const attuned=r=>!r.ch||count(r)===r.ch.steps.length;
/* the other raids a chain runs through, and whether you can get into them yet */
const needs=r=>r.ch?r.ch.steps.map(s=>({s,o:raidAt(s.loc)})).filter(x=>x.o&&x.o.id!==r.id):[];
const blockers=r=>needs(r).filter(x=>!attuned(x.o)).map(x=>x.o).filter((o,k,a)=>a.indexOf(o)===k);
const nextStep=r=>r.ch?r.ch.steps.find(s=>!isDone(r,s.o))||null:null;
/* the drops an attunement step asks you to loot (Earthen Signet, Blazing Signet), found by name in the step */
const stepDrops=RAIDS.flatMap(r=>r.ch?r.ch.steps.flatMap(s=>ITEMS.map((x,i)=>x.k==="q"&&!x.q&&(s.t.indexOf(x.n)>=0||s.req.indexOf(x.n)>=0)?{i,r,s}:null).filter(Boolean)):[]);
/* an example: a Fury Warrior part-way (Karazhan done, two Serpentshrine steps, the first Tempest Keep step) */
const EXAMPLE={"karazhan-attunement":[1,2,3,4,5,6,7,8],"serpentshrine-cavern-attunement":[1,2],"tempest-keep-attunement":[1]};

const css=document.createElement("style");
css.textContent=`
.jb{display:grid;gap:16px;margin:4px 0 0}
.jb-doors>h2{flex-wrap:wrap}
.jb-doors>h2 .jb-acts{display:flex;gap:6px;margin-left:auto}
.jb-acts button{font:600 var(--t-xs) var(--f-body);min-height:36px;padding:6px 12px;border-radius:999px;border:1px solid var(--rim);background:var(--glass-2);color:var(--ink-2);cursor:pointer}
.jb-acts button:hover{color:var(--ink);border-color:var(--glow)}
@media (max-width:700px){.jb-acts button,.jb-dep button,.jb-filter select{min-height:44px}}
.jb-row{list-style:none;margin:0;padding:12px 14px 14px;display:grid;gap:10px;grid-template-columns:repeat(5,minmax(0,1fr));position:relative}
@media (max-width:1000px){.jb-row{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}}
@media (max-width:520px){.jb-row{grid-template-columns:minmax(0,1fr)}}
.jb-door{position:relative;width:100%;min-height:150px;display:flex;flex-direction:column;justify-content:flex-end;gap:3px;padding:10px 11px;border-radius:12px;border:1px solid var(--rim);background:#081014 var(--art) center/cover no-repeat;color:var(--ink);font:inherit;text-align:left;cursor:pointer;overflow:hidden;isolation:isolate}
@media (max-width:520px){.jb-door{min-height:110px}}
.jb-door::before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(3,8,12,.15),rgba(3,8,12,.88) 70%)}
.jb-door.locked::before{background:linear-gradient(180deg,rgba(3,8,12,.55),rgba(3,8,12,.92) 70%)}
.jb-door.locked{filter:saturate(.45)}
.jb-door[aria-pressed="true"]{border-color:var(--glow);box-shadow:0 0 0 2px var(--glow),0 0 28px -6px var(--glow)}
.jb-door b{font:400 var(--t-lg)/1.1 var(--f-head)}
.jb-door small{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3)}
.jb-st{align-self:flex-start;font:700 10px/1.5 var(--f-body);text-transform:uppercase;letter-spacing:.08em;padding:2px 8px;border-radius:999px;border:1px solid var(--rim);background:rgba(3,10,14,.7);color:var(--ink-2);margin-bottom:auto}
.jb-st.open{color:var(--glow-ink);background:var(--glow);border-color:var(--glow)}
.jb-st.lock{color:var(--warn);border-color:rgba(255,207,122,.5)}
.jb-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:4px}
.jb-bar i{display:block;height:100%;background:var(--glow);border-radius:inherit;transition:width .35s ease}
.jb-need{font-size:var(--t-xs);color:var(--warn)}
.jb-grid{display:grid;gap:16px;grid-template-columns:minmax(0,1fr)}
@media (min-width:980px){.jb-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);align-items:start}}
.jb-next{position:relative;margin:0 0 12px;padding:10px 12px;border-radius:10px;border:1px solid var(--glow);background:var(--glow-soft)}
.jb-next .lab{font:500 var(--t-xs) var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--glow)}
.jb-next b{display:block;font:400 var(--t-lg)/1.25 var(--f-head);margin:2px 0}
.jb-next p{margin:0;font-size:var(--t-sm);color:var(--ink-2)}
.jb-next.ok{border-color:var(--rim)}
.jb-steps{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:6px;position:relative}
.jb-step{display:grid;grid-template-columns:44px minmax(0,1fr);gap:4px 8px;align-items:start;padding:6px 10px 8px 4px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim)}
.jb-step.done{border-color:color-mix(in srgb,var(--glow) 45%,transparent)}
.jb-step.done .jb-t{color:var(--ink-2);text-decoration:line-through;text-decoration-color:color-mix(in srgb,var(--glow) 60%,transparent)}
.jb-step.is-next{border-color:var(--glow)}
.jb-cb{grid-row:span 2;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;position:relative}
.jb-cb input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}
.jb-cb i{width:22px;height:22px;border-radius:6px;border:2px solid var(--rim);display:grid;place-items:center;font:700 13px/1 var(--f-body);color:var(--glow-ink);background:rgba(3,10,14,.6)}
.jb-cb input:checked+i{background:var(--glow);border-color:var(--glow)}
.jb-cb input:checked+i::after{content:"✓"}
.jb-cb input:focus-visible+i{outline:2px solid var(--focus);outline-offset:3px}
.jb-t{font-weight:600;font-size:var(--t-sm);padding-top:4px}
.jb-t .n{font:500 var(--t-xs) var(--f-mono);color:var(--glow);margin-right:6px}
.jb-m{font-size:var(--t-xs);color:var(--ink-3)}
.jb-req{grid-column:2;font-size:var(--t-xs);color:var(--ink-2);margin:2px 0 0}
.jb-dep{grid-column:2;display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:var(--t-xs);color:var(--warn);margin-top:4px}
.jb-dep button{font:600 var(--t-xs) var(--f-body);min-height:32px;padding:4px 10px;border-radius:999px;border:1px solid rgba(255,207,122,.45);background:none;color:var(--warn);cursor:pointer}
.jb-dep.ok{color:var(--glow)}
.jb-pre{margin:0 0 12px;padding:0 0 0 18px;font-size:var(--t-sm);color:var(--ink-2)}
.jb-mini{margin:12px 0 6px;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.jb-inside .ja-filter,.jb-filter{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 10px}
.jb-filter label{font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);display:flex;align-items:center;gap:8px}
.jb-filter select{min-height:40px;text-transform:none;letter-spacing:0;font-weight:600;font-size:var(--t-sm)}
.jb-sum{font-size:var(--t-sm);color:var(--ink-2);margin:0 0 10px}
.jb-sum strong{color:var(--ink)}
.jb-bosses{list-style:none;margin:0;padding:0;display:grid;gap:6px;position:relative}
.jb-boss{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;padding:8px 10px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim)}
.jb-bh{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.jb-bh b{font-weight:600;font-size:var(--t-sm)}
.jb-bh small{font-size:var(--t-xs);color:var(--ink-3);margin-left:auto}
.jb-icons{display:flex;flex-wrap:wrap;gap:6px}
.jb-it{position:relative;border:0;padding:0;background:none;cursor:default;border-radius:9px;line-height:0;min-width:44px;min-height:44px;display:grid;place-items:center}
.jb-it .rk-rank{position:absolute;right:-6px;bottom:-6px;font-size:10px;padding:2px 4px}
.jb-it:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.jb-none{font-size:var(--t-xs);color:var(--ink-3)}
.jb-quest{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px dashed var(--rim);margin:0 0 8px;font-size:var(--t-sm);color:var(--ink-2)}
.jb-quest b{color:var(--ink)}
.jb-quest .jb-it{flex:none}
`;
document.head.appendChild(css);

function doorsHTML(sel){
  const n=CHAINS.filter(attuned).length;
  return `<section class="box jb-doors" aria-labelledby="jb-dh"><h2 id="jb-dh">Your way in <small>${n} of ${CHAINS.length} attunements done · kept in this browser · on Anniversary realms each counts for your whole account</small>`+
    `<span class="jb-acts"><button type="button" data-act="example">Example: part-way</button><button type="button" data-act="clear">Clear ticks</button></span></h2>`+
    `<ul class="jb-row">`+RAIDS.map(r=>{
      const ok=attuned(r),c=count(r),tot=r.ch?r.ch.steps.length:0,bl=blockers(r);
      const stt=!r.ch?`<span class="jb-st open">Open to all</span>`:ok?`<span class="jb-st open">Attuned</span>`:`<span class="jb-st lock">Locked</span>`;
      const line=!r.ch?"No attunement":ok?esc(r.ch.n):`${c} of ${tot} steps · ${esc(r.ch.n)}`;
      return `<li><button type="button" class="jb-door${ok?"":" locked"}" data-raid="${r.id}" aria-pressed="${r.id===sel}" style="--art:url('${R.raidArt(r.id)}')" aria-label="${esc(r.n)}: ${!r.ch?"open to any level 70":ok?"attuned":`locked, ${c} of ${tot} steps done`}">`+
        `${stt}<b>${esc(r.n)}</b><small>${r.tier} · ${r.sz} players · ${line}</small>`+
        (r.ch?`<span class="jb-bar" aria-hidden="true"><i style="width:${Math.round(c/tot*100)}%"></i></span>`:"")+
        (bl.length&&!ok?`<span class="jb-need">Needs ${bl.map(o=>esc(o.n)).join(" and ")} first</span>`:"")+
        `</button></li>`;
    }).join("")+`</ul></section>`;
}
function chainHTML(r){
  if(!r.ch){
    const feeds=CHAINS.map(o=>({o,s:o.ch.steps.find(s=>raidAt(s.loc)===r)})).filter(x=>x.s);
    return `<section class="box jb-chain" data-enter aria-labelledby="jb-ch"><h2 id="jb-ch">${esc(r.n)} <small>no attunement</small></h2><div class="in">`+
      `<div class="jb-next ok"><span class="lab">Open</span><b>Any level 70 can walk in.</b><p>${esc(r.loc)}</p></div>`+
      (feeds.length?`<p class="jb-mini">Part of an attunement</p>`+feeds.map(x=>`<p>${esc(x.s.t)}: step ${x.s.o} of <strong>${esc(x.o.ch.n)}</strong>, the way into ${esc(x.o.n)}. `+
        `${isDone(x.o,x.s.o)?"You've ticked it.":"Not ticked yet."} <button type="button" class="btn ghost" data-raid="${x.o.id}">Open ${esc(x.o.n)}</button></p>`).join(""):"")+
      `<p>${esc(r.desc)}</p></div></section>`;
  }
  const c=r.ch,nx=nextStep(r),k=count(r);
  const nxDep=nx&&raidAt(nx.loc)&&raidAt(nx.loc)!==r?raidAt(nx.loc):null;
  const next=nx?`<div class="jb-next"><span class="lab">Next · step ${nx.o} of ${c.steps.length}</span><b>${esc(nx.t)}</b><p>${esc(nx.loc)}${nx.d?" · "+esc(nx.d):""}${nxDep&&!attuned(nxDep)?` · needs your ${esc(nxDep.n)} attunement first`:""}</p></div>`:
    `<div class="jb-next ok"><span class="lab">Attuned</span><b>${esc(r.n)} is open to you.</b><p>${esc(c.rew)}</p></div>`;
  return `<section class="box jb-chain" data-enter aria-labelledby="jb-ch"><h2 id="jb-ch">${esc(c.n)} <small>${k} of ${c.steps.length} done</small></h2><div class="in">`+next+
    (c.nv?`<p class="verify"><strong>Not every point is confirmed for Anniversary realms.</strong> ${esc(c.note)}</p>`:"")+
    `<p class="jb-mini">Before step 1</p><ul class="jb-pre">${c.pre.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`+
    `<p class="jb-mini">Steps · tick what you've done</p><ol class="jb-steps">`+c.steps.map(s=>{
      const d=isDone(r,s.o),o=raidAt(s.loc),dep=o&&o!==r?o:null;
      return `<li class="jb-step${d?" done":""}${nx===s?" is-next":""}"><label class="jb-cb"><input type="checkbox" data-step="${s.o}"${d?" checked":""} aria-label="Step ${s.o}: ${esc(s.t)}"><i aria-hidden="true"></i></label>`+
        `<div><div class="jb-t"><span class="n">${String(s.o).padStart(2,"0")}</span>${esc(s.t)}${s.d?`<span class="diff ${esc(s.d)}">${esc(s.d)}</span>`:""}</div><div class="jb-m">${s.q?"Quest: "+esc(s.q)+" · ":""}${esc(s.loc)}</div></div>`+
        `<p class="jb-req">${esc(s.req)}</p>`+
        (dep?(dep.ch&&!attuned(dep)?`<div class="jb-dep">Needs your ${esc(dep.n)} attunement: ${count(dep)} of ${dep.ch.steps.length} ticked <button type="button" data-raid="${dep.id}">Open ${esc(dep.n)}</button></div>`:
          `<div class="jb-dep ok">${esc(dep.n)} ${dep.ch?"is open to you":"needs no attunement"}</div>`):"")+
        `</li>`;
    }).join("")+`</ol><p><strong>Reward:</strong> ${esc(c.rew)}</p></div></section>`;
}
function insideHTML(r){
  const l=R.getLi()<0?R.FURY:R.getLi(),who=R.listName(l); /* this design always shows one spec; "Every spec" from design A falls back to Fury */
  const ok=attuned(r);
  const per=r.bosses.map(b=>({b,ids:l>=0?b.loot.filter(i=>R.rankIn(i,l)).sort((a,c)=>R.rankIn(a,l).rank-R.rankIn(c,l).rank):[]}));
  if(r.trash.length)per.push({b:null,ids:l>=0?r.trash.filter(i=>R.rankIn(i,l)):[]});
  const tot=per.reduce((n,p)=>n+p.ids.length,0),best=per.reduce((n,p)=>n+p.ids.filter(i=>R.rankIn(i,l).rank===1).length,0);
  const quest=stepDrops.filter(x=>R.WHERE[x.i].some(w=>w.r===r));
  const it=(i,showRank)=>`<button type="button" class="jb-it" data-tip="${i}" data-i="${i}" aria-label="${esc(ITEMS[i].n)}">${R.iconHTML(i,36)}${showRank?R.rankHTML(i,l):""}</button>`;
  return `<section class="box jb-inside" data-enter aria-labelledby="jb-ih"><h2 id="jb-ih">${ok?"Inside":"Waiting inside"} ${esc(r.n)} <small>${plural(R.drops(r),"drop")}</small></h2><div class="in">`+
    `<div class="jb-filter"><label for="jb-li">Loot for <select id="jb-li">${R.specOptions(l,false)}</select></label></div>`+
    `<p class="jb-sum">${R.specIconHTML(l,22).replace("rk-spec","rk-spec jb-si")}<strong>${plural(tot,"drop")}</strong> on the ${esc(who)} list, ${best} of them its first pick${ok?"":r.ch?`, once you finish ${esc(r.ch.n)}`:""}.</p>`+
    quest.map(x=>`<div class="jb-quest">${it(x.i,false)}<span><b>${esc(ITEMS[x.i].n)}</b> drops here for <b>${esc(x.r.ch.n)}</b>, step ${x.s.o}${isDone(x.r,x.s.o)?" (ticked)":""}.</span></div>`).join("")+
    `<ul class="jb-bosses">`+per.map(p=>`<li class="jb-boss" data-boss="${p.b?esc(p.b.id):"trash"}"><div class="jb-bh"><b>${p.b?esc(p.b.n):"Notable trash"}</b>${p.b&&p.b.opt?`<span class="opt">Optional</span>`:""}<small>${p.ids.length?`${p.ids.length} for ${esc(R.LISTS[l].spec)} · `:""}${plural(p.b?p.b.loot.length:r.trash.length,"drop")}</small></div>`+
      (p.ids.length?`<div class="jb-icons">${p.ids.map(i=>it(i,true)).join("")}</div>`:`<span class="jb-none">Nothing on the ${esc(who)} list.</span>`)+`</li>`).join("")+`</ul>`+
    `<p class="prov" style="margin-top:10px">Ranks from Wowhead's Phase 2 lists; hover or tap an icon for the item.</p></div></section>`;
}
let cur=null;
function draw(r,opts){
  opts=opts||{};cur=r;
  ui.innerHTML=`<div class="jb">${doorsHTML(r.id)}<div class="jb-grid">${chainHTML(r)}${insideHTML(r)}</div></div>`;
  if(opts.item!=null){const el=$(`.jb-it[data-i="${opts.item}"]`)||$(`.jb-boss[data-boss="${opts.boss||"trash"}"]`);
    if(el){el.scrollIntoView({block:"center",behavior:R.motion()?"smooth":"auto"});el.classList.add("rk-flash");if(el.focus)el.focus({preventScroll:true});}}
}
on(ui,"change",e=>{
  const cb=e.target.closest("input[data-step]");
  if(cb&&cur&&cur.ch){
    const o=+cb.dataset.step,id=cur.ch.id,list=(done[id]||[]).filter(x=>x!==o);
    if(cb.checked)list.push(o);done[id]=list.sort((a,b)=>a-b);save();
    const was=attuned(cur);draw(cur);
    const f=$(`input[data-step="${o}"]`);if(f)f.focus();
    R.say(`Step ${o} ${cb.checked?"ticked":"unticked"}. ${count(cur)} of ${cur.ch.steps.length} done${attuned(cur)?`: ${cur.n} is open to you`:""}.`);
    if(attuned(cur)&&!was&&R.motion()){const d=$(`.jb-door[data-raid="${cur.id}"]`);if(d)d.classList.add("rk-flash");if(window.TBCKit)window.TBCKit.swell();}
    return;
  }
  if(e.target.id==="jb-li"&&cur){R.setLi(+e.target.value);draw(cur);const s=$("#jb-li");if(s)s.focus();R.say(`What's inside, for ${R.listName(+e.target.value)}.`);}
});
on(ui,"click",e=>{
  const a=e.target.closest("[data-act]");
  if(a){done=a.dataset.act==="example"?JSON.parse(JSON.stringify(EXAMPLE)):{};save();draw(cur);
    const b=$(`[data-act="${a.dataset.act}"]`);if(b)b.focus();
    R.say(a.dataset.act==="example"?"Example loaded: Karazhan done, two Serpentshrine steps and the first Tempest Keep step.":"Ticks cleared.");return;}
  const d=e.target.closest("[data-raid]");
  if(d&&ui.contains(d)){const id=d.dataset.raid;R.select(id,{user:true});const nd=$(`.jb-door[data-raid="${id}"]`);if(nd)nd.focus({preventScroll:true});}
});

window.RAIDS_DESIGN="b";
R.start({
  render(r,ctx){draw(r,{item:ctx.item,boss:ctx.sub});},
  annotate(i){const l=R.getLi();return l>=0?R.rankHTML(i,l):"";},
  open(rid,bid,i){R.select(rid,{user:true,item:i,sub:bid});},
});
})();
