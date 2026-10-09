// Hands-on test of the three Buffs designs (buffs-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/buffs-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = planner.html, once the chosen Buffs tab is built into it (window.BUFFS_IN_PLANNER says which design it is).
// Real numbers: Improved Faerie Fire's +3% hit lowers the special-attack cap from 95 to 48 rating with Precision 3/3
// (140 hit is then 92 over). The example setup adds +886 attack power and +7.8% crit, and takes the boss's 7,700 armor
// to 3,690 (6,290 without Sunder Armor). In the example 25-man, group 1 has no Enhancement Shaman, so no Strength of
// Earth Totem.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const arg = (process.argv[2] || "a").toLowerCase(), WIDTH = +(process.env.WIDTH || 1280);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 120 : 300);
const text = async () => (await p.locator("#bufui").innerText()).replace(/\s+/g, " ");
const msg = async () => (await p.locator("#bufui .okline[aria-live]").first().innerText()).replace(/\s+/g, " ");
const hitRow = async () => (await p.locator("#hitwarn").innerText()).replace(/\s+/g, " ");
const pressed = async sel => (await p.locator(sel).first().getAttribute("aria-pressed")) === "true";

await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${arg === "p" ? "planner.html" : `buffs-${arg}.html`}`)).href);
await p.waitForTimeout(process.env.RM ? 900 : 2800);
const openedOnGear = arg === "p" ? await p.locator("#p-gear").isVisible() : null;
/* which design: the planner says, through window.BUFFS_IN_PLANNER */
const k = arg === "p" ? await p.evaluate(() => window.BUFFS_IN_PLANNER || "") : arg;
/* the switch for a buff in each design */
/* the planner's C shows icon tiles (window.BUFFS_ICONS): the tile is the switch */
const icons = arg === "p" ? await p.evaluate(() => !!window.BUFFS_ICONS) : false;
const sw = id => k === "a" || icons ? `#bufui .bk-ic[data-bid="${id}"]` : k === "b" ? `#bufui .bb-sw[data-bid="${id}"]` : `#bufui [data-tog="${id}"]`;
await p.locator("#t-gear").click(); await settle(); await p.locator("#gx-rec").click(); await settle();
await p.locator("#t-buffs").click(); await settle();
/* start from the example setup (A, B) or the example 25-man (C) */
async function reset() { if (k === "c") await p.locator('#bufui [data-src="ex25"]').click(); else await p.locator(`#b${k}-example`).click(); await settle(); }
await reset();

