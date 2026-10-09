/* buffs-c.js — Buffs design C, "From your raid": the buffs fill in from who is actually in your raid. Pick the raid (the
   roster built on the Raid Composition tab, an example 25-man or 10-man, or just you) and your seat in it; every buff
   then says who brings it ("Enhancement Shaman, group 2") or what's missing ("needs a Feral Druid in your group"),
   sorted by how far it reaches: your group, the raid, the boss. The raid's Paladins each get a Blessing to give. Any
   buff can still be switched by hand, and the page says how many were. "By hand" drops the raid altogether.
   Inside the Character Planner (picked 2026-10-09: C with A's icons), each buff is design A's icon tile instead of a
   row: click it to switch it by hand, hover it (or select it) to read who brings it; the Missing box keeps one line per
   gap saying what it needs. The page keeps opening on Gear. */
(function(){
"use strict";
const B=window.BuffKit;if(!B)return;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("bufui");if(!mount)return;
const S=B.store("planner");
const KEY="pd-buffs-c";
const IN_PLANNER=window.BUFFS_IN_PLANNER==="c",ICONS=IN_PLANNER;
window.BUFFS_ICONS=ICONS;
const SRC={mine:"Your raid",ex25:"Example 25-man",ex10:"Example 10-man",solo:"Just you",hand:"By hand"};
let ui=null;try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&SRC[v.src])ui=v;}catch(e){}
const fresh=!ui;
ui=ui||{src:"ex25",seat:null,edits:0};ui.sel=ui.sel&&B.BY[ui.sel]?ui.sel:null;
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=$("#bc-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.bc-src{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.bc-src button{font:600 var(--t-sm) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink-2);padding:6px 12px;border-radius:999px;cursor:pointer}
.bc-src button[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
.bc-src button:disabled{opacity:.5;cursor:not-allowed}
.bc-roster{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));margin:0 0 12px}
.bc-grp{border:1px solid var(--rim-2);border-radius:10px;background:var(--scrim);padding:6px 8px}
.bc-grp.mine{border-color:#f0c050;box-shadow:0 0 14px -6px rgba(240,192,80,.8)}
.bc-grp h5{font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin:0 0 5px;display:flex;justify-content:space-between}
.bc-grp.mine h5{color:#ffd56b}
.bc-seats{display:flex;gap:4px}
.bc-seat{position:relative;width:36px;height:36px;padding:0;border-radius:6px;border:2px solid var(--cc,#3a414a);background:#05080b;cursor:pointer;overflow:visible}
.bc-seat img{display:block;width:100%;height:100%;border-radius:4px}
.bc-seat.empty{border-style:dashed;border-color:#3a414a}
.bc-seat.you{border-color:#f0c050;box-shadow:0 0 0 2px #f0c050}
.bc-seat.you::after{content:"YOU";position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);font:800 8px/1 var(--f-body);background:#f0c050;color:#1a1204;padding:2px 3px;border-radius:3px}
.bc-seat:hover,.bc-seat:focus-visible{border-color:#fff}
.bc-cols{display:grid;gap:10px;grid-template-columns:minmax(0,1fr)}
@media (min-width:900px){.bc-cols{grid-template-columns:repeat(2,minmax(0,1fr))}}
.bc-box{background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;padding:10px 12px}
.bc-box.miss{border-color:rgba(255,207,122,.3)}
.bc-box h4{display:flex;align-items:baseline;gap:8px;font:400 var(--t-lg) var(--f-head);margin:0 0 6px}
.bc-box h4 small{font:600 var(--t-xs) var(--f-body);color:var(--ink-3)}
.bc-box ul{list-style:none;margin:0;padding:0}
.bc-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:2px 10px;align-items:center;padding:6px 0;border-top:1px solid var(--rim-2);font-size:var(--t-sm)}
.bc-row:first-child{border-top:0}
.bc-row img{width:30px;height:30px;border-radius:5px;grid-row:span 2}
.bc-row.off img{filter:grayscale(1) brightness(.55)}
.bc-row b{font-weight:600}
.bc-row small{grid-column:2;color:var(--ink-3);font-size:var(--t-xs)}
.bc-row .from{color:var(--ink-2)}.bc-row .need{color:var(--warn)}
.bc-tag{font:700 9.5px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.08em;border:1px solid var(--rim-2);border-radius:4px;padding:0 5px;color:var(--ink-3);margin-left:6px;vertical-align:1px}
.bc-tag.hand{color:var(--glow);border-color:var(--rim)}
.bc-tog{grid-row:span 2;width:40px;height:24px;border-radius:999px;border:0;background:var(--rim);position:relative;cursor:pointer}
.bc-tog::after{content:"";position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:var(--ink-3);transition:transform .15s}
.bc-tog[aria-pressed="true"]{background:var(--glow)}.bc-tog[aria-pressed="true"]::after{transform:translateX(16px);background:var(--glow-ink)}
.bc-sec{margin:12px 0 0}
.bc-sec>h4{font:400 var(--t-lg) var(--f-head);margin:0 0 6px}
.bc-box .bk-bar{background:none;border:0;box-shadow:none;padding:2px 0 4px}
.bc-needs{list-style:none;margin:6px 0 0;padding:0;font-size:var(--t-xs);color:var(--ink-3);display:grid;gap:3px}
.bc-needs b{color:var(--ink-2);font-weight:600}.bc-needs span{color:var(--warn)}
.bc-card{margin:10px 0 0;background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:10px 12px}
.bc-card .tt{max-width:none}
@media (max-width:699px),(pointer:coarse){.bc-src button{min-height:44px}.bc-seat{width:44px;height:44px}.bc-tog{width:52px;height:44px;border-radius:22px}.bc-tog::after{top:14px;left:8px}.bc-tog[aria-pressed="true"]::after{transform:translateX(20px)}}
`;
document.head.appendChild(css);

mount.innerHTML=`<h3>Buffs</h3>
<p class="lead">Your buffs, filled in from who is in your raid: pick the raid and your seat, and each buff says who brings it or what's missing. Paladins each give the Blessing you assign. You can still switch any buff by hand.</p>
<div class="bc-src" role="group" aria-label="Where your buffs come from">${Object.entries(SRC).map(([k,v])=>`<button type="button" data-src="${k}">${v}</button>`).join("")}</div>
<p class="okline" id="bc-msg" aria-live="polite"></p>
<div id="bc-body"></div>`;
const body=$("#bc-body");

function roster(){
  if(ui.src==="mine")return B.savedRoster();
  if(ui.src==="ex25")return B.exampleRoster(25);
  if(ui.src==="ex10")return B.exampleRoster(10);
  if(ui.src==="solo")return [[null,null,null,null,null]];
  return null;
}
function seatFor(groups){const s=ui.seat;return s&&groups[s.g]&&s.i>=0&&s.i<5?s:B.defaultSeat(groups);}
/* fill the shared setup from the raid (consumables are yours, so they stay) */
function apply(keepPals){
  const groups=roster();if(!groups)return false;
  const seat=seatFor(groups);ui.seat=seat;ui.edits=0;
  const pals=B.rosterPals(groups,seat,keepPals?S.get().pals:null);
  S.set(B.stateFrom(B.coverage(groups,seat,pals),S.get().cons,pals),"buffs-c");save();return true;
}
const ICON_OF=bd=>B.iconUrl(bd.icon);
function rosterHTML(groups,seat){
  const all=B.seatsWithYou(groups,seat);
  return `<div class="bc-roster" role="group" aria-label="Your raid: press a seat to sit there">`+all.map((row,g)=>`<div class="bc-grp${g===seat.g?" mine":""}"><h5><span>Group ${g+1}</span>${g===seat.g?"<span>yours</span>":""}</h5><div class="bc-seats">`+
    row.map((s,i)=>{const bd=s&&B.BUILD[s.id],you=g===seat.g&&i===seat.i;
      return bd?`<button type="button" class="bc-seat${you?" you":""}" data-seat="${g}-${i}" style="--cc:${B.COLOR[bd.cls]}" aria-label="${you?"You, Fury Warrior":`${B.esc(s.name?s.name+", ":"")}${B.esc(bd.label)} ${bd.cls}. Sit here`}" title="${you?"You":B.esc((s.name?s.name+", ":"")+bd.label+" "+bd.cls)}"><img src="${ICON_OF(bd)}" alt=""></button>`
        :`<button type="button" class="bc-seat empty" data-seat="${g}-${i}" aria-label="Empty seat in group ${g+1}. Sit here" title="Empty seat"></button>`;}).join("")+`</div></div>`).join("")+`</div>`;
}
const fromText=r=>{const n=r.by.length;if(!n)return "";const first=B.seatLabel(r.by[0]);return `from ${first}${n>1?` and ${n-1} more`:""}`;};
function needText(b,r){
  if(r.blessing)return r.taken||"no Paladin is assigned it";
  if(r.taken)return r.taken;
  return b.reach==="your group"?`needs ${B.whoA(b)} in your group`:`nobody in the raid brings it: needs ${B.whoA(b)}`;
}
function row(b,st,r){
  const bl=B.isBless(b.id),on=B.isOn(st,b.id),dead=b.out&&!bl,got=r?r.got:on,hand=r&&!dead&&!bl&&on!==got;
  const eff=b.out?(b.does[0].toUpperCase()+b.does.slice(1)):B.effectText(b);
  const src=r?(got?`<span class="from">${B.esc(fromText(r))}</span>`:`<span class="need">${B.esc(needText(b,r))}</span>`):"";
  return `<li class="bc-row${on||(dead&&got)?"":" off"}" data-bid="${b.id}"><img src="${B.iconUrl(b.icon)}" alt="" loading="lazy" decoding="async">
    <span><b>${B.esc(B.nameOf(b))}</b>${dead?'<span class="bc-tag">not counted</span>':""}${hand?`<span class="bc-tag hand">${on?"on":"off"} by hand</span>`:""}</span>
    ${dead||bl?"<span></span>":`<button type="button" class="bc-tog" data-tog="${b.id}" aria-pressed="${on}" aria-label="${B.esc(B.nameOf(b))}: ${on?"on":"off"}"></button>`}
    <small>${src}${src?" · ":""}${B.esc(eff)}</small></li>`;
}
function tile(b,st,r){
  const bl=B.isBless(b.id),on=B.isOn(st,b.id),dead=b.out&&!bl,got=r?r.got:on,hand=r&&!dead&&!bl&&on!==got;
  const why=r?(got?fromText(r):needText(b,r)):"";
  const lab=`${dead?"not counted":bl?(on?"given":"not given"):(on?"on":"off")}${hand?", by hand":""}${why?": "+why:""}`;
  return B.tileHTML(b,{pressed:dead||bl?undefined:on,cls:[r&&!got?"miss":"",bl?(on?"lit":"dim"):"",dead&&got?"":""].filter(Boolean).join(" "),
    badge:hand?"by hand":"",label:lab,current:ui.sel===b.id});
}
/* "From you and 1 more" or "Needs ..." under a buff's tooltip */
function moreFor(id){
  const groups=roster();if(!groups)return "";
  const cov=B.coverage(groups,seatFor(groups),S.get().pals),r=cov[id];if(!r)return "";
  return r.got?`<span class="tt-sim">${B.esc(fromText(r)[0].toUpperCase()+fromText(r).slice(1))}</span>`:`<span class="tt-red">${B.esc(needText(r.b,r)[0].toUpperCase()+needText(r.b,r).slice(1))}</span>`;
}
function render(){
  const st=S.get();
  mount.querySelectorAll("[data-src]").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.src===ui.src);if(b.dataset.src==="mine"){const ok=!!B.savedRoster();b.disabled=!ok;b.title=ok?"The roster you built on the Raid Composition tab":"Build a raid on the Raid Composition tab first";}});
  const groups=roster(),seat=groups?seatFor(groups):null;
  const cov=groups?B.coverage(groups,seat,st.pals):null;
  const all=[...B.D.buffs,...B.D.uncounted,...B.D.debuffs,...B.D.uncountedDebuffs];
  const pick=f=>{const L=all.filter(f);if(!L.length)return "";
    return ICONS?`<div class="bk-bar" role="group">${L.map(b=>tile(b,st,cov&&cov[b.id])).join("")}</div>`:`<ul>${L.map(b=>row(b,st,cov&&cov[b.id])).join("")}</ul>`;};
  const none=t=>ICONS?`<p class="prov" style="margin:0">${t}</p>`:`<ul><li class="bc-row"><span></span><small>${t}</small></li></ul>`;
  let h="";
  if(groups){
    h+=rosterHTML(groups,seat);
    if(ui.src==="mine")h+=`<p class="prov" style="margin:-4px 0 10px">From the roster on the <a href="raid-composition.html">Raid Composition</a> tab.</p>`;
    else if(ui.src!=="solo")h+=`<p class="prov" style="margin:-4px 0 10px">Real builds, invented seating <span class="bk-ex">example</span> · build your own on the <a href="raid-composition.html">Raid Composition</a> tab.</p>`;
    const mine=b=>b.reach==="your group",boss=b=>b.boss;
    const got=b=>cov[b.id]&&cov[b.id].got;
    h+=`<div class="bc-sec"><h4>Paladin Blessings</h4>${B.palsHTML(st,{fixed:true})}</div>`;
    h+=`<div class="bc-cols bc-sec">
      <section class="bc-box"><h4>From your group <small>group ${seat.g+1}</small></h4>${pick(b=>mine(b)&&got(b))||none("Nobody in your group brings a buff.")}</section>
      <section class="bc-box"><h4>From the raid</h4>${pick(b=>!mine(b)&&!boss(b)&&got(b))||none("Nothing from the rest of the raid.")}</section>
      <section class="bc-box"><h4>On the boss</h4>${pick(b=>boss(b)&&got(b))||none("Nobody puts a debuff on the boss.")}</section>
      <section class="bc-box miss"><h4>Missing</h4>${pick(b=>!got(b))||none("Nothing: every buff here reaches you.")}${ICONS?`<ul class="bc-needs">${all.filter(b=>!got(b)).map(b=>`<li><b>${B.esc(B.nameOf(b))}</b>: <span>${B.esc(needText(b,cov[b.id]))}</span></li>`).join("")}</ul>`:""}</section></div>`;
  }else{
    h+=`<p class="prov" style="margin:0 0 8px">No raid: switch each buff yourself.</p><div class="bc-sec"><h4>Paladin Blessings</h4>${B.palsHTML(st)}</div>
      <div class="bc-cols bc-sec"><section class="bc-box"><h4>Your group</h4>${pick(b=>b.reach==="your group")}</section>
      <section class="bc-box"><h4>The raid</h4>${pick(b=>!b.boss&&b.reach!=="your group")}</section>
      <section class="bc-box"><h4>On the boss</h4>${pick(b=>b.boss)}</section></div>`;
  }
  if(ICONS&&ui.sel&&B.BY[ui.sel])h+=`<div class="bc-card">${B.tooltipHTML(ui.sel,st,moreFor(ui.sel))}</div>`;
  h+=`<div class="bc-sec"><h4>Consumables</h4>${B.conChipsHTML(st)}</div>`;
  B.keepFocus(body,()=>{body.innerHTML=h;});
  save();
}
function sourceSay(){
  const groups=roster();if(!groups)return;
  const seat=seatFor(groups),cov=B.coverage(groups,seat,S.get().pals);
  const n=B.COUNTED.filter(b=>cov[b.id]&&cov[b.id].got).length,miss=B.COUNTED.filter(b=>!(cov[b.id]&&cov[b.id].got)).length;
  say(`${SRC[ui.src]}: you're in group ${seat.g+1}. ${n} counted buffs and debuffs reach you; ${miss} ${miss===1?"is":"are"} missing.`);
}
body.addEventListener("click",e=>{
  if(B.palsClick(e,S,"buffs-c",say))return;
  if(B.conClick(e,S,"buffs-c",say))return;
  const seat=e.target.closest("[data-seat]");
  if(seat){const [g,i]=seat.dataset.seat.split("-").map(Number);ui.seat={g,i};apply(true);sourceSay();const f=body.querySelector(`[data-seat="${g}-${i}"]`);if(f)f.focus();return;}
  const tl=ICONS&&e.target.closest(".bk-ic[data-bid]");
  if(tl){const id=tl.dataset.bid,b=B.BY[id];ui.sel=id;
    if(B.isBless(id)){render();say(`${B.nameOf(b)}: ${B.isOn(S.get(),id)?"given by "+B.palName(S.get(),B.giver(S.get(),id)):"no Paladin gives it"}. Choose who gives which Blessing in the Paladin rows.`);return;}}
  const t=e.target.closest("[data-tog]")||tl;
  if(t){const id=t.dataset.tog||t.dataset.bid,b=B.BY[id],r=B.toggle(S.get(),id);if(r.why){render();say(r.why);return;}
    ui.edits=(ui.edits||0)+1;S.set(r.st,"buffs-c");const on=B.isOn(S.get(),id);
    say(`${B.nameOf(b)} ${on?"on":"off"} by hand.${roster()?" Choose the raid again to undo your changes.":""}`);}
});
mount.addEventListener("click",e=>{
  const b=e.target.closest("[data-src]");if(!b||b.disabled)return;
  ui.src=b.dataset.src;ui.seat=null;
  if(ui.src==="hand"){save();render();say("By hand: no raid, so switch each buff yourself.");return;}
  apply(false);sourceSay();
});
document.addEventListener("buffs:change",render);
B.hoverTips(body,()=>S.get(),moreFor);
/* the first visit fills from the example 25-man; after that the page keeps your choice */
if(fresh&&roster())apply(false);
render();if(fresh&&roster())sourceSay();
if(!IN_PLANNER)B.openBuffsTab();
})();
