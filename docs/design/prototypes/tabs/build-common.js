/* build-common.js — shared logic for the three Build designs (build-a/b/c.html), over the Gear, Talents and Buffs tabs'
   shared stores. A build here is the live app's own saved build (version 1, src/domain/builds/buildTypes.ts), so:
   - the share link is the app's: the live site's address + #build=1.<the build without savedAt, deflated, base64url>
     (src/domain/builds/shareLink.ts). It opens the same character in the live app.
   - the build text is the app's "Copy build text" (pretty JSON), and pasting a link or build text back loads it here
   - the in-game addon's /pdexport string is read the way the app reads it (src/domain/builds/addonImport.ts): game
     slot numbers, item ids, enchant effect ids, gem item ids and talents as [id, tree, row, column, rank]
   - this prototype only knows the items on Wowhead's Fury Warrior Phase 2 list, so anything else is reported, never
     guessed, and a build for another class is refused
   - named saves stay in this browser (localStorage), like the app's "Saved builds"
   Loading a build sets the Gear, Talents and Buffs tabs; the Buffs tab switches to "By hand" so the raid doesn't
   overwrite what the build says. */
(function(){
"use strict";
const G=window.GearKit,T=window.TalentKit,B=window.BuffKit;if(!G||!T||!B)return;
const GS=G.store("planner"),TS=T.store("planner"),BS=B.store("planner");

const LIVE="https://josephevenson08.github.io/project-defeat/";
const VERSION=1;
/* the planner's character, and the app's one fixed target (src/domain/simulation/sampleEncounters.ts) */
const CHARACTER={faction:"Alliance",race:"Human",className:"Warrior",spec:"Fury"};
const TARGET={id:"generic-phase-2-raid-boss",name:"Generic Phase 1/2 Raid Boss (Level 73)",level:73,armor:7700};
/* the game's inventory slot numbers, as the addon writes them (addonImport.ts SLOT_BY_ID; 18 is Ranged for a Warrior) */
const SLOT_ID={"Head":1,"Neck":2,"Shoulders":3,"Chest":5,"Waist":6,"Legs":7,"Feet":8,"Wrists":9,"Hands":10,"Finger 1":11,"Finger 2":12,
  "Trinket 1":13,"Trinket 2":14,"Back":15,"Main Hand":16,"Off Hand":17,"Ranged":18};
const SLOT_OF=Object.fromEntries(Object.entries(SLOT_ID).map(([k,v])=>[v,k]));
const DEBUFF=new Set(B.D.debuffs.map(d=>d.id));
const esc=G.esc;

/* ---------- the build as the app saves it (the planner's gear, or another gear set with its talents and buffs) ---------- */
function snapshot(gearState){
  const st=gearState||GS.get(),gear={};
  G.SLOTS.forEach(({key})=>{const s=st[key];if(!s||!s.item)return;
    gear[key]=Object.assign({itemId:s.item,gemIds:s.gems.map(g=>g||"")},s.enchant?{enchantId:s.enchant}:{});});
  const b=BS.get(),on=b.on.filter(id=>B.BY[id]);
  const points={};Object.entries(TS.get()).forEach(([id,n])=>{if(n>0)points[id]=n;});
  return {version:VERSION,savedAt:new Date().toISOString(),character:Object.assign({},CHARACTER),gear,
    activeBuffIds:on.filter(id=>!DEBUFF.has(id)),activeConsumableIds:Object.values(b.cons).filter(Boolean),
    activeTargetDebuffIds:on.filter(id=>DEBUFF.has(id)),talentPoints:points,target:Object.assign({},TARGET)};
}
const textOf=build=>JSON.stringify(build,null,2);

/* ---------- the share link (the app's encoding exactly) ---------- */
function b64url(bytes){let s="";for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function unb64url(t){if(!/^[A-Za-z0-9_-]*$/.test(t))throw new Error("not base64url");
  const bin=atob(t.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-t.length%4)%4));return Uint8Array.from(bin,c=>c.charCodeAt(0));}
const pipe=(bytes,tx)=>new Response(new Blob([bytes]).stream().pipeThrough(tx)).arrayBuffer().then(b=>new Uint8Array(b));
async function linkFor(build){
  const stable=Object.assign({},build);delete stable.savedAt;
  const json=new TextEncoder().encode(JSON.stringify(stable));
  const value=typeof CompressionStream==="undefined"?"0."+b64url(json):"1."+b64url(await pipe(json,new CompressionStream("deflate")));
  return LIVE+"#build="+value;
}
async function readLink(text){
  const m=text.match(/#?build=([0-9]\.[A-Za-z0-9_-]+)/)||text.match(/^([01]\.[A-Za-z0-9_-]+)$/);
  if(!m)return null;
  const [enc,payload]=[m[1].slice(0,1),m[1].slice(2)];
  try{const bytes=unb64url(payload);const json=enc==="1"?await pipe(bytes,new DecompressionStream("deflate")):bytes;
    return {ok:true,raw:JSON.parse(new TextDecoder().decode(json))};}
  catch(e){return {ok:false,error:"That build link could not be read: it looks cut off or altered."};}
}

/* ---------- checking a build against what this prototype knows ---------- */
function check(raw){
  if(!raw||typeof raw!=="object")return {ok:false,error:"That isn't a build."};
  if(raw.version!==VERSION)return {ok:false,error:`Unsupported build version ${String(raw.version)}. This planner reads version ${VERSION}.`};
  const ch=raw.character||{};
  if(ch.className!=="Warrior")return {ok:false,error:`That build is a ${ch.spec||""} ${ch.className||"character"}. This prototype only plans a Fury Warrior; the live app plans every class.`.replace("  "," ")};
  const issues=[],gear={};
  Object.entries(raw.gear||{}).forEach(([slot,s])=>{
    if(!G.SLOT[slot]){issues.push(`Ignored unknown gear slot "${slot}".`);return;}
    const it=G.item(s&&s.itemId);
    if(!it){issues.push(`${slot}: "${s&&s.itemId}" isn't on Wowhead's Fury Phase 2 list, which is all this prototype carries, so the slot was left empty.`);return;}
    const enchant=s.enchantId&&G.D.enchants[s.enchantId]?s.enchantId:null;
    if(s.enchantId&&!enchant)issues.push(`${slot}: enchant "${s.enchantId}" isn't in this prototype, so it was left off.`);
    const gems=it.sockets.map((_,i)=>{const g=(s.gemIds||[])[i];if(g&&!G.gem(g)){issues.push(`${slot}: gem "${g}" isn't in this prototype, so that socket was left empty.`);return null;}return g||null;});
    gear[slot]={item:it.id,enchant,gems};
  });
  const points={};Object.entries(raw.talentPoints||{}).forEach(([id,n])=>{if(T.BY[id]&&typeof n==="number"&&n>0)points[id]=Math.min(n,T.BY[id].max);else if(!T.BY[id])issues.push(`A talent this planner doesn't know (id ${id}) was skipped.`);});
  const ids=[...(raw.activeBuffIds||[]),...(raw.activeTargetDebuffIds||[])];
  const unknown=ids.filter(id=>!B.BY[id]);if(unknown.length)issues.push(`${unknown.length} buff${unknown.length===1?"":"s"} this planner doesn't count ${unknown.length===1?"was":"were"} left off.`);
  const cons=(raw.activeConsumableIds||[]).filter(id=>B.CON[id]);
  return {ok:true,issues,parts:{gear,points,buffs:ids.filter(id=>B.BY[id]),cons},spec:ch.spec||"Fury"};
}

/* ---------- the in-game addon's export ---------- */
function fromAddon(d){
  if(d.formatVersion!==1)return {ok:false,error:`That export is format version ${String(d.formatVersion)}; this planner reads version 1.`};
  if(String(d.class).toUpperCase()!=="WARRIOR")return {ok:false,error:`That export is a ${String(d.race||"")} ${String(d.class||"").toLowerCase()}. This prototype only plans a Fury Warrior; the live app reads every class.`};
  const issues=[],gear={};
  (Array.isArray(d.gear)?d.gear:[]).forEach(p=>{
    const slot=SLOT_OF[p&&p.slot];if(!slot)return;
    const it=Object.values(G.D.items).find(x=>x.w===p.item);
    if(!it){issues.push(`${slot}: item ${p.item} isn't on Wowhead's Fury Phase 2 list, which is all this prototype carries, so the slot was left empty.`);return;}
    const s={itemId:it.id,gemIds:[]};
    if(p.enchant>0){const e=Object.values(G.D.enchants).find(x=>x.fx===p.enchant&&G.enchantOptions(slot).some(o=>o.id===x.id));
      if(e)s.enchantId=e.id;else issues.push(`${slot}: enchant ${p.enchant} isn't in this prototype, so it was left off.`);}
    s.gemIds=(Array.isArray(p.gems)?p.gems:[]).map(w=>{if(!w)return "";const g=Object.values(G.D.gems).find(x=>x.w===w);
      if(!g){issues.push(`${slot}: gem ${w} isn't in this prototype, so that socket was left empty.`);return "";}return g.id;});
    gear[slot]=s;
  });
  const points={},byTree=[0,0,0];
  (Array.isArray(d.talents)?d.talents:[]).forEach(t=>{const [id,tab,,,rank]=t;
    if(T.BY[id]){points[id]=rank;byTree[tab-1]+=rank;}else issues.push(`A talent the planner doesn't know (id ${id}) was skipped.`);});
  const max=Math.max(...byTree),top=byTree.filter(n=>n===max).length;
  const specs=T.TREES.map(t=>t.spec||t.name);
  const spec=max>0&&top===1?specs[byTree.indexOf(max)]:null;
  const raw={version:VERSION,character:{faction:d.faction||"Alliance",race:d.race||"Human",className:"Warrior",spec:spec||specs[0]},gear,
    activeBuffIds:[],activeConsumableIds:[],activeTargetDebuffIds:[],talentPoints:points,target:Object.assign({},TARGET)};
  const r=check(raw);if(!r.ok)return r;
  r.issues=issues.concat(r.issues);r.fromAddon=true;r.build=raw;
  if(!spec)r.specChoice={reason:max===0?"no-points":"even",candidates:specs.filter((_,i)=>byTree[i]===max||max===0)};
  return r;
}

/* one box, three formats: a link (or its #build= part), the build text, or the addon's export */
async function read(text){
  text=String(text||"").trim();if(!text)return {ok:false,error:"Paste a link, a build, or the addon's /pdexport string."};
  const link=await readLink(text);
  if(link){if(!link.ok)return link;const r=check(link.raw);if(r.ok){r.build=link.raw;r.kind="link";}return r;}
  let d;try{d=JSON.parse(text);}catch(e){return {ok:false,error:"That isn't a build link, build text or an addon export this planner can read."};}
  if(d&&d.format==="project-defeat-character"){const r=fromAddon(d);if(r.ok)r.kind="addon";return r;}
  const r=check(d);if(r.ok){r.build=d;r.kind="text";}return r;
}

/* put a checked build on the Gear, Talents and Buffs tabs */
function apply(r,from){
  const p=r.parts,gear={};
  G.SLOTS.forEach(({key})=>{gear[key]=p.gear[key]?G.clone(p.gear[key]):{item:null,enchant:null,gems:[]};});
  GS.set(gear,from||"build");
  TS.set(Object.assign({},p.points),from||"build");
  /* the addon reads what you wear and your talents, not your raid's buffs, so an export leaves the Buffs tab alone */
  if(r.fromAddon)return;
  const hand=document.querySelector('#bufui [data-src="hand"]');if(hand&&hand.getAttribute("aria-pressed")!=="true")hand.click();
  const st=B.empty?B.empty():B.clone(BS.get());
  st.on=p.buffs.filter(id=>!B.isBless(id));
  st.cons=Object.fromEntries(B.CATS.map(([k])=>[k,null]));p.cons.forEach(id=>{st.cons[B.CON[id].cat]=id;});
  st.pals=p.buffs.filter(id=>B.isBless(id)).map(id=>({bless:id,who:null}));
  BS.set(B.sync(st),from||"build");
}

/* ---------- what a build adds up to, for its card ---------- */
function summary(build){
  const st={};G.SLOTS.forEach(({key})=>{const s=(build.gear||{})[key];const it=s&&G.item(s.itemId);
    st[key]=it?{item:it.id,enchant:s.enchantId||null,gems:it.sockets.map((_,i)=>(s.gemIds||[])[i]||null)}:{item:null,enchant:null,gems:[]};});
  const items=G.SLOTS.map(({key})=>G.item(st[key].item)).filter(Boolean);
  const ilvl=items.length?Math.round(items.reduce((a,it)=>a+it.ilvl,0)/items.length):0;
  const sets=Object.entries(G.D.sets).map(([id,s])=>({name:s.name,n:items.filter(it=>it.set===id).length,of:s.pieces})).filter(x=>x.n);
  const pts=build.talentPoints||{},split=T.TREES.map(t=>(t.talents||[]).reduce((a,x)=>a+(pts[x.id]||0),0));
  const prec=pts[T.PRECISION]||0;
  const on=[...(build.activeBuffIds||[]),...(build.activeTargetDebuffIds||[])].filter(id=>B.BY[id]);
  const buffHit=on.reduce((a,id)=>a+(B.BY[id].hit||0),0)*100;
  const cap=Math.ceil(Math.max(0,9-prec-buffHit)*15.7692),hit=G.totals(st).Hit;
  const spec=(build.character&&build.character.spec)||"Fury";
  return {spec,icon:T.SPEC_ICON&&T.SPEC_ICON[spec],filled:items.length,ilvl,sets,split,hit,cap,buffs:on.length,
    cons:(build.activeConsumableIds||[]).filter(id=>B.CON[id]).length,items,st};
}

/* ---------- named saves in this browser ---------- */
const SAVES="pd-proto-builds";
const saves=()=>{try{const v=JSON.parse(localStorage.getItem(SAVES)||"[]");return Array.isArray(v)?v.filter(x=>x&&x.name&&x.build):[];}catch(e){return [];}};
const putSaves=list=>{try{localStorage.setItem(SAVES,JSON.stringify(list));return true;}catch(e){return false;}};
const MAX_NAME=40;
function save(name,build){name=String(name||"").trim().slice(0,MAX_NAME);if(!name)return null;
  const list=saves().filter(x=>x.name!==name);list.unshift({name,build});return putSaves(list)?name:null;}
function removeSave(name){putSaves(saves().filter(x=>x.name!==name));}

/* ---------- an example /pdexport, in the addon's real format, built from the Gear tab's part-geared example ---------- */
function exampleAddon(){
  const st=G.partGeared(),gear=[];
  G.SLOTS.forEach(({key})=>{const s=st[key],it=G.item(s&&s.item);if(!it)return;
    const e=G.enchant(s.enchant),p={slot:SLOT_ID[key],item:it.w};if(e&&e.fx)p.enchant=e.fx;
    const gems=s.gems.map(g=>{const x=G.gem(g);return x?x.w:0;});if(gems.some(Boolean))p.gems=gems;gear.push(p);});
  const pts=T.preset("Fury"),talents=[];
  T.TREES.forEach((t,ti)=>(t.talents||[]).forEach(x=>{if(pts[x.id])talents.push([x.id,ti+1,x.row+1,x.col+1,pts[x.id]]);}));
  return JSON.stringify({format:"project-defeat-character",formatVersion:1,addon:"1.0.0",client:"2.5.6",level:70,race:"Human",class:"WARRIOR",faction:"Alliance",talents,gear});
}

const openTab=()=>{const t=document.getElementById("t-build");if(t&&t.getAttribute("aria-selected")!=="true")t.click();};
/* the Gear tab's "Import your character" opens this tab; the paste box (#importbox in every design) takes the focus */
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#gx-import"))setTimeout(()=>{const b=document.getElementById("importbox");if(b)b.focus();},60);});
/* copy to the clipboard, saying so either way */
async function copy(text){try{await navigator.clipboard.writeText(text);return true;}catch(e){return false;}}

const css=document.createElement("style");
css.textContent=`
.bd-card{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;align-items:center;background:var(--scrim);border:1px solid var(--rim);border-radius:12px;padding:12px 14px}
.bd-card .ic{width:44px;height:44px;border-radius:8px;border:1.5px solid var(--glow);grid-row:span 2}
.bd-card h4{font:400 var(--t-lg) var(--f-head);margin:0}
.bd-facts{display:flex;flex-wrap:wrap;gap:5px;list-style:none;margin:0;padding:0}
.bd-facts li{font:500 var(--t-xs) var(--f-mono);background:var(--glow-soft);border:1px solid var(--rim-2);border-radius:999px;padding:3px 9px}
.bd-facts li.warn{color:var(--warn);border-color:rgba(255,207,122,.35);background:var(--warn-soft)}
.bd-icons{display:flex;flex-wrap:wrap;gap:3px;grid-column:1/-1;margin-top:4px}
.bd-icons img{width:26px;height:26px;border-radius:4px;border:1.5px solid var(--q,var(--rim))}
.bd-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.bd-link{width:100%;font:500 var(--t-xs) var(--f-mono);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:8px;padding:8px 10px;min-height:38px}
.bd-box{width:100%;min-height:110px;font:500 var(--t-xs) var(--f-mono);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:8px;padding:8px 10px;resize:vertical}
.bd-name{font:600 var(--t-sm) var(--f-body);background:var(--glass-2);color:var(--ink);border:1px solid var(--rim);border-radius:8px;padding:7px 10px;min-height:38px;min-width:0;flex:1 1 180px}
.bd-issues{margin:6px 0 0;padding-left:18px;font-size:var(--t-sm);color:var(--ink-2)}
.bd-err{color:var(--warn)}
.bd-ex{display:inline-block;font:700 10px/1.4 var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--warn);border:1px solid rgba(255,207,122,.4);background:var(--warn-soft);border-radius:4px;padding:1px 6px;vertical-align:middle}
.bc2-rep{background:var(--scrim);border:1px solid var(--rim);border-radius:12px;padding:10px 12px;margin-top:10px}
.bc2-rep h4{font:400 var(--t-lg) var(--f-head);margin:0 0 6px}
.bc2-slots{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:3px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.bc2-slots li{display:grid;grid-template-columns:22px 26px minmax(0,1fr);gap:0 8px;align-items:center;font-size:var(--t-sm);padding:3px 0;border-top:1px solid var(--rim-2)}
.bc2-slots li em{font-style:normal;font:600 9.5px var(--f-mono);color:var(--ink-3)}
.bc2-slots img{width:26px;height:26px;border-radius:4px;border:1.5px solid var(--q,var(--rim))}
.bc2-slots .gap{color:var(--warn);font-size:var(--t-xs);grid-column:3}
.bc2-slots .none{color:var(--ink-3)}
.bc2-ask{background:var(--warn-soft);border:1px solid rgba(255,207,122,.35);border-radius:10px;padding:8px 10px;margin:8px 0 0}
.bc2-sm{font:600 var(--t-xs) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink);border-radius:999px;padding:7px 12px;cursor:pointer;min-height:34px}
.bc2-sm:hover,.bc2-sm:focus-visible{border-color:var(--glow);color:var(--glow)}
.bc2-sm[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
@media (max-width:699px),(pointer:coarse){.bc2-sm,.bd-link,.bd-name,#bdui .btn{min-height:44px}#bdui summary{min-height:44px;display:flex;align-items:center;cursor:pointer}}`;
document.head.appendChild(css);

/* the card every design shows for a build */
function cardHTML(build,title){
  const s=summary(build),set=s.sets.map(x=>`${esc(x.name)} ${x.n}/${x.of}`).join(" · ");
  const capTxt=s.hit>=s.cap?`hit ${s.hit} / ${s.cap} (${s.hit-s.cap} over)`:`hit ${s.hit} / ${s.cap} (${s.cap-s.hit} under)`;
  return `<div class="bd-card">${s.icon?`<img class="ic" src="${G.iconUrl(s.icon)}" alt="">`:""}<h4>${esc(title||`${CHARACTER.race} ${s.spec} Warrior`)}</h4>
    <ul class="bd-facts"><li>${s.filled} of 17 slots</li><li>item level ${s.ilvl||"–"}</li><li>talents ${s.split.join(" / ")}</li><li class="${s.hit<s.cap?"warn":""}">${capTxt}</li><li>${s.buffs} buffs · ${s.cons} consumables</li>${set?`<li>${set}</li>`:""}</ul>
    <div class="bd-icons" aria-hidden="true">${s.items.map(it=>`<img src="${G.iconUrl(it.icon)}" alt="" style="--q:${G.qVar(it.q)}">`).join("")}</div></div>`;
}
/* the result of a load, in words */
function resultHTML(r){
  if(!r)return "";
  if(!r.ok)return `<p class="bd-err"><b>Nothing was changed.</b> ${esc(r.error)}</p>`;
  const what={link:"the link",text:"the build text",addon:"the addon's export"}[r.kind]||"the build";
  return `<p><b>Loaded from ${what}.</b> ${r.issues.length?`With ${r.issues.length} note${r.issues.length===1?"":"s"}:`:"Every slot resolved cleanly."}</p>`+
    (r.issues.length?`<ul class="bd-issues">${r.issues.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`:"");
}

/* (design C's report, used by the planner's Build tab too: picked 2026-10-10) */
/* what came in, slot by slot: the item, or why the slot is empty */
function reportHTML(r,spec){
  if(!r)return "";
  if(!r.ok)return `<div class="bc2-rep" aria-live="polite">${resultHTML(r)}</div>`;
  const p=r.parts,s=summary(r.build),what={link:"a build link",text:"build text",addon:"the addon's export"}[r.kind];
  const gapFor=slot=>(r.issues.find(i=>i.startsWith(slot+":"))||"").replace(slot+": ","");
  const rows=G.SLOTS.map(({key,glyph})=>{const g=p.gear[key],it=g&&G.item(g.item);
    if(it)return `<li><em>${glyph}</em><img src="${G.iconUrl(it.icon)}" alt="" style="--q:${G.qVar(it.q)}"><span style="color:${G.qVar(it.q)}">${esc(it.name)}</span></li>`;
    const why=gapFor(key);
    return `<li><em>${glyph}</em><span></span><span class="none">${esc(key)}: empty</span>${why?`<span class="gap">${esc(why)}</span>`:""}</li>`;}).join("");
  const others=r.issues.filter(i=>!G.SLOTS.some(({key})=>i.startsWith(key+":")));
  const filled=Object.keys(p.gear).length;
  let h=`<div class="bc2-rep" aria-live="polite"><h4>What came in</h4><p>Read from ${what}: <b>${filled} of 17 slots</b> worn, talents ${s.split.join(" / ")}${r.fromAddon?"":`, ${p.buffs.length} buffs and ${p.cons.length} consumables`}. ${r.issues.length?`${r.issues.length} note${r.issues.length===1?"":"s"}.`:"Everything resolved cleanly."} Nothing has changed yet.</p>`;
  if(r.specChoice&&!spec)h+=`<div class="bc2-ask"><p style="margin:0 0 6px">${r.specChoice.reason==="no-points"?"This character has spent no talent points, so the export can't say which spec it is.":"The talent points are evenly split, so the export can't say which spec this is."} Which is it?</p>
    <div class="bd-row" style="margin:0">${r.specChoice.candidates.map(c=>`<button type="button" class="bc2-sm" data-spec="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`;
  h+=`<ul class="bc2-slots" aria-label="Gear that came in">${rows}</ul>`;
  if(others.length)h+=`<ul class="bd-issues">${others.map(i=>`<li>${esc(i)}</li>`).join("")}</ul>`;
  if(r.fromAddon)h+=`<p class="prov" style="margin:8px 0 0">The addon reads what you wear and your talents, not your raid's buffs, so the Buffs tab keeps its own.</p>`;
  h+=`<div class="bd-row"><button type="button" class="btn magnet" data-act="wear"${r.specChoice&&!spec?" disabled":""}>Load into the planner</button><button type="button" class="bc2-sm" data-act="clear">Clear</button></div></div>`;
  return h;
}

window.BuildKit={G,T,B,GS,TS,BS,LIVE,CHARACTER,TARGET,snapshot,textOf,linkFor,read,apply,summary,saves,save,removeSave,MAX_NAME,
  exampleAddon,openTab,copy,cardHTML,resultHTML,reportHTML,esc};
})();
