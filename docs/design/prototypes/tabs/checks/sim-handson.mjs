// Hands-on test of the three Simulation designs (sim-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/sim-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = simulation.html: the chosen design (window.SIM_PICKED = "c+a": design C with design A's damage sources and breakdown
// under the estimate), so p runs C's steps and the damage-source check.
// The numbers must be the live app's: with the app's dev server up (APP= its address, default http://localhost:5173/),
// the planner character's share link is opened in the app, its Simulation is run, and the app's estimate must equal
// the design's to the decimal. APP=off skips that step. Every design must show the estimate against Fury's observed
// 2,053 DPS (archon.gg), and its damage sources must add up to it.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
let k = (process.argv[2] || "a").toLowerCase();
const WIDTH = +(process.env.WIDTH || 1280), APP = process.env.APP || "http://localhost:5173/";
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(8000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = (ms) => p.waitForTimeout(ms || (process.env.RM ? 200 : 500));
const ui = p.locator("#simui");
const text = async (loc = ui) => (await loc.innerText()).replace(/\s+/g, " ");
const num = s => +String(s).replace(/[^\d.\-−]/g, "").replace("−", "-");
/* what the engine says for the planner character right now (the design must show the same) */
const engineScore = () => p.evaluate(() => { const r = window.PDSim.run(window.BuildKit.snapshot()); return r.ok ? r.simulation.score : null; });

const page = process.argv[2] === "p" ? "simulation.html" : `sim-${k}.html`;
await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${page}`)).href);
await p.waitForTimeout(process.env.RM ? 1200 : 3000);
if (process.argv[2] === "p") { k = await p.evaluate(() => window.SIM_PICKED || ""); expect(/^[abc]/.test(k), "simulation.html has no chosen design"); }
const D = k[0], hasTable = D === "a" || k.includes("+a");

/* the design's headline number */
async function shown() {
  if (D === "a") { const run = ui.locator('[data-act="run"]'); if (await run.count()) { await run.click(); await settle(900); } return num(await ui.locator("#sa-score").innerText()); }
  if (D === "b") return num(await ui.locator("#sb-now").innerText());
  await ui.locator(".sc-est .big").waitFor({ timeout: 20000 }); return num(await ui.locator(".sc-est .big").innerText());
}

let score = 0;
await step("the estimate is the engine's, for the planner's character", async () => {
  score = await shown(); const e = await engineScore();
  expect(score > 0 && Math.abs(score - e) < 0.05, `shown ${score}, engine ${e}`);
});
if (APP !== "off") await step("the live app gives the same estimate for the same character", async () => {
  const link = await p.evaluate(async () => window.BuildKit.linkFor(window.BuildKit.snapshot()));
  const app = await ctx.newPage();
  try { await app.goto(APP + link.slice(link.indexOf("#")), { waitUntil: "domcontentloaded" }); } catch (e) { throw new Error(`the app isn't running at ${APP}: start it with npm run dev, or set APP=off`); }
  await app.getByTestId("share-notice").waitFor({ timeout: 15000 });
  await app.getByRole("button", { name: "Simulation", exact: true }).click();
  await app.getByRole("button", { name: /run simulation/i }).click();
  const got = num(await app.getByTestId("simulation-score").innerText());
  await app.close();
  expect(Math.abs(got - score) < 0.05, `app ${got}, design ${score}`);
});
await step("against what Fury warriors average: 2,053 (archon.gg)", async () => {
  const t = await text(); expect(/2,053/.test(t) && /× below what Fury warriors average/.test(t), "no comparison: " + t.slice(0, 300));
});

if (hasTable) await step("damage sources add up to the estimate", async () => {
    const dps = (await ui.locator(".sm-src tbody td:nth-child(2)").allInnerTexts()).map(num);
    const sum = dps.reduce((a, x) => a + x, 0);
    expect(dps.length > 1 && Math.abs(sum - score) < 0.5, `sources ${dps.join("+")} = ${sum}, estimate ${score}`);
  });