if (arg === "p") await step("the planner still opens on the Gear tab", async () => { expect(openedOnGear, "Gear panel not shown on load"); expect(k, "BUFFS_IN_PLANNER not set"); });
await step("opens on Buffs with real buff icons", async () => {
  expect(await p.locator("#p-buffs").isVisible(), "Buffs panel hidden");
  const ok = await p.evaluate(() => { const i = [...document.querySelectorAll("#bufui img")].find(x => x.offsetParent); return !!i && i.complete && i.naturalWidth > 0; });
  expect(ok, "first visible icon didn't load");
  const t = await text(); expect(/Battle Shout/.test(t) && /Sunder Armor/.test(t) && /Roasted Clefthoof|Relentless Assault/.test(t), "buffs missing: " + t.slice(0, 200));
});
await step("Improved Faerie Fire moves the hit cap: 95 ↔ 48", async () => {
  const start = await hitRow();
  if (k === "c") expect(/140 \/ 48/.test(start) && /3% from Improved Faerie Fire/.test(start), "example raid's cap: " + start);
  else expect(/140 \/ 95/.test(start), "example setup's cap: " + start);
  await p.locator(sw("improved-faerie-fire")).click(); await settle();
  const h = await hitRow();
  if (k === "c") expect(/140 \/ 95/.test(h), "after switching it off: " + h);
  else expect(/140 \/ 48/.test(h) && /92 over/.test(h) && /3% from Improved Faerie Fire/.test(h), "after switching it on: " + h);
  await p.locator(sw("improved-faerie-fire")).click(); await settle();
  expect(/140 \/ (95|48)/.test(await hitRow()), "didn't switch back");
});
if (k === "c") await step("C: a buff switched by hand says so", async () => {
  await p.locator(sw("curse-of-recklessness")).click(); await settle();
  expect(await p.locator("#bufui .bc-tag.hand, #bufui .bk-badge").count() === 1 && /by hand/.test(await msg()), "no by-hand mark");
  await reset();
  expect(!(await p.locator("#bufui .bc-tag.hand, #bufui .bk-badge").count()), "choosing the raid again didn't undo it");
});
await step("Paladins: assigning a taken Blessing swaps it", async () => {
  /* A and B: Paladin 1 Kings, Paladin 2 Might. C: the example raid's Paladins, Kings then Might. */
  await p.locator('#bufui [data-pal="0"][data-bless="blessing-of-might"]').click(); await settle();
  expect(await pressed('#bufui [data-pal="0"][data-bless="blessing-of-might"]') && await pressed('#bufui [data-pal="1"][data-bless="blessing-of-kings"]'), "no swap");
  expect(/takes Greater Blessing of Kings instead/.test(await msg()), "message: " + await msg());
  await p.locator('#bufui [data-pal="0"][data-bless="blessing-of-salvation"]').click(); await settle();
  expect(/Salvation/.test(await msg()), "message: " + await msg());
  if (k === "a") expect(!(await pressed('#bufui .bk-ic[data-bid="blessing-of-might"]')), "Might still on");
  /* C has four Paladins: the Retribution Paladin gave Salvation, so Might moves to them */
  if (k === "c") expect(await pressed('#bufui [data-pal="2"][data-bless="blessing-of-might"]'), "Might didn't move to the Paladin who gave Salvation");
  await reset();
});
if (k !== "c") await step("Paladins: add one, then remove it", async () => {
  const rows = async () => p.locator("#bufui .bk-pal").count();
  const n = await rows();
  await p.locator("#bufui [data-paladd]").click(); await settle();
  expect(await rows() === n + 1, "no row added");
  await p.locator(`#bufui [data-palrm="${n}"]`).click(); await settle();
  expect(await rows() === n, "row not removed");
});
await step("an elixir takes out the flask", async () => {
  if (k === "a") { await p.locator('#bufui [data-slot="battle"]').click(); await settle(); }
  await p.locator('#bufui [data-ccat="battle"][data-cid="elixir-of-major-strength"]').click(); await settle();
  expect(/Took out Flask of Relentless Assault/.test(await msg()), "message: " + await msg());
  if (k === "a") expect(/Empty/.test(await p.locator('#bufui [data-slot="flask"]').innerText()), "flask slot not empty");
  else expect(await pressed('#bufui [data-ccat="flask"][data-cid=""]'), "flask not set to None");
  await reset();
});
if (k !== "c") await step("a buff the simulator doesn't count says why", async () => {
  await p.locator(sw("windfury-totem")).click(); await settle();
  expect(/Windfury Totem isn't counted: it is an extra swing, not a stat\./.test(await msg()), "message: " + await msg());
});
if (k === "a") await step("A: the selected buff's tooltip sits under the bar", async () => {
  await p.locator(sw("unleashed-rage")).click(); await settle();
  const t = (await p.locator("#bufui .ba-tipbox").innerText()).replace(/\s+/g, " ");
  expect(/Unleashed Rage/.test(t) && /\+10% attack power, counted as \+9\.4%/.test(t), "tooltip: " + t);
  await reset();
});
if (k === "b") await step("B: the total adds up, and a change lights its line", async () => {
  const t = await text();
  expect(/Attack power \+886/.test(t) && /Crit \+7\.8%/.test(t) && /7,700 → 3,690/.test(t), "totals: " + t.slice(t.indexOf("What it adds up to"), t.indexOf("What it adds up to") + 400));
  await p.locator(sw("sunder-armor")).click(); await settle();
  expect(/7,700 → 6,290/.test(await text()), "armor after Sunder off");
  expect(await p.locator('#bufui .bb-line.chg[data-k="armor"]').count() === 1, "armor line not lit");
  expect(/Boss armor: 7,700 → 6,290\./.test(await msg()), "message: " + await msg());
  await reset();
});
if (k === "c") await step("C: sitting in group 1 loses Strength of Earth (no Enhancement Shaman there)", async () => {
  await p.locator('#bufui [data-seat="0-0"]').click(); await settle();
  expect(/you're in group 1/.test(await msg()), "message: " + await msg());
  const miss = (await p.locator("#bufui .bc-box.miss").innerText()).replace(/\s+/g, " ");
  expect(/Strength of Earth Totem/.test(miss) && /needs an Enhancement Shaman in your group/.test(miss), "missing box: " + miss.slice(0, 300));
  await reset();
});
if (k === "c") await step("C: \"Your raid\" waits for a Raid Composition roster, and \"Just you\" is you alone", async () => {
  expect(await p.locator('#bufui [data-src="mine"], [data-src="mine"]').first().isDisabled(), "Your raid enabled with no roster");
  await p.locator('[data-src="solo"]').click(); await settle();
  expect(/Just you/.test(await msg()), "message: " + await msg());
  await reset();
});
await step("reload keeps the setup", async () => {
  await p.locator(sw("curse-of-recklessness")).click(); await settle();
  const before = await p.locator(sw("curse-of-recklessness")).first().getAttribute("aria-pressed");
  await p.reload(); await p.waitForTimeout(process.env.RM ? 900 : 2500);
  await p.locator("#t-buffs").click(); await settle();
  expect(await p.locator(sw("curse-of-recklessness")).first().getAttribute("aria-pressed") === before, "switch didn't survive a reload");
  await reset();
});
await step("the Gear tab still works and shows the same cap", async () => {
  const h = await hitRow();
  await p.locator("#t-gear").click(); await settle();
  expect(await p.locator("#gearui-b").isVisible(), "character sheet hidden");
  expect((await hitRow()) === h, "hit row changed with the tab");
  await p.locator("#t-buffs").click(); await settle();
});
await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("buff controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#bufui button")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44).map(x => (x.textContent.trim() || x.getAttribute("aria-label") || "").slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
try { await p.locator("#t-buffs").click(); await settle(); if (k === "c") await p.locator('[data-src="ex25"]').click(); else await p.locator(`#b${k}-example`).click(); } catch (e) { results.push(["FAIL", "reset at the end", String(e.message || e).split("\n")[0]]); }
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${arg === "p" ? "planner buffs" : "buffs-" + arg} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
