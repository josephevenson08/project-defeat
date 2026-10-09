/* buffs-b.js — Buffs design B, "What it adds up to": a compact list of switches beside a running total of what the
   setup gives you, the way the simulator counts it: attack power (flat, and from Strength at 2 per point), crit (rating,
   Agility, Leader of the Pack), haste and damage (averaged where a buff is a cooldown or a proc), the attribute boost,
   and the boss (armor removed, what armor still takes off your hits, crit and hit against it, and the hit cap that
   Improved Faerie Fire lowers). Buffs the simulator doesn't count are listed with the reason. A line a change moves
   lights up, and the message says what it now reads. */
(function(){
"use strict";
const B=window.BuffKit;if(!B)return;
const G=window.GearKit||null,TK=window.TalentKit||null;
const $=(s,r=document)=>r.querySelector(s);
const mount=document.getElementById("bufui");if(!mount)return;
const S=B.store("planner");
let changed=[];
const say=t=>{const m=$("#bb-msg");if(!m)return;m.textContent=t+(changed.length&&changed.length<=3?" "+changed.join(" "):"");changed=[];};
const CLASS_ORDER=["Warrior","Paladin","Priest","Druid","Hunter","Shaman","Warlock","Mage","Rogue"];
const byClass=(a,b)=>CLASS_ORDER.indexOf(a.cls)-CLASS_ORDER.indexOf(b.cls);

const css=document.createElement("style");
css.textContent=`
.bb-cols{display:grid;gap:14px;grid-template-columns:minmax(0,1fr);align-items:start}
@media (min-width:960px){.bb-cols{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
.bb-list h4,.bb-sum h4{font:400 var(--t-lg) var(--f-head);margin:0 0 6px}
.bb-list h5,.bb-sum h5{font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin:14px 0 6px}
.bb-list ul{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.bb-sw{width:100%;display:grid;grid-template-columns:auto auto minmax(0,1fr);gap:2px 10px;align-items:center;text-align:left;padding:6px 8px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim);color:var(--ink);cursor:pointer;font:600 var(--t-sm) var(--f-body)}
.bb-sw .tg{width:34px;height:20px;border-radius:999px;background:var(--rim);position:relative;grid-row:span 2}
.bb-sw .tg::after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:var(--ink-3);transition:transform .15s}
.bb-sw[aria-pressed="true"] .tg{background:var(--glow)}.bb-sw[aria-pressed="true"] .tg::after{transform:translateX(14px);background:var(--glow-ink)}
.bb-sw img{width:28px;height:28px;border-radius:5px;grid-row:span 2;border:1px solid var(--rim-2)}
.bb-sw[aria-pressed="false"] img{filter:grayscale(1) brightness(.6)}
.bb-sw small{grid-column:3;color:var(--ink-3);font:500 var(--t-xs) var(--f-body)}
.bb-sw .cc{font-weight:700}
.bb-sw:hover,.bb-sw:focus-visible{border-color:var(--glow)}
.bb-sw.out{cursor:default;opacity:.85}.bb-sw.out .tg{opacity:.35}
.bb-sum{background:var(--scrim);border:1px solid var(--rim);border-radius:12px;padding:12px 14px}
.bb-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 10px;align-items:baseline;padding:7px 8px;border-radius:8px;border:1px solid transparent}
.bb-line b{font:600 var(--t-sm) var(--f-body)}.bb-line .v{font:700 var(--t-md) var(--f-body);font-variant-numeric:tabular-nums;color:var(--glow);text-align:right}
.bb-line small{grid-column:1/-1;color:var(--ink-3);font-size:var(--t-xs)}
.bb-line.chg{background:rgba(79,216,200,.12);border-color:var(--glow)}
html.motion .bb-line.chg{animation:bbGlow 1.6s ease-out}
@keyframes bbGlow{0%{box-shadow:0 0 0 0 rgba(79,216,200,.6)}100%{box-shadow:0 0 0 10px rgba(79,216,200,0)}}
.bb-armor{position:relative;height:10px;margin:8px 0 4px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden}
.bb-armor i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#8a95a5,#c9d2de)}
.bb-armor i.off{left:auto;background:repeating-linear-gradient(45deg,rgba(255,143,134,.55) 0 6px,rgba(255,143,134,.2) 6px 12px)}
.bb-cap{margin:6px 0 0;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,207,122,.3);background:var(--warn-soft);font-size:var(--t-sm)}
.bb-cap b{color:var(--warn)}
.bb-out li{display:grid;grid-template-columns:auto minmax(0,1fr);gap:2px 8px;font-size:var(--t-xs);color:var(--ink-3);padding:4px 0;list-style:none}
.bb-out{margin:0;padding:0}
.bb-out img{width:22px;height:22px;border-radius:4px;filter:grayscale(1) brightness(.6)}
.bb-out b{color:var(--ink-2)}
@media (max-width:699px),(pointer:coarse){.bb-sw{min-height:48px}}
`;
document.head.appendChild(css);

mount.innerHTML=`<h3>Buffs</h3>
<p class="lead">Switch buffs, Blessings and consumables on the left; the right adds up what they give you, the way the simulator counts them, and lists what it doesn't count. It opens on an example raid setup <span class="bk-ex">example</span></p>
<div class="bk-tools"><span class="bk-count" id="bb-count"></span>
  <button type="button" class="btn ghost" id="bb-example">Example raid setup</button>
  <button type="button" class="btn ghost" id="bb-all">Everything on</button>
  <button type="button" class="btn ghost" id="bb-none">Clear all</button></div>
<p class="okline" id="bb-msg" aria-live="polite"></p>
<div id="bb-body"></div>`;
const body=$("#bb-body");

function sw(b,st){
  const bl=B.isBless(b.id),on=B.isOn(st,b.id),dead=b.out&&!bl;
  return `<li><button type="button" class="bb-sw${b.out?" out":""}" data-bid="${b.id}" ${dead?"":`aria-pressed="${on}"`}
    aria-label="${B.esc(B.nameOf(b))}, ${dead?"not counted":on?"on":"off"}">${dead?"":'<span class="tg" aria-hidden="true"></span>'}<img src="${B.iconUrl(b.icon)}" alt="" loading="lazy" decoding="async">
    <span>${B.esc(B.nameOf(b))} <span class="cc" style="color:${B.COLOR[b.cls]}">· ${B.esc(B.who(b))}</span></span><small>${B.esc(b.out?(b.does[0].toUpperCase()+b.does.slice(1))+(b.whyNot?" · not counted: "+b.whyNot:""):B.effectText(b))}</small></button></li>`;
}
/* the hit cap: what gear-common.js computes, with and without Improved Faerie Fire */
function capLine(t){
  const prec=TK&&TK.precision?TK.precision():0,ff=Math.round(t.boss.hit*100);
  const capWith=Math.ceil(Math.max(0,9-prec-3)*15.7692),capNow=G?G.HIT_CAP:Math.ceil(Math.max(0,9-prec-ff)*15.7692),capOff=Math.ceil(Math.max(0,9-prec)*15.7692);
  const hit=G?G.totals(G.store("planner").get()).Hit:null;
  return `<div class="bb-cap">${ff?`<b>Hit cap for special attacks: ${capNow} rating</b> (${capOff} without Improved Faerie Fire)`:`<b>Hit cap for special attacks: ${capNow} rating.</b> Improved Faerie Fire would lower it to ${capWith}`}${hit!=null?`. Your gear has ${hit}: ${hit>=capNow?`${hit-capNow} over`:`${capNow-hit} under`}.`:"."}</div>`;
}
let prev=null;
function line(key,label,val,note,now){now[key]=val+"|"+(note||"");return `<div class="bb-line${prev&&prev[key]!==now[key]?" chg":""}" data-k="${key}"><b>${label}</b><span class="v">${val}</span>${note?`<small>${note}</small>`:""}</div>`;}
function sumHTML(st){
  const t=B.sum(st),now={},P=B.pct,N=B.fmtN;
  const apFrom=[...(t.from.AP||[]).map(([n,v])=>`${n} ${N(v)}`),t.ap.fromStr?`${N(t.flat.Str)} Strength × 2 = ${N(t.ap.fromStr)}`:""].filter(Boolean).join(" · ");
  let h=`<h4>What it adds up to</h4><p class="prov" style="margin:0 0 6px">As the simulator counts it, on top of your gear and talents.</p>`;
  h+=`<h5>You</h5>`;
  h+=line("ap","Attack power",`+${N(t.ap.flat+t.ap.fromStr)}`,apFrom||"Nothing adds attack power.",now);
  if(t.ap.pctAfter)h+=line("app","Attack power, after that",`+${P(t.ap.pctAfter)}`,"Unleashed Rage, averaged over the fight",now);
  if(t.mult.length)h+=line("kings","Attributes",`+${P(t.mult[0].mult[0][1])}`,`${t.mult.map(b=>B.nameOf(b)).join(", ")}: Strength, Agility and Stamina, including your gear's`,now);
  const critNote=[t.crit.rating?`${Math.round(t.crit.rating*10)/10} crit rating${(t.from.Crit||[]).length?` (${t.from.Crit.map(([n])=>n).join(", ")})`:""}`:"",t.crit.fromAgi?`${N(t.flat.Agi)} Agility at 33 per 1%`:""].filter(Boolean).join(" · ");
  h+=line("crit","Crit",`+${P(t.crit.pct)}`,critNote||"Nothing adds crit.",now);
  h+=line("haste","Haste",`+${P(t.haste)}`,t.haste?"Heroism, averaged over the fight":"No haste.",now);
  if(t.dmg)h+=line("dmg","Damage",`+${P(t.dmg)}`,"Ferocious Inspiration, averaged over the fight",now);
  if(t.flat.Hit)h+=line("hitr","Hit rating",`+${N(t.flat.Hit)}`,(t.from.Hit||[]).map(([n])=>n).join(", "),now);
  const sta=t.flat.Sta||0,arm=t.flat.Armor||0;
  if(sta||arm)h+=line("sta","Stamina and armor",`+${N(sta)} · +${N(arm)}`,"Kept for the record: they don't change your damage",now);
  h+=`<h5>The boss</h5>`;
  const b=t.boss,w=v=>(v/b.armor*100).toFixed(1);
  h+=line("armor","Armor",`${N(b.armor)} → ${N(b.after)}`,`${b.off?`−${N(b.off)} from ${t.on.filter(x=>x.armor).map(x=>B.nameOf(x)).join(", ")}. `:""}Armor takes ${P(b.drAfter)} off your hits${b.off?`, not ${P(b.drBefore)}`:""}.`,now)+
    `<div class="bb-armor" role="img" aria-label="Boss armor ${N(b.after)} of ${N(b.armor)}"><i style="width:${w(b.after)}%"></i><i class="off" style="width:${w(b.off)}%;right:0"></i></div>`;
  h+=line("bcrit","Crit against it",`+${P(b.crit)}`,b.crit?"Improved Seal of the Crusader":"Nothing on the boss adds crit.",now);
  h+=line("bhit","Hit against it",`+${P(b.hit)}`,b.hit?"Improved Faerie Fire":"Nothing on the boss adds hit.",now)+capLine(t);
  const outs=[...B.D.uncounted,...B.D.uncountedDebuffs].filter(x=>!B.isBless(x.id)||B.isOn(st,x.id));
  h+=`<h5>Not counted</h5><ul class="bb-out">`+outs.map(x=>`<li><img src="${B.iconUrl(x.icon)}" alt=""><span><b>${B.esc(B.nameOf(x))}</b>: ${B.esc(x.does)}. ${x.whyNot?`Not counted: ${B.esc(x.whyNot)}.`:""}</span></li>`).join("")+`</ul>`;
  if(prev){Object.keys(now).forEach(k=>{if(prev[k]!==undefined&&prev[k]!==now[k]){const lab={ap:"Attack power",crit:"Crit",haste:"Haste",armor:"Boss armor",bhit:"Hit against the boss",bcrit:"Crit against the boss",dmg:"Damage",app:"Attack power after that",kings:"Attributes",hitr:"Hit rating"}[k];if(lab)changed.push(`${lab}: ${now[k].split("|")[0]}.`);}});}
  prev=now;
  return h;
}
function render(){
  const st=S.get();
  const raid=B.D.buffs.filter(b=>!B.isBless(b.id)).sort(byClass);
  const nOn=B.D.buffs.filter(b=>B.isOn(st,b.id)).length,dOn=B.D.debuffs.filter(b=>B.isOn(st,b.id)).length,cons=B.consumed(st);
  const cnt=$("#bb-count");if(cnt)cnt.innerHTML=`<b>${nOn}</b> buffs · <b>${dOn}</b> on the boss · <b>${cons.length}</b> consumable${cons.length===1?"":"s"}`;
  B.keepFocus(body,()=>{
    body.innerHTML=`<div class="bb-cols"><div class="bb-list">
      <h5 style="margin-top:0">Raid buffs</h5><ul>${raid.map(b=>sw(b,st)).join("")}</ul>
      <h5>Paladin Blessings</h5>${B.palsHTML(st)}
      <h5>On the boss</h5><ul>${B.D.debuffs.map(b=>sw(b,st)).join("")}</ul>
      <h5>Consumables</h5>${B.conChipsHTML(st)}
      <h5>Also in raids, not counted</h5><ul>${[...B.D.uncounted.filter(b=>!B.isBless(b.id)),...B.D.uncountedDebuffs].sort(byClass).map(b=>sw(b,st)).join("")}</ul>
    </div><aside class="bb-sum" aria-label="What it adds up to">${sumHTML(st)}</aside></div>`;
  });
}
body.addEventListener("click",e=>{
  if(B.palsClick(e,S,"buffs-b",say))return;
  if(B.conClick(e,S,"buffs-b",say))return;
  const t=e.target.closest("[data-bid]");if(!t)return;
  const id=t.dataset.bid,b=B.BY[id],r=B.toggle(S.get(),id);
  if(r.why){say(r.why);return;}
  S.set(r.st,"buffs-b");const on=B.isOn(S.get(),id);
  say(r.msg||`${B.nameOf(b)} ${on?"on":"off"}.`);
});
mount.addEventListener("click",e=>{
  const id=e.target.id;
  if(id==="bb-example"){S.set(B.example(),"buffs-b");say("Loaded the example raid setup: what a melee group commonly gets in a 25-man.");}
  else if(id==="bb-all"){S.set(B.everything(S.get()),"buffs-b");say("Every counted buff, Blessing and debuff is on.");}
  else if(id==="bb-none"){S.set(B.empty(),"buffs-b");say("Cleared: no buffs, Paladins, debuffs or consumables.");}
});
B.hoverTips(body,()=>S.get());
document.addEventListener("buffs:change",render);
/* the hit line reads your gear and talents too */
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="buffs")render();});
render();B.openBuffsTab();
})();
