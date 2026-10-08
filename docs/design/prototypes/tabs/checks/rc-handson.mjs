// Hands-on test of the Raid Composition planning tables (designs A and B).
// Run from the repo root: node <this file> [a|b] ; env WIDTH=400 for the phone run, RM=1 for reduced motion.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");

const TABS = path.resolve("docs/design/prototypes/tabs");
const WIDTH = +(process.env.WIDTH || 1280);
const OUT = process.env.OUT;
const AD = {
  a: {
    file: "raid-composition.html", count: "#count", example: "#examplebtn",
    async pick(p, cls, id, name) {
      await p.locator(`#pk-classes button[data-cls="${cls}"]`).click();
      await p.locator(`#pk-specs button[data-id="${id}"]`).click();
      if (name) await p.locator("#pk-name").fill(name);
      await p.locator("#pk-ok").click();
    },
    renameInput: () => "#groups input.ren",
  },
  b: {
    file: "raid-comp-b.html", count: "#boardsum", example: "#resetbtn",
    async pick(p, cls, id, name) {
      await p.locator(`#groups .picker button[data-cls="${cls}"]`).click();
      if (name) await p.locator("#pk-name").fill(name);
      await p.locator(`#groups .picker button[data-b="${id}"]`).click();
    },
    renameInput: (g, i) => `#rn-${g}-${i}`,
  },
};

const which = (process.argv[2] || "a").toLowerCase(), A = AD[which];
const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", e => errs.push("pageerror: " + e.message));
p.on("console", m => { if (m.type() === "error" && !/WebGL context/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000);

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(["PASS", name]); }
  catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 8).join(" / ").slice(0, 700)]); }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const seat = (g, i) => p.locator(`#groups .seat[data-g="${g}"][data-i="${i}"]`);
const seatText = async (g, i) => (await seat(g, i).locator(".who").innerText()).replace(/\s+/g, " ").trim();
const act = (a, g, i) => p.locator(`#groups [data-act="${a}"][data-g="${g}"][data-i="${i}"]`);
const chips = async g => p.locator(`#groups section.grp[data-group="${g}"] .gets .chips li:not(.none)`).count();
const countText = async () => (await p.locator(A.count).innerText()).replace(/\s+/g, " ");
const status = async () => (await p.locator("#status").innerText()).replace(/\s+/g, " ");
const settle = () => p.waitForTimeout(process.env.RM ? 150 : 700);

await p.goto(pathToFileURL(path.join(TABS, A.file)).href);
await p.waitForTimeout(process.env.RM ? 800 : 3000);

