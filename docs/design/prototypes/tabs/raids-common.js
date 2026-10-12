/* raids-common.js — shared by the three Raids designs (raids-a/b/c.js), over raid-data.js (gen-raid-data.mjs, the live
   app's own raid data). It keeps the page shell every design shares:
   - the raid picker in the hero: re-lights the scene for the raid and keeps the choice in the URL hash (#raid/boss);
   - the loot search across all five raids, whose results open a drop where it drops;
   - game-style item tooltips (our own markup and wording; the icons are the files the live app ships);
   - the Motion toggle, the intro and the rise of new panels.
   A design calls RaidKit.start({render(raid, ctx), annotate(i), open(raidId, bossId, i), sub(raid)}) once; sub names what
   follows the raid in the hash after a raid change (design A: the boss it shows). */
(function(){
"use strict";
const D=window.RAID_DATA;
if(!D){console.warn("raids-common.js: raid-data.js is missing");return;}
const $=(s,r=document)=>r?r.querySelector(s):null, $$=(s,r=document)=>r?Array.from(r.querySelectorAll(s)):[];
const on=(el,ev,fn,o)=>{if(el)el.addEventListener(ev,fn,o);};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const plural=(n,one,many)=>n+" "+(n===1?one:(many||one+"s"));
const root=document.documentElement, live=$("#live");
let sayT=0;
const say=t=>{if(!live)return;clearTimeout(sayT);live.textContent="";sayT=setTimeout(()=>{live.textContent=t;},40);};
const store={get(k){try{return sessionStorage.getItem(k);}catch(e){return null;}},set(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}};

/* ---------- data ---------- */
const RAIDS=D.raids, ITEMS=D.items, LISTS=D.lists, BUILDS=D.builds;
/* the app's own files: public/ in the repo, beside /prototypes/ on the published site */
const PUB=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/":"../../";
const iconUrl=n=>n?PUB+"icons/"+n+".jpg":"";
const raidArt=id=>PUB+"raids/"+id+".jpg";
const bossArt=id=>PUB+"raids/bosses/"+id+".jpg";
const raid=id=>RAIDS.find(r=>r.id===id)||null;
const boss=(r,id)=>r&&r.bosses.find(b=>b.id===id)||null;
const drops=r=>r.bosses.reduce((n,b)=>n+b.loot.length,0)+r.trash.length;
/* where each item drops (a recipe can drop from several bosses) */
const WHERE=ITEMS.map(()=>[]);
RAIDS.forEach(r=>{r.bosses.forEach(b=>b.loot.forEach(i=>WHERE[i].push({r,b})));r.trash.forEach(i=>WHERE[i].push({r,b:null}));});
const shortRaid=r=>r.id==="tempest-keep"?"Tempest Keep":r.n;
const whereText=i=>WHERE[i].map(w=>(w.b?w.b.n:"Trash")+", "+shortRaid(w.r)).filter((v,k,a)=>a.indexOf(v)===k).join(" · ");
/* Wowhead's lists, one per spec */
const FURY=LISTS.findIndex(l=>l.key==="Warrior|Fury");
const listName=li=>{const l=LISTS[li];return l?`${l.spec} ${l.cls}`:"";};
const listIcon=li=>{const b=BUILDS.find(x=>x.list===li);return b?b.icon:"";};
const rankIn=(i,li)=>{const r=ITEMS[i]&&ITEMS[i].r;if(!r)return null;const e=r.find(x=>x[0]===li);return e?{rank:e[1],slot:e[2],note:e[3]}:null;};
const CLASS_COL={Druid:"#ff7d0a",Hunter:"#abd473",Mage:"#69ccf0",Paladin:"#f58cba",Priest:"#ffffff",Rogue:"#fff569",Shaman:"#2a8cff",Warlock:"#9482c9",Warrior:"#c79c6e"};
/* the "Loot for" spec, shared by every design for the browser session; the planner's character (Fury Warrior) by default */
const LI_KEY="pd-raids-li";
let li=(()=>{const v=store.get(LI_KEY);if(v==="all")return -1;const n=v==null?FURY:+v;return LISTS[n]?n:FURY;})();
const getLi=()=>li;
function setLi(v){li=v;store.set(LI_KEY,v<0?"all":String(v));}
function specOptions(sel,withAll){
  const byCls={};LISTS.forEach((l,i)=>{(byCls[l.cls]=byCls[l.cls]||[]).push([i,l]);});
  return (withAll?`<option value="-1"${sel<0?" selected":""}>Every spec</option>`:"")+
    Object.keys(byCls).sort().map(c=>`<optgroup label="${esc(c)}">`+byCls[c].map(([i,l])=>`<option value="${i}"${i===sel?" selected":""}>${esc(l.spec)} ${esc(c)}</option>`).join("")+`</optgroup>`).join("");
}

/* ---------- what a drop is ---------- */
const QN={e:"Epic",r:"Rare",u:"Uncommon",l:"Legendary"};
const KIND={t:"Tier token",s:"Set piece · from a token",r:"Recipe",m:"Mount",x:"Trash drop"};
const kindLabel=x=>x.k==="q"?(x.q?"Quest reward":"Quest item"):(KIND[x.k]||"");
const slotName=s=>s?s.replace(/ [12]$/,""):"";
/* tokens, set pieces, quest items and mounts first, then gear, recipes last; the data's own order inside each */
const KORD={t:0,s:1,q:2,m:3,"":4,x:4,r:9};
const sortLoot=ids=>ids.map((i,k)=>[i,k]).sort((a,b)=>(KORD[ITEMS[a[0]].k]-KORD[ITEMS[b[0]].k])||a[1]-b[1]).map(p=>p[0]);
const WHITE=/(Strength|Agility|Stamina|Intellect|Spirit|Armor)$/;
/* the app's stat line ("+33 Agility, +66 Attack Power, +66 Ranged AP") as tooltip lines; Ranged AP that only mirrors
   Attack Power is the catalogue's bookkeeping, not a line on the item */
function statLines(x){
  if(!x.st)return [];
  const parts=x.st.split(", "),ap=parts.find(p=>/ Attack Power$/.test(p));
  return parts.filter(p=>!(ap&&/ Ranged AP$/.test(p)&&p.split(" ")[0]===ap.split(" ")[0]))
    .map(p=>/ Armor$/.test(p)?{t:p.replace(/^\+/,""),w:1}:{t:p,w:WHITE.test(p)});
}
const QC={e:"var(--q-epic)",r:"var(--q-rare)",u:"var(--q-unc)",l:"var(--q-leg)"};
function tipHTML(i,opt){
  opt=opt||{};const x=ITEMS[i],L=[];
  L.push(`<b class="tt-name" style="color:${QC[x.q]||"#d9e2e1"}">${esc(x.n)}</b>`);
  if(x.ilvl)L.push(`<span class="tt-ilvl">Item Level ${x.ilvl}</span>`);
  if(x.uq)L.push(`<span>Unique</span>`);
  if(x.slot||x.at||x.wt)L.push(`<span class="tt-row"><span>${esc(slotName(x.slot))}</span><span>${esc(x.wt||x.at||"")}</span></span>`);
  if(x.dmg)L.push(`<span class="tt-row"><span>${x.dmg[0]} - ${x.dmg[1]} Damage</span><span>Speed ${Number(x.dmg[2]).toFixed(2)}</span></span>`);
  statLines(x).forEach(s=>L.push(`<span class="${s.w?"":"tt-green"}">${esc(s.t)}</span>`));
  (x.sock||[]).forEach(c=>L.push(`<span class="tt-sock tt-${esc(c.toLowerCase())}">${esc(c)} Socket</span>`));
  if(x.sb)L.push(`<span class="tt-grey">Socket Bonus: ${esc(x.sb)}</span>`);
  const k=kindLabel(x);if(k)L.push(`<span class="tt-kind">${esc(k)}</span>`);
  if(!x.q)L.push(`<span class="tt-grey">Not in the item catalogue, so listed by name only.</span>`);
  if(x.note&&opt.note!==false)L.push(`<span class="tt-note">${esc(x.note)}</span>`);
  const w=whereText(i);if(w)L.push(`<span class="tt-src">${esc(w)}</span>`);
  if(x.r){
    const mine=opt.li>=0?x.r.find(e=>e[0]===opt.li):null;
    const rest=x.r.filter(e=>e!==mine).slice(0,mine?3:4).map(e=>`${esc(listName(e[0]))} #${e[1]}`);
    const more=x.r.length-(mine?1:0)-rest.length;
    L.push(`<span class="tt-rank">${mine?`<b>#${mine[1]} on the ${esc(listName(mine[0]))} list</b> (${esc(slotName(mine[2]))}${mine[3]?", "+esc(mine[3]):""})<br>`:""}`+
      `On ${plural(x.r.length,"Wowhead Phase 2 list")}${rest.length?": "+rest.join(", ")+(more>0?`, and ${more} more`:""):""}</span>`);
  }else if(x.q&&!x.k)L.push(`<span class="tt-grey">On no spec's Wowhead Phase 2 list.</span>`);
  return `<span class="tt">${L.join("")}</span>`;
}
/* an item's icon in its quality frame */
const iconHTML=(i,size)=>{const x=ITEMS[i];size=size||36;
  return `<span class="rk-ic q-${x.q||"n"}" style="--s:${size}px">${x.ic?`<img src="${iconUrl(x.ic)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`:""}</span>`;};
const rankHTML=(i,l)=>{const r=rankIn(i,l);if(!r)return "";
  return `<span class="rk-rank${r.rank===1?" r1":""}" title="Rank ${r.rank} on Wowhead's ${esc(listName(l))} list (${esc(slotName(r.slot))})">#${r.rank}<span class="sr"> on the ${esc(listName(l))} list</span></span>`;};
const specIconHTML=(bOrLi,size,extra)=>{size=size||22;
  const b=typeof bOrLi==="number"?BUILDS.find(x=>x.list===bOrLi):bOrLi;if(!b)return "";
  return `<img class="rk-spec" src="${iconUrl(b.icon)}" alt="" width="${size}" height="${size}" loading="lazy" style="--cc:${CLASS_COL[b.cls]||"#888"}"${extra||""}>`;};

/* ---------- floating tooltip: hover or focus on anything with data-tip="<item index>"; a tap on touch screens ---------- */
const tip=document.createElement("div");tip.id="rk-tip";tip.setAttribute("role","tooltip");tip.hidden=true;document.body.appendChild(tip);
let tipFor=null;
function placeTip(el){
  if(innerWidth<700){tip.classList.add("sheet");tip.style.left=tip.style.top="";return;}
  tip.classList.remove("sheet");
  const r=el.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;
  let x=r.right+12;if(x+w>innerWidth-8)x=r.left-w-12;
  let y=r.top-4;
  if(x<8){x=Math.max(8,Math.min(innerWidth-w-8,r.left));y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;}
  y=Math.max(8,Math.min(innerHeight-h-8,y));
  tip.style.left=Math.round(x)+"px";tip.style.top=Math.round(y)+"px";
}
function showTip(el){const i=+el.dataset.tip;if(!(i>=0)||!ITEMS[i])return;tipFor=el;tip.innerHTML=tipHTML(i,{li});tip.hidden=false;placeTip(el);}
function hideTip(){if(!tip.hidden)tip.hidden=true;tipFor=null;}
const tipEl=t=>t&&t.closest?t.closest("[data-tip]"):null;
on(document,"pointerover",e=>{if(e.pointerType==="touch")return;const el=tipEl(e.target);if(el){if(el!==tipFor)showTip(el);}else if(tipFor&&tipFor!==document.activeElement)hideTip();});
on(document,"focusin",e=>{const el=tipEl(e.target);if(el)showTip(el);else hideTip();});
on(document,"pointerdown",e=>{if(e.pointerType!=="touch")return;const el=tipEl(e.target);if(!el)hideTip();else if(el!==tipFor)showTip(el);});
on(window,"scroll",()=>{if(tipFor&&innerWidth>=700)hideTip();},{passive:true});
on(document,"keydown",e=>{if(e.key==="Escape")hideTip();});

/* ---------- scene: the light follows the raid (tbc-kit.js theme when the kit built its 3D extras, else the legacy mix) ---------- */
const SC=window.SCENE||{cam:{},mix:{},setMotion(){},render(){},pointer(){}};
if(SC.mix&&SC.mix.charge===undefined)SC.mix.charge=0;
const KIT=window.TBCKit||null, KIT3D=!!(KIT&&KIT.ok);
const G=typeof gsap!=="undefined", ST=G&&typeof ScrollTrigger!=="undefined", SPL=G&&typeof SplitText!=="undefined";
const RMQ=matchMedia("(prefers-reduced-motion: reduce)");
const M={on:false};
const moving=()=>!RMQ.matches&&(G?M.on:true);
const THEME={"serpentshrine-cavern":"ssc","tempest-keep":"tk","magtheridons-lair":"hellfire","gruuls-lair":"bladesedge","karazhan":"karazhan"};
const look=r=>r.ph===1?{raid:"p1",phase:"1",tk:0,warm:1}:r.id==="tempest-keep"?{raid:"tk",phase:"2",tk:1,warm:0}:{raid:"ssc",phase:"2",tk:0,warm:0};
function relight(r,instant){
  const L=look(r);root.dataset.raid=L.raid;root.dataset.phase=L.phase;
  instant=instant||!M.on;
  if(KIT3D){if(SC.mix){SC.mix.warm=0;SC.mix.charge=0;}KIT.theme(THEME[r.id]||"ssc",{instant});return;}
  if(KIT)KIT.theme(THEME[r.id]||"ssc",{instant:true});
  if(!SC.mix)return;
  if(!instant&&G)safe(gsap.timeline().to(SC.mix,{tk:L.tk,warm:L.warm,duration:.9,ease:"power2.inOut",onUpdate:SC.render},0)
    .to(SC.mix,{charge:.6,duration:.25,ease:"power2.in",onUpdate:SC.render},0).to(SC.mix,{charge:0,duration:.8,ease:"power2.out",onUpdate:SC.render},.25));
  else{if(G)gsap.killTweensOf(SC.mix);SC.mix.tk=L.tk;SC.mix.warm=L.warm;SC.mix.charge=0;if(SC.render)SC.render();}
}

/* ---------- the shell ---------- */
const ui=$("#raidui"), raidBtns=$$("#rpick button[data-raid]");
const K={cur:null,design:null};
function parseHash(){const h=decodeURIComponent((location.hash||"").slice(1)).split("/");return {id:raid(h[0])?h[0]:null,sub:h[1]||null};}
function setHash(id,sub){try{history.replaceState(null,"","#"+id+(sub?"/"+sub:""));}catch(e){}}
function select(id,opts){
  opts=opts||{};const r=raid(id);if(!r||!ui||!K.design)return;
  const changed=K.cur!==id;K.cur=id;
  raidBtns.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.raid===id)));
  if(changed||opts.force)relight(r,!!opts.initial);
  hideTip();
  K.design.render(r,{sub:opts.sub||null,item:opts.item==null?null:opts.item,user:!!opts.user,changed,initial:!!opts.initial});
  if(opts.user){
    setHash(id,opts.sub||(K.design.sub?K.design.sub(r):null));
    if(changed)say(`${r.n} selected: ${plural(r.bosses.length,"boss","bosses")}, ${plural(drops(r),"drop")}${r.ch?", attunement "+r.ch.n:", no attunement"}.`);
    if(changed&&M.on)rise(ui);
  }
}
raidBtns.forEach(b=>on(b,"click",()=>{if(SR.active)clearSearch(true);select(b.dataset.raid,{user:true});}));
on(window,"hashchange",()=>{const h=parseHash();if(h.id)select(h.id,{sub:h.sub});});

