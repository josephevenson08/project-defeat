// Hands-on test of the three Compare designs (compare-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/compare-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = planner.html, the chosen Compare tab (design A with design B's one-sentence summary).
// Real numbers: Destroyer Battle-Helm → Furious Gizmatic Goggles is −8 hit (140 → 132 for the recommended set). On the
// planner the cap is 95 (the Fury preset's Precision 3/3), so the swap keeps you 37 over it.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const k = (process.argv[2] || "a").toLowerCase(), WIDTH = +(process.env.WIDTH || 1280);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
/* the planner's Buffs tab fills the example 25-man raid on a first visit, and that raid's Balance Druid lowers the hit cap
   to 48; this test checks its own numbers against the example buff setup (cap 95), so the Buffs tab starts "by hand" */
await ctx.addInitScript(() => { try { if (!sessionStorage.getItem("pd-buffs-c")) sessionStorage.setItem("pd-buffs-c", JSON.stringify({ src: "hand", seat: null, edits: 0 })); } catch (e) {} });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 120 : 450);
const text = async () => (await p.locator("#cmpui").innerText()).replace(/\s+/g, " ");
const pickOther = async id => { if (k === "c") return; await p.locator(`#cmpui [data-other="${id}"]`).click(); await settle(); };
const equipBtn = id => k === "c" ? p.locator(`#cmpui [data-equip="${id}"]`) : p.locator('#cmpui [data-act="equip"]');

await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${k === "p" ? "planner.html" : `compare-${k}.html`}`)).href);
await p.waitForTimeout(process.env.RM ? 900 : 2800);
/* start from the recommended set */
await p.locator("#t-gear").click(); await settle(); await p.locator("#gx-rec").click(); await settle(); await p.locator("#t-compare").click(); await settle();
await step("opens on Compare and shows the Head swap: −8 hit, 140 → 132", async () => {
  expect(await p.locator("#p-compare").isVisible(), "Compare panel hidden");
  await p.locator('#cmpui [data-cslot="Head"]').click(); await settle(); await pickOther("furious-gizmatic-goggles");
  const t = await text();
  expect(/Furious Gizmatic Goggles/.test(t), "Goggles not shown");
  expect(/[−-]8/.test(t) && /132/.test(t), "no −8 / 132 in: " + t.slice(0, 200));
});
if (k === "p") await step("the summary says the trade in one sentence", async () => {
  const t = (await p.locator("#cmpui .ca-sum").innerText()).replace(/\s+/g, " ");
  expect(/You gain \+6 Crit/.test(t) && /lose .*[−-]8 Hit/.test(t) && /keeps you 37 over the hit cap, where extra hit only helps white swings \(140 → 132\)/.test(t) && /example/i.test(t), "summary reads: " + t);
});
await step("switching slot to Main Hand shows its ranked items", async () => {
  await p.locator('#cmpui [data-cslot="Main Hand"]').click(); await settle();
  const t = await text(); expect(/Dragonmaw/.test(t) && /Dragonstrike/.test(t), "Main Hand items missing");
});
await step("equip from Compare: Dragonmaw shows in the Gear tab", async () => {
  await pickOther("dragonmaw");
  await equipBtn("dragonmaw").first().click(); await settle();
  await p.locator("#t-gear").click(); await settle();
  const g = (await p.locator('#gearui-b [data-slot="Main Hand"]').innerText()).replace(/\s+/g, " ");
  expect(/Dragonmaw/.test(g), "Gear tab Main Hand reads " + g);
});
await step("a Gear-tab change shows in Compare (part-geared: Warbringer worn on Head)", async () => {
  await p.locator("#gx-part").click(); await settle();
  await p.locator("#t-compare").click(); await settle();
  await p.locator('#cmpui [data-cslot="Head"]').click(); await settle();
  const t = await text(); expect(/Warbringer Battle-Helm/.test(t) && /worn|You wear|Currently equipped/i.test(t), "Head compare doesn't show Warbringer as worn");
});
if (k === "c") await step("pins: unpinning hides the head-to-head; pinning two brings it back", async () => {
  const pins = p.locator("#cmpui [data-pin]");
  const checked = async () => (await pins.evaluateAll(xs => xs.filter(x => x.checked).length));
  expect(await checked() === 2, "not two pinned by default");
  /* the page redraws the table on every pin change, so click and re-read rather than uncheck() the old element */
  await p.locator("#cmpui [data-pin]:checked").first().click(); await settle();
  expect(await checked() === 1, "unpinning didn't stick: " + await checked() + " pinned");
  expect(!(await p.locator("#cmpui .cc-h2h").count()), "head-to-head still shown with one pin");
  await p.locator("#cmpui [data-pin]:not(:checked)").first().click(); await settle();
  expect(await checked() === 2, "pinning didn't take");
  expect(await p.locator("#cmpui .cc-h2h").count() === 1, "head-to-head not back");
});
await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("compare controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#cmpui button, #cmpui input")].filter(x => { const t = x.type === "checkbox" && x.closest("label") ? x.closest("label") : x; return x.offsetParent && t.getBoundingClientRect().height < 44; }) /* a checkbox counts its clickable label */.map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.type).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
/* leave the shared character as the recommended set */
await p.locator("#t-gear").click(); await settle(); await p.locator("#gx-rec").click(); await settle();
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${k === "p" ? "planner compare" : "compare-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
