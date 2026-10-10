/* ranked-c.js — Ranked Gear design C, "Where to get it": the same ranked items grouped by where they come from, for
   planning a raid night. This tier's raids come first with their bosses in kill order, then last tier's raids, world
   bosses, crafting, and everything else (badges, PvP, quests, dungeons). Each item shows its slot and rank; what you
   wear is ticked, and anything ranked above what you wear in its slot is an upgrade. "Only upgrades" hides the rest.
   An item ranked for two slots (a one-hander for main and off hand) is one row naming both. Raid drops the loot
   tables don't place on a boss (trash, or a boss not recorded) sit at the end of their raid, said as such. */
(function(){
"use strict";
const R=window.RankedKit;if(!R)return;
const {G}=R;
/* inside the Character Planner (picked 2026-10-10: A with C as a second view) C draws into its own view, under the
   tab's one heading and view switch (ranked-planner.js) */
const IN_PLANNER=/c/.test(window.RANKED_IN_PLANNER||"");
const mount=document.getElementById(IN_PLANNER?"rkui-c":"rkui");if(!mount)return;
const KEY="pd-ranked-c";
let ui={only:false};try{const v=JSON.parse(sessionStorage.getItem(KEY)||"null");if(v&&typeof v.only==="boolean")ui=v;}catch(e){}
const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(ui));}catch(e){}};
const say=t=>{const m=mount.querySelector("#rc-msg");if(m)m.textContent=t;};

const css=document.createElement("style");
css.textContent=`
.rc-sum{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:0 0 10px;font-size:var(--t-sm)}
.rc-sum .chips{display:flex;flex-wrap:wrap;gap:5px}
.rc-sum .chips span{font:500 var(--t-xs) var(--f-mono);background:var(--glow-soft);border:1px solid var(--rim);border-radius:999px;padding:3px 10px}
.rc-tog{font:600 var(--t-sm) var(--f-body);background:var(--glass-2);border:1px solid var(--rim);color:var(--ink-2);padding:6px 12px;border-radius:999px;cursor:pointer;min-height:36px}
.rc-tog[aria-pressed="true"]{background:var(--glow);border-color:var(--glow);color:var(--glow-ink)}
.rc-grps{display:grid;gap:12px}
.rc-grp{background:var(--scrim);border:1px solid var(--rim-2);border-radius:12px;padding:10px 12px}
.rc-grp>h4{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;font:400 var(--t-lg) var(--f-head);margin:0 0 6px}
.rc-grp>h4 small{font:600 var(--t-xs) var(--f-body);color:var(--ink-3)}
.rc-grp>h4 .up{color:#7fdc8a}
.rc-boss{border-top:1px solid var(--rim-2);padding:6px 0 2px}
.rc-boss:first-of-type{border-top:0}
.rc-boss h5{display:flex;align-items:center;gap:8px;font:700 var(--t-xs) var(--f-body);text-transform:uppercase;letter-spacing:.08em;color:var(--ink-2);margin:2px 0 4px}
.rc-boss h5 .ord{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--rim);color:var(--glow);font:500 11px var(--f-mono)}
.rc-items{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.rc-it{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:2px 10px;align-items:center;padding:4px 0}
.rc-it .rk-ic{grid-row:span 2}
.rc-it .rk-src{grid-column:2}
.rc-it.below{opacity:.62}
.rc-it .acts{grid-row:span 2;display:flex;align-items:center;gap:6px}
.rc-tick{font-weight:700}
.rc-none{color:var(--ink-3);font-size:var(--t-sm)}
@media (min-width:1000px){.rc-grps{grid-template-columns:repeat(2,minmax(0,1fr))}.rc-grp.wide{grid-column:1/-1}}
@media (max-width:699px),(pointer:coarse){.rc-tog{min-height:44px}}
@media (max-width:699px){.rc-it{grid-template-columns:34px minmax(0,1fr)}.rc-it .acts{grid-column:2;grid-row:auto}}`;
document.head.appendChild(css);

const items=()=>R.byItem();

function itemRow(x){
  const ranks=x.on.map(o=>`${G.esc(o.l.label)} #${o.rank} of ${o.size} · ${G.esc(o.note)}`).join(" · ");
  const tag=x.standing==="wearing"?`<span class="rk-tag wear"><span class="rc-tick" aria-hidden="true">✓</span> You wear it</span>`
    :x.standing==="above"?`<span class="rk-tag up">Upgrade</span>`:"";
  const tok=x.where.token?` <span class="rk-tag tok">T5 token</span>`:"";
  const btn=x.target?`<button type="button" class="rk-eq" data-eq="${x.id}" data-slot="${G.esc(x.target)}" aria-label="Equip ${G.esc(x.it.name)} in ${G.esc(x.target)}">Equip</button>`:"";
  return `<li class="rc-it ${x.standing}">${R.icon(x.it,34)}<span>${R.name(x.it)}${tok}</span><span class="acts">${tag}${btn}</span><span class="rk-src">${ranks}</span></li>`;
}
const list=xs=>xs.length?`<ul class="rc-items">${xs.map(itemRow).join("")}</ul>`:"";
const ups=xs=>xs.filter(x=>x.standing==="above").length;
const head=(title,sub,xs)=>{const u=ups(xs);return `<h4>${G.esc(title)} <small>${sub} · ${xs.length} item${xs.length===1?"":"s"}${u?` · <span class="up">${u} upgrade${u===1?"":"s"}</span>`:""}</small></h4>`;};

