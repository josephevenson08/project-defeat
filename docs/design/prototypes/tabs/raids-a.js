/* raids-a.js — Raids design A, "The Adventure Guide": one boss at a time, the way the game's own boss journal reads.
   A list of the raid's bosses down the side (the owner's boss art where there is some), the chosen boss's loot as
   icons with game tooltips, and a "Loot for" spec that puts the drops on that spec's Wowhead Phase 2 list first, each
   with its rank. "About the raid" holds the facts, the way in and the attunement chain; "The fight" holds the
   mechanics. The hash carries the boss (#raid/boss), so a link opens the same page.
   In the Raids tab (window.RAIDS_IN_TAB, decided 2026-10-11) a switch adds design C's view, "For my raid": who in your
   Raid Composition raid wants each drop (raids-c.js, window.RaidsC). The switch is remembered for the browser session
   ("pd-raids-view"), and #raid/raid links to that view. */
(function(){
"use strict";
const R=window.RaidKit;if(!R)return;
const {ITEMS,$,$$,on,esc,plural}=R;
const ui=$("#raidui");
const st={sub:{},tab:"loot"};
/* the tab: a "For me / For my raid" switch above one shared area that this design and design C draw into */
const C=window.RAIDS_IN_TAB&&window.RaidsC?window.RaidsC:null;
const VKEY="pd-raids-view";
let view=C&&R.store.get(VKEY)==="raid"?"raid":"me";
let host=ui;
if(C){
  ui.innerHTML=`<div class="rk-views" role="group" aria-label="Show the loot"><button type="button" data-view="me" aria-pressed="${view==="me"}">For me <small>boss by boss</small></button>`+
    `<button type="button" data-view="raid" aria-pressed="${view==="raid"}">For my raid <small>who wants what</small></button></div><div id="raidhost"></div>`;
  host=$("#raidhost");C.setHost(host);
}
function setView(v){view=v;R.store.set(VKEY,v);$$(".rk-views [data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===v)));}

const css=document.createElement("style");
css.textContent=`
.rk-views{display:inline-flex;gap:4px;padding:4px;margin:4px 0 12px;border-radius:999px;border:1px solid var(--rim);background:var(--scrim);position:relative}
.rk-views button{font:600 var(--t-sm) var(--f-body);min-height:44px;padding:6px 16px;border-radius:999px;border:0;background:none;color:var(--ink-2);cursor:pointer}
.rk-views button small{font:500 var(--t-xs) var(--f-body);color:var(--ink-3);margin-left:4px}
.rk-views button[aria-pressed="true"]{background:var(--glow);color:var(--glow-ink)}
.rk-views button[aria-pressed="true"] small{color:var(--glow-ink)}
.rk-views button:hover:not([aria-pressed="true"]){color:var(--ink)}
@media (max-width:520px){.rk-views{display:flex}.rk-views button{flex:1;padding:6px 8px}.rk-views button small{display:none}}
.ja{display:grid;gap:16px;grid-template-columns:minmax(0,1fr);margin:4px 0 0}
@media (min-width:900px){.ja{grid-template-columns:290px minmax(0,1fr);align-items:start}}
.ja-rail{padding:10px}
@media (min-width:900px){.ja-rail{position:sticky;top:66px;max-height:calc(100vh - 80px);overflow:auto}}
.ja-raid{display:flex;gap:10px;align-items:center;padding:4px 4px 10px;border-bottom:1px solid var(--rim-2);margin-bottom:6px;position:relative}
.ja-raid img{width:64px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--rim)}
.ja-raid b{display:block;font:400 var(--t-lg)/1.15 var(--f-head)}
.ja-raid small{font:500 var(--t-xs) var(--f-mono);color:var(--ink-3)}
.ja-list{list-style:none;margin:0;padding:0;display:grid;gap:3px;position:relative}
.ja-list button{width:100%;display:flex;align-items:center;gap:10px;min-height:52px;padding:5px 8px;border-radius:10px;border:1px solid transparent;background:none;color:var(--ink-2);font:inherit;text-align:left;cursor:pointer}
.ja-list button:hover{background:var(--glow-soft);color:var(--ink)}
.ja-list button[aria-current="true"]{background:var(--glow-soft);border-color:var(--glow);color:var(--ink);box-shadow:inset 3px 0 0 var(--glow)}
.ja-port{flex:none;width:42px;height:42px;border-radius:50%;border:2px solid var(--rim);background:#0a1418 center 22%/cover no-repeat;display:grid;place-items:center;font:500 var(--t-xs) var(--f-mono);color:var(--glow)}
.ja-list button[aria-current="true"] .ja-port{border-color:var(--glow)}
.ja-port.info{font:400 1.1rem var(--f-head)}
.ja-bn{display:grid;min-width:0}
.ja-bn b{font-weight:600;font-size:var(--t-sm);color:inherit;overflow-wrap:anywhere}
.ja-bn small{font-size:var(--t-xs);color:var(--ink-3)}
.ja-bn small em{font-style:normal;color:var(--glow)}
.ja-opt{font:600 9px/1.5 var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--warn);border:1px solid rgba(255,207,122,.4);border-radius:4px;padding:0 4px;margin-left:4px;vertical-align:1px}
@media (max-width:899px){
  .ja-rail{padding:8px}
  .ja-raid{display:none}
  .ja-list{display:flex;overflow-x:auto;gap:6px;padding-bottom:4px;scroll-snap-type:x proximity;overscroll-behavior-x:contain}
  .ja-list li{flex:none;scroll-snap-align:start}
  .ja-list button{width:auto;min-width:150px;max-width:210px}
}
.ja-page{overflow:hidden}
.ja-banner{position:relative;min-height:190px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:16px;background:#071014 var(--art) center 28%/cover no-repeat;border-bottom:1px solid var(--rim)}
.ja-banner::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,8,12,.05) 0%,rgba(3,8,12,.55) 55%,rgba(3,8,12,.92) 100%)}
.ja-banner.noart::after{background:linear-gradient(180deg,rgba(3,8,12,.55),rgba(3,8,12,.92))}
.ja-banner>*{position:relative;z-index:1}
.ja-bt h2{margin:2px 0 2px;font:400 var(--t-xl)/1.1 var(--f-head);text-shadow:0 2px 18px rgba(0,0,0,.8)}
.ja-bt .ja-num{font:500 var(--t-xs) var(--f-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--glow)}
.ja-bt p{margin:0;font-size:var(--t-sm);color:var(--ink-2)}
.ja-nav{display:flex;gap:6px}
.ja-nav button{width:44px;height:44px;border-radius:50%;border:1px solid var(--rim);background:rgba(3,10,14,.7);color:var(--ink);font:400 1.2rem/1 var(--f-body);cursor:pointer}
.ja-nav button:hover:not(:disabled){border-color:var(--glow);color:var(--glow)}
.ja-nav button:disabled{opacity:.35;cursor:default}
.ja-tabs{display:flex;gap:2px;padding:0 10px;border-bottom:1px solid var(--rim-2);position:relative}
.ja-tabs button{font:600 var(--t-sm) var(--f-body);background:none;border:0;border-bottom:2px solid transparent;color:var(--ink-2);padding:12px 12px 10px;min-height:44px;cursor:pointer}
.ja-tabs button[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--glow)}
.ja-body{padding:12px 14px 14px;position:relative}
.ja-filter{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 12px}
.ja-filter label{font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);display:flex;align-items:center;gap:8px}
.ja-filter select{min-height:40px;text-transform:none;letter-spacing:0;font-weight:600;font-size:var(--t-sm)}
.ja-filter .ja-count{font-size:var(--t-sm);color:var(--ink-2)}
@media (max-width:700px){.ja-filter select{min-height:44px}}
.ja-filter .ja-count img{vertical-align:-6px;margin-right:6px;display:inline-block}
.ja-h3{margin:4px 0 8px;font:600 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3)}
.ja-loot{list-style:none;margin:0 0 6px;padding:0;display:grid;gap:4px;grid-template-columns:minmax(0,1fr)}
@media (min-width:1100px){.ja-loot{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ja-ib{width:100%;display:flex;align-items:center;gap:10px;min-height:56px;padding:6px 8px;border-radius:10px;border:1px solid var(--rim-2);background:var(--scrim);color:var(--ink);font:inherit;text-align:left;cursor:default}
.ja-ib:hover,.ja-ib:focus-visible{border-color:var(--glow);background:var(--glow-soft)}
.ja-in{display:grid;min-width:0;flex:1}
.ja-in b{font-weight:600;font-size:var(--t-sm);overflow-wrap:anywhere}
.ja-in small{font-size:var(--t-xs);color:var(--ink-3)}
.ja-in .ja-st{font-size:var(--t-xs);color:var(--ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ja-ib .rk-rank{flex:none}
.q-e{color:var(--q-epic)}.q-r{color:var(--q-rare)}.q-u{color:var(--q-unc)}.q-l{color:var(--q-leg)}.q-n{color:var(--ink-2)}
details.ja-more{margin-top:8px;border-top:1px solid var(--rim-2);padding-top:4px}
details.ja-more>summary{cursor:pointer;font:600 var(--t-sm) var(--f-body);color:var(--glow);padding:10px 0;min-height:44px;list-style:none}
details.ja-more>summary::-webkit-details-marker{display:none}
details.ja-more>summary::before{content:"+ ";font-family:var(--f-mono)}
details.ja-more[open]>summary::before{content:"− "}
.ja-empty{font-size:var(--t-sm);color:var(--ink-2);margin:0 0 10px}
.ja-fight p{font-size:var(--t-sm);color:var(--ink-2);max-width:70ch}
.ja-roles{list-style:none;margin:10px 0 0;padding:0;display:grid;gap:6px}
.ja-roles li{font-size:var(--t-sm);color:var(--ink-2);padding:8px 10px;border:1px solid var(--rim-2);border-radius:10px;background:var(--scrim)}
.ja-roles b{display:inline-block;min-width:96px;color:var(--glow);font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.08em}
.ja-about .facts{margin-bottom:12px}
.ja-about h3{margin:14px 0 6px;font:400 var(--t-lg)/1.2 var(--f-head)}
.ja-about p{font-size:var(--t-sm);color:var(--ink-2);max-width:72ch}
.ja-about p strong{color:var(--ink)}
.ja-steps{list-style:none;margin:0;padding:0;display:grid;gap:6px;counter-reset:s}
.ja-steps li{position:relative;padding:8px 10px 8px 42px;background:var(--scrim);border:1px solid var(--rim-2);border-radius:10px;font-size:var(--t-sm)}
.ja-steps li .n{position:absolute;left:11px;top:9px;font:500 var(--t-xs) var(--f-mono);color:var(--glow)}
.ja-steps li b{display:block;font-weight:600}
.ja-steps li small{color:var(--ink-3);font-size:var(--t-xs)}
.ja-steps li p{margin:3px 0 0;font-size:var(--t-xs)}
`;
document.head.appendChild(css);

const subsOf=r=>["about",...r.bosses.map(b=>b.id),...(r.trash.length?["trash"]:[])];
const lootOf=(r,sub)=>sub==="trash"?r.trash:(R.boss(r,sub)||{loot:[]}).loot;
const forLi=(ids,l)=>l<0?[]:ids.filter(i=>R.rankIn(i,l));
const defaultSub=r=>r.bosses[0].id;

function railHTML(r,sub){
  const l=R.getLi(),short=l>=0?R.LISTS[l].spec:"";
  const row=(id,port,name,meta,extra)=>`<li><button type="button" data-sub="${esc(id)}" aria-current="${id===sub}">${port}<span class="ja-bn"><b>${name}${extra||""}</b><small>${meta}</small></span></button></li>`;
  return `<nav class="box ja-rail" aria-label="${esc(r.n)}: bosses">`+
    `<div class="ja-raid"><img src="${R.raidArt(r.id)}" alt="" width="64" height="40" loading="lazy"><span><b>${esc(r.n)}</b><small>${r.tier} · ${r.sz} players · Phase ${r.ph}</small></span></div>`+
    `<ul class="ja-list">`+
    row("about",`<span class="ja-port info" aria-hidden="true">i</span>`,"About the raid",r.ch?"Getting in · "+esc(r.ch.n):"Getting in · no attunement")+
    r.bosses.map((b,k)=>{
      const n=forLi(b.loot,l).length;
      const port=b.art?`<span class="ja-port" style="background-image:url('${R.bossArt(b.id)}')" aria-hidden="true"></span>`:`<span class="ja-port" aria-hidden="true">${b.opt?"·":String(b.o||k+1).padStart(2,"0")}</span>`;
      return row(b.id,port,esc(b.n),`${plural(b.loot.length,"drop")}${l>=0?` · <em>${n} for ${esc(short)}</em>`:""}`,b.opt?`<span class="ja-opt">Optional</span>`:"");
    }).join("")+
    (r.trash.length?row("trash",`<span class="ja-port" aria-hidden="true">✦</span>`,"Notable trash",`${plural(r.trash.length,"drop")}${l>=0?` · <em>${forLi(r.trash,l).length} for ${esc(short)}</em>`:""}`):"")+
    `</ul></nav>`;
}
function itemHTML(i,l){
  const x=ITEMS[i];
  const meta=[R.slotName(x.slot),x.wt||x.at,x.ilvl?"ilvl "+x.ilvl:"",R.kindLabel(x)].filter(Boolean).join(" · ");
  return `<li><button type="button" class="ja-ib" data-tip="${i}" data-i="${i}">${R.iconHTML(i,40)}<span class="ja-in"><b class="q-${x.q||"n"}">${esc(x.n)}</b><small>${esc(meta||"Not in the item catalogue")}</small>${x.st?`<span class="ja-st">${esc(x.st)}</span>`:""}</span>${l>=0?R.rankHTML(i,l):""}</button></li>`;
}
function lootPanel(r,sub){
  const l=R.getLi(),ids=R.sortLoot(lootOf(r,sub));
  const mine=forLi(ids,l).sort((a,b)=>R.rankIn(a,l).rank-R.rankIn(b,l).rank),rest=ids.filter(i=>!mine.includes(i));
  const who=l>=0?R.listName(l):"";
  let h=`<div class="ja-filter"><label for="ja-li">Loot for <select id="ja-li">${R.specOptions(l,true)}</select></label>`+
    `<span class="ja-count">${l>=0?`${R.specIconHTML(l,24)}${mine.length?`${plural(mine.length,"drop")} here ${mine.length===1?"is":"are"} on the ${esc(who)} list`:`Nothing here is on the ${esc(who)} list`}`:`${plural(ids.length,"drop")}, sorted tokens first`}</span></div>`;
  if(l<0)return h+`<ul class="ja-loot">${ids.map(i=>itemHTML(i,-1)).join("")}</ul>`;
  h+=mine.length?`<h3 class="ja-h3">On Wowhead's ${esc(who)} list, best first</h3><ul class="ja-loot">${mine.map(i=>itemHTML(i,l)).join("")}</ul>`:
    `<p class="ja-empty">No drop from ${sub==="trash"?"this raid's notable trash":"this boss"} is on Wowhead's Phase 2 ${esc(who)} list. Pick another spec, or see everything below.</p>`;
  if(rest.length)h+=`<details class="ja-more"${mine.length?"":" open"}><summary>${plural(rest.length,"other drop")}</summary><ul class="ja-loot">${rest.map(i=>itemHTML(i,l)).join("")}</ul></details>`;
  return h;
}
function fightPanel(b){
  return `<div class="ja-fight"><p>${esc(b.m)}</p>${b.rn.length?`<ul class="ja-roles">${b.rn.map(([role,note])=>`<li><b>${esc(role)}</b> ${esc(note)}</li>`).join("")}</ul>`:""}`+
    (b.nv?`<p class="verify"><strong>Needs checking.</strong> ${esc(b.note)}</p>`:"")+`</div>`;
}
function aboutPanel(r){
  const c=r.ch;
  const feeds=R.RAIDS.filter(o=>o.ch&&o.ch.steps.some(s=>s.loc.indexOf(r.n.split(":")[0])===0)).map(o=>{const s=o.ch.steps.find(x=>x.loc.indexOf(r.n.split(":")[0])===0);return `${esc(o.ch.n)} (${esc(o.n)}), step ${s.o}: ${esc(s.t)}`;});
  return `<div class="ja-about"><ul class="facts"><li><b>Size</b>${r.sz}</li><li><b>Bosses</b>${r.bosses.length}</li><li><b>Drops</b>${R.drops(r)}</li><li><b>Zone</b>${esc(r.zone)}</li><li><b>Resets</b>every ${r.reset} days</li></ul>`+
    `<p>${esc(r.desc)}</p><p><strong>Getting there:</strong> ${esc(r.loc)}</p><p><strong>Can I get in?</strong> ${esc(r.att)}</p>`+
    (feeds.length?`<p><strong>Part of an attunement:</strong> ${feeds.join("; ")}.</p>`:"")+
    (c?`<h3>${esc(c.n)} <small class="prov">${plural(c.steps.length,"step")}</small></h3>`+
      (c.nv?`<p class="verify"><strong>Not every point is confirmed for Anniversary realms.</strong> ${esc(c.note)}</p>`:"")+
      `<p>${esc(c.sum)}</p><p><strong>Before step 1:</strong></p><ul class="pre">${c.pre.map(p=>`<li>${esc(p)}</li>`).join("")}</ul>`+
      `<ol class="ja-steps">${c.steps.map(s=>`<li><span class="n">${String(s.o).padStart(2,"0")}</span><b>${esc(s.t)}${s.d?`<span class="diff ${esc(s.d)}">${esc(s.d)}</span>`:""}</b><small>${s.q?"Quest: "+esc(s.q)+" · ":""}${esc(s.loc)}</small><p>${esc(s.req)}</p></li>`).join("")}</ol>`+
      `<p style="margin-top:10px"><strong>Reward:</strong> ${esc(c.rew)}</p>`:"")+
    `<p class="prov">Raids, bosses, loot and attunements from the live app's <code>src/domain/raids</code>; quality, stats and icons from its item catalogue.</p></div>`;
}
function pageHTML(r,sub){
  const subs=subsOf(r),k=subs.indexOf(sub),b=R.boss(r,sub);
  const l=R.getLi();
  let art,title,num,line;
  if(sub==="about"){art=R.raidArt(r.id);title="About "+r.n;num=`${r.tier} · ${r.sz} players`;line=`${plural(r.bosses.length,"boss","bosses")} · ${plural(R.drops(r),"drop")} · ${r.ch?"attunement: "+r.ch.n:"no attunement"}`;}
  else if(sub==="trash"){art=R.raidArt(r.id);title="Notable trash";num=r.n;line=`${plural(r.trash.length,"drop")} from trash, not a boss`;}
  else{art=b.art?R.bossArt(b.id):R.raidArt(r.id);title=b.n;num=b.opt?"Optional boss":`Boss ${b.o||k} of ${r.bosses.filter(x=>!x.opt).length}`;
    const n=forLi(b.loot,l).length;line=`${plural(b.loot.length,"drop")}${l>=0?` · ${n} on the ${esc(R.listName(l))} list`:""}`;}
  const noart=sub==="about"||sub==="trash"||!b||!b.art;
  const tabs=b?`<div class="ja-tabs" role="tablist" aria-label="${esc(b.n)}"><button type="button" role="tab" id="ja-t-loot" aria-controls="ja-body" aria-selected="${st.tab==="loot"}" data-tab="loot">Loot</button><button type="button" role="tab" id="ja-t-fight" aria-controls="ja-body" aria-selected="${st.tab==="fight"}" data-tab="fight">The fight</button></div>`:"";
  const body=sub==="about"?aboutPanel(r):(b&&st.tab==="fight")?fightPanel(b):lootPanel(r,sub);
  return `<section class="box ja-page" data-enter aria-labelledby="ja-h">`+
    `<div class="ja-banner${noart?" noart":""}" style="--art:url('${art}')"><div class="ja-bt"><span class="ja-num">${esc(num)}</span><h2 id="ja-h">${esc(title)}</h2><p>${line}</p></div>`+
    `<div class="ja-nav"><button type="button" data-step="-1" aria-label="Previous"${k<=0?" disabled":""}>←</button><button type="button" data-step="1" aria-label="Next"${k>=subs.length-1?" disabled":""}>→</button></div></div>`+
    tabs+`<div class="ja-body" id="ja-body"${b?` role="tabpanel" aria-labelledby="ja-t-${st.tab}"`:""}>${body}</div></section>`;
}
let cur=null;
function draw(r,sub,opts){
  opts=opts||{};
  const subs=subsOf(r);if(!subs.includes(sub))sub=defaultSub(r);
  st.sub[r.id]=sub;cur=r;
  const railScroll=$(".ja-list")?$(".ja-list").scrollLeft:0;
  host.innerHTML=`<div class="ja">${railHTML(r,sub)}${pageHTML(r,sub)}</div>`;
  const list=$(".ja-list");
  if(list){list.scrollLeft=railScroll;const curB=$('.ja-list button[aria-current="true"]');if(curB&&innerWidth<900){const lr=list.getBoundingClientRect(),br=curB.getBoundingClientRect();if(br.left<lr.left||br.right>lr.right)list.scrollLeft+=br.left-lr.left-12;}}
  if(opts.item!=null){
    const det=$("details.ja-more"),el=$(`.ja-ib[data-i="${opts.item}"]`);
    if(el){if(det&&det.contains(el))det.open=true;el.scrollIntoView({block:"center",behavior:R.motion()?"smooth":"auto"});el.classList.add("rk-flash");el.focus({preventScroll:true});}
  }
}
function go(sub,focusSel){
  if(!cur)return;
  st.tab=st.tab||"loot";
  draw(cur,sub);R.setHash(cur.id,sub);
  const b=R.boss(cur,sub);
  R.say(sub==="about"?`About ${cur.n}.`:sub==="trash"?`Notable trash: ${plural(cur.trash.length,"drop")}.`:`${b.n}: ${plural(b.loot.length,"drop")}.`);
  if(R.motion())R.rise($(".ja-page").parentNode,true);
  const f=focusSel&&$(focusSel);if(f)f.focus({preventScroll:true});
}
on(ui,"click",e=>{
  const s=e.target.closest("[data-sub]");if(s){go(s.dataset.sub,`.ja-list button[data-sub="${s.dataset.sub}"]`);return;}
  const n=e.target.closest("[data-step]");
  if(n&&cur){
    const d=n.dataset.step,subs=subsOf(cur),nx=subs[subs.indexOf(st.sub[cur.id])+(+d)];
    if(nx){go(nx,`.ja-nav button[data-step="${d}"]`);const btn=$(`.ja-nav button[data-step="${d}"]`);if(btn&&btn.disabled){const h=$("#ja-h");h.setAttribute("tabindex","-1");h.focus();}}
    return;
  }
  const v=e.target.closest("[data-view]");
  if(v&&C){
    if(v.dataset.view===view)return;
    setView(v.dataset.view);
    const r=R.raid(R.current());if(!r)return;
    if(view==="raid"){C.reset();C.render(r,{});R.setHash(r.id,"raid");R.say(`For your raid: who wants each drop in ${r.n}.`);}
    else{draw(r,st.sub[r.id]||defaultSub(r));R.setHash(r.id,st.sub[r.id]);R.say(`For you: ${r.n}, boss by boss.`);}
    if(R.motion())R.rise(host,true);
    return;
  }
  const t=e.target.closest("[data-tab]");if(t&&cur){st.tab=t.dataset.tab;draw(cur,st.sub[cur.id]);const nt=$(`[data-tab="${st.tab}"]`);if(nt)nt.focus();}
});
on(ui,"change",e=>{if(e.target.id==="ja-li"&&cur){R.setLi(+e.target.value);draw(cur,st.sub[cur.id]);const s=$("#ja-li");if(s)s.focus();
  const l=R.getLi();R.say(l<0?"Showing every drop.":`Loot for ${R.listName(l)}.`);}});
/* arrow keys move through the boss list */
on(ui,"keydown",e=>{
  const b=e.target.closest(".ja-list button");if(!b)return;
  const all=$$(".ja-list button"),k=all.indexOf(b);
  const d={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(!d)return;
  const nx=all[k+d];if(nx){e.preventDefault();nx.focus();}
});

window.RAIDS_DESIGN="a";
R.start({
  render(r,ctx){
    if(C){
      /* a link picks the view: #raid/raid is design C's, a boss is this design's */
      if(ctx.sub==="raid")setView("raid");else if(ctx.sub&&subsOf(r).includes(ctx.sub))setView("me");
      if(view==="raid"){C.render(r,ctx);return;}
    }
    if(ctx.changed&&!ctx.sub)st.tab="loot";
    if(ctx.item!=null)st.tab="loot";
    const sub=ctx.sub&&ctx.sub!=="raid"?ctx.sub:st.sub[r.id]||defaultSub(r);
    draw(r,sub,{item:ctx.item});
  },
  annotate(i){if(C&&view==="raid")return C.annotate(i);const l=R.getLi();return l>=0?R.rankHTML(i,l):"";},
  open(rid,bid,i){if(C&&view==="raid"){C.reset();R.select(rid,{user:true,sub:"raid",item:i});}else R.select(rid,{user:true,sub:bid||"trash",item:i});},
  sub(r){return C&&view==="raid"?"raid":st.sub[r.id]||defaultSub(r);},
});
})();
