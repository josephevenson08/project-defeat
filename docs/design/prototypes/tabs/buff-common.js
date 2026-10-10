/* buff-common.js — shared logic for the three Buffs sub-tab designs (buffs-a/b/c.html), over buff-data.js.
   Each design draws the buffs its own way; this file owns the state and every rule they share:
   - state: which counted buffs and boss debuffs are on, and the four consumable slots (flask, battle elixir, guardian
     elixir, food); one shared setup per page (window.BUFF_STORE_KEY, "planner"), kept for the browser session. Every
     change fires "buffs:change", then "gear:change" (from "buffs") so the stat bar's hit cap redraws: Improved Faerie
     Fire's +3% hit lowers it (gear-common.js reads BuffKit.hitPct()).
   - rules: a flask takes both elixir slots; one battle elixir, one guardian elixir and one food. Buffs the live app
     doesn't count are listed with the reason and can't be switched on, as in the app.
   - Paladins and their Blessings: each Paladin is assigned one Greater Blessing (they go class by class, so this is the
     one a Paladin puts on Warriors). Kings and Might count; Salvation, Wisdom and Sanctuary can be assigned but count
     for nothing here. Turning a Blessing on hands it to a free Paladin; the assignment rows say who gives what.
   - what each buff does, in words; what everything adds up to (design B); and who in a raid brings what (design C),
     with each buff's reach (your group, any group, the whole raid, the boss). Shamans bring totems by spec, as raids
     run them: Enhancement Strength of Earth, Grace of Air and Windfury. Heroism is raid-wide on Anniversary realms.
     One aura per Paladin and one shout per Warrior.
   - a game-style tooltip, in our own words, with the buff icons the live app ships. */