if (D === "a") {
  await step("stat priority and the upgrade finder open in their tabs", async () => {
    await ui.locator('[data-tab="weights"]').click(); await ui.locator(".sm-w li").first().waitFor({ timeout: 20000 });
    expect(/Strength/.test(await text()), "no Strength weight");
    await ui.locator('[data-tab="upgrades"]').click(); await settle();
    expect(await ui.locator(".sm-up li").count() > 0, "no upgrades listed");
  });
  await step("a change on the planner asks for a new run", async () => {
    await p.evaluate(() => window.GearKit.store("planner").set(window.GearKit.partGeared(), "test")); await settle();
    expect(/The character changed\. Run it again/.test(await text()), "no prompt: " + (await text()).slice(0, 200));
    const s2 = await shown(), e2 = await engineScore(); expect(Math.abs(s2 - e2) < 0.05 && Math.abs(s2 - score) > 0.05, `after change shown ${s2}, engine ${e2}, before ${score}`);
  });
}

if (D === "b") {
  await step("switching Battle Shout off lowers the estimate against the baseline", async () => {
    await ui.locator('[data-buff="battle-shout"]').click(); await settle();
    const t = await text(ui.locator(".sb-delta"));
    expect(/^−[\d.,]+ DPS \(−[\d.]+%\)$/.test(t), "delta: " + t);
    expect(num(await ui.locator("#sb-now").innerText()) < score, "now not below the baseline");
  });
  await step("a flask replaces both elixirs", async () => {
    await ui.locator('[data-pane="cons"]').click(); await settle();
    await ui.locator('select[data-cat="battle"]').selectOption("elixir-of-major-strength"); await settle();
    await ui.locator('select[data-cat="flask"]').selectOption("flask-of-relentless-assault"); await settle();
    expect(await ui.locator('select[data-cat="battle"]').inputValue() === "", "the battle elixir stayed with a flask");
  });
  await step("undo returns to the baseline", async () => {
    await ui.locator('[data-act="undo"]').click(); await settle();
    expect(/No change/.test(await text(ui.locator(".sb-delta"))), "still changed");
  });
  await step("trying the finder's best upgrade raises the estimate by about what it promised", async () => {
    await ui.locator('[data-pane="gear"]').click(); await ui.locator("[data-try]").first().waitFor({ timeout: 20000 });
    const promised = num(await ui.locator(".sm-up li .d").first().innerText());
    await ui.locator("[data-try]").first().click(); await settle();
    const now = num(await ui.locator("#sb-now").innerText());
    expect(Math.abs((now - score) - promised) < 0.2, `promised ${promised}, got ${now - score}`);
    await ui.locator('[data-act="undo"]').click(); await settle();
  });
  await step("keep a buff change on the planner: the planner's buffs change", async () => {
    await ui.locator('[data-pane="buffs"]').click(); await settle();
    await ui.locator('[data-buff="battle-shout"]').click(); await settle();
    await ui.locator('[data-act="keep"]').click(); await settle();
    const on = await p.evaluate(() => window.BuffKit.store("planner").get().on.includes("battle-shout"));
    expect(!on, "Battle Shout still on in the planner's buffs");
    expect(/No change/.test(await text(ui.locator(".sb-delta"))), "the kept build isn't the new baseline");
  });
}

if (D === "c") {
  await step("it leads with the stat priority and the best upgrade", async () => {
    const t = await text(); expect(/Gem and enchant for Strength/.test(t), "priority: " + t.slice(0, 300));
    expect(/The biggest single gain is/.test(t) && await ui.locator(".sm-up li").count() > 0, "no upgrades");
  });
  await step("the trust panel lists all 20 DPS specs, with Fury marked", async () => {
    expect(await ui.locator(".sm-specs li").count() === 20, "specs: " + await ui.locator(".sm-specs li").count());
    expect(/Fury Warrior/.test(await text(ui.locator(".sm-specs li.me"))), "Fury not marked");
    expect(/1\.05× to 2\.13× low/.test(await text(ui.locator(".sm-trust"))), "range: " + await text(ui.locator(".sm-trust .prov")));
  });
  await step("a change on the planner re-runs everything", async () => {
    await p.evaluate(() => window.GearKit.store("planner").set(window.GearKit.partGeared(), "test"));
    await p.waitForFunction(() => document.querySelector("#simui .sc-est .big"), null, { timeout: 20000 }); await settle();
    const s2 = await shown(), e2 = await engineScore(); expect(Math.abs(s2 - e2) < 0.05 && Math.abs(s2 - score) > 0.05, `after change shown ${s2}, engine ${e2}`);
  });
}

await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("Simulation controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#simui button, #simui select, #simui a.sm-btn")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${process.argv[2] === "p" ? "simulation (" + k + ")" : "sim-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
