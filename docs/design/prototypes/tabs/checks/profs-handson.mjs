// Hands-on test of the three Professions designs (profs-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/profs-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = professions.html once a design is built into it (it sets window.PROFS_DESIGN, and window.PROFS_ALSO for a
// design merged into it), and runs those designs' steps.
// Real numbers from prof-data.js: 13 professions, 9 crafting paths (198 steps), 4 gathering guides (32 ranges). Rough
// Sharpening Stone is orange at 1 and green at 40 (its colours are 1/15/35/55). Blacksmithing from 1 buys 34s from
// vendors; Mining feeds 97% of its farmed materials; for Fury, Blacksmithing makes Dragonstrike, the #1 main hand.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
let k = (process.argv[2] || "a").toLowerCase();
const WIDTH = +(process.env.WIDTH || 1280);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = (ms) => p.waitForTimeout(ms || (process.env.RM ? 150 : 450));
const ui = p.locator("#profui");
const text = async (loc = ui) => (await loc.innerText()).replace(/\s+/g, " ");
const page = k === "p" ? "professions.html" : `profs-${k}.html`;
const url = pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${page}`)).href;
const open = async h => { await p.goto("about:blank"); await p.goto(url + (h || "")); await p.waitForTimeout(process.env.RM ? 900 : 2600); };
const clearStore = () => p.evaluate(() => { try { Object.keys(sessionStorage).filter(x => /^pd-prof/.test(x)).forEach(x => sessionStorage.removeItem(x)); } catch (e) {} });
await p.goto(url); await clearStore();
await open();
const planner = k === "p";
let also = [];
if (planner) { k = await p.evaluate(() => window.PROFS_DESIGN || ""); also = await p.evaluate(() => window.PROFS_ALSO || []); expect(/^[abc]$/.test(k), "professions.html has no chosen design"); }
const runs = d => k === d || also.includes(d);
const setSkill = async (sel, v) => { await ui.locator(sel).fill(String(v)); await ui.locator(sel).press("Enter"); await ui.locator(sel).blur().catch(() => {}); await settle(); };

/* ---------- every design ---------- */
await step("the live app's data: 13 professions, 9 crafting paths (198 steps), 4 gathering guides (32 ranges)", async () => {
  const c = await p.evaluate(() => { const P = window.PROF_DATA.profs; return [P.length, P.filter(x => x.craft).length, P.reduce((a, x) => a + (x.craft ? x.craft.length : 0), 0), P.filter(x => x.gather).length, P.reduce((a, x) => a + (x.gather ? x.gather.length : 0), 0)].join(","); });
  expect(c === "13,9,198,4,32", c);
});
await step("the tab keeps its amber scene", async () => {
  const t = await p.evaluate(() => document.documentElement.dataset.tbcTheme || "");
  expect(t === "profs", "theme " + t);
});

/* ---------- A · the profession window ---------- */
if (runs("a")) {
  await step("Blacksmithing at skill 1: 33 recipes, four trainer stops, Rough Sharpening Stone orange", async () => {
    expect(await ui.locator(".pa-list .pa-r").count() === 33, "rows " + await ui.locator(".pa-list .pa-r").count());
    expect(await ui.locator(".pa-list .pa-train").count() === 4, "stops " + await ui.locator(".pa-list .pa-train").count());
    expect(await ui.locator('.pa-r[data-step="0"] b.pk-c-orange').count() === 1, "first recipe not orange");
  });
  await step("at skill 40 it turns green, and You moves to Rough Grinding Stone", async () => {
    await setSkill("#pa-sk", 40);
    expect(await ui.locator('.pa-r[data-step="0"] b.pk-c-green').count() === 1, "not green");
    expect(/Rough Grinding Stone/.test(await text(ui.locator('.pa-r[aria-current="true"]'))), "current: " + await text(ui.locator('.pa-r[aria-current="true"]')));
  });
  await step("a recipe shows its reagents, who gathers them, and its colours", async () => {
    await ui.locator(".pa-r", { hasText: "Gemmed Copper Gauntlets" }).click(); await settle();
    const t = await text(ui.locator(".pa-detail"));
    expect(/Copper Bar/.test(t) && /Farmed: Mining/.test(t) && /yellow/i.test(t), "detail: " + t.slice(0, 300));
  });
  await step("Mining: 9 ranges; 325-350 is Adamantite with a route drawn on the grid", async () => {
    await ui.locator('[data-prof="Mining"]').click(); await settle();
    expect(await ui.locator(".pa-list .pa-r").count() === 9, "ranges " + await ui.locator(".pa-list .pa-r").count());
    await ui.locator(".pa-r", { hasText: "325–350" }).first().click(); await settle();
    expect(/Adamantite Ore/.test(await text(ui.locator(".pa-detail"))) && await ui.locator(".pa-detail .pk-route").count() === 1, "no Adamantite route");
    expect(await p.evaluate(() => location.hash) === "#mining", "hash " + await p.evaluate(() => location.hash));
  });
  await step("your skill in each profession survives a reload", async () => {
    await open("#blacksmithing");
    expect(await ui.locator("#pa-sk").inputValue() === "40", "skill " + await ui.locator("#pa-sk").inputValue());
  });
}

/* ---------- the tab's switch: Level it / Which two ---------- */
if (planner && also.includes("b")) {
  await step("the switch: Level it first, Which two shows the comparison, and the link says so", async () => {
    await p.evaluate(() => sessionStorage.removeItem("pd-prof-view")); await open();
    expect(await ui.locator('[data-view="level"]').getAttribute("aria-pressed") === "true" && await ui.locator(".pa-win").count() === 1, "window not first");
    await ui.locator('[data-view="which"]').click(); await settle();
    expect(await ui.locator(".pb-card").count() === 13 && !(await ui.locator(".pa-win").count()), "comparison not shown");
    expect(await p.evaluate(() => location.hash) === "#which", "hash " + await p.evaluate(() => location.hash));
  });
  await step("the view is remembered across a reload, and a profession link opens the window", async () => {
    await open(); expect(await ui.locator(".pb-card").count() === 13, "forgot the comparison");
    await open("#mining"); expect(/Mining/.test(await text(ui.locator("#pa-h"))), "#mining didn't open the window");
    await ui.locator('[data-view="which"]').click(); await settle();
  });
}

/* ---------- B · which two to take ---------- */
if (runs("b")) {
  await settle();
  await step("for Fury: Blacksmithing first, with Dragonstrike as the #1 main hand; Engineering's goggles next", async () => {
    const first = await text(ui.locator(".pb-grid").first().locator(".pb-card").first());
    expect(/Blacksmithing/.test(first) && /#1 Dragonstrike Main Hand · binds on pickup/.test(first), "first: " + first.slice(0, 200));
    expect(/Furious Gizmatic Goggles/.test(await text(ui.locator('.pb-card[data-card="Engineering"]'))), "no goggles");
  });
  await step("picking Mining and Blacksmithing: Mining feeds 97% of its farmed materials", async () => {
    await ui.locator('[data-pick="Mining"]').click(); await settle();
    await ui.locator('[data-pick="Blacksmithing"]').click(); await settle();
    const t = await text(ui.locator(".pb-pair"));
    expect(/Mining feeds Blacksmithing: 97% of its farmed materials/.test(t) && /including a first pick: Dragonstrike/.test(t), "pair: " + t.slice(0, 300));
    expect(await ui.locator('[data-pick="Tailoring"]').isDisabled(), "a third pick is allowed");
  });
  await step("another spec reorders the cards by what they make for it", async () => {
    await ui.locator("#pb-spec").selectOption("Druid|Feral"); await settle();
    const counts = await p.evaluate(() => [...document.querySelectorAll(".pb-grid")][0].querySelectorAll(".pb-card").length && [...[...document.querySelectorAll(".pb-grid")][0].querySelectorAll(".pb-card")].map(c => c.querySelectorAll(".pb-items li").length + (/and (\d+) more/.exec(c.textContent) ? +/and (\d+) more/.exec(c.textContent)[1] : 0)));
    expect(counts.every((n, i) => i === 0 || n <= counts[i - 1]), "not ordered: " + counts.join(","));
    expect(/For Feral Druid/i.test(await text()), "spec not shown");
  });
  await step("the pair and the spec survive a reload", async () => {
    await open();
    expect(/Mining feeds Blacksmithing/.test(await text(ui.locator(".pb-pair"))) && await ui.locator("#pb-spec").inputValue() === "Druid|Feral", "forgotten");
    await ui.locator("#pb-spec").selectOption("Warrior|Fury"); await settle();
  });
}

/* ---------- C · the road to 375 ---------- */
if (runs("c")) {
  if (also.includes("c")) { await ui.locator('[data-view="road"]').click(); await settle(); }
  await step("Blacksmithing from 1: 33 steps and four trainer stops on the road; 34s from vendors", async () => {
    await ui.locator('[data-prof="Blacksmithing"]').click(); await settle();
    await setSkill("#pc-sk", 1);
    expect(await ui.locator(".pc-road .pc-wp:not(.train)").count() === 33 && await ui.locator(".pc-road .pc-wp.train").count() === 4, "road");
    expect(/34s in all/.test(await text(ui.locator(".pc-shop"))), "vendor total: " + (await text(ui.locator(".pc-shop"))).slice(0, 200));
  });
  await step("at 200 the passed steps fold away and the list counts from your step's start", async () => {
    await setSkill("#pc-sk", 200);
    const exp = await p.evaluate(() => { const K = window.ProfKit, s = K.shopping(K.prof("Blacksmithing"), 200); return { from: s.from, cost: K.copper(s.cost) }; });
    expect(/steps behind you/.test(await text(ui.locator(".pc-road"))), "no fold");
    const t = await text(ui.locator(".pc-shop"));
    expect(new RegExp(`from ${exp.from}`).test(t) && t.includes(exp.cost), `shop: ${t.slice(0, 160)} / expected from ${exp.from}, ${exp.cost}`);
  });
  await step("Mining shows its routes on the grid, and costs time, not gold", async () => {
    await ui.locator('[data-prof="Mining"]').click(); await settle();
    await ui.locator(".pc-mapbtn").first().click(); await settle();
    expect(await ui.locator(".pc-road .pk-route").count() === 1, "no route");
    expect(/costs time, not gold/.test(await text(ui.locator(".pc-shop"))), "no note");
  });
}

await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("Professions controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#profui button, #profui input, #profui summary, #profui select")]
    .filter(x => x.offsetParent && x.type !== "checkbox" && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.id || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
await clearStore();
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${planner ? "professions.html (" + [k, ...also].join("+") + ")" : "profs-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
