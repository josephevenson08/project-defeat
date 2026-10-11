// Hands-on test of the three front-door designs (front-a/b/c.html), the live app's 5-card section picker reworked.
// Run from the repo root:
//   node docs/design/prototypes/tabs/checks/front-handson.mjs a|b|c   (WIDTH=400 for a phone, RM=1 for reduced motion)
// What every design must do: open all five sections and the simulator, name each door by its title alone (the
// usability study's screen-reader user heard five paragraph-long names), state the real counts from src/ (front-data.js:
// 5 raids, 24 bosses, the drops, 13 professions), and bring a character in from the game: a bad paste is refused in a
// sentence, an export with no talents asks the spec first, and the example /pdexport lands on the planner wearing it
// (the Gear tab's part-geared example, Warbringer Battle-Helm on Head).
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const k = (process.argv[2] || "a").toLowerCase(), WIDTH = +(process.env.WIDTH || 1280);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(5000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 120 : 350);
const URL = pathToFileURL(path.resolve(`docs/design/prototypes/tabs/front-${k}.html`)).href;
const open = async () => { await p.goto(URL); await p.waitForTimeout(800); };
const front = p.locator("#front");
const text = async () => (await front.innerText()).replace(/\s+/g, " ");

/* each design names its doors its own way: A and C by the section, B by the goal */
const NAMES = k === "b"
  ? [["Gear my character", "planner.html"], ["Simulate my DPS", "simulation.html"], ["Plan a raid", "raid-composition.html"], ["See where my spec stands", "tier-lists.html"], ["Find what drops where", "raids.html"], ["Level a profession", "professions.html"]]
  : [["Character Planner", "planner.html"], ["Simulation", "simulation.html"], ["Raid Composition", "raid-composition.html"], ["Spec Tier Lists", "tier-lists.html"], ["Raids", "raids.html"], ["Professions", "professions.html"]];
const openImport = async () => {
  if (k === "a") await front.locator('[data-act="open"]').click();
  if (k === "b") await front.locator('[data-act="toggle"]').click();
  if (k === "c") await front.locator('[data-k="arrive"]').click();
  await settle();
};
const box = () => front.locator("textarea:visible").first();

await open();
await step("all five sections and the simulator, each door named by its title alone", async () => {
  for (const [name, href] of NAMES) {
    const door = p.getByRole("link", { name, exact: true });
    expect(await door.count() >= 1, `no door named exactly "${name}"`);
    expect((await door.first().getAttribute("href")) === href, `"${name}" goes to ${await door.first().getAttribute("href")}`);
  }
});
await step("the doors say what they do: each has its sentence as a description", async () => {
  const described = await p.evaluate(() => [...document.querySelectorAll("#front a[aria-describedby]")].filter(a => a.getAttribute("aria-describedby").split(" ").every(id => { const el = document.getElementById(id); return el && el.textContent.trim().length > 20 || (el && /\d/.test(el.textContent)); })).length);
  expect(described >= 6, `${described} doors carry a description`);
});
await step("the counts are the data's: 5 raids, 24 bosses, every drop, 13 professions", async () => {
  const F = await p.evaluate(() => window.FRONT_DATA);
  if (k === "c") { await front.locator('[data-k="raids"]').focus(); await settle(); }
  const t = await text();
  const want = k === "b" ? ["five raids"] : [`${F.raids.length} raids`, `${F.bosses} bosses`, `${F.drops} drops`];
  for (const w of want) expect(t.toLowerCase().includes(w.toLowerCase()), `missing "${w}"`);
  if (k !== "b") { if (k === "c") { await front.locator('[data-k="professions"]').focus(); await settle(); } expect((await text()).includes(`${F.professions} professions`), "no profession count"); }
  expect(F.bosses === 24 && F.raids.length === 5 && F.professions === 13, JSON.stringify({ r: F.raids.length, b: F.bosses, p: F.professions }));
});
if (k === "c" && WIDTH >= 900) await step("arrow keys move along the rail, and the preview follows", async () => {
  await front.locator('[data-k="planner"]').focus(); await settle();
  await p.keyboard.press("ArrowDown"); await settle();
  expect(await p.evaluate(() => document.activeElement && document.activeElement.dataset.k) === "simulation", "focus didn't move to Simulation");
  expect(/Enter Simulation/.test(await text()), "the preview didn't follow");
});
await step("a broken paste is refused in a sentence, and nothing moves", async () => {
  await openImport();
  await box().fill("this is not an export"); await front.locator('[data-act="load"]:visible').first().click(); await settle();
  expect(/isn't a build link, build text or an addon export/.test(await text()), "no refusal: " + (await text()).slice(0, 300));
  expect(/front-/.test(p.url()), "navigated away");
});
await step("an export with no talents asks which spec before it goes", async () => {
  const bare = await p.evaluate(() => { const d = JSON.parse(window.FrontKit.exampleExport()); d.talents = []; return JSON.stringify(d); });
  await box().fill(bare); await front.locator('[data-act="load"]:visible').first().click(); await settle();
  expect(/can't say which spec it is/.test(await text()) && await front.locator('[data-spec="Fury"]:visible').count() > 0, "no spec question");
  expect(/front-/.test(p.url()), "navigated before the answer");
});
await step("the example export lands on the planner wearing it", async () => {
  await open(); await openImport();
  await front.locator('[data-act="example"]:visible').first().click(); await settle();
  await Promise.all([p.waitForURL(/planner\.html/, { timeout: 15000 }), front.locator('[data-act="load"]:visible').first().click()]);
  await p.waitForTimeout(1500);
  const head = (await p.locator('#gearui-b [data-slot="Head"]').innerText()).replace(/\s+/g, " ");
  expect(/Warbringer Battle-Helm/.test(head), "Head on the planner: " + head);
});
await open();
await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("front-door controls are at least 44px on a phone", async () => {
  await openImport();
  const small = await p.evaluate(() => [...document.querySelectorAll("#front a, #front button")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`front-${k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