/* ---------- loot search across all five raids ---------- */
const sBox=$("#lsearch"), sIn=$("#lq"), sX=$("#lqx");
const SR={active:false,q:"",t:0,a:0};
let res=null;
function hl(name,q){const lc=name.toLowerCase();let i=0,j,out="";
  while((j=lc.indexOf(q,i))>-1){out+=esc(name.slice(i,j))+"<mark>"+esc(name.slice(j,j+q.length))+"</mark>";i=j+q.length;}
  return out+esc(name.slice(i));}
function announce(t){clearTimeout(SR.a);SR.a=setTimeout(()=>say(t),400);}
function runSearch(raw){
  const q=raw.trim().toLowerCase();
  if(sX)sX.hidden=!raw;
  if(q.length<2){if(SR.active){exitSearch();const r=raid(K.cur);announce("Search cleared. Showing "+(r?r.n:"the selected raid")+".");}return;}
  if(SR.active&&q===SR.q)return;
  let n=0,nr=0;
  const groups=RAIDS.map(r=>{
    const parts=r.bosses.map(b=>({b,ids:b.loot.filter(i=>ITEMS[i].n.toLowerCase().includes(q))})).concat([{b:null,ids:r.trash.filter(i=>ITEMS[i].n.toLowerCase().includes(q))}]).filter(p=>p.ids.length);
    const c=parts.reduce((m,p)=>m+p.ids.length,0);n+=c;if(c)nr++;
    return {r,parts,c};
  }).filter(g=>g.c);
  const ann=K.design.annotate||(()=>"");
  res.innerHTML=n?`<div class="rk-shead"><h2>${plural(n,"drop matches","drops match")} in ${plural(nr,"raid")}</h2><p class="prov">Searching all five raids · press a drop to open it where it drops · <kbd>Esc</kbd> clears</p></div>`+
    groups.map(g=>`<section class="box rk-sgroup" aria-label="${esc(g.r.n)}"><h2>${esc(g.r.n)} <small>Phase ${g.r.ph} · ${g.r.tier} · ${plural(g.c,"match","matches")}${g.r.id===K.cur?" · selected raid":""}</small></h2><div class="in">`+
      g.parts.map(p=>`<h3 class="rk-sboss">${esc(p.b?p.b.n:"Notable trash")}</h3><ul class="rk-hits">`+p.ids.map(i=>{const x=ITEMS[i];
        return `<li><button type="button" class="rk-hit" data-go="${esc(g.r.id)}|${esc(p.b?p.b.id:"")}|${i}" data-tip="${i}">${iconHTML(i,30)}<span class="rk-hn q-${x.q||"n"}">${hl(x.n,q)}</span><span class="rk-hm">${esc([slotName(x.slot),x.ilvl?"ilvl "+x.ilvl:"",kindLabel(x)].filter(Boolean).join(" · "))}</span></button>${ann(i)}</li>`;}).join("")+`</ul>`).join("")+
      `</div></section>`).join(""):
    `<div class="box rk-sempty"><div class="in"><p>No drops match “${esc(raw.trim())}”.</p><p>Try part of a name, such as “Trophy”, “Destroyer” or “Mongoose”.</p><button type="button" class="btn ghost" data-clear>Clear search</button></div></div>`;
  if(!SR.active){SR.active=true;ui.hidden=true;res.hidden=false;refreshST();}
  SR.q=q;
  if(M.on)rise(res,true);
  announce(n?`${plural(n,"drop matches","drops match")} in ${plural(nr,"raid")}.`:`No drops match ${raw.trim()}.`);
}
function exitSearch(){SR.active=false;SR.q="";if(res)res.hidden=true;if(ui)ui.hidden=false;refreshST();}
function clearSearch(keepFocus){if(!sIn)return;clearTimeout(SR.t);sIn.value="";if(sX)sX.hidden=true;exitSearch();if(!keepFocus)sIn.focus();}
function initSearch(){
  if(!sBox||!sIn||!ui)return;
  res=document.createElement("div");res.id="rk-search";res.hidden=true;res.setAttribute("aria-label","Search results");ui.after(res);
  sBox.hidden=false;
  on(sIn,"input",()=>{clearTimeout(SR.t);if(sX)sX.hidden=!sIn.value;SR.t=setTimeout(()=>runSearch(sIn.value),120);});
  on(sIn,"keydown",e=>{if(e.key==="Escape"&&sIn.value){e.preventDefault();clearSearch();}});
  on(sX,"click",()=>clearSearch());
  on(res,"click",e=>{
    if(e.target.closest("[data-clear]")){clearSearch();return;}
    const b=e.target.closest(".rk-hit");if(!b)return;
    const [rid,bid,i]=b.dataset.go.split("|");
    clearSearch(true);
    if(K.design.open)K.design.open(rid,bid||null,+i);else select(rid,{user:true,sub:bid||null,item:+i});
  });
  on(document,"keydown",e=>{
    if(e.key!=="/"||e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
    const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
    e.preventDefault();sIn.focus();sIn.select();
  });
  if(sIn.value)runSearch(sIn.value);
}

/* ---------- motion ---------- */
function safe(a){if(!a)return a;const ms=Math.max(1500,a.totalDuration()*1000+400);setTimeout(()=>{if(a.progress()<1&&!a.scrollTrigger)a.progress(1);},ms);return a;}
function refreshST(){if(M.on&&ST)ScrollTrigger.refresh();}
let ctx=null;
const A=fn=>ctx?ctx.add(fn):fn();
/* new panels rise into place; boxes marked data-enter open through the kit's small ring of light */
function rise(scope,quick){
  if(!M.on||RMQ.matches||!G||!scope)return;
  A(()=>{
    const boxes=$$(".box",scope).filter(b=>b.offsetParent&&b.getBoundingClientRect().top<innerHeight*1.15).slice(0,14);
    if(!boxes.length)return;
    safe(gsap.fromTo(boxes,{y:quick?14:36,autoAlpha:0},{y:0,autoAlpha:1,duration:quick?.3:.6,stagger:.04,ease:"expo.out",clearProps:"transform,opacity,visibility"}));
    if(KIT&&!quick)boxes.filter(b=>b.hasAttribute("data-enter")).forEach((b,i)=>KIT.enter(b,{delay:i*.05}));
  });
}
function splitHero(){
  const h=$("#h-raids");if(!h)return null;
  if(SPL)return SplitText.create(h,{type:"words",wordsClass:"w",mask:"words",aria:"auto"}).words;
  if(h.dataset.split)return null;
  h.dataset.split="1";h.setAttribute("aria-label",h.textContent.replace(/\s+/g," ").trim());
  const words=t=>t.split(/(\s+)/).map(w=>/^\s+$/.test(w)||!w?w:`<span class="w-mask" aria-hidden="true"><span class="w">${w}</span></span>`).join("");
  h.innerHTML=Array.from(h.childNodes).map(n=>n.nodeType===3?words(n.textContent):`<em>${words(n.textContent)}</em>`).join("");
  return $$("#h-raids .w");
}
function intro(){
  const words=splitHero();
  const tl=gsap.timeline({defaults:{ease:"power4.out"}});
  if(SC.cam)tl.fromTo(SC.cam,{intro:1},{intro:0,duration:1.4,ease:"expo.out"},0);
  tl.from("#scene, .fallback",{autoAlpha:0,duration:.8,ease:"power1.out"},0);
  if(words&&words.length)tl.from(words,{yPercent:115,rotate:7,duration:.7,stagger:.04},.1);
  if($("#rpick button"))tl.from("#rpick button",{y:14,scale:.85,autoAlpha:0,duration:.4,stagger:.07,ease:"back.out(2.6)"},.45);
  if($(".flavor .chip"))tl.from(".flavor .chip",{scale:.6,autoAlpha:0,duration:.35,ease:"back.out(3)"},.3);
  safe(tl);
  setTimeout(()=>rise(ui),350);
}
function scrollStory(){
  if(SC.cam)gsap.fromTo(SC.cam,{depth:0},{depth:1,ease:"none",immediateRender:false,scrollTrigger:{trigger:"main",start:"top top",end:"bottom bottom",scrub:.8}});
}
const tog=$("#mtoggle"), mstate=$("#mstate");
function label(v,why){if(tog)tog.setAttribute("aria-pressed",String(v));if(mstate)mstate.textContent=why||(v?"on":"off");}
function enable(first){
  if(M.on)return;M.on=true;root.classList.add("motion");SC.setMotion(true);
  ctx=gsap.context(()=>{if(first)intro();if(ST)scrollStory();});
  if(ST)ScrollTrigger.refresh();
  label(true);
}
function disable(){
  if(!M.on)return;
  gsap.globalTimeline.getChildren(false,true,true).forEach(t=>{if(t.scrollTrigger)return;if(t.repeat&&t.repeat()===-1)t.kill();else t.progress(1);});
  if(ctx){ctx.revert();ctx=null;}
  M.on=false;root.classList.remove("motion");
  if(SC.cam)Object.assign(SC.cam,{depth:0,dip:0,rise:0,dive:0,intro:0});
  {const r=raid(K.cur);if(r)relight(r,true);}
  if(SC.render)SC.render();
  label(false);SC.setMotion(false);
}
function initMotion(){
  if(matchMedia("(pointer:fine)").matches)on(window,"pointermove",e=>{if(moving())SC.pointer(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);},{passive:true});
  if(tog)tog.hidden=false;
  if(!G){if(tog)tog.disabled=true;label(false,"unavailable");const sync=()=>SC.setMotion(moving());if(RMQ.addEventListener)RMQ.addEventListener("change",sync);sync();return;}
  gsap.registerPlugin(...[ST&&ScrollTrigger,SPL&&SplitText].filter(Boolean));
  const stored=()=>{try{return localStorage.getItem("pd-motion");}catch(e){return null;}};
  const keep=v=>{try{localStorage.setItem("pd-motion",v?"1":"0");}catch(e){}};
  on(tog,"click",()=>{if(M.on){disable();keep(false);}else{enable(false);keep(true);}});
  const syncRM=()=>{if(RMQ.matches){disable();SC.setMotion(false);if(tog)tog.disabled=true;label(false,"off (reduced motion)");}else{if(tog)tog.disabled=false;label(M.on);}};
  if(RMQ.addEventListener)RMQ.addEventListener("change",syncRM);
  if(RMQ.matches)syncRM();else if(stored()==="0"){label(false);SC.setMotion(false);}else enable(true);
}

/* ---------- shared styles ---------- */
const css=document.createElement("style");
css.textContent=`
#raidui{position:relative;scroll-margin-top:70px}
.rk-ic{--s:36px;position:relative;flex:none;display:inline-block;width:calc(var(--s) + 4px);height:calc(var(--s) + 4px);border-radius:7px;border:2px solid #555;background:#0b1316;overflow:hidden;line-height:0;box-shadow:0 0 0 1px rgba(0,0,0,.6)}
.rk-ic img{width:var(--s);height:var(--s);display:block}
.rk-ic.q-e{border-color:var(--q-epic)}.rk-ic.q-r{border-color:var(--q-rare)}.rk-ic.q-u{border-color:var(--q-unc)}.rk-ic.q-l{border-color:var(--q-leg)}.rk-ic.q-n{border-color:#6f7c7c}
.rk-rank{display:inline-flex;align-items:center;font:600 11px/1 var(--f-mono);padding:3px 6px;border-radius:999px;border:1px solid var(--rim);color:var(--ink-2);background:var(--glass-2);white-space:nowrap}
.rk-rank.r1{color:var(--glow-ink);background:var(--glow);border-color:var(--glow)}
.rk-spec{display:block;border-radius:50%;border:2px solid var(--cc,#888);background:#000;box-sizing:content-box}
.rk-flash{animation:rkflash 1.6s ease-out 1}
@keyframes rkflash{0%,40%{box-shadow:0 0 0 2px var(--glow),0 0 24px -2px var(--glow)}100%{box-shadow:0 0 0 0 transparent}}
@media (prefers-reduced-motion:reduce){.rk-flash{animation:none;outline:2px solid var(--glow);outline-offset:2px}}
#rk-tip{position:fixed;z-index:60;pointer-events:none;background:linear-gradient(180deg,rgba(10,16,30,.97),rgba(4,8,18,.97));border:1px solid rgba(200,210,230,.45);border-radius:6px;padding:9px 11px;box-shadow:0 12px 40px -8px rgba(0,0,0,.9)}
#rk-tip.sheet{left:8px!important;right:8px;top:auto!important;bottom:8px;max-height:60vh;overflow:auto}
#rk-tip.sheet .tt{max-width:none}
.tt{display:grid;gap:2px;font:400 12.5px/1.38 var(--f-body);color:#fff;min-width:220px;max-width:310px}
.tt-name{font-size:14px;font-weight:700}.tt-ilvl{color:#ffd100}.tt-row{display:flex;justify-content:space-between;gap:12px}
.tt-green{color:#1eff00}.tt-grey{color:#9d9d9d}.tt-kind{color:#ffd100;margin-top:3px}.tt-note{color:#c8d3d2;font-size:11.5px;margin-top:4px}
.tt-src{color:#a9c6c4;margin-top:5px;font-size:11.5px}.tt-rank{color:#e8dcbc;margin-top:5px;font-size:11.5px;border-top:1px solid rgba(255,255,255,.12);padding-top:5px}
.tt-rank b{color:#ffd100}
.tt-sock{display:flex;gap:6px;align-items:center;color:#9d9d9d}.tt-sock::before{content:"";width:10px;height:10px;border-radius:2px;border:1.5px solid currentColor}
.tt-red{color:#ff6b6b}.tt-blue{color:#6ba8ff}.tt-yellow{color:#ffe36b}.tt-meta{color:#d8d8d8}
#rk-search{display:grid;gap:14px;margin:6px 0 0}
.rk-shead{padding:10px 14px;background:var(--scrim);border:1px solid var(--rim);border-radius:12px}
.rk-shead h2{margin:0;font:400 var(--t-xl)/1.2 var(--f-head)}.rk-shead p{margin:2px 0 0}
.rk-sgroup h2 small{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3)}
.rk-sboss{margin:8px 0 2px;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3)}
.rk-sboss:first-child{margin-top:0}
.rk-hits{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.rk-hits li{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rk-hit{flex:1 1 260px;min-width:0;display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 8px;border-radius:9px;border:1px solid transparent;background:none;color:var(--ink);font:inherit;text-align:left;cursor:pointer}
.rk-hit:hover,.rk-hit:focus-visible{background:var(--glow-soft);border-color:var(--rim)}
.rk-hn{font-weight:600;overflow-wrap:anywhere}.rk-hm{margin-left:auto;font-size:var(--t-xs);color:var(--ink-3);white-space:nowrap}
@media (max-width:640px){.rk-hm{display:none}}
.rk-sempty p{font-size:var(--t-md)}
`;
document.head.appendChild(css);

/* ---------- start ---------- */
function start(design){
  K.design=design;
  if(!ui)return;
  initSearch();
  const h=parseHash();
  select(h.id||"serpentshrine-cavern",{initial:true,sub:h.sub,force:true});
  initMotion();
}

window.RaidKit={D,RAIDS,ITEMS,LISTS,BUILDS,FURY,CLASS_COL,$,$$,on,esc,plural,say,store,iconUrl,raidArt,bossArt,raid,boss,drops,WHERE,whereText,shortRaid,
  listName,listIcon,rankIn,getLi,setLi,specOptions,kindLabel,slotName,sortLoot,tipHTML,iconHTML,rankHTML,specIconHTML,hideTip,
  select,setHash,current:()=>K.cur,rise,motion:()=>M.on&&!RMQ.matches,start};
})();
