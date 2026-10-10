/* ranked-planner.js — the Character Planner's Ranked Gear tab, as picked by the owner on 2026-10-10: design A, the guide
   slot by slot, with design C's "Where it drops" as a second view, switched the way the Gear tab switches to its
   checklist (and styled by the same .gp-views from gear-planner.js). This file owns the tab's heading, the view switch
   (kept for the browser session) and the switch's count of upgrades left; ranked-a.js and ranked-c.js draw the views
   into #rkui-a and #rkui-c. */
(function(){
"use strict";
const R=window.RankedKit,mount=document.getElementById("rkui");if(!R||!mount)return;
const a=document.getElementById("rkui-a"),c=document.getElementById("rkui-c");if(!a||!c)return;
const VKEY="pd-ranked-planner-view";
let view="slot";try{if(sessionStorage.getItem(VKEY)==="where")view="where";}catch(e){}

const head=document.createElement("div");
head.innerHTML=`<h3>Ranked gear</h3><div class="gp-views" role="group" aria-label="Ranked Gear view">
  <button type="button" data-rview="slot" aria-pressed="true">Slot by slot</button>
  <button type="button" data-rview="where" aria-pressed="false">Where it drops<span class="n" id="rp-n"></span></button></div>`;
mount.insertBefore(head,mount.firstChild);

function show(v){
  view=v==="where"?"where":"slot";
  a.hidden=view!=="slot";c.hidden=view!=="where";
  head.querySelectorAll("[data-rview]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.rview===view));
  try{sessionStorage.setItem(VKEY,view);}catch(e){}
}
/* how many ranked items sit above what you wear, on the "Where it drops" button */
function count(){const n=R.upgradesLeft(),el=head.querySelector("#rp-n");if(el){el.textContent=n?` ${n}`:"";el.title=n?`${n} upgrade${n===1?"":"s"} left`:"";}
  const b=head.querySelector('[data-rview="where"]');if(b)b.setAttribute("aria-label",`Where it drops${n?`, ${n} upgrade${n===1?"":"s"} left`:""}`);}
head.addEventListener("click",e=>{const t=e.target.closest("[data-rview]");if(t){show(t.dataset.rview);t.focus();}});
document.addEventListener("gear:change",count);
show(view);count();
})();
