// Hands-on test of the three Talents designs (talents-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/talents-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = planner.html, the chosen Talents tab (design A's talent window with design C's "What's off" list).
// Real numbers: the stored wowsims Fury preset is 9 / 39 / 0 (48 of 61 points) and breaks 3 rules (Flurry without
// Enrage, Arms rows 3-4 short of points, Fury rows 6-9 short of points); Enrage 5/5 fixes 2 of them. Precision 3/3 puts
// the special-attack hit cap at 95 rating, 2/3 at 111; the recommended gear has 140 hit.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const k = (process.argv[2] || "a").toLowerCase(), WIDTH = +(process.env.WIDTH || 1280), PHONE = WIDTH < 900;
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 120 : 300);
const text = async () => (await p.locator("#talui").innerText()).replace(/\s+/g, " ");
const msg = async () => (await p.locator("#talui .okline[aria-live]").first().innerText()).replace(/\s+/g, " ");
const tal = name => p.locator(`#talui .tk-tal[aria-label^="${name},"]`);
const rankOf = async name => +((await tal(name).first().getAttribute("aria-label")).match(/, (\d+) of \d+/) || [0, -1])[1];
/* one tree at a time (B always; A and C on a phone): pick the tree first */
async function showTree(spec) { const t = p.locator(`#talui [data-ttree="${spec}"]`); if (await t.count() && await t.first().isVisible()) { await t.first().click(); await settle(); } }
const hitRow = async () => (await p.locator("#hitwarn").innerText()).replace(/\s+/g, " ");
const probCount = async () => { const t = await text(); const m = t.match(/breaks (\d+) (?:of the game's )?rules?/); return m ? +m[1] : 0; };

await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${k === "p" ? "planner.html" : `talents-${k}.html`}`)).href);
await p.waitForTimeout(process.env.RM ? 900 : 2800);
const openedOnGear = k === "p" ? await p.locator("#p-gear").isVisible() : null;
/* start from the recommended gear and the stored Fury preset */
await p.locator("#t-gear").click(); await settle(); await p.locator("#gx-rec").click(); await settle();
await p.locator("#t-talents").click(); await settle();
await p.locator('#talui [data-tpreset="Fury"]').click(); await settle();

if (k === "p") await step("the planner still opens on the Gear tab", async () => { expect(openedOnGear, "Gear panel not shown on load"); });
await step("opens on Talents with the stored Fury preset: 9 / 39 / 0, 13 points left", async () => {
  expect(await p.locator("#p-talents").isVisible(), "Talents panel hidden");
  const t = await text();
  expect(/Points left 13/.test(t) && /9 \/ 39 \/ 0/.test(t), "points line reads: " + t.slice(0, 220));
  const n = await p.locator("#talui .tk-tal").count();
  expect(n === (k === "b" ? 21 : 66), `${n} talent buttons`);
  const img = await p.evaluate(() => { const i = [...document.querySelectorAll("#talui .tk-tal img")].find(x => x.offsetParent); return !!i && i.complete && i.naturalWidth > 0; });
  expect(img, "talent icon didn't load");
});
await step("the preset's 3 broken rules are shown, Flurry's first", async () => {
  expect(await probCount() === 3, "rule count " + await probCount());
  const t = await text(); expect(/Flurry needs Enrage at 5\/5/.test(t) || k === "a", "Flurry problem missing");
  if (k === "a") { await p.locator("#talui .ta-probs summary").click(); await settle(); expect(/Flurry needs Enrage at 5\/5/.test(await text()), "A's list doesn't name Flurry"); }
  expect(await p.locator('#talui .tk-tal.bad.req[aria-label^="Flurry,"]').count() === 1, "Flurry not marked");
});
await step("the stat bar's hit cap follows Precision 3/3: 140 / 95, 45 over", async () => {
  const h = await hitRow(); expect(/140 \/ 95/.test(h) && /45 over/.test(h) && /3% of it from Precision/.test(h), "hit row reads " + h);
});
await step("a locked talent refuses a point and says why", async () => {
  await showTree("Protection");
  await tal("Last Stand").click(); await settle();
  const m = await msg(); expect(/Can't learn Last Stand: Needs 10 points in Protection first. You have 0./.test(m), "message: " + m);
  expect(await rankOf("Last Stand") === 0, "Last Stand took a point");
});
await step("click learns a point and right-click unlearns it (Booming Voice)", async () => {
  await showTree("Fury");
  await tal("Booming Voice").click(); await settle();
  expect(await rankOf("Booming Voice") === 1, "not 1/5 after click");
  expect(/Points left 12/.test(await text()), "points left not 12");
  await tal("Booming Voice").click({ button: "right" }); await settle();
  expect(await rankOf("Booming Voice") === 0, "not 0/5 after right-click");
  expect(/Points left 13/.test(await text()), "points left not back to 13");
});
await step("unlearning under a dependent is refused: Bloodthirst needs Sweeping Strikes", async () => {
  await tal("Sweeping Strikes").click({ button: "right" }); await settle();
  const m = await msg(); expect(/Can't unlearn Sweeping Strikes: Bloodthirst needs Sweeping Strikes at 1\/1\./.test(m), "message: " + m);
  expect(await rankOf("Sweeping Strikes") === 1, "Sweeping Strikes lost its point");
});
await step("Precision moves the hit cap: 2/3 → 111, back to 3/3 → 95", async () => {
  await tal("Precision").click({ button: "right" }); await settle();
  let h = await hitRow(); expect(/140 \/ 111/.test(h) && /29 over/.test(h), "after unlearning: " + h);
  if (k === "b") { const t = await text(); expect(/Hit cap for special attacks: 111 rating/.test(t) && /\+2% melee hit chance/.test(t), "B's list didn't follow: " + t.slice(0, 400));
    expect(/Now \+2% melee hit chance\./.test(await msg()), "B's message: " + await msg()); }
  await tal("Precision").click(); await settle();
  h = await hitRow(); expect(/140 \/ 95/.test(h), "after relearning: " + h);
});
await step("keyboard: Enter learns, minus unlearns, arrows move", async () => {
  await tal("Booming Voice").focus(); await p.keyboard.press("Enter"); await settle();
  expect(await rankOf("Booming Voice") === 1, "Enter didn't learn");
  await p.keyboard.press("-"); await settle();
  expect(await rankOf("Booming Voice") === 0, "minus didn't unlearn");
  await p.keyboard.press("ArrowRight"); await settle();
  const f = await p.evaluate(() => document.activeElement && document.activeElement.getAttribute("aria-label"));
  expect(/^Cruelty,/.test(f || ""), "focus after ArrowRight: " + f);
});
await step("the − and + buttons work without a right-click", async () => {
  await tal("Booming Voice").click(); await settle(); /* learns one and selects it */
  await p.locator('#talui [data-tstep="-1"]').first().click(); await settle();
  expect(await rankOf("Booming Voice") === 0, "− didn't unlearn");
  await p.locator('#talui [data-tstep="1"]').first().click(); await settle();
  expect(await rankOf("Booming Voice") === 1, "+ didn't learn");
  await p.locator('#talui [data-tstep="-1"]').first().click(); await settle();
});
await step("Enrage 5/5 fixes Flurry and the Fury rows: 3 rules broken → 1", async () => {
  if (k === "c" || k === "p") {
    await p.locator("#talui [data-tfix]").first().click(); await settle();
    const m = await msg(); expect(/Added 5 points to Enrage \(5\/5\): that fixed 2 problems\./.test(m), "message: " + m);
  } else for (let i = 0; i < 5; i++) { await tal("Enrage").click(); await settle(); }
  expect(await rankOf("Enrage") === 5, "Enrage at " + await rankOf("Enrage"));
  expect(await probCount() === 1, "rules still broken: " + await probCount());
  expect(!(await p.locator('#talui .tk-tal.bad[aria-label^="Flurry,"]').count()), "Flurry still marked");
});
if (k === "a" || k === "p") await step("A: the selected talent's tooltip reads like the game's", async () => {
  await tal("Flurry").click({ button: "right" }); await settle(); /* select Flurry (and drop it to 4/5) */
  const t = (await p.locator("#talui .ta-tipbox").innerText()).replace(/\s+/g, " ");
  expect(/Flurry/.test(t) && /Rank 4\/5/.test(t) && /Next rank:/.test(t) && /In the simulation: \+20% attack speed/.test(t), "tooltip: " + t);
  await tal("Flurry").click(); await settle();
});
if (k === "b") await step("B: the list adds up the build and says what isn't simulated", async () => {
  const t = await text();
  expect(/\+5% melee crit chance/.test(t) && /\+25% off-hand damage/.test(t) && /\+10% attack power in Berserker Stance/.test(t), "simulated lines missing");
  expect(/Spent, but not simulated/i.test(t) && /Rampage/.test(t) && /Enrage/.test(t), "not-simulated list missing");
  await p.locator('#talui .tb-chip[data-tsel]').filter({ hasText: "Rampage" }).first().click(); await settle();
  expect(/Rampage/.test((await p.locator("#talui .tb-sel").innerText())), "chip didn't select Rampage");
});
if (k === "c") await step("C: against the Arms preset, Match brings a talent level with it", async () => {
  await p.locator('#talui [data-tvs="Arms"], [data-tvs="Arms"]').first().click(); await settle();
  let t = await text(); const m1 = t.match(/differs from the Arms preset in (\d+) talents/); expect(m1, "summary: " + t.slice(0, 200));
  await p.locator('#talui [data-tmatch][aria-label*="Deflection"]').click(); await settle();
  t = await text(); const m2 = t.match(/differs from the Arms preset in (\d+) talents/);
  expect(m2 && +m2[1] === +m1[1] - 1, `differences ${m1[1]} → ${m2 && m2[1]}`);
  await p.locator('[data-tvs="Fury"]').first().click(); await settle();
  await p.locator("#talui [data-thint]").first().click(); await settle();
  expect(await p.locator("#talui .tk-tal.tk-hint").count() > 0, "Show where lit nothing");
  expect(/glowing/.test(await msg()), "message: " + await msg());
});
if (k === "p") await step("What's off: Show where lights the Arms talents that can take a point, and Hide clears it", async () => {
  const t = (await p.locator("#talui .ta-off").innerText()).replace(/\s+/g, " ");
  expect(/breaks 1 of the game's rules and leaves 8 points unspent/.test(t) && /Arms is 8 points short in rows 1–2/.test(t), "What's off reads: " + t);
  await p.locator('#talui [data-thint="Arms"]').click(); await settle();
  const n = await p.locator("#talui .tk-tal.tk-hint").count();
  expect(n > 0 && /glowing/.test(await msg()), `${n} lit; message: ${await msg()}`);
  await p.locator('#talui [data-thint="Arms"]').click(); await settle();
  expect(!(await p.locator("#talui .tk-tal.tk-hint").count()), "Hide left talents lit");
});
await step("reload keeps the build", async () => {
  const before = await rankOf("Enrage");
  await p.reload(); await p.waitForTimeout(process.env.RM ? 900 : 2500);
  await p.locator("#t-talents").click(); await settle(); await showTree("Fury");
  expect(await rankOf("Enrage") === before && before === 5, `Enrage ${before} → ${await rankOf("Enrage")}`);
});
await step("the Gear tab still works and shows the same cap", async () => {
  await p.locator("#t-gear").click(); await settle();
  expect(await p.locator("#gearui-b").isVisible(), "character sheet hidden");
  expect(/\/ 95/.test(await hitRow()), "hit row: " + await hitRow());
  await p.locator("#t-talents").click(); await settle();
});
await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("talent controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#talui button, #talui summary")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44).map(x => (x.textContent.trim() || x.getAttribute("aria-label") || "").slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
/* leave the shared build as the stored Fury preset and the gear as the recommended set */
try {
  await p.locator("#t-talents").click(); await settle(); await p.locator('#talui [data-tpreset="Fury"]').click(); await settle();
  await p.locator("#t-gear").click(); await settle(); await p.locator("#gx-rec").click(); await settle();
} catch (e) { results.push(["FAIL", "reset at the end", String(e.message || e).split("\n")[0]]); }
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${k === "p" ? "planner talents" : "talents-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
