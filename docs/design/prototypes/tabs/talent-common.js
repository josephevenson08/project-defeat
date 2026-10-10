/* talent-common.js — shared logic for the three Talents sub-tab designs (talents-a/b/c.html), over talent-data.js.
   Each design draws the trees its own way; this file owns the state and every rule they share:
   - state: points per talent, one shared build per page (window.TALENT_STORE_KEY, "planner"), kept for the browser
     session; every change fires "talents:change", then "gear:change" (from "talents") so the gear views and the stat
     bar redraw against the new hit cap
   - rules, as the talent calculators apply them: 61 points; a row takes points once its tree has 5 per row ("Requires
     25 points in Fury Talents"); prerequisites; a point can't come out from under a talent that needs it, or leave a
     deeper talent with fewer than 5 per row ABOVE its own row. A legal build always has those rows-above counts. A stored build that already breaks a
     rule (both wowsims presets do) is shown as stored and listed as an issue, never silently filled in, and removal
     is only refused when it would break something that currently holds, so a broken build can't trap you.
   - what the live simulator reads from each talent (talent-data.js effects) and why it skips the rest
   - Precision for the hit cap (gear-common.js reads TalentKit.precision())
   - a game-style tooltip in our own words, the tree grid with prerequisite arrows, arrow-key movement in a tree
   Every DOM lookup is guarded, so a page without some element just skips that feature. */