function render(){
  const all=items(),shown=ui.only?all.filter(x=>x.standing==="above"):all;
  const raidUps=R.RAID_ORDER.map(r=>[r,ups(all.filter(x=>x.where.raid===r))]).filter(([,n])=>n);
  const totalUps=ups(all);
  let h=(IN_PLANNER?"":`<h3>Ranked gear, by where it drops</h3>`)+`<p class="lead">Every item on Wowhead's Fury Warrior Phase 2 list, grouped by where you get it, with raid bosses in kill order. What you wear is ticked; anything ranked above what you wear in its slot is an upgrade.</p>`;
  h+=`<div class="rc-sum"><b>${totalUps?`${totalUps} upgrade${totalUps===1?"":"s"} left`:"No upgrades left: you wear the top pick in every slot"}</b>`+
    (raidUps.length?`<span class="chips">${raidUps.map(([r,n])=>`<span>${G.esc(r)} ${n}</span>`).join("")}</span>`:"")+
    `<button type="button" class="rc-tog" data-act="only" aria-pressed="${ui.only}">Only upgrades</button>`+
    (!totalUps?`<button type="button" class="rk-eq" data-act="example">Try the part-geared example</button>`:"")+`</div>`;
  h+=`<div class="rc-grps">`;
  R.RAID_ORDER.forEach(raid=>{
    const xs=shown.filter(x=>x.where.raid===raid);if(!xs.length)return;
    const bosses=[...new Set(xs.filter(x=>x.where.boss).map(x=>x.where.boss))]
      .map(b=>({b,order:xs.find(x=>x.where.boss===b).where.order})).sort((a,b)=>a.order-b.order);
    const loose=xs.filter(x=>!x.where.boss);
    h+=`<section class="rc-grp${raid==="Serpentshrine Cavern"||raid==="Tempest Keep"?" wide":""}" aria-label="${G.esc(raid)}">`+head(raid,R.PHASE1.has(raid)?"Last tier":"This tier",xs)+
      bosses.map(({b,order})=>`<div class="rc-boss"><h5><span class="ord" aria-label="Boss ${order}">${order}</span>${G.esc(b)}</h5>${list(xs.filter(x=>x.where.boss===b))}</div>`).join("")+
      (loose.length?`<div class="rc-boss"><h5>Trash, or a boss the loot tables don't record</h5>${list(loose)}</div>`:"")+`</section>`;
  });
  [["world","World bosses","Doom Lord Kazzak and Doomwalker"],["craft","Crafted","Professions"],["other","Everything else","Badges, PvP, quests, dungeons and world drops"]].forEach(([k,title,sub])=>{
    const xs=shown.filter(x=>x.where.kind===k);if(!xs.length)return;
    h+=`<section class="rc-grp" aria-label="${title}">`+head(title,sub,xs)+list(xs.sort((a,b)=>a.where.text.localeCompare(b.where.text)))+`</section>`;
  });
  h+=`</div>`;
  if(!shown.length)h+=`<p class="rc-none">No upgrades left. Turn off "Only upgrades" to see every ranked item.</p>`;
  h+=`<p class="okline rk-msg" id="rc-msg" aria-live="polite"></p>`;
  h+=`<p class="prov" style="margin:6px 0 0">Order and notes: <a href="${G.D.source.url}">Wowhead Fury Warrior DPS BiS, Phase 2</a>. Bosses: the app's raid loot tables, in encounter order.</p>`;
  mount.innerHTML=h;
}

mount.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.act==="only"){ui.only=!ui.only;save();render();const f=mount.querySelector('[data-act="only"]');if(f)f.focus();return;}
  if(t.dataset.act==="example"){R.loadExample("ranked-c");render();say("Loaded the part-geared example. The Gear tab shows it too.");return;}
  if(t.dataset.eq){const id=t.dataset.eq,slot=t.dataset.slot,nm=G.item(id).name;R.equip(slot,id,"ranked-c");render();
    say(`${slot}: equipped ${nm}. The Gear tab shows it too.`);const f=mount.querySelector('[data-act="only"]');if(f)f.focus();}
});
document.addEventListener("gear:change",e=>{if(!e.detail||e.detail.from!=="ranked-c")render();});
render();if(!IN_PLANNER)R.openTab();
})();
