/* front-common.js — shared logic for the three front-door designs (front-a/b/c.html): the live app's 5-card section
   picker (src/components/layout/SectionPicker.tsx), reworked. What every design keeps from it and from the usability
   study (docs/research/USABILITY-STUDY.md):
   - the five sections in the app's own words, each now in its tab's colour, plus the simulator, which the study found
     nothing on the front page mentioned
   - a door's accessible name is its title alone, with the sentence as its description (the study's screen-reader user
     heard five paragraph-long button names)
   - the import from the game: the paste is read the way the planner's Build tab reads it (build-common.js), the
     planner's character is set for this browser session, and the planner opens wearing it, as the app does
   - the owner's own art (public/backdrop and public/raids, ChatGPT generations, settled in HANDOFF.md) and real counts
     from src/ (front-data.js); no WebGL, so the pick can go straight into the app's SectionPicker */
(function(){
"use strict";
const F=window.FRONT_DATA,K=window.BuildKit,G=window.GearKit,B=window.BuffKit;if(!F)return;
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* the owner's art: public/ in the repo, the site root on GitHub Pages */
const ART=location.pathname.indexOf("/docs/design/prototypes/")>=0?"../../../../public/":"../../";
const icon=n=>G?G.iconUrl(n):ART+"icons/"+n+".jpg";

const SECTIONS=[
  {id:"planner",label:"Character Planner",tagline:"Gear, gems and talents",href:"planner.html",accent:"#7cc4ff",
    blurb:"Build a character from faction to spec, fill every slot against real Phase 2 rankings, and see what the stats come to.",
    goal:"Gear my character",goalSub:"Fill every slot against Wowhead's Phase 2 rankings, then see what it adds up to."},
  {id:"simulation",label:"Simulation",tagline:"Estimated DPS",href:"simulation.html",accent:"#ecc06a",
    blurb:"Run the app's own model on your character: your stat priority, your best upgrades, and the estimate against what players average.",
    goal:"Simulate my DPS",goalSub:"Your stat priority, your best upgrades, and the estimate against what players average."},
  {id:"raidcomp",label:"Raid Composition",tagline:"Buff coverage",href:"raid-composition.html",accent:"#f2c75c",
    blurb:"Plan a 10 or 25-player roster and see which raid buffs and target debuffs it actually brings, and what one more seat would buy you.",
    goal:"Plan a raid",goalSub:"See which buffs and debuffs a 10 or 25-player roster brings, and what it's missing."},
  {id:"tierlists",label:"Spec Tier Lists",tagline:"Where specs stand",href:"tier-lists.html",accent:"#3ee0a0",
    blurb:"Wowhead's Phase 2 rankings for damage, healing and tanking, all three lists on one page.",
    goal:"See where my spec stands",goalSub:"Wowhead's Phase 2 rankings for damage, healing and tanking."},
  {id:"raids",label:"Raids",tagline:"Loot tables",href:"raids.html",accent:"#b9a6ff",
    blurb:"What drops where across Serpentshrine Cavern, Tempest Keep and the Phase 1 raids still worth running.",
    goal:"Find what drops where",goalSub:"Every boss and its loot across the five raids, with a search."},
  {id:"professions",label:"Professions",tagline:"Levelling and payoffs",href:"professions.html",accent:"#ffb547",
    blurb:"How to take a profession to 375 without wasting materials, and what each one is actually worth at 70.",
    goal:"Level a profession",goalSub:"The cheapest path to 375, and what each profession is worth at 70."},
];
/* the icon each goal leads with (all shipped in public/icons) */
const GOAL_ICON={planner:"inv_helmet_58",simulation:"ability_warrior_innerrage",raidcomp:"ability_warrior_battleshout",tierlists:"spell_arcane_blast",raids:null,professions:"trade_mining"};
SECTIONS.forEach(s=>{s.goalIcon=GOAL_ICON[s.id];});
const BY=Object.fromEntries(SECTIONS.map(s=>[s.id,s]));
/* the backdrop behind every front door */
/* the live front door's own backdrop (backdrop.webp is a different picture, the five-raid collage) */
document.documentElement.style.setProperty("--fd-backdrop",`url("${ART}backdrop.jpg")`);

/* ---------- real glimpses of what is behind each door ---------- */
const specIcon=(cls,spec)=>{const b=B&&(B.D.builds||[]).find(x=>x.cls===cls&&x.spec===spec);return b?b.icon:null;};
const glimpse={
  /* the recommended set's icons, the planner's opening gear */
  planner:()=>{const st=G?G.recommended():null;return st?G.SLOTS.map(s=>G.item(st[s.key].item)).filter(Boolean).map(it=>({icon:it.icon,name:it.name,q:it.q})):[];},
  /* an example 25-man's first two groups, as the Raid Composition tab fills them */
  raidcomp:()=>{if(!B||!B.exampleRoster)return [];const seats=B.exampleRoster(25).slice(0,2).flat();
    return seats.filter(Boolean).map(seat=>{const b=(B.D.builds||[]).find(x=>x.id===seat.id);return b?{icon:b.icon,name:`${b.label} ${b.cls}`}:null;}).filter(Boolean);},
  tierlists:()=>F.tierTop.specs.map(s=>({icon:specIcon(s.className,s.spec),name:`${s.spec} ${s.className}`})).filter(x=>x.icon),
  raids:()=>F.raids.filter(r=>r.art).map(r=>({art:ART+r.art,name:r.name,phase:r.phase,bosses:r.bosses,drops:r.drops})),
  professions:()=>F.professionIcons.map(p=>({icon:p.icon,name:p.name})),
};
const fact={
  planner:()=>`${F.bisSpecs} specs ranked slot by slot`,
  simulation:()=>`The live app's own model`,
  raidcomp:()=>`${F.buffs} raid buffs counted`,
  tierlists:()=>`${F.dpsSpecs} DPS specs ranked; ${F.tierTop.label} tier shown`,
  raids:()=>`${F.raids.length} raids · ${F.bosses} bosses · ${F.drops} drops`,
  professions:()=>`${F.professions} professions, each to 375`,
};
const icons=(list,size,max)=>list.slice(0,max||list.length).map(x=>`<img src="${icon(x.icon)}" alt="" width="${size}" height="${size}" title="${esc(x.name)}"${x.q&&G?` style="--q:${G.qVar(x.q)}"`:""}>`).join("");

/* ---------- arriving as yourself ---------- */
const importText="In game, run /pdexport, press Ctrl+C, and paste it here. Nothing is uploaded: the string never leaves your browser, and it carries no character name or realm.";
/* read a paste; on success the planner's character is set for this session and the planner opens wearing it */
async function arrive(text,spec){
  if(!K)return {ok:false,error:"The import needs the planner's scripts."};
  const r=await K.read(text);if(!r.ok)return r;
  if(r.specChoice&&!spec)return r;
  if(spec)r.build.character.spec=spec;
  K.apply(r,"front");
  /* a link or build text sets the buffs by hand; the planner's Buffs tab would otherwise fill the example raid over them */
  if(!r.fromAddon)try{sessionStorage.setItem("pd-buffs-c",JSON.stringify({src:"hand",seat:null,edits:0}));}catch(e){}
  try{sessionStorage.setItem("pd-front-arrived",JSON.stringify({kind:r.kind,issues:r.issues.length}));}catch(e){}
  location.href=BY.planner.href;
  return r;
}
const exampleExport=()=>K?K.exampleAddon():"";

/* the line every front door ends with (the study's P11 found no About, credits or source anywhere) */
const footer=`<footer class="fd-foot"><p>A fan-made TBC Classic Anniversary planner, local-first: nothing you enter leaves your browser.
  Data from Wowhead, wowsims and archon.gg; the art is the owner's own. <a href="https://github.com/josephevenson08/project-defeat">Source on GitHub</a> · <a href="../index.html">All prototypes</a></p>
  <p>World of Warcraft is a trademark of Blizzard Entertainment; this is a fan project, not affiliated with Blizzard. Prototype only, not the live app.</p></footer>`;
const head=`<header class="fd-head"><h1>Project Defeat</h1><p class="fd-sub">TBC Classic · Phase 2</p>
  <p class="fd-sides"><span class="side-alliance">For the Alliance</span> <span class="side-and">and</span> <span class="side-horde">For the Horde</span></p></header>`;

/* the footer goes after the page's main area */
{const m=document.getElementById("front");if(m)m.insertAdjacentHTML("afterend",footer);}

window.FrontKit={F,K,G,B,esc,ART,icon,SECTIONS,BY,glimpse,fact,icons,importText,arrive,exampleExport,footer,head};
})();
