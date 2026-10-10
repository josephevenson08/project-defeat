/* gear-common.js — shared logic for the three Gear sub-tab designs (gear-a/b/c.html), over gear-data.js.
   Each design draws the gear its own way; this file owns the state and every rule they share:
   - state: what each of the 17 slots holds (item, enchant, gems), kept per design for the browser session
   - presets: the recommended set (Wowhead's rank 1, second ring and trinket take rank 2), a part-geared example, empty
   - sockets: which gem colours match which socket, and whether an item's socket bonus is on
   - totals: gear + gems + enchants, and the live hit-rating row in the stat bar (the special-attack cap: 142 rating,
     less 1% per Precision rank the Talents tab holds, so 95 at 3/3)
   - a game-style tooltip, written in our own words (no Blizzard art beyond the item icons the live app ships)
   Every DOM lookup is guarded, so a page without some element just skips that feature. */
(function(){
"use strict";
const D=window.GEAR_DATA;
if(!D){if(window.console)console.warn("gear-common: GEAR_DATA missing");return;}
/* the app's own icons: public/icons/ in the repo, /icons/ beside /prototypes/ on the published site */
const ICON_DIR=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/icons/":"../../icons/";
/* the special-attack hit cap against a level-73 boss: 9% at 15.77 rating per 1% = 142 rating. Each Precision rank in the
   Talents tab (talent-common.js, when the page loads it) is 1% the gear doesn't have to supply, so 3/3 makes it 95.
   Past the cap extra hit isn't wasted for a dual-wielder: it still stops white swings missing. Raid help (Improved
   Faerie Fire, a Draenei's Heroic Presence) would lower the cap further; the Buffs tab doesn't feed it yet. */
const precisionRank=()=>{const T=window.TalentKit;return T&&T.precision?T.precision():0;};
/* Improved Faerie Fire on the boss (the Buffs tab, buff-common.js) is +3% hit for melee and ranged attacks */
const buffHitPct=()=>{const B=window.BuffKit;return B&&B.hitPct?B.hitPct():0;};
const hitCap=()=>Math.ceil(Math.max(0,9-precisionRank()-buffHitPct())*15.7692);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const SLOTS=D.slots, SLOT=Object.fromEntries(SLOTS.map(s=>[s.key,s]));
const item=id=>id?D.items[id]||null:null;
const gem=id=>id?D.gems[id]||null:null;
const enchant=id=>id?D.enchants[id]||null:null;
const iconUrl=name=>name?ICON_DIR+name+".jpg":"";
const QV={Epic:"--q-epic",Rare:"--q-rare",Uncommon:"--q-unc",Legendary:"--q-leg"};
const qVar=q=>"var("+(QV[q]||"--ink")+")";

/* the ranked list a slot chooses from (the second ring and trinket share the first one's list) */
function listFor(slotKey){const s=SLOT[slotKey];return s?(D.lists[s.list]||[]).map(e=>Object.assign({},item(e.id),{rank:e.rank,note:e.note})):[];}
function rankOf(slotKey,itemId){const e=(D.lists[(SLOT[slotKey]||{}).list]||[]).find(x=>x.id===itemId);return e?e.rank:null;}
function listSize(slotKey){return (D.lists[(SLOT[slotKey]||{}).list]||[]).length;}
/* rings need Enchanting to enchant, so they are not counted as "missing an enchant" */
const enchantable=slotKey=>!!D.enchOpts[slotKey]&&!/^Finger/.test(slotKey);
const enchantOptions=slotKey=>enchantable(slotKey)?D.enchOpts[slotKey].ids.map(enchant).filter(Boolean):[];
const bestEnchant=slotKey=>enchantable(slotKey)?D.enchOpts[slotKey].best:null;

/* sockets: a gem fits any socket except meta, which only fits meta; the bonus needs every gem to match its socket */
const MATCH={Red:["Red","Orange","Purple"],Yellow:["Yellow","Orange","Green"],Blue:["Blue","Purple","Green"],Meta:["Meta"]};
const gemFits=(socket,g)=>!!g&&(socket==="Meta"?g.color==="Meta":g.color!=="Meta");
const gemMatches=(socket,g)=>!!g&&(MATCH[socket]||[]).includes(g.color);
/* gems that fit a socket, the ones matching its colour first (only those keep the socket bonus on) */
const gemOptions=socket=>Object.values(D.gems).filter(g=>gemFits(socket,g)).sort((a,b)=>((MATCH[socket]||[]).includes(b.color))-((MATCH[socket]||[]).includes(a.color)));
function socketBonusOn(slotState){
  const it=item(slotState&&slotState.item);if(!it||!it.sockets.length)return null;
  return it.sockets.every((s,i)=>gemMatches(s,gem(slotState.gems[i])));
}

/* presets */
const recommended=()=>clone(D.equip);
const empty=()=>Object.fromEntries(SLOTS.map(s=>[s.key,{item:null,enchant:null,gems:[]}]));
/* a raider halfway through Phase 2: a few slots still on lower-ranked items, one enchant and one gem missing,
   one red socket holding a blue gem (bonus off) — enough to show every status a design has to show */
function partGeared(){
  const g=recommended();
  const take=(slot,rank)=>{const l=listFor(slot);const it=l.find(x=>x.rank===rank)||l[l.length-1];
    g[slot]={item:it.id,enchant:bestEnchant(slot),gems:it.sockets.map(c=>D.gemFor[c]||D.gemFor.Red)};};
  take("Head",3);take("Chest",4);take("Legs",3);take("Main Hand",4);take("Feet",4);
  if(g.Hands)g.Hands.enchant=null;
  if(g.Waist&&g.Waist.gems.length)g.Waist.gems[g.Waist.gems.length-1]=null;
  /* a yellow gem in a red socket: it fits, but the socket bonus goes off */
  const ch=g.Chest;const it=item(ch.item);
  if(it){const r=it.sockets.indexOf("Red");if(r>=0)ch.gems[r]=D.gems["rigid-dawnstone"]?"rigid-dawnstone":D.gemFor.Yellow;}
  return g;
}

/* status of one slot, for designs that report it */
function status(slotKey,st){
  const s=st[slotKey];const it=item(s&&s.item);
  if(!it)return {empty:true,rank:null,best:false,upgrade:listFor(slotKey)[0]||null,noEnchant:false,emptySockets:0,bonusOff:false};
  const rank=rankOf(slotKey,it.id),list=listFor(slotKey);
  /* the second ring and trinket count as best when they hold the best item the first one leaves free */
  const other=slotKey.endsWith("2")?st[slotKey.replace("2","1")]:null;
  const free=list.filter(x=>!(other&&other.item===x.id));
  const top=free[0]||list[0];
  const best=!!top&&top.id===it.id;
  return {empty:false,rank,size:list.length,best,upgrade:best?null:top,
    noEnchant:enchantable(slotKey)&&!s.enchant,
    emptySockets:it.sockets.filter((_,i)=>!s.gems[i]).length,
    bonusOff:socketBonusOn(s)===false&&it.sockets.every((_,i)=>s.gems[i])};
}

/* totals from gear, gems and enchants (what this screen changes; talents, buffs and race are not here) */
const TOT=["Str","Agi","Sta","AP","Hit","Crit","Haste","Expertise","ArP"];
function totals(st){
  const t=Object.fromEntries(TOT.map(k=>[k,0]));const add=list=>(list||[]).forEach(([k,v])=>{if(k in t)t[k]+=v;});
  SLOTS.forEach(({key})=>{const s=st[key];const it=item(s&&s.item);if(!it)return;
    add(it.stats);const e=enchant(s.enchant);if(e)add(e.stats);
    s.gems.forEach(g=>{const x=gem(g);if(x)add(x.stats);});
    if(socketBonusOn(s))add(it.bonus);});
  return t;
}
function setCounts(st){const c={};SLOTS.forEach(({key})=>{const it=item(st[key]&&st[key].item);if(it&&it.set)c[it.set]=(c[it.set]||0)+1;});return c;}
const filledCount=st=>SLOTS.filter(({key})=>st[key]&&st[key].item).length;

/* the stat bar's hit row follows the gear (the other stat-bar numbers stay as imported) */
function updateHit(st){
  const hit=totals(st).Hit,row=document.getElementById("hitwarn"),cap=hitCap(),prec=precisionRank(),ff=buffHitPct();
  const parts=[prec?`${prec}% of it from Precision`:"",ff?`${ff}% from Improved Faerie Fire`:""].filter(Boolean);
  if(row){const b=row.querySelector("b"),spans=row.querySelectorAll("span");
    const diff=hit-cap,txt=diff<0?`${-diff} under`:diff>0?`${diff} over`:"exactly at the cap";
    if(spans[0])spans[0].textContent=`Hit cap for special attacks (9%${parts.length?", "+parts.join(", "):""})`;
    if(spans[1])spans[1].innerHTML=`<b>${hit} / ${cap}</b> rating · ${txt}`;else if(b)b.textContent=`${hit} / ${cap}`;}
  const g=document.querySelector(".statbar .gauge");
  if(g){g.setAttribute("aria-label",`Hit rating ${hit} of ${cap}`);const i=g.querySelector("i");if(i)i.style.width=Math.min(100,hit/cap*100).toFixed(1)+"%";}
  const K=window.TBCKit;if(K&&row)K.taint(row,hit<cap);
  const note=document.getElementById("statnote");
  const less=[prec?`${prec}% from Precision (Talents tab)`:"",ff?`${ff}% from Improved Faerie Fire (Buffs tab)`:""].filter(Boolean);
  if(note)note.textContent=`Hit rating follows the gear below (gear, gems and enchants). The cap is ${cap} rating: 9% hit${less.length?`, less ${less.join(" and ")}`:""}. Past the cap, extra hit still stops white swings missing. The other stats are from your import, 28 Sep.`;
  const setEl=document.querySelector(".charline .who .prov .q-epic");
  if(setEl){const n=setCounts(st)["destroyer-battlegear"]||0;setEl.textContent=`Destroyer Battlegear (${n}/5)`;}
  return hit;
}

/* game-style tooltip (our own markup and wording) */
const RATING={Hit:"Improves hit rating by",Crit:"Improves critical strike rating by",Haste:"Improves haste rating by",Expertise:"Increases your expertise rating by",AP:"Increases attack power by",ArP:"Your attacks ignore this much of your opponent's armor:"};
const PRIMARY={Str:"Strength",Agi:"Agility",Sta:"Stamina"};
function tooltipHTML(itemId,slotState,slotKey){
  const it=item(itemId);if(!it)return "";
  const L=[];
  L.push(`<b class="tt-name" style="color:${qVar(it.q)}">${esc(it.name)}</b>`);
  L.push(`<span class="tt-ilvl">Item Level ${it.ilvl}</span>`);
  if(it.unique)L.push(`<span>Unique</span>`);
  L.push(`<span class="tt-row"><span>${esc(slotKey?slotKey.replace(/ [12]$/,""):"")}</span><span>${esc(it.weapon||"")}</span></span>`);
  if(it.dmg)L.push(`<span class="tt-row"><span>${it.dmg[0]} - ${it.dmg[1]} Damage</span><span>Speed ${Number(it.speed).toFixed(2)}</span></span>`);
  it.stats.filter(([k])=>PRIMARY[k]).forEach(([k,v])=>L.push(`<span>+${v} ${PRIMARY[k]}</span>`));
  const s=slotState&&slotState.item===itemId?slotState:null;
  if(s&&s.enchant){const e=enchant(s.enchant);if(e)L.push(`<span class="tt-green">${esc(e.name)}</span>`);}
  it.sockets.forEach((c,i)=>{const g=s?gem(s.gems[i]):null;
    L.push(g?`<span class="tt-gem"><img src="${iconUrl(g.icon)}" alt="" width="14" height="14"> ${esc(g.name)}</span>`:`<span class="tt-sock tt-${c.toLowerCase()}">${c} Socket</span>`);});
  if(it.bonus.length){const on=s?socketBonusOn(s):false;
    L.push(`<span class="${on?"tt-green":"tt-grey"}">Socket Bonus: ${it.bonus.map(([k,v])=>`+${v} ${PRIMARY[k]||k}`).join(", ")}</span>`);}
  it.stats.filter(([k])=>RATING[k]).forEach(([k,v])=>L.push(`<span class="tt-green">Equip: ${RATING[k]} ${v}.</span>`));
  if(it.set&&D.sets[it.set]){const set=D.sets[it.set],n=0;
    L.push(`<span class="tt-set">${esc(set.name)}</span>`);
    set.bonuses.forEach(([p,txt])=>L.push(`<span class="tt-grey">(${p}) Set: ${esc(txt)}</span>`));}
  const rank=slotKey?rankOf(slotKey,itemId):null;
  L.push(`<span class="tt-src">${esc(it.src.text)}${rank?` · rank ${rank} of ${listSize(slotKey)} on Wowhead's Fury list`:""}</span>`);
  return `<span class="tt">${L.join("")}</span>`;
}

/* shared tooltip styling; each design positions it */
function css(){
  if(document.getElementById("gear-common-css"))return;
  const st=document.createElement("style");st.id="gear-common-css";
  st.textContent=`.tt{display:grid;gap:2px;font:400 12.5px/1.35 var(--f-body);color:#fff;min-width:220px;max-width:300px}
.tt-name{font-size:14px;font-weight:700}.tt-ilvl{color:#ffd100}.tt-row{display:flex;justify-content:space-between;gap:12px}
.tt-green{color:#1eff00}.tt-grey{color:#9d9d9d}.tt-set{color:#ffd100;margin-top:4px}.tt-src{color:#a9c6c4;margin-top:6px;font-size:11.5px}
.tt-gem{display:flex;gap:6px;align-items:center}.tt-gem img{border-radius:2px}
.tt-sock{display:flex;gap:6px;align-items:center;color:#9d9d9d}.tt-sock::before{content:"";width:10px;height:10px;border-radius:2px;border:1.5px solid currentColor}
.tt-red::before{border-color:#ff5050}.tt-yellow::before{border-color:#ffd100}.tt-blue::before{border-color:#4ba3ff}.tt-meta::before{border-color:#ddd;border-radius:50%}
.gemdot{display:inline-block;width:9px;height:9px;border-radius:50%;border:1.5px solid rgba(255,255,255,.5);vertical-align:middle}
.gemdot.Red{background:#e0413f}.gemdot.Yellow{background:#e8c13a}.gemdot.Blue{background:#3f7fe0}.gemdot.Orange{background:#e88a2c}.gemdot.Purple{background:#9b55d6}.gemdot.Green{background:#3fb350}.gemdot.Meta{background:#e9e9ef;border-radius:2px;transform:rotate(45deg)}
.gemdot.none{background:none;border-style:dashed}
.nm{border-style:dashed!important;opacity:.78}.nm::after{content:"no bonus";font:600 9px var(--f-mono);text-transform:uppercase;letter-spacing:.05em;opacity:.75;margin-left:2px}`;
  (document.head||document.documentElement).appendChild(st);
}
const GEMCOLOR={Red:"Red",Yellow:"Yellow",Blue:"Blue",Orange:"Orange",Purple:"Purple",Green:"Green",Meta:"Meta"};
function gemDots(slotState){
  const it=item(slotState&&slotState.item);if(!it)return "";
  return it.sockets.map((c,i)=>{const g=gem(slotState.gems[i]);
    return `<i class="gemdot ${g?GEMCOLOR[g.color]||"":"none"}" title="${esc(g?g.name:c+" socket, empty")}" aria-hidden="true"></i>`;}).join("");
}

/* state, kept for the browser session per design */
/* one store per key; a page can set window.GEAR_STORE_KEY so several views share one character. Every set()
   fires "gear:change" (detail.from = who changed it) so the other views on the page redraw. */
const STORES={};
function store(key){
  key=window.GEAR_STORE_KEY||key;
  if(STORES[key])return STORES[key];
  const K="pd-gear-"+key;
  let st=null;try{const raw=sessionStorage.getItem(K);if(raw){const v=JSON.parse(raw);if(v&&SLOTS.every(s=>v[s.key]))st=v;}}catch(e){}
  if(!st)st=recommended();
  return STORES[key]={get:()=>st,set:(v,from)=>{st=v;try{sessionStorage.setItem(K,JSON.stringify(st));}catch(e){}
    document.dispatchEvent(new CustomEvent("gear:change",{detail:{from:from||""}}));return st;}};
}
/* what still needs doing in a slot (the checklist's "to do") */
const todo=(slotKey,st)=>{const x=status(slotKey,st);return x.empty||!x.best||x.noEnchant||!!x.emptySockets||x.bonusOff;};

css();
window.GearKit={D,SLOTS,SLOT,item,gem,enchant,iconUrl,qVar,esc,clone,listFor,rankOf,listSize,enchantable,enchantOptions,bestEnchant,
  gemFits,gemMatches,gemOptions,socketBonusOn,recommended,empty,partGeared,status,todo,totals,setCounts,filledCount,updateHit,tooltipHTML,gemDots,store,hitCap,
  get HIT_CAP(){return hitCap();}};
})();