(function(){
"use strict";
const D=window.BUFF_DATA;
if(!D){if(window.console)console.warn("buff-common: BUFF_DATA missing");return;}
/* the app's own icons: public/icons/ in the repo, /icons/ beside /prototypes/ on the published site */
const ICON_DIR=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/icons/":"../../icons/";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iconUrl=n=>n?ICON_DIR+n+".jpg":"";
const BY={},CON={};
[...D.buffs,...D.uncounted,...D.debuffs,...D.uncountedDebuffs,...D.extraBlessings].forEach(b=>{BY[b.id]=b;});
D.uncounted.forEach(b=>{b.out=true;});D.uncountedDebuffs.forEach(b=>{b.out=true;});D.extraBlessings.forEach(b=>{b.out=true;});
const BLESS=D.blessings.filter(id=>BY[id]); /* Kings, Might, Salvation, Wisdom, Sanctuary */
const isBless=id=>BLESS.includes(id);
/* the app records why each of these isn't counted, for developers; the same in plain words: what it does, and why not */
const PLAIN={
  "commanding-shout":["+1,080 maximum health for your group","the planner has no health stat, and turning it into Stamina would be wrong"],
  "blessing-of-salvation":["−30% threat","the simulator doesn't model threat"],
  "retribution-aura":["26 Holy damage to anything that hits your group","it is damage back to the attacker, not a stat"],
  "sanctity-aura":["+10% Holy damage for your group","the simulator doesn't split damage by school"],
  "shadow-protection":["+70 Shadow resistance","the planner has no resistances"],
  "windfury-totem":["each main-hand hit has a 20% chance of an extra attack with +445 attack power","it is an extra swing, not a stat"],
  "blessing-of-wisdom":["+41 mana every 5 seconds","a Warrior has no mana"],
  "blessing-of-sanctuary":["up to 80 less damage from each hit, and Holy damage back when you block","it is a tank's blessing; the simulator doesn't count damage taken for a damage dealer"],
  "expose-weakness":["everyone attacking the boss gains attack power equal to 25% of the Survival Hunter's Agility","it depends on another player's Agility"]};
[...D.uncounted,...D.uncountedDebuffs,...D.extraBlessings].forEach(b=>{const p=PLAIN[b.id];b.does=p?p[0]:b.why;b.whyNot=p?p[1]:"";});
D.debuffs.forEach(b=>{b.boss=true;});D.uncountedDebuffs.forEach(b=>{b.boss=true;});
D.consumables.forEach(c=>{CON[c.id]=c;});
const COUNTED=[...D.buffs,...D.debuffs];
const CATS=[["flask","Flask"],["battle","Battle elixir"],["guardian","Guardian elixir"],["food","Food"]];
const CAT_NAME=Object.fromEntries(CATS);
const COLOR={Druid:"#FF7C0A",Hunter:"#AAD372",Mage:"#3FC7EB",Paladin:"#F48CBA",Priest:"#FFFFFF",Rogue:"#FFF468",Shaman:"#4aa3ff",Warlock:"#8788EE",Warrior:"#C69B6D"};
const NAME={AP:"attack power",Str:"Strength",Agi:"Agility",Sta:"Stamina",Int:"Intellect",Spi:"Spirit",Crit:"crit rating",Hit:"hit rating",Haste:"haste rating",Armor:"armor",Expertise:"expertise rating",ArP:"armor penetration",Defense:"defense rating"};
const fmtN=n=>Math.round(n).toLocaleString("en-US");
const pct=v=>`${Math.round(v*1000)/10}%`;
/* an averaged buff's full value: the stored figure is rounded, so dividing the uptime back out lands a hair off (30.1%) */
const full=(v,up)=>`${Math.round(v/up*100)}%`;
/* the planner's character is an Alliance Human: Bloodlust shows as Heroism, its identical Alliance twin */
const nameOf=b=>b.alliance||b.name;
const specOf=b=>b.spec||(b.specs&&b.specs.length===1?b.specs[0]:null);
const who=b=>specOf(b)?`${specOf(b)} ${b.cls}`:b.cls;
const whoA=b=>(/^[AEIOU]/.test(specOf(b)||b.cls)?"an ":"a ")+who(b);
const REACH={"your group":"Your group","any group":"Any group (cast once per group)","whole raid":"The whole raid","one player":"One player","on the boss":"On the boss"};

/* ---------- what a buff does, in words ---------- */
function statWords(list){
  const s=(list||[]).filter(([,v])=>v);
  const prim=["Str","Agi","Sta","Int","Spi"],p=s.filter(([k])=>prim.includes(k));
  /* +14 to all five attributes reads better as one phrase */
  if(p.length===5&&p.every(([,v])=>v===p[0][1]))return [`+${p[0][1]} to every attribute`,...s.filter(([k])=>!prim.includes(k)).map(statWord)];
  return s.map(statWord);
}
function statWord([k,v]){
  if(k==="Crit"&&v>=50)return `+${pct(v/D.conv.critPerPct/100)} crit (${v} crit rating)`;
  return `${v<0?"−":"+"}${fmtN(Math.abs(v))} ${NAME[k]||k}`;
}
/* one short line per effect; an averaged buff says its full value and what it is counted as */
function effects(b){
  const L=[];
  if(b.boss){
    if(b.armor)L.push(`−${fmtN(b.armor)} armor on the boss`);
    if(b.crit)L.push(`+${pct(b.crit)} crit chance against the boss`);
    if(b.hit)L.push(`+${pct(b.hit)} hit chance against the boss`);
    return L;
  }
  L.push(...statWords(b.stats));
  if(b.mult&&b.mult.length){const v=b.mult[0][1];L.push(`+${pct(v)} ${b.mult.map(([k])=>NAME[k]||k).join(", ").replace(/, ([^,]*)$/," and $1")}`);}
  (b.after||[]).forEach(([k,v])=>L.push(b.uptime?`+${full(v,b.uptime)} ${NAME[k]||k}, counted as +${pct(v)} (up ${pct(b.uptime)} of a fight)`:`+${pct(v)} ${NAME[k]||k}`));
  if(b.haste)L.push(b.uptime?`+${full(b.haste,b.uptime)} haste while it lasts, counted as +${pct(b.haste)} on average (up ${pct(b.uptime)} of a fight)`:`+${pct(b.haste)} haste`);
  if(b.dmg)L.push(b.uptime?`+${full(b.dmg,b.uptime)} damage, counted as +${pct(b.dmg)} (up ${pct(b.uptime)} of a fight)`:`+${pct(b.dmg)} damage`);
  return L;
}
const effectText=b=>effects(b).join(", ");
function conWords(c){
  const L=statWords(c.stats);
  const ex=c.extra||[],res=ex.filter(([k])=>/Resistance/.test(k)),other=ex.filter(([k])=>!/Resistance/.test(k));
  other.forEach(([k,v])=>L.push(`+${v} ${k.toLowerCase()} (not counted: the stat model has no ${k.toLowerCase()})`));
  if(res.length){const kinds=res.map(([k])=>k.replace(/ ?Resistance/,"").toLowerCase());
    L.push(`+${res[0][1]} ${kinds.length>1?kinds.slice(0,-1).join(", ")+" and "+kinds[kinds.length-1]:kinds[0]} resistance (not counted: the stat model has no resistances)`);}
  if(!L.length)L.push("No stats the planner counts");
  return L.join(", ");
}

/* ---------- state ---------- */
/* an example raid setup to start from (every design labels it so): what a melee group commonly gets in a 25-man */
const EXAMPLE_ON=["battle-shout","blessing-of-might","blessing-of-kings","prayer-of-fortitude","mark-of-the-wild","leader-of-the-pack",
  "strength-of-earth-totem","grace-of-air-totem","unleashed-rage","bloodlust","sunder-armor","curse-of-recklessness","faerie-fire","improved-seal-of-the-crusader"];
const EXAMPLE_CONS={flask:"flask-of-relentless-assault",battle:null,guardian:null,food:"roasted-clefthoof"};
/* pals: one entry per Paladin, {bless: a Blessing id or null, who: a name or null}; the example has two, on Kings and Might */
const example=()=>sync({on:EXAMPLE_ON.filter(id=>BY[id]&&!BY[id].out),cons:Object.assign({},EXAMPLE_CONS),
  pals:[{bless:"blessing-of-kings",who:null},{bless:"blessing-of-might",who:null}]});
const empty=()=>({on:[],cons:{flask:null,battle:null,guardian:null,food:null},pals:[]});
const clone=s=>({on:s.on.slice(),cons:Object.assign({},s.cons),pals:(s.pals||[]).map(p=>Object.assign({},p))});
/* the counted Blessings that are on are exactly the ones a Paladin is assigned */
function sync(s){const given=new Set((s.pals||[]).map(p=>p.bless));s.on=s.on.filter(id=>!isBless(id)).concat(BLESS.filter(id=>given.has(id)&&!BY[id].out));return s;}
function valid(v){return v&&Array.isArray(v.on)&&v.on.every(id=>BY[id]&&!BY[id].out)&&v.cons&&CATS.every(([k])=>v.cons[k]===null||(CON[v.cons[k]]&&CON[v.cons[k]].cat===k))
  &&Array.isArray(v.pals)&&v.pals.every(p=>p&&(p.bless===null||isBless(p.bless)));}
const MAX_PALS=6;
const palName=(st,i)=>st.pals[i]&&st.pals[i].who||`Paladin ${i+1}`;
const giver=(st,id)=>(st.pals||[]).findIndex(p=>p.bless===id);
/* give Paladin i a Blessing (null takes it away). Two Paladins can't put the same Greater Blessing on one class, so if
   another already gives it, the two swap. */
function assign(st,i,id){
  const n=clone(st);if(!n.pals[i])return {st,msg:""};
  const j=id?giver(n,id):-1,prev=n.pals[i].bless;
  if(j>=0&&j!==i)n.pals[j].bless=prev;
  n.pals[i].bless=id||null;sync(n);
  const nm=id?nameOf(BY[id]):"no Blessing";
  return {st:n,msg:`${palName(n,i)} gives ${nm}${j>=0&&j!==i?`; ${palName(n,j)} takes ${prev?nameOf(BY[prev]):"nothing"} instead`:""}.`};
}
function addPal(st){const n=clone(st);if(n.pals.length>=MAX_PALS)return {st,msg:`Up to ${MAX_PALS} Paladins.`};n.pals.push({bless:null,who:null});return {st:n,msg:`Added ${palName(n,n.pals.length-1)}: choose the Blessing they give.`};}
/* every counted buff and debuff on, with a Paladin for each counted Blessing (added if needed) */
function everything(st){const n=clone(st);n.on=COUNTED.filter(b=>!isBless(b.id)).map(b=>b.id);
  BLESS.filter(x=>!BY[x].out).forEach(x=>{if(giver(n,x)<0){const k=n.pals.findIndex(p=>!p.bless);if(k>=0)n.pals[k].bless=x;else n.pals.push({bless:x,who:null});}});
  return sync(n);}
function removePal(st,i){const n=clone(st);const nm=palName(n,i),b=n.pals[i]&&n.pals[i].bless;n.pals.splice(i,1);sync(n);return {st:n,msg:`Removed ${nm}${b?`, and with them ${nameOf(BY[b])}`:""}.`};}
const STORES={};
function store(key){
  key=window.BUFF_STORE_KEY||key||"planner";
  if(STORES[key])return STORES[key];
  const K="pd-buffs-"+key;
  let st=null;try{const raw=sessionStorage.getItem(K);if(raw){const v=JSON.parse(raw);if(valid(v))st=v;}}catch(e){}
  if(!st)st=example();
  return STORES[key]={get:()=>st,set:(v,from)=>{st=v;try{sessionStorage.setItem(K,JSON.stringify(st));}catch(e){}
    document.dispatchEvent(new CustomEvent("buffs:change",{detail:{from:from||""}}));
    /* Improved Faerie Fire moves the hit cap, so every gear view and the stat bar redraw */
    document.dispatchEvent(new CustomEvent("gear:change",{detail:{from:"buffs"}}));
    return st;}};
}
window.BUFF_STORE_KEY=window.BUFF_STORE_KEY||"planner";
const isOn=(st,id)=>isBless(id)?giver(st,id)>=0:st.on.includes(id);
function toggle(st,id){
  const b=BY[id];if(!b)return {st,why:"Unknown buff."};
  if(isBless(id)){const i=giver(st,id);
    if(i>=0){const r=assign(st,i,null);return {st:r.st,why:"",msg:`${nameOf(b)} off: ${palName(st,i)} no longer gives it.`};}
    let n=clone(st),k=n.pals.findIndex(p=>!p.bless);
    if(k<0){const a=addPal(n);if(a.st===n)return {st,why:a.msg};n=a.st;k=n.pals.length-1;}
    const r=assign(n,k,id);return {st:r.st,why:"",msg:`${nameOf(b)} on: ${palName(r.st,k)} gives it.${b.out?` It isn't counted${b.whyNot?": "+b.whyNot:""}.`:""}`};}
  if(b.out)return {st,why:`${nameOf(b)} isn't counted${b.whyNot?": "+b.whyNot:""}.`};
  const n=clone(st);n.on=isOn(st,id)?n.on.filter(x=>x!==id):[...n.on,id];return {st:n,why:""};
}
/* put a consumable in its slot (null empties it). A flask takes both elixir slots, and an elixir empties the flask. */
function setCon(st,cat,id){
  const n=clone(st),c=id?CON[id]:null;let cleared=[];
  if(id&&(!c||c.cat!==cat))return {st,why:"That doesn't go in this slot.",cleared};
  n.cons[cat]=id||null;
  if(id&&cat==="flask"){["battle","guardian"].forEach(k=>{if(n.cons[k]){cleared.push(CON[n.cons[k]].name);n.cons[k]=null;}});}
  if(id&&(cat==="battle"||cat==="guardian")&&n.cons.flask){cleared.push(CON[n.cons.flask].name);n.cons.flask=null;}
  return {st:n,why:"",cleared};
}
const conOptions=cat=>D.consumables.filter(c=>c.cat===cat);
const consumed=st=>CATS.map(([k])=>st.cons[k]).filter(Boolean).map(id=>CON[id]);

/* ---------- the hit cap: Improved Faerie Fire is +3% hit against the boss (gear-common.js asks for it) ---------- */
const hitPct=()=>{const st=store().get();return Math.round(COUNTED.filter(b=>isOn(st,b.id)).reduce((a,b)=>a+(b.hit||0),0)*100);};

/* ---------- what it all adds up to (design B) ---------- */
/* armor's damage reduction against a level-73 boss, for a level-70 attacker: combatConstants.ts (467.5 x level − 22167.5),
   capped at 75% */
const armorDR=a=>Math.min(.75,Math.max(0,a)/(Math.max(0,a)+467.5*70-22167.5));
function sum(st){
  const on=COUNTED.filter(b=>isOn(st,b.id)),cons=consumed(st);
  const flat={},from={};
  const add=(src,list)=>(list||[]).forEach(([k,v])=>{flat[k]=(flat[k]||0)+v;(from[k]=from[k]||[]).push([src,v]);});
  on.forEach(b=>add(nameOf(b),b.stats));cons.forEach(c=>add(c.name,c.stats));
  const mult=on.filter(b=>b.mult&&b.mult.length),after=on.filter(b=>b.after&&b.after.length);
  const str=flat.Str||0,agi=flat.Agi||0;
  const ap={flat:flat.AP||0,fromStr:str*D.conv.strAP,pctAfter:after.reduce((a,b)=>a+b.after.filter(([k])=>k==="AP").reduce((x,[,v])=>x+v,0),0)};
  const crit={rating:flat.Crit||0,fromAgi:agi*D.conv.agiCrit};
  crit.pct=(crit.rating+crit.fromAgi)/D.conv.critPerPct/100;
  const haste=on.reduce((a,b)=>a+(b.haste||0),0),dmg=on.reduce((a,b)=>a+(b.dmg||0),0);
  const armorOff=on.reduce((a,b)=>a+(b.armor||0),0),bossArmor=Math.max(0,D.boss.armor-armorOff);
  return {on,cons,flat,from,mult,after,ap,crit,haste,dmg,
    boss:{armor:D.boss.armor,after:bossArmor,off:armorOff,drBefore:armorDR(D.boss.armor),drAfter:armorDR(bossArmor),
      crit:on.reduce((a,b)=>a+(b.crit||0),0),hit:on.reduce((a,b)=>a+(b.hit||0),0)}};
}

/* ---------- who brings what (design C) ---------- */
const BUILD=Object.fromEntries(D.builds.map(b=>[b.id,b]));
const ME="warrior-fury"; /* the planner's character: a Fury Warrior */
const provides=(bd,b)=>!!bd&&bd.cls===b.cls&&(!b.specs||b.specs.includes(bd.spec));
/* the example rosters from raid-composition.html: real builds, invented seating (labelled "example" wherever shown) */
const EX={
 25:[["warrior-protection","paladin-protection","druid-feral-tank","paladin-holy","shaman-restoration"],
     ["warrior-fury","warrior-fury","rogue-combat","shaman-enhancement","druid-feral-cat"],
     ["mage-fire","warlock-destruction","shaman-elemental","priest-shadow","druid-balance"],
     ["hunter-beast-mastery","hunter-marksmanship","hunter-survival","paladin-retribution","rogue-combat"],
     ["priest-holy","priest-discipline","druid-restoration","paladin-holy","mage-arcane"]],
 10:[["warrior-protection","paladin-holy","shaman-enhancement","warrior-fury","rogue-combat"],
     ["druid-feral-tank","shaman-restoration","priest-shadow","mage-fire","warlock-destruction"]]};
const exampleRoster=n=>EX[n].map(r=>r.map(id=>({id})));
/* the roster the Raid Composition tab keeps for the browser session, if any, trusted only if every seat is a known build */
function savedRoster(){
  try{const raw=JSON.parse(sessionStorage.getItem("pd-raidcomp-a:v1")||"null");
    if(!raw||!Array.isArray(raw.groups)||!raw.groups.length)return null;
    const groups=raw.groups.map(r=>Array.isArray(r)&&r.length===5?r.map(s=>s&&BUILD[s.id]?(s.name?{id:s.id,name:String(s.name).slice(0,24)}:{id:s.id}):null):null);
    if(groups.some(r=>!r)||!groups.flat().some(Boolean))return null;
    return groups;}catch(e){return null;}
}
/* your seat: the first Fury Warrior, else the first empty seat (you sit there), else the first seat */
function defaultSeat(groups){
  for(let g=0;g<groups.length;g++)for(let i=0;i<5;i++)if(groups[g][i]&&groups[g][i].id===ME)return {g,i};
  for(let g=0;g<groups.length;g++)for(let i=0;i<5;i++)if(!groups[g][i])return {g,i};
  return {g:0,i:0};
}
/* everyone, with you in your seat as a Fury Warrior */
function seatsWithYou(groups,seat){
  return groups.map((row,g)=>row.map((s,i)=>g===seat.g&&i===seat.i?{id:ME,you:true,name:"You"}:s));
}
/* "you", or "Thrallson, Enhancement Shaman, group 2" */
const seatLabel=x=>x.who||(x.s.you?"you":`${x.s.name?x.s.name+", ":""}${BUILD[x.s.id].label} ${BUILD[x.s.id].cls}, group ${x.g+1}`);
const groupOf=b=>D.groups.find(g=>g.ids.includes(b.id));
/* what reaches you, and from whom: party buffs from your group, "any group" buffs and Blessings from anyone in the raid,
   boss debuffs from anyone. Exclusive groups get one buff per provider, in the group's order (Kings, Might, Salvation
   for a Warrior, since Blessings go per class; Windfury before Grace of Air; Devotion first; one shout per Warrior). */
/* the raid's Paladins, each with a Blessing: kept from prev where the same seat was assigned, otherwise in raid order
   (Kings, Might, Salvation for a Warrior, then none) */
function rosterPals(groups,seat,prev){
  const all=seatsWithYou(groups,seat),keep=new Map((prev||[]).filter(p=>p.key).map(p=>[p.key,p.bless]));
  const pals=[];all.forEach((row,g)=>row.forEach((s,i)=>{if(s&&BUILD[s.id]&&BUILD[s.id].cls==="Paladin")pals.push({key:g+"-"+i,who:seatLabel({s,g}),bless:keep.has(g+"-"+i)?keep.get(g+"-"+i):undefined});}));
  const order=["blessing-of-kings","blessing-of-might","blessing-of-salvation"];
  pals.forEach(p=>{if(p.bless===undefined){const next=order.find(id=>!pals.some(q=>q.bless===id));p.bless=next||null;}});
  /* a kept assignment can collide with a default one: the later Paladin gives way */
  const seen=new Set();pals.forEach(p=>{if(p.bless&&seen.has(p.bless))p.bless=null;else if(p.bless)seen.add(p.bless);});
  return pals;
}
function coverage(groups,seat,pals){
  const all=seatsWithYou(groups,seat),mine=all[seat.g].map(s=>s?{s,g:seat.g}:null).filter(Boolean);
  const raid=all.flatMap((row,g)=>row.map(s=>s?{s,g}:null)).filter(Boolean);
  const scopeOf=b=>b.reach==="your group"?mine:raid;
  const res={};
  [...D.buffs,...D.uncounted,...D.debuffs,...D.uncountedDebuffs].forEach(b=>{
    /* you first, then your own group, then the rest of the raid in seat order */
    const near=x=>x.s.you?2:x.g===seat.g?1:0;
    const pool=scopeOf(b).filter(x=>provides(BUILD[x.s.id],b)).sort((x,y)=>near(y)-near(x));
    res[b.id]={b,by:pool,got:pool.length>0,where:b.reach==="your group"?"your group":"the raid"};
  });
  /* Blessings: what the Paladins are assigned */
  BLESS.forEach(id=>{const r=res[id]||(res[id]={b:BY[id],by:[],got:false,where:"the raid"});const p=(pals||[]).find(x=>x.bless===id);
    r.got=!!p;r.by=p?[{s:{id:"paladin-holy",name:p.who,pal:true},g:-1,who:p.who}]:[];r.blessing=true;
    if(!p)r.taken=(pals||[]).length?"no Paladin is assigned it":"no Paladin in the raid";});
  /* exclusive groups: n providers in reach cover at most n of the group, in order */
  D.groups.forEach(gr=>{
    const first=BY[gr.ids[0]];if(!first)return;
    const pool=scopeOf(first).filter(x=>provides(BUILD[x.s.id],first));
    let left=pool.length;
    gr.ids.forEach(id=>{const r=res[id];if(!r)return;
      if(r.got&&left>0){left--;}
      else if(r.got){r.got=false;const n=pool.length;
        r.taken=`the ${n===1?"one":n} ${first.cls}${n>1?"s":""} in reach ${n>1?"are":"is"} already giving ${gr.ids.slice(0,gr.ids.indexOf(id)).filter(x=>res[x]&&res[x].got).map(x=>nameOf(BY[x])).join(" and ")}`;}});
  });
  return res;
}
/* the state a roster gives: counted buffs and debuffs that reach you (consumables are yours, so they stay) */
function stateFrom(cov,cons,pals){return sync({on:COUNTED.filter(b=>!isBless(b.id)&&cov[b.id]&&cov[b.id].got).map(b=>b.id),cons:Object.assign({},cons),pals:(pals||[]).map(p=>({bless:p.bless,who:p.who,key:p.key}))});}

/* ---------- tooltip (game-style, our own wording) ---------- */
/* one buff as an icon tile (design A's look, which the planner uses too). o.pressed: true/false for a switch, or leave it
   out for a tile that only explains itself; o.cls: extra classes; o.label: more accessible text; o.badge: a small tag;
   o.current: the selected tile */
function tileHTML(b,o){
  o=o||{};
  const pr=o.pressed===true||o.pressed===false?` aria-pressed="${o.pressed}"`:"";
  return `<button type="button" class="bk-ic${b.out?" out":""}${o.cls?" "+o.cls:""}" data-bid="${b.id}"${pr} style="--cc:${COLOR[b.cls]}"
    aria-label="${esc(nameOf(b))}${o.label?", "+esc(o.label):""}"${o.current?' aria-current="true"':""}>
    <span class="fr"><img src="${iconUrl(b.icon)}" alt="" loading="lazy" decoding="async"><i class="cb"></i></span><span class="bk-nm">${esc(nameOf(b))}</span>${o.badge?`<span class="bk-badge">${esc(o.badge)}</span>`:""}</button>`;
}
function tooltipHTML(id,st,more){
  const b=BY[id];if(!b)return "";
  const L=[`<b class="tt-name">${esc(nameOf(b))}</b>`];
  L.push(`<span class="tt-grey">${esc(REACH[b.reach]||b.reach)} · from ${esc(whoA(b))}</span>`);
  if(b.alliance)L.push(`<span class="tt-grey">Bloodlust for the Horde, Heroism for the Alliance</span>`);
  if(b.anniversary)L.push(`<span class="tt-grey">Raid-wide on Anniversary realms (patch 2.5.5); the original tooltip says party</span>`);
  if(isBless(id)&&st){const i=giver(st,id);L.push(`<span class="${i>=0?"tt-sim":"tt-grey"}">${i>=0?`Given by ${esc(palName(st,i))}`:"No Paladin assigned"}</span>`);}
  if(b.out)L.push(`<span class="tt-desc">${esc(b.does[0].toUpperCase()+b.does.slice(1))}</span><span class="tt-src">Not counted${b.whyNot?": "+esc(b.whyNot):""}.</span>`);
  else{
    effects(b).forEach(t=>L.push(`<span class="tt-desc">${esc(t)}</span>`));
    if(b.talented)L.push(`<span class="tt-src">With ${esc(b.talented.talent)} 5/5 the shouting Warrior gives ${b.talented.ap}; the simulator counts 306.</span>`);
    const gr=groupOf(b);if(gr)L.push(`<span class="tt-src">${esc(gr.label)}: one per ${esc(BY[gr.ids[0]].cls)}${gr.basis==="raid convention"?", by raid custom":""}.</span>`);
    if(st&&!isBless(id))L.push(`<span class="${isOn(st,id)?"tt-sim":"tt-grey"}">${isOn(st,id)?"On":"Off"} · counted by the simulator</span>`);
  }
  return `<span class="tt bk-tt">${L.join("")}${more||""}</span>`;
}
function conTooltipHTML(id){
  const c=CON[id];if(!c)return "";
  return `<span class="tt bk-tt"><b class="tt-name">${esc(c.name)}</b><span class="tt-grey">${esc(CAT_NAME[c.cat])}${c.cat==="flask"?" · takes both elixir slots":c.cat!=="food"?" · not with a flask":""}</span><span class="tt-desc">${esc(conWords(c))}</span></span>`;
}

/* ---------- consumables as chips (designs B and C; A uses slots) ---------- */
/* small drawings of our own for the three kinds (the live app ships no consumable icons) */
const GLYPH={
  flask:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2h6v2h-1v5.2l5.3 8.6A2.8 2.8 0 0 1 16.9 22H7.1a2.8 2.8 0 0 1-2.4-4.2L10 9.2V4H9z" fill="currentColor" opacity=".9"/></svg>',
  battle:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2h4v3l2 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7l2-2z" fill="currentColor" opacity=".9"/></svg>',
  guardian:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2h4v3l2 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7l2-2z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 13h6v7H9z" fill="currentColor" opacity=".8"/></svg>',
  food:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3a5.5 5.5 0 0 1 0 11c-1 0-1.6.4-2.3 1.1l-4 4a2 2 0 1 1-2.8-2.8l4-4c.7-.7 1.1-1.3 1.1-2.3A5.5 5.5 0 0 1 15.5 3z" fill="currentColor" opacity=".9"/></svg>'};
function conChipsHTML(st){
  return '<div class="bk-cons">'+CATS.map(([k,lab])=>`<div class="bk-cat"><span class="lab"><i class="bk-g bk-${k}">${GLYPH[k]}</i>${lab}</span><div class="bk-chips" role="group" aria-label="${lab}">`+
    `<button type="button" class="bk-chip" data-ccat="${k}" data-cid="" aria-pressed="${!st.cons[k]}">None</button>`+
    conOptions(k).map(c=>`<button type="button" class="bk-chip" data-ccat="${k}" data-cid="${c.id}" aria-pressed="${st.cons[k]===c.id}"><b>${esc(c.name)}</b><small>${esc(conWords(c))}</small></button>`).join("")+'</div></div>').join("")+
    '<p class="prov" style="margin:6px 0 0">A flask takes both elixir slots, so picking one empties the other.</p></div>';
}
/* a consumable chosen: put it in its slot and say what came out, if anything */
function conClick(e,S,from,say){
  const b=e.target.closest&&e.target.closest("[data-ccat]");if(!b)return false;
  const cat=b.dataset.ccat,id=b.dataset.cid||null,r=setCon(S.get(),cat,id);
  if(r.why){say(r.why);return true;}
  S.set(r.st,from);
  say(`${CAT_NAME[cat]}: ${id?CON[id].name:"none"}.${r.cleared.length?` Took out ${r.cleared.join(" and ")}: ${cat==="flask"?"a flask takes both elixir slots":"an elixir can't go with a flask"}.`:""}`);
  return true;
}
/* ---------- Paladins and their Blessings (all three designs) ---------- */
/* one row per Paladin with the five Blessings as icons to pick from; opts.fixed: the roster decides who the Paladins are */
function palsHTML(st,opts){
  opts=opts||{};const pals=st.pals||[];
  const row=(p,i)=>`<li class="bk-pal"><span class="bk-pn"><i class="bk-pdot" aria-hidden="true"></i>${esc(palName(st,i))}</span>
    <span class="bk-pb" role="group" aria-label="Blessing ${esc(palName(st,i))} gives">`+BLESS.map(id=>{const b=BY[id],on=p.bless===id;
      return `<button type="button" class="bk-bl${b.out?" out":""}" data-pal="${i}" data-bless="${id}" aria-pressed="${on}" title="${esc(nameOf(b))}${b.out?" (not counted)":""}" aria-label="${esc(nameOf(b))}${b.out?", not counted":""}"><img src="${iconUrl(b.icon)}" alt=""><span>${esc(nameOf(b).replace("Greater Blessing of ",""))}</span></button>`;}).join("")+
    `<button type="button" class="bk-bl none" data-pal="${i}" data-bless="" aria-pressed="${!p.bless}" aria-label="No Blessing">None</button></span>`+
    (opts.fixed?"":`<button type="button" class="bk-x" data-palrm="${i}" aria-label="Remove ${esc(palName(st,i))}">×</button>`)+`</li>`;
  return `<div class="bk-pals"><ul>${pals.map(row).join("")}</ul>`+
    (pals.length?"":`<p class="prov" style="margin:0 0 6px">${opts.fixed?"No Paladin in this raid, so no Blessings.":"No Paladins yet."}</p>`)+
    (opts.fixed?"":`<button type="button" class="btn ghost" data-paladd="1"${pals.length>=MAX_PALS?" disabled":""}>Add a Paladin</button>`)+
    `<p class="prov" style="margin:6px 0 0">Each Paladin gives each class one Greater Blessing, so this is the one they put on Warriors. Kings and Might count; Salvation, Wisdom and Sanctuary do nothing the planner counts for you.</p></div>`;
}
function palsClick(e,S,from,say){
  const t=e.target.closest&&e.target.closest("[data-pal],[data-palrm],[data-paladd]");if(!t)return false;
  let r;
  if(t.dataset.paladd)r=addPal(S.get());
  else if(t.dataset.palrm!==undefined)r=removePal(S.get(),+t.dataset.palrm);
  else r=assign(S.get(),+t.dataset.pal,t.dataset.bless||null);
  if(r.st!==S.get())S.set(r.st,from);
  say(r.msg);return true;
}
/* these pages open on the Buffs sub-tab, since that is what they are for */
function openBuffsTab(){const t=document.getElementById("t-buffs");if(t&&t.getAttribute("aria-selected")!=="true")t.click();}

/* a game-style hover tooltip for fine pointers: [data-bid] buffs and [data-cid] consumables inside root */
function hoverTips(root,getState,more){
  if(!matchMedia("(hover:hover) and (pointer:fine)").matches)return null;
  const tip=document.createElement("div");tip.className="tk-tip bk-tip";tip.hidden=true;tip.setAttribute("aria-hidden","true");document.body.appendChild(tip);
  let cur=null;
  const place=el=>{const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
    let x=r.right+10,y=r.top-4;if(x+w>innerWidth-8)x=r.left-w-10;if(x<8)x=8;if(y+h>innerHeight-8)y=innerHeight-h-8;if(y<8)y=8;
    tip.style.left=x+"px";tip.style.top=y+"px";};
  const show=el=>{cur=el.dataset.bid?"b:"+el.dataset.bid:"c:"+el.dataset.cid;tip.innerHTML=el.dataset.bid?tooltipHTML(el.dataset.bid,getState(),more?more(el.dataset.bid):""):conTooltipHTML(el.dataset.cid);tip.hidden=false;place(el);};
  const hide=()=>{tip.hidden=true;cur=null;};
  root.addEventListener("pointerover",e=>{const el=e.target.closest("[data-bid],[data-cid]");if(el&&el.dataset.tip!=="off")show(el);});
  root.addEventListener("pointerout",e=>{const el=e.target.closest("[data-bid],[data-cid]");if(el&&!(e.relatedTarget&&el.contains(e.relatedTarget)))hide();});
  addEventListener("scroll",hide,{passive:true});
  document.addEventListener("buffs:change",()=>{if(!cur)return;const c=cur;setTimeout(()=>{const sel=c[0]==="b"?`[data-bid="${c.slice(2)}"]`:`[data-cid="${c.slice(2)}"]`;const el=root.querySelector(sel);if(el&&el.offsetParent)show(el);else hide();},0);});
  return {hide};
}
/* redraw root with fn() and put focus back on the same control (matched by its data-* key or id) */
function keepFocus(root,fn){
  const a=document.activeElement,inside=!!a&&a!==document.body&&root.contains(a);let sel=null;
  if(inside){if(a.id)sel="#"+(window.CSS&&CSS.escape?CSS.escape(a.id):a.id);
    else{const d=a.dataset||{},ks=Object.keys(d).filter(k=>k!=="tip");if(ks.length)sel=ks.map(k=>`[data-${k.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}="${d[k]}"]`).join("");}}
  fn();
  if(sel){const n=root.querySelector(sel);if(n&&!n.disabled)n.focus({preventScroll:true});}
}

/* ---------- shared styling ---------- */
function css(){
  if(document.getElementById("buff-common-css"))return;
  const st=document.createElement("style");st.id="buff-common-css";
  st.textContent=`
.bk-tt{min-width:220px;max-width:300px}
.tk-tip{position:fixed;z-index:30;pointer-events:none;background:linear-gradient(180deg,rgba(8,14,36,.97),rgba(4,8,22,.97));border:1px solid #9aa7c7;border-radius:6px;padding:9px 11px;box-shadow:0 10px 30px rgba(0,0,0,.6)}
.tk-tip[hidden]{display:none}
.tt-desc{color:#ffd100}.tt-sim{color:#7fe0d4;margin-top:6px;font-size:11.5px}
.bk-ex{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--warn);border:1px solid rgba(255,207,122,.4);background:var(--warn-soft);border-radius:4px;padding:1px 6px;vertical-align:middle}
.bk-out{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);border:1px solid var(--rim-2);border-radius:4px;padding:1px 6px;vertical-align:middle}
.bk-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 10px}
.bk-count{font:600 var(--t-sm) var(--f-body);color:var(--ink-2)}.bk-count b{font:700 var(--t-md) var(--f-body);font-variant-numeric:tabular-nums;color:var(--ink)}
.bk-cls{font-weight:700}
.bk-g{display:inline-grid;place-items:center;width:18px;height:18px;margin-right:6px;vertical-align:-4px}.bk-g svg{width:18px;height:18px}
.bk-flask{color:#7fd0ff}.bk-battle{color:#ff9a6b}.bk-guardian{color:#9be37f}.bk-food{color:#ffcf7a}
.bk-cons{display:grid;gap:10px}
.bk-cat .lab{display:block;font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin:0 0 5px}
.bk-chips{display:flex;flex-wrap:wrap;gap:6px}
.bk-chip{display:grid;gap:1px;text-align:left;font:600 var(--t-xs) var(--f-body);color:var(--ink-2);background:var(--glass-2);border:1px solid var(--rim-2);border-radius:10px;padding:6px 10px;cursor:pointer;max-width:260px}
.bk-chip b{font-weight:700;color:var(--ink)}.bk-chip small{color:var(--ink-3);font-weight:500}
.bk-chip[aria-pressed="true"]{border-color:var(--glow);background:color-mix(in srgb,var(--glow) 16%,var(--scrim));box-shadow:inset 3px 0 0 var(--glow)}
.bk-chip:hover,.bk-chip:focus-visible{border-color:var(--glow)}
@media (max-width:699px),(pointer:coarse){.bk-chip{min-height:44px}}
@media (max-width:699px),(pointer:coarse){.bk-tools .btn{min-height:44px}}
.bk-bar{display:flex;flex-wrap:wrap;gap:10px 8px;padding:10px;border-radius:12px;background:linear-gradient(180deg,rgba(6,10,16,.92),rgba(3,6,10,.92));border:1px solid #5b4a2e;box-shadow:inset 0 0 0 1px rgba(0,0,0,.6)}
.bk-ic{position:relative;display:grid;justify-items:center;gap:4px;width:64px;padding:0;background:none;border:0;cursor:pointer;color:var(--ink-3);font:600 10px/1.15 var(--f-body);text-align:center}
.bk-ic .fr{position:relative;width:46px;height:46px;border-radius:7px;border:2px solid #3a414a;background:#05080b;overflow:hidden}
.bk-ic img{display:block;width:100%;height:100%}
.bk-ic .cb{position:absolute;left:0;right:0;bottom:0;height:4px;background:var(--cc)}
.bk-ic[aria-pressed="false"] img{filter:grayscale(1) brightness(.45)}
.bk-ic[aria-pressed="true"] .fr{border-color:#f0c050;box-shadow:0 0 12px -2px rgba(240,192,80,.75)}
.bk-ic[aria-pressed="true"]{color:var(--ink)}
.bk-ic .bk-nm{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.3em}
.bk-ic.out .fr{border-style:dashed;border-color:#4a5058}
.bk-ic.out img{filter:grayscale(1) brightness(.35)}
.bk-ic.out[aria-pressed="true"] .fr{border-color:#f0c050}.bk-ic.out[aria-pressed="true"] img{filter:grayscale(.4) brightness(.7)}
.bk-ic.out .fr::after{content:"";position:absolute;left:-6px;right:-6px;top:50%;height:2px;background:rgba(255,143,134,.85);transform:rotate(-45deg)}
.bk-ic.miss .fr{border:2px dashed var(--warn)}
.bk-ic.lit .fr{border-color:#f0c050;box-shadow:0 0 12px -2px rgba(240,192,80,.75)}.bk-ic.lit{color:var(--ink)}
.bk-ic.dim img{filter:grayscale(1) brightness(.45)}
.bk-ic .bk-badge{position:absolute;top:-6px;right:0;font:800 8px/1 var(--f-body);text-transform:uppercase;letter-spacing:.04em;background:var(--glow);color:var(--glow-ink);padding:2px 3px;border-radius:3px;white-space:nowrap}
.bk-ic:hover .fr,.bk-ic:focus-visible .fr{border-color:#fff}
.bk-ic[aria-current="true"] .fr{outline:2px solid var(--focus);outline-offset:2px}
.bk-sep{width:1px;align-self:stretch;background:var(--rim-2);margin:0 4px}
@media (max-width:699px),(pointer:coarse){.bk-ic{width:60px;min-height:44px}}
.bk-pals ul{list-style:none;margin:0 0 8px;padding:0;display:grid;gap:6px}
.bk-pal{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:6px 8px;border:1px solid var(--rim-2);border-radius:10px;background:var(--scrim)}
.bk-pn{display:inline-flex;align-items:center;gap:6px;font:600 var(--t-sm) var(--f-body);min-width:120px}
.bk-pdot{width:10px;height:10px;border-radius:50%;background:${COLOR.Paladin}}
.bk-pb{display:flex;flex-wrap:wrap;gap:4px;flex:1}
.bk-bl{display:inline-flex;align-items:center;gap:5px;font:600 var(--t-xs) var(--f-body);color:var(--ink-3);background:var(--glass-2);border:1px solid var(--rim-2);border-radius:999px;padding:2px 9px 2px 2px;cursor:pointer}
.bk-bl img{width:24px;height:24px;border-radius:50%;filter:grayscale(1) brightness(.55)}
.bk-bl.none{padding:5px 10px}
.bk-bl.out span{opacity:.75}
.bk-bl[aria-pressed="true"]{color:var(--ink);border-color:#f0c050;background:rgba(240,192,80,.12)}.bk-bl[aria-pressed="true"] img{filter:none}
.bk-bl:hover,.bk-bl:focus-visible{border-color:var(--glow)}
.bk-x{width:30px;height:30px;border-radius:50%;border:1px solid var(--rim);background:none;color:var(--ink-2);font:700 16px/1 var(--f-body);cursor:pointer}
@media (max-width:699px),(pointer:coarse){.bk-bl,.bk-x{min-height:44px}.bk-x{width:44px}.bk-pals .btn{min-height:44px}}`;
  (document.head||document.documentElement).appendChild(st);
}
css();
window.BuffKit={D,BY,CON,COUNTED,CATS,CAT_NAME,COLOR,BUILD,ME,esc,iconUrl,nameOf,who,whoA,REACH,effects,effectText,conWords,statWords,
  example,empty,clone,store,isOn,toggle,setCon,conOptions,consumed,hitPct,sum,armorDR,pct,fmtN,
  exampleRoster,savedRoster,defaultSeat,seatsWithYou,rosterPals,coverage,stateFrom,seatLabel,groupOf,provides,BLESS,isBless,giver,palName,assign,addPal,removePal,palsHTML,palsClick,sync,specOf,everything,
  tileHTML,tooltipHTML,conTooltipHTML,openBuffsTab,hoverTips,keepFocus,GLYPH,conChipsHTML,conClick};
})();