(function(){
"use strict";
const D=window.TALENT_DATA;
if(!D){if(window.console)console.warn("talent-common: TALENT_DATA missing");return;}
/* the app's own icons: public/icons/ in the repo, /icons/ beside /prototypes/ on the published site */
const ICON_DIR=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/icons/":"../../icons/";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iconUrl=n=>n?ICON_DIR+n+".jpg":"";
const TREES=D.trees,BY={},TREE_OF={};
TREES.forEach(t=>t.talents.forEach(x=>{BY[x.id]=x;TREE_OF[x.id]=t;}));
const SPEC_ICON={Arms:"ability_warrior_savageblow",Fury:"ability_warrior_innerrage",Protection:"ability_warrior_defensivestance"};
const PRECISION=1657;
const clone=o=>Object.assign({},o);

/* ---------- counting ---------- */
const rank=(pts,id)=>pts[id]||0;
const inTree=(t,pts)=>t.talents.reduce((a,x)=>a+rank(pts,x.id),0);
const spent=pts=>TREES.reduce((a,t)=>a+inTree(t,pts),0);
const left=pts=>D.total-spent(pts);
const above=(t,row,pts)=>t.talents.reduce((a,x)=>a+(x.row<row?rank(pts,x.id):0),0);
const need=row=>row*D.perRow;
const split=pts=>TREES.map(t=>inTree(t,pts)).join(" / ");

/* ---------- rules ---------- */
/* why a talent can't take another point, or "" when it can */
function whyBlocked(id,pts){
  const x=BY[id],t=TREE_OF[id];if(!x)return "Unknown talent.";
  if(rank(pts,id)>=x.max)return `Already at ${x.max}/${x.max}.`;
  if(spent(pts)>=D.total)return `No points left: all ${D.total} are spent.`;
  const n=inTree(t,pts);
  if(n<need(x.row))return `Needs ${need(x.row)} points in ${t.spec} first. You have ${n}.`;
  for(const [rid,rr] of x.req)if(rank(pts,rid)<rr)return `Needs ${BY[rid].name} at ${rr}/${BY[rid].max} first.`;
  return "";
}
/* why a point can't come out, or "" when it can. Refused only when the removal would break something that holds now. */
function whyNoRemove(id,pts){
  const x=BY[id],t=TREE_OF[id],r=rank(pts,id);if(!x)return "Unknown talent.";
  if(!r)return "No points to remove.";
  const next=Object.assign({},pts,{[id]:r-1});
  for(const o of t.talents){if(!rank(next,o.id))continue;const q=o.req.find(([rid])=>rid===id);
    if(q&&r>=q[1]&&next[id]<q[1])return `${o.name} needs ${x.name} at ${q[1]}/${x.max}.`;}
  for(const o of t.talents){if(o.row<=x.row||!rank(next,o.id))continue;
    if(above(t,o.row,pts)>=need(o.row)&&above(t,o.row,next)<need(o.row))return `${o.name} needs ${need(o.row)} points in ${t.spec} above its row.`;}
  return "";
}
function add(id,pts){const why=whyBlocked(id,pts);if(why)return {pts,why};const n=clone(pts);n[id]=rank(pts,id)+1;return {pts:n,why:""};}
function remove(id,pts){const why=whyNoRemove(id,pts);if(why)return {pts,why};const n=clone(pts);n[id]=rank(pts,id)-1;if(!n[id])delete n[id];return {pts:n,why:""};}
/* raise a talent to a rank one legal point at a time (a fix button), stopping at the first rule that says no */
function raiseTo(id,to,pts){let p=pts,why="";while(rank(p,id)<to){const r=add(id,p);if(r.why){why=r.why;break;}p=r.pts;}return {pts:p,why,added:rank(p,id)-rank(pts,id)};}
/* set a talent to a rank, up or down, by legal single points (a "match the preset" button) */
function setTo(id,to,pts){let p=pts,why="";
  while(rank(p,id)<to){const r=add(id,p);if(r.why){why=r.why;break;}p=r.pts;}
  while(rank(p,id)>to){const r=remove(id,p);if(r.why){why=r.why;break;}p=r.pts;}
  return {pts:p,why};}
/* what in a stored build breaks the rules: a prerequisite below its rank, or a row without enough points above it */
function issues(pts){
  const out=[];
  TREES.forEach(t=>t.talents.forEach(x=>{
    if(!rank(pts,x.id))return;
    x.req.forEach(([rid,rr])=>{if(rank(pts,rid)<rr)out.push({kind:"req",id:x.id,need:rid,to:rr,
      text:`${x.name} needs ${BY[rid].name} at ${rr}/${BY[rid].max}; it has ${rank(pts,rid)}.`});});
    const a=above(t,x.row,pts);
    if(a<need(x.row))out.push({kind:"row",id:x.id,
      text:`${x.name} sits in row ${x.row+1}, which needs ${need(x.row)} points in ${t.spec} above it; there are ${a}.`});
  }));
  return out;
}
/* talent id -> "req" | "row", for marking cells (a missing prerequisite wins) */
const broken=pts=>{const m=new Map();issues(pts).forEach(i=>{if(m.get(i.id)!=="req")m.set(i.id,i.kind);});return m;};
const andList=a=>a.length<2?a.join(""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
/* the same issues grouped for reading: one line per missing prerequisite (with a fix), and one per tree whose upper
   rows are short of points (a row needs 5 per row above it). wowsims lists only the talents its simulator reads, so
   both stored presets leave out the filler points that open their deeper rows. */
function problems(pts){
  const iss=issues(pts),out=[];
  iss.filter(i=>i.kind==="req").forEach(i=>{const n=BY[i.need];
    out.push({kind:"req",ids:[i.id],text:i.text,fix:{id:i.need,to:i.to,label:`Add ${n.name} to ${i.to}/${n.max}`}});});
  TREES.forEach(t=>{const v=iss.filter(i=>i.kind==="row"&&TREE_OF[i.id]===t);if(!v.length)return;
    const rows=v.map(i=>BY[i.id].row),r0=Math.min(...rows),r1=Math.max(...rows);
    const short=Math.max(...v.map(i=>need(BY[i.id].row)-above(t,BY[i.id].row,pts)));
    const names=[...new Set(v.map(i=>BY[i.id].name))];
    out.push({kind:"rows",tree:t.spec,short,ids:v.map(i=>i.id),upTo:r0,
      text:`${t.spec} is ${short} point${short>1?"s":""} short in row${r0>1?`s 1–${r0}`:" 1"}: ${andList(names)} ${names.length>1?"sit":"sits"} in row${r1>r0?`s ${r0+1}–${r1+1}`:` ${r0+1}`}, which ${r1>r0?"need":"needs"} more points above.`});
  });
  return out;
}

/* ---------- presets (as stored: wowsims lists only the talents its simulator reads) ---------- */
const PRESETS=D.presets;
const preset=name=>clone((PRESETS[name]||{}).points||{});
const presetNote=name=>{const p=preset(name);return `${name} preset · ${split(p)} · ${spent(p)} of ${D.total} points · ${(PRESETS[name]||{}).source||""}`;};

/* ---------- what the simulator reads ---------- */
const pct=v=>`${Math.round(v*1000)/10}%`;
const everySec=v=>{const s=1/v;return Math.abs(s-Math.round(s))<.05?`every ${Math.round(s)} seconds`:`every ${s.toFixed(1)} seconds`;};
/* one plain-words line per effect at a given rank; group = where design B files it */
const FX={
  meleeCritChance:{g:"Hit and crit",f:v=>`+${pct(v)} melee crit chance`},
  meleeHitChance:{g:"Hit and crit",f:v=>`+${pct(v)} melee hit chance`},
  targetDodgeReduction:{g:"Hit and crit",f:v=>`−${pct(v)} chance to be dodged`},
  attackPowerMultiplier:{g:"Attack power and damage",f:v=>`+${pct(v)} attack power in Berserker Stance`},
  offHandDamageMultiplier:{g:"Attack power and damage",f:v=>`+${pct(v)} off-hand damage`},
  twoHandedDamageMultiplier:{g:"Attack power and damage",f:v=>`+${pct(v)} damage with a two-handed weapon`},
  flurryHaste:{g:"Speed",f:v=>`+${pct(v)} attack speed for 3 swings after a crit`},
  rageProcsPerMinute:{g:"Rage",f:v=>`${Math.round(v)} extra rage a minute from weapon hits`},
  ragePerSecondFlat:{g:"Rage",f:v=>`+1 rage ${everySec(v)}`},
  rageGeneratedMultiplier:{g:"Rage",f:v=>`+${pct(v-1)} rage from damage dealt`},
  parryChance:{g:"Defence",f:v=>`+${pct(v)} parry chance`},
  defenseSkill:{g:"Defence",f:v=>`+${Math.round(v)} defense skill`},
  blockChance:{g:"Defence",f:v=>`+${pct(v)} block chance`},
  statFactor:{g:"Defence",f:(v,e)=>`+${pct(v)} ${e.stat||"stats"}`},
  itemArmorMultiplier:{g:"Defence",f:v=>`+${pct(v)} armor from items`},
};
const GROUPS=["Hit and crit","Attack power and damage","Speed","Rage","Defence"];
/* the lines a talent gives at rank r (rank 0 gives the one-rank value, for tooltips) */
function effectLines(id,r){
  const list=D.effects[id];if(!list)return [];
  return list.map(e=>{const fx=FX[e.kind];if(!fx)return null;
    const v=e.flat!=null?e.flat:e.per*(r||1);return {g:fx.g,text:fx.f(v,e),caveat:PLAIN_CAVEAT[BY[id].name]||""};}).filter(Boolean);
}
/* is a talent read by the simulator? "sim" | "skip" (with the reason upstream gives) | "ability" | "none".
   Bloodthirst and Mortal Strike are the talents whose abilities the simulator casts in its Fury and Arms rotations. */
const ROTATION=new Set(["Bloodthirst","Mortal Strike"]);
/* the ingest records its reasons for developers; these say the same in plain words (keyed by talent name) */
const PLAIN_SKIP={
  "Deep Wounds":"It is a bleed, and the simulator doesn't model bleeds from special attacks.",
  "Death Wish":"It is a cooldown you press; how often it's up depends on the fight, which the simulator doesn't play out.",
  "Rampage":"Its attack power builds up hit by hit, and the simulator doesn't play the fight out hit by hit.",
  "Enrage":"It triggers when you take a crit, and the simulator doesn't model damage taken by a damage dealer.",
  "Sweeping Strikes":"It hits extra targets, and the simulator models one target.",
  "Blood Frenzy":"It is a debuff on the boss rather than a change to you.",
  "Mace Specialization":"It depends on the weapon type, which the simulator doesn't check yet.",
  "Sword Specialization":"It depends on the weapon type, which the simulator doesn't check yet.",
  "Poleaxe Specialization":"It depends on the weapon type, which the simulator doesn't check yet.",
  "Impale":"It raises the crit damage of abilities, which the simulator doesn't take from talents yet.",
  "Defiance":"Its expertise only matters to the tank model, which scores survival and doesn't roll your own attacks.",
  "Shield Mastery":"It raises how much a block absorbs, and the simulator only counts whether you block."};
/* and the caveats on simulated talents (Unbridled Wrath's "each proc grants 1 rage" is already in its line) */
const PLAIN_CAVEAT={
  "Improved Berserker Stance":"The simulator counts it in every stance; in game it is Berserker Stance only.",
  "Two-Handed Weapon Specialization":"Only with a two-handed weapon in the main hand.",
  "Flurry":"The simulator estimates how often it is up from your crit chance, rather than swing by swing.",
  "Improved Berserker Rage":"Assumes Berserker Rage is used on cooldown: 5 rage per rank every 30 seconds."};
function simStatus(id){
  const x=BY[id];if(!x)return {kind:"none",text:""};
  if(D.effects[id])return {kind:"sim",text:"In the simulation"};
  if(D.skipped[id])return {kind:"skip",text:"Not simulated: "+(PLAIN_SKIP[x.name]||D.skipped[id])};
  if(ROTATION.has(x.name))return {kind:"ability",text:"Its ability is in the simulated rotation; the talent point itself isn't read."};
  return {kind:"none",text:"Not read by the simulator: it changes a cost, cooldown, shout or utility the estimate doesn't track."};
}
/* the whole build's simulated effects, summed per kind, with the talents behind each line */
function ledger(pts){
  const acc={};
  TREES.forEach(t=>t.talents.forEach(x=>{const r=rank(pts,x.id);if(!r||!D.effects[x.id])return;
    D.effects[x.id].forEach(e=>{const fx=FX[e.kind];if(!fx)return;const key=e.kind+(e.stat||"");
      const v=e.flat!=null?e.flat:e.per*r;
      const a=acc[key]||(acc[key]={g:fx.g,kind:e.kind,e,v:e.kind==="rageGeneratedMultiplier"?1:0,from:[],caveats:[]});
      a.v=e.kind==="rageGeneratedMultiplier"?a.v*v:a.v+v;a.from.push({id:x.id,name:x.name,icon:x.icon,r,max:x.max});
      if(PLAIN_CAVEAT[x.name])a.caveats.push(PLAIN_CAVEAT[x.name]);});}));
  return Object.values(acc).map(a=>Object.assign(a,{text:FX[a.kind].f(a.v,a.e)}));
}

/* ---------- the hit cap ---------- */
/* special attacks against a level-73 boss need 9% hit, 15.77 rating per 1% at level 70: 142 rating. Each Precision rank
   is 1% the gear doesn't have to supply (3/3 makes it 95). gear-common.js computes the cap; this reports the rank. */
const RATING_PER_HIT=15.7692;
const capFor=prec=>Math.ceil((9-prec)*RATING_PER_HIT);

/* ---------- the shared build ---------- */
const STORES={};
function store(key){
  key=window.TALENT_STORE_KEY||key||"planner";
  if(STORES[key])return STORES[key];
  const K="pd-talents-"+key;
  let st=null;try{const raw=sessionStorage.getItem(K);if(raw){const v=JSON.parse(raw);if(v&&typeof v==="object"&&Object.keys(v).every(id=>BY[id]))st=v;}}catch(e){}
  if(!st)st=preset("Fury");
  return STORES[key]={get:()=>st,set:(v,from)=>{st=v;try{sessionStorage.setItem(K,JSON.stringify(st));}catch(e){}
    document.dispatchEvent(new CustomEvent("talents:change",{detail:{from:from||""}}));
    /* the hit cap follows Precision, so every gear view (and the stat bar) redraws */
    document.dispatchEvent(new CustomEvent("gear:change",{detail:{from:"talents"}}));
    return st;}};
}
window.TALENT_STORE_KEY=window.TALENT_STORE_KEY||"planner";
const precision=()=>rank(store().get(),PRECISION);

/* ---------- tooltip (game-style, our own wording) ---------- */
function tooltipHTML(id,pts,opts){
  const x=BY[id],t=TREE_OF[id];if(!x)return "";
  const r=rank(pts,id),L=[];
  L.push(`<b class="tt-name">${esc(x.name)}</b>`);
  L.push(`<span class="tt-grey">Rank ${r}/${x.max}</span>`);
  if(inTree(t,pts)<need(x.row))L.push(`<span class="tt-red">Requires ${need(x.row)} points in ${esc(t.spec)} Talents</span>`);
  x.req.forEach(([rid,rr])=>{if(rank(pts,rid)<rr)L.push(`<span class="tt-red">Requires ${rr} point${rr>1?"s":""} in ${esc(BY[rid].name)}</span>`);});
  L.push(`<span class="tt-desc">${esc(x.ranks[Math.max(0,r-1)])}</span>`);
  if(r>0&&r<x.max)L.push(`<span class="tt-next">Next rank:</span><span class="tt-desc">${esc(x.ranks[r])}</span>`);
  const s=simStatus(id);
  if(s.kind==="sim"){const lines=effectLines(id,Math.max(1,r));
    L.push(`<span class="tt-sim">${r?"In the simulation":"In the simulation, per rank"}: ${lines.map(l=>esc(l.text)).join("; ")}</span>`);}
  else L.push(`<span class="tt-src">${esc(s.text)}</span>`);
  if(!(opts&&opts.noHint))L.push(`<span class="tt-hint">Click to learn · right-click to unlearn</span>`);
  return `<span class="tt tk-tt">${L.join("")}</span>`;
}

/* ---------- the tree grid ---------- */
/* state of one talent for drawing: max | part | open | locked, plus broken when it holds points against a rule */
function cellState(id,pts,bad){
  const x=BY[id],r=rank(pts,id);
  const st=r>=x.max?"max":r>0?"part":whyBlocked(id,pts)?"locked":"open";
  return {r,st,bad:(bad&&bad.get(id))||""};
}
/* one tree as a 4 x 9 grid of icon buttons with arrows from each prerequisite; opts.extra(x) adds markup to a cell,
   opts.cls(x) adds classes, opts.label(x) appends to its accessible name */
function treeHTML(t,pts,opts){
  opts=opts||{};const bad=broken(pts);
  const arrows=t.talents.flatMap(x=>x.req.map(([rid,rr])=>{const p=BY[rid];if(!p||p.col!==x.col)return "";
    const met=rank(pts,rid)>=rr,live=rank(pts,x.id)>0;
    return `<i class="tk-arrow${met?" met":""}${!met&&live?" bad":""}" style="--c:${x.col+1};--r1:${p.row+1};--r2:${x.row+2}" aria-hidden="true"></i>`;})).join("");
  const cells=t.talents.map(x=>{const c=cellState(x.id,pts,bad),why=c.st==="locked"?whyBlocked(x.id,pts):"";
    return `<button type="button" class="tk-tal ${c.st}${c.bad?" bad "+c.bad:""}${opts.cls?" "+opts.cls(x):""}" data-tid="${x.id}" style="--c:${x.col+1};--r:${x.row+1}"
      aria-label="${esc(x.name)}, ${c.r} of ${x.max}${c.bad==="req"?", missing its prerequisite":c.bad?", row not opened":""}${why?`, locked: ${esc(why)}`:""}${opts.label?esc(opts.label(x)):""}">
      <img src="${iconUrl(x.icon)}" alt="" loading="lazy" decoding="async"><span class="tk-rk" aria-hidden="true">${c.r}/${x.max}</span>${opts.extra?opts.extra(x):""}</button>`;}).join("");
  return `<div class="tk-grid" role="group" aria-label="${esc(t.spec)} tree, ${inTree(t,pts)} points">${arrows}${cells}</div>`;
}
/* arrow keys move between talents in the same tree by row and column; Home/End go to the first and last */
function navKey(e){
  const b=e.target.closest&&e.target.closest(".tk-tal");if(!b)return false;
  const k=e.key,grid=b.closest(".tk-grid");if(!grid)return false;
  const dirs={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  const all=Array.from(grid.querySelectorAll(".tk-tal")),me=BY[b.dataset.tid];
  let to=null;
  if(k==="Home")to=all[0];else if(k==="End")to=all[all.length-1];
  else if(dirs[k]){const [dr,dc]=dirs[k];
    const cand=all.map(el=>({el,x:BY[el.dataset.tid]})).filter(({x})=>dr?Math.sign(x.row-me.row)===dr:x.row===me.row&&Math.sign(x.col-me.col)===dc);
    cand.sort((p,q)=>(Math.abs(p.x.row-me.row)*4+Math.abs(p.x.col-me.col))-(Math.abs(q.x.row-me.row)*4+Math.abs(q.x.col-me.col)));
    to=cand.length?cand[0].el:null;}
  else return false;
  e.preventDefault();if(to)to.focus();return true;
}
/* talents in a tree are one tab stop: the focused (or first) one is tabbable, the rest are reached with arrows */
function roving(root,focusId){
  root.querySelectorAll(".tk-grid").forEach(g=>{const all=Array.from(g.querySelectorAll(".tk-tal"));
    const on=all.find(b=>b.dataset.tid===String(focusId))||all[0];all.forEach(b=>b.tabIndex=b===on?0:-1);});
}

/* these pages open on the Talents sub-tab, since that is what they are for */
function openTalentsTab(){const t=document.getElementById("t-talents");if(t&&t.getAttribute("aria-selected")!=="true")t.click();}

/* ---------- shared styling; each design lays the trees out ---------- */
function css(){
  if(document.getElementById("talent-common-css"))return;
  const st=document.createElement("style");st.id="talent-common-css";
  st.textContent=`
.tk-grid{--cell:44px;--gap:8px;position:relative;display:grid;grid-template-columns:repeat(4,var(--cell));grid-auto-rows:var(--cell);gap:var(--gap);justify-content:center}
.tk-tal{grid-column:var(--c);grid-row:var(--r);position:relative;z-index:1;width:var(--cell);height:var(--cell);padding:0;border-radius:7px;border:2px solid #4a5568;background:#060b10;cursor:pointer;overflow:visible}
.tk-tal img{display:block;width:100%;height:100%;border-radius:5px}
.tk-tal .tk-rk{position:absolute;right:-6px;bottom:-7px;font:700 10.5px/1 var(--f-body);font-variant-numeric:tabular-nums;background:#05080b;color:#cfd8dc;border:1px solid #4a5568;border-radius:5px;padding:2px 3px;pointer-events:none}
.tk-tal.locked img{filter:grayscale(1) brightness(.45)}
.tk-tal.locked{border-color:#2c333b;cursor:not-allowed}
.tk-tal.open{border-color:#3fbf4a}.tk-tal.open .tk-rk{color:#7fe08a;border-color:#3fbf4a}
.tk-tal.part{border-color:#3fbf4a;box-shadow:0 0 10px -2px rgba(63,191,74,.7)}.tk-tal.part .tk-rk{color:#7fe08a;border-color:#3fbf4a}
.tk-tal.max{border-color:#f0c050;box-shadow:0 0 12px -2px rgba(240,192,80,.75)}.tk-tal.max .tk-rk{color:#ffd56b;border-color:#f0c050}
.tk-tal.bad{border-color:#ff6b5e;box-shadow:0 0 12px -2px rgba(255,107,94,.8)}.tk-tal.bad .tk-rk{color:#ffb0a8;border-color:#ff6b5e}
.tk-tal.bad::before{content:"!";position:absolute;left:-6px;top:-7px;width:15px;height:15px;border-radius:50%;background:#ff6b5e;color:#1a0503;font:800 10px/15px var(--f-body);text-align:center;z-index:2}
.tk-tal.bad.row{border-color:var(--warn);box-shadow:0 0 10px -3px rgba(255,207,122,.7)}.tk-tal.bad.row .tk-rk{color:var(--warn);border-color:var(--warn)}.tk-tal.bad.row::before{background:var(--warn)}
.tk-tal:hover:not(.locked),.tk-tal:focus-visible{border-color:#fff}
.tk-tal[aria-current="true"]{outline:2px solid var(--focus);outline-offset:3px}
.tk-arrow{grid-column:var(--c);grid-row:var(--r1)/var(--r2);justify-self:center;position:relative;z-index:0;width:4px;background:#39414b;border-radius:2px;margin:calc(var(--cell)/2) 0 calc(var(--cell) + 2px)}
.tk-arrow::after{content:"";position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);border:6px solid transparent;border-top:7px solid #39414b;border-bottom:0}
.tk-arrow.met{background:#f0c050}.tk-arrow.met::after{border-top-color:#f0c050}
.tk-arrow.bad{background:#ff6b5e}.tk-arrow.bad::after{border-top-color:#ff6b5e}
.tk-tt{min-width:230px;max-width:300px}
.tt-red{color:#ff5c50}.tt-next{color:#fff;margin-top:5px}.tt-desc{color:#ffd100}
.tt-sim{color:#7fe0d4;margin-top:6px;font-size:11.5px}.tt-hint{color:#9d9d9d;margin-top:6px;font-size:11px}
.tk-tip{position:fixed;z-index:30;pointer-events:none;background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:9px 11px;box-shadow:0 10px 30px rgba(0,0,0,.6)}
.tk-tip[hidden]{display:none}
.tk-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}
.tk-left{font:600 var(--t-sm) var(--f-body);color:var(--ink-2)}.tk-left b{font:700 var(--t-md) var(--f-body);font-variant-numeric:tabular-nums;color:var(--ink)}
.tk-left .num{font-family:var(--f-body);font-variant-numeric:tabular-nums}
.tk-ttabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.tk-ttabs button{display:inline-flex;align-items:center;gap:7px;font:600 var(--t-sm) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink-2);padding:5px 12px 5px 5px;border-radius:999px;cursor:pointer}
.tk-ttabs button img{width:26px;height:26px;border-radius:50%}
.tk-ttabs button b{font:700 var(--t-sm) var(--f-body);font-variant-numeric:tabular-nums;color:var(--ink)}
.tk-ttabs button[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}.tk-ttabs button[aria-pressed="true"] b{color:var(--glow-ink)}
.tk-step{display:inline-flex;gap:6px;align-items:center}
.tk-step button{min-width:40px;min-height:36px;font:700 var(--t-md) var(--f-body)}
.tk-step .num{font:700 var(--t-md) var(--f-body);font-variant-numeric:tabular-nums}
.tk-off{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.tk-off li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 10px;align-items:center;font-size:var(--t-sm);padding:6px 0;border-top:1px solid var(--rim-2)}
.tk-off li:first-child{border-top:0}
.tk-off li .k{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;font:800 14px var(--f-body)}
.tk-off li .k.req{background:#ff6b5e;color:#1a0503}.tk-off li .k.rows{background:var(--warn);color:#1a1204}.tk-off li .k.left{background:var(--glow-soft);color:var(--glow);border:1px solid var(--rim)}
.tk-off li small{display:block;color:var(--ink-3);font-size:var(--t-xs)}
.tk-off .btn{padding:7px 12px;white-space:nowrap}
.tk-offok{color:#7fdc8a;font-size:var(--t-sm);margin:0}
.tk-tal.tk-hint{box-shadow:0 0 0 3px var(--glow),0 0 18px var(--glow)}
html.motion .tk-tal.tk-hint{animation:tkHint 1.4s ease-in-out infinite alternate}
@keyframes tkHint{from{box-shadow:0 0 0 2px var(--glow),0 0 6px var(--glow)}to{box-shadow:0 0 0 3px var(--glow),0 0 20px var(--glow)}}
html.motion .tk-tal.pulse{animation:tkPulse .45s ease-out}
@keyframes tkPulse{0%{transform:scale(1)}40%{transform:scale(1.14)}100%{transform:scale(1)}}
@media (max-width:699px),(pointer:coarse){.tk-ttabs button,.tk-tools .btn,.tk-step button,.tk-off .btn{min-height:44px}.tk-grid{--cell:48px;--gap:12px}
  .tk-off li{grid-template-columns:auto minmax(0,1fr)}.tk-off li .btn{grid-column:2;justify-self:start}}
@media (prefers-reduced-motion:reduce){html.motion .tk-tal.pulse,html.motion .tk-tal.tk-hint{animation:none}}`;
  (document.head||document.documentElement).appendChild(st);
}
/* a game-style hover tooltip for fine pointers, shared by the designs that want one */
function hoverTips(root,getPts){
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches)return;
  const tip=document.createElement("div");tip.className="tk-tip";tip.hidden=true;tip.setAttribute("aria-hidden","true");document.body.appendChild(tip);
  let curId=null;
  const place=b=>{const r=b.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
    let x=r.right+10,y=r.top-4;if(x+w>innerWidth-8)x=r.left-w-10;if(x<8)x=8;if(y+h>innerHeight-8)y=innerHeight-h-8;if(y<8)y=8;
    tip.style.left=x+"px";tip.style.top=y+"px";};
  const show=b=>{curId=b.dataset.tid;tip.innerHTML=tooltipHTML(+curId,getPts());tip.hidden=false;place(b);};
  const hide=()=>{tip.hidden=true;curId=null;};
  root.addEventListener("pointerover",e=>{const b=e.target.closest(".tk-tal");if(b)show(b);});
  root.addEventListener("pointerout",e=>{const b=e.target.closest(".tk-tal");if(b&&!(e.relatedTarget&&b.contains(e.relatedTarget)))hide();});
  addEventListener("scroll",hide,{passive:true});
  /* a change redraws the trees under the pointer: re-read the talent once the new button is in place */
  document.addEventListener("talents:change",()=>{if(!curId)return;const id=curId;
    setTimeout(()=>{const b=root.querySelector(`.tk-tal[data-tid="${id}"]`);if(b&&b.offsetParent)show(b);else hide();},0);});
  return {hide};
}
const pulse=(root,id)=>{const b=root.querySelector(`.tk-tal[data-tid="${id}"]`);if(!b)return;b.classList.remove("pulse");void b.offsetWidth;b.classList.add("pulse");};

/* tree picker (one tree at a time, or the phone view of three) */
function treeTabsHTML(sel,pts,cls){
  return `<div class="tk-ttabs${cls?" "+cls:""}" role="group" aria-label="Talent tree">`+TREES.map(t=>`<button type="button" data-ttree="${t.spec}" aria-pressed="${t.spec===sel}"><img src="${iconUrl(SPEC_ICON[t.spec])}" alt="">${t.spec} <b>${inTree(t,pts)}</b></button>`).join("")+`</div>`;
}
/* − rank + for the selected talent: the way to unlearn without a right-click (touch, keyboard) */
function stepHTML(id,pts){
  const x=BY[id];if(!x)return "";const r=rank(pts,id);
  return `<span class="tk-step"><button type="button" class="btn ghost" data-tstep="-1" data-tid="${id}" aria-label="Unlearn a point of ${esc(x.name)}"${r?"":" disabled"}>−</button><span class="num">${r}/${x.max}</span><button type="button" class="btn ghost" data-tstep="1" data-tid="${id}" aria-label="Learn a point of ${esc(x.name)}"${r>=x.max?" disabled":""}>+</button></span>`;
}
/* learning and unlearning inside root: click (or Enter/Space) learns, right-click or −/Delete/Backspace unlearns, +/=
   learns, arrows move. S is the shared store; the design redraws on "talents:change", and focus follows the talent.
   cb: {from, say(text), select(id), refresh()} — refresh redraws after a refused change, when no event fires */
function bind(root,S,cb){
  const act=(id,dir)=>{
    const p=S.get(),x=BY[id];if(!x)return false;
    const r=dir>0?add(id,p):remove(id,p);
    if(cb.select)cb.select(id);
    if(r.why){if(cb.refresh)cb.refresh();if(cb.say)cb.say(`${dir>0?"Can't learn":"Can't unlearn"} ${x.name}: ${r.why}`);return false;}
    S.set(r.pts,cb.from);
    pulse(root,id);
    if(cb.say)cb.say(`${x.name} ${rank(r.pts,id)}/${x.max}. ${left(r.pts)} of ${D.total} points left.`);
    if(dir>0&&x.row===D.rows-1&&rank(r.pts,id)===1&&window.TBCKit)window.TBCKit.swell(); /* K3: a tree's 41-point talent */
    return true;
  };
  root.addEventListener("click",e=>{const b=e.target.closest(".tk-tal");if(b){act(+b.dataset.tid,1);return;}
    const s=e.target.closest("[data-tstep]");if(s&&!s.disabled)act(+s.dataset.tid,+s.dataset.tstep);});
  root.addEventListener("contextmenu",e=>{const b=e.target.closest(".tk-tal");if(!b)return;e.preventDefault();act(+b.dataset.tid,-1);});
  root.addEventListener("keydown",e=>{if(navKey(e))return;const b=e.target.closest&&e.target.closest(".tk-tal");if(!b)return;
    if(e.key==="-"||e.key==="Delete"||e.key==="Backspace"){e.preventDefault();act(+b.dataset.tid,-1);}
    else if(e.key==="+"||e.key==="="){e.preventDefault();act(+b.dataset.tid,1);}});
  return act;
}
/* redraw root's content with fn() and put focus back on the same control (talent, −/+, tree button or id) */
function keepFocus(root,fn){
  const a=document.activeElement,inside=!!a&&a!==document.body&&root.contains(a);
  let sel=null,tid=null;
  if(inside){const d=a.dataset||{};tid=d.tid||null;
    if(a.classList.contains("tk-tal"))sel=`.tk-tal[data-tid="${d.tid}"]`;
    else if(d.tstep)sel=`[data-tstep="${d.tstep}"][data-tid="${d.tid}"]`;
    else if(d.ttree)sel=`[data-ttree="${d.ttree}"]`;
    else if(a.id)sel="#"+(window.CSS&&CSS.escape?CSS.escape(a.id):a.id);
    else{const k=Object.keys(d)[0];if(k)sel=`[data-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}="${d[k]}"]`;}}
  fn();
  if(!sel)return;
  let n=root.querySelector(sel);
  if((!n||n.disabled||!n.offsetParent)&&tid)n=root.querySelector(`.tk-tal[data-tid="${tid}"]`);
  if(n&&!n.disabled)n.focus({preventScroll:true});
}
/* ---------- "What's off": design C's list, which the planner's pick (design A) uses too ---------- */
/* hint = {tree, upTo} or null: the talents that can take a point toward a tree's rows that are short of points */
function hintIds(p,hint){
  if(!hint)return new Set();const t=TREES.find(x=>x.spec===hint.tree);if(!t)return new Set();
  return new Set(t.talents.filter(x=>x.row<hint.upTo&&rank(p,x.id)<x.max&&!whyBlocked(x.id,p)).map(x=>x.id));
}
const hintLive=(p,hint)=>!!hint&&problems(p).some(x=>x.kind==="rows"&&x.tree===hint.tree);
/* one row per broken rule, with a one-press fix where the rule names one or "Show where" for rows short of points,
   then the unspent points */
function offHTML(p,hint){
  const rows=problems(p).map(x=>x.kind==="req"
      ?`<li><span class="k req" aria-hidden="true">!</span><span>${esc(x.text)}</span><button type="button" class="btn ghost" data-tfix="${x.fix.id}" data-to="${x.fix.to}">${esc(x.fix.label)}</button></li>`
      :`<li><span class="k rows" aria-hidden="true">!</span><span>${esc(x.text)}<small>wowsims leaves out these filler points; where they go is your call.</small></span><button type="button" class="btn ghost" data-thint="${x.tree}" data-upto="${x.upTo}" aria-pressed="${!!(hint&&hint.tree===x.tree)}">${hint&&hint.tree===x.tree?"Hide":"Show where"}</button></li>`).join("")+
    (left(p)?`<li><span class="k left" aria-hidden="true">${left(p)}</span><span>${left(p)} of ${D.total} points unspent.</span><span></span></li>`:"");
  return rows?`<ul class="tk-off">${rows}</ul>`:`<p class="tk-offok">✓ Nothing: every rule holds and every point is spent.</p>`;
}
/* the fix and "Show where" buttons inside root. ui holds sel, tree and hint; render() redraws after a hint change (a fix
   redraws through talents:change). Returns true when it handled the click. */
function offClick(e,root,S,ui,from,say,render){
  const b=e.target.closest&&e.target.closest("[data-tfix],[data-thint]");if(!b)return false;
  if(b.dataset.tfix){const id=+b.dataset.tfix,before=problems(S.get()).length,r=raiseTo(id,+b.dataset.to,S.get());
    if(!r.added){say(`Can't add ${BY[id].name}: ${r.why}`);return true;}
    ui.sel=id;ui.tree=TREE_OF[id].spec;S.set(r.pts,from);const fixed=before-problems(S.get()).length;
    say(`Added ${r.added} point${r.added>1?"s":""} to ${BY[id].name} (${rank(S.get(),id)}/${BY[id].max})${fixed>0?`: that fixed ${fixed} problem${fixed>1?"s":""}`:""}.${r.why?` Stopped: ${r.why}`:""}`);
    const f=root.querySelector(`.tk-tal[data-tid="${id}"]`);if(f&&!root.querySelector("[data-tfix]"))f.focus();return true;}
  const tr=b.dataset.thint;
  if(ui.hint&&ui.hint.tree===tr){ui.hint=null;render();say("Highlight off.");return true;}
  ui.hint={tree:tr,upTo:+b.dataset.upto};ui.tree=tr;render();
  const n=root.querySelectorAll(".tk-tal.tk-hint").length;
  say(n?`${n} ${tr} talent${n>1?"s":""} glowing: each can take a point that counts toward the rows below.`:`No ${tr} talent above those rows can take a point right now.`);
  return true;
}
/* the three preset/reset buttons every design offers */
function toolsHTML(prefix){
  return `<button type="button" class="btn ghost" data-tpreset="Fury" id="${prefix}-fury">Load the Fury preset</button>
  <button type="button" class="btn ghost" data-tpreset="Arms" id="${prefix}-arms">Load the Arms preset</button>
  <button type="button" class="btn ghost" data-tpreset="" id="${prefix}-reset">Reset all points</button>`;
}
function presetClick(e,S,from,say){
  const b=e.target.closest("[data-tpreset]");if(!b)return false;
  const name=b.dataset.tpreset;
  if(name){S.set(preset(name),from);const n=problems(S.get()).length;
    say(`Loaded the ${name} preset as stored: ${split(S.get())}, ${spent(S.get())} of ${D.total} points.${n?` It breaks ${n} rule${n>1?"s":""}, shown below.`:""}`);}
  else{S.set({},from);say(`Reset: all ${D.total} points are free.`);}
  return true;
}

css();
window.TalentKit={D,TREES,BY,TREE_OF,SPEC_ICON,PRESETS,esc,iconUrl,rank,inTree,spent,left,above,need,split,whyBlocked,whyNoRemove,add,remove,raiseTo,setTo,
  issues,broken,problems,andList,preset,presetNote,effectLines,simStatus,ledger,GROUPS,capFor,precision,store,tooltipHTML,cellState,treeHTML,navKey,roving,
  openTalentsTab,hoverTips,pulse,treeTabsHTML,stepHTML,bind,keepFocus,toolsHTML,presetClick,hintIds,hintLive,offHTML,offClick,PRECISION};
})();