await step("starts empty: 0 of 25, Clear disabled", async () => {
  expect(/^0 of 25/.test(await countText()), "count is " + await countText());
  expect(await p.locator("#clearbtn").isDisabled(), "Clear is enabled on an empty raid");
});
await step("Add: Enhancement Shaman named Thrallson into group 1 seat 1", async () => {
  await act("add", 0, 0).click(); await A.pick(p, "Shaman", "shaman-enhancement", "Thrallson"); await settle();
  const t = await seatText(0, 0);
  expect(/Thrallson/.test(t) && /Enhancement/.test(t), "seat reads " + t);
  expect(await chips(0) > 0, "group 1 shows no party buffs");
  expect(/^1 of 25/.test(await countText()), "count is " + await countText());
});
await step("Add: Fury Warrior (no name) into group 2 seat 1", async () => {
  await act("add", 1, 0).click(); await A.pick(p, "Warrior", "warrior-fury", ""); await settle();
  expect(/Fury Warrior/.test(await seatText(1, 0)), "seat reads " + await seatText(1, 0));
});
await step("Add: cancel the picker leaves the seat empty", async () => {
  await act("add", 2, 0).click(); await p.keyboard.press("Escape"); await settle();
  expect(/Empty seat|Open seat/.test(await seatText(2, 0)), "seat reads " + await seatText(2, 0));
  expect(await act("add", 2, 0).isVisible(), "Add button not back");
});
await step("Role balance counts both players", async () => {
  const r = (await p.locator("#roles").innerText()).replace(/\s+/g, " ");
  expect(/Physical DPS 2/.test(r), "roles read " + r);
});
await step("Move: Thrallson to group 2 seat 2 (empty) with Move then Move here", async () => {
  const before = await chips(1);
  await act("move", 0, 0).click(); await act("here", 1, 1).click(); await settle();
  expect(/Thrallson/.test(await seatText(1, 1)), "target reads " + await seatText(1, 1));
  expect(/Empty seat|Open seat/.test(await seatText(0, 0)), "source reads " + await seatText(0, 0));
  expect(await chips(1) > before, "group 2 buffs did not grow");
  expect(await chips(0) === 0, "group 1 still shows buffs");
});
await step("Swap: Fury Warrior (g2s1) with Thrallson (g2s2)", async () => {
  await act("move", 1, 0).click(); await act("here", 1, 1).click(); await settle();
  expect(/Thrallson/.test(await seatText(1, 0)) && /Fury Warrior/.test(await seatText(1, 1)), "seats read " + await seatText(1, 0) + " / " + await seatText(1, 1));
});
await step("Move: Escape cancels a held move", async () => {
  await act("move", 1, 0).click(); await p.keyboard.press("Escape"); await settle();
  expect(await p.locator('#groups [data-act="here"]').count() === 0, "Here buttons still shown");
  expect(/Thrallson/.test(await seatText(1, 0)), "seat changed");
});
await step("Move: pressing Cancel on the held seat cancels", async () => {
  await act("move", 1, 0).click(); await act("move", 1, 0).click(); await settle();
  expect(await p.locator('#groups [data-act="here"]').count() === 0, "Here buttons still shown");
});
await step("Drag: Thrallson from group 2 seat 1 onto group 3 seat 1", async () => {
  if (WIDTH < 700) { await act("move", 1, 0).click(); await act("here", 2, 0).click(); } else await seat(1, 0).dragTo(seat(2, 0)); await settle();
  expect(/Thrallson/.test(await seatText(2, 0)), "target reads " + await seatText(2, 0));
  expect(/Empty seat|Open seat/.test(await seatText(1, 0)), "source reads " + await seatText(1, 0));
});
await step("Drag: onto a taken seat swaps (Thrallson onto the Fury Warrior)", async () => {
  if (WIDTH < 700) { await act("move", 2, 0).click(); await act("here", 1, 1).click(); } else await seat(2, 0).dragTo(seat(1, 1)); await settle();
  expect(/Thrallson/.test(await seatText(1, 1)) && /Fury Warrior/.test(await seatText(2, 0)), "seats read " + await seatText(1, 1) + " / " + await seatText(2, 0));
});
await step("Rename: Thrallson becomes Thrall (Enter saves)", async () => {
  await act("rename", 1, 1).click(); const inp = p.locator(A.renameInput(1, 1));
  await inp.fill("Thrall"); await inp.press("Enter"); await settle();
  const t = await seatText(1, 1); expect(/Thrall\b/.test(t) && !/Thrallson/.test(t), "seat reads " + t);
});
await step("Rename: Escape cancels without changing the name", async () => {
  await act("rename", 1, 1).click(); const inp = p.locator(A.renameInput(1, 1));
  await inp.fill("Nope"); await inp.press("Escape"); await settle();
  const t = await seatText(1, 1); expect(/Thrall\b/.test(t) && !/Nope/.test(t), "seat reads " + t);
});
await step("Name an unnamed player (the Fury Warrior becomes Garrosh)", async () => {
  await act("rename", 2, 0).click(); const inp = p.locator(A.renameInput(2, 0));
  await inp.fill("Garrosh"); await inp.press("Enter"); await settle();
  expect(/Garrosh/.test(await seatText(2, 0)), "seat reads " + await seatText(2, 0));
});
await step("Rename: clearing the name falls back to the spec", async () => {
  await act("rename", 2, 0).click(); const inp = p.locator(A.renameInput(2, 0));
  await inp.fill(""); await inp.press("Enter"); await settle();
  const t = await seatText(2, 0); expect(/Fury Warrior/.test(t) && !/Garrosh/.test(t), "seat reads " + t);
});
await step("Remove: the Fury Warrior, then Undo brings them back", async () => {
  await act("remove", 2, 0).click(); await settle();
  expect(/Empty seat|Open seat/.test(await seatText(2, 0)), "seat reads " + await seatText(2, 0));
  await p.locator("#undobtn").click(); await settle();
  expect(/Fury Warrior/.test(await seatText(2, 0)), "after Undo seat reads " + await seatText(2, 0));
});
await step("10-player: drops group 3 with Undo offered; Undo restores 25", async () => {
  await p.locator('.seg button[data-size="10"]').click(); await settle();
  expect(await p.locator("#groups section.grp").count() === 2, "groups: " + await p.locator("#groups section.grp").count());
  expect(/of 10/.test(await countText()), "count is " + await countText());
  expect(await p.locator("#undobtn").isVisible(), "no Undo after dropping a player");
  await p.locator("#undobtn").click(); await settle();
  expect(await p.locator("#groups section.grp").count() === 5, "groups after Undo: " + await p.locator("#groups section.grp").count());
  expect(/Fury Warrior/.test(await seatText(2, 0)), "group 3 player lost");
});
await step("Roster survives a reload (kept for the session)", async () => {
  await p.reload(); await p.waitForTimeout(process.env.RM ? 800 : 3000);
  expect(/Thrall\b/.test(await seatText(1, 1)) && /Fury Warrior/.test(await seatText(2, 0)), "after reload: " + await seatText(1, 1) + " / " + await seatText(2, 0));
});
await step("Load / reset to example: 25 of 25, marked example", async () => {
  await p.locator(A.example).click(); await settle();
  const c = await countText(); expect(/^25 of 25/.test(c), "count is " + c);
  const tag = (await p.locator(which === "a" ? "#rostertag" : "#boardsum").innerText()).toLowerCase();
  expect(/example/.test(tag), "not marked example: " + tag);
  expect(await p.locator("#undobtn").isVisible(), "no Undo after replacing a roster");
});
await step("Editing the example marks it edited", async () => {
  await act("move", 0, 0).click(); await act("here", 1, 0).click(); await settle();
  const tag = (await p.locator(which === "a" ? "#rostertag" : "#boardsum").innerText()).toLowerCase();
  expect(/edited/.test(tag), "tag reads " + tag);
});
await step("Missing list and one-more-seat list respond to the roster", async () => {
  const miss = (await p.locator("#misslist").innerText()).replace(/\s+/g, " ");
  const add = (await p.locator("#addlist").innerText()).replace(/\s+/g, " ");
  expect(/Group 1/i.test(add) && add.length > 40, "add list: " + add.slice(0, 120));
  expect(miss.length > 20 && !/Nobody is seated/.test(miss), "missing list: " + miss.slice(0, 120));
  results.push(["INFO", "one-more-seat sample: " + add.slice(0, 200)]);
});
await step("Suggestions use the right article (an Elemental, not a Elemental)", async () => {
  const texts = [];
  for (const ids of [["shaman-restoration"], ["warrior-fury"], ["mage-arcane"], []]) {
    await p.locator("#clearbtn").click().catch(() => {}); await settle();
    for (const [k, id] of ids.entries()) { const [cls] = id.split("-"); await act("add", 0, k).click(); await A.pick(p, cls[0].toUpperCase() + cls.slice(1), id, ""); await settle(); }
    texts.push((await p.locator("#addlist").innerText()).replace(/s+/g, " "));
  }
  await p.locator(A.example).click(); await settle(); texts.push((await p.locator("#addlist").innerText()).replace(/s+/g, " "));
  const bad = texts.join(" ").match(/A (?:<b>)?[AEIOU]w+/g);
  expect(!bad, "found: " + (bad || []).join(", "));
});
await step("Clear: empties all 25, Undo restores", async () => {
  await p.locator("#clearbtn").click(); await settle();
  expect(/^0 of 25/.test(await countText()), "count is " + await countText());
  await p.locator("#undobtn").click(); await settle();
  expect(/^25 of 25/.test(await countText()), "after Undo count is " + await countText());
});
await step("Export image: explains the stub", async () => {
  await p.locator("#exportbtn").click(); await settle();
  expect(/PNG/.test(await status()), "status: " + await status());
});
if (which === "a") await step("Quick add from 'one more seat' seats the suggestion", async () => {
  await p.locator("#clearbtn").click(); await settle();
  const q = p.locator('#addlist button[data-act="quick"]').first(); const label = await q.innerText();
  await q.click(); await settle();
  expect(/^1 of 25/.test(await countText()), "count is " + await countText() + " after " + label);
});
await step("Keyboard: Move with Enter, Tab to a target, Enter", async () => {
  await p.locator(A.example).click(); await settle();
  const before = await seatText(0, 0);
  await act("move", 0, 0).focus(); await p.keyboard.press("Enter"); await settle();
  const focused = await p.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-act"));
  expect(focused === "move", "focus after Move is on " + focused);
  await act("here", 0, 1).focus(); await p.keyboard.press("Enter"); await settle();
  expect((await seatText(0, 1)) === before, "seat 2 reads " + await seatText(0, 1) + ", expected " + before);
});
await step("No sideways scroll", async () => {
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(sw <= 0, sw + "px sideways scroll");
});
if (WIDTH < 700) await step("Seat buttons are at least 44px tall on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#groups button")].filter(b => b.offsetParent && b.getBoundingClientRect().height < 44).map(b => b.textContent.trim() + " " + Math.round(b.getBoundingClientRect().height)).slice(0, 6));
  expect(!small.length, "short buttons: " + small.join(", "));
});
if (OUT) {
  await p.locator(A.example).click(); await settle(); await p.locator("#groups").scrollIntoViewIfNeeded(); await settle();
  await p.screenshot({ path: path.join(OUT, `rc-${which}-${WIDTH}.png`), fullPage: true });
}
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 5).join(" | ")]);
await browser.close();
for (const r of results) console.log(r.join("  "));
console.log(`${which.toUpperCase()} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
