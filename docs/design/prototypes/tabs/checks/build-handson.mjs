// Hands-on test of the three Build designs (build-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/build-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = planner.html: the chosen Build tab (window.BUILD_IN_PLANNER = "a": design A with design C's read-first report on its
// paste box), so p runs A's steps through the report, and C's report steps.
// The share link is checked in the real app: with the app's dev server up (npm run dev on 127.0.0.1:5173, or APP= its
// address), the prototype's link is opened there and must load a Human Fury Warrior wearing Destroyer Battle-Helm with
// no notes, and design C's example /pdexport must load cleanly in the app's own importer. Set APP=off to skip both.
// Real numbers: the recommended set fills 17 of 17 slots with 140 hit; the Gear tab's part-geared example wears
// Warbringer Battle-Helm on Head.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
let k = (process.argv[2] || "a").toLowerCase();
const WIDTH = +(process.env.WIDTH || 1280), APP = process.env.APP || "http://127.0.0.1:5173/";
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 150 : 500);
const ui = p.locator("#bdui");
const text = async (loc = ui) => (await loc.innerText()).replace(/\s+/g, " ");
const gearSlot = async slot => (await p.locator(`#gearui-b [data-slot="${slot}"]`).innerText()).replace(/\s+/g, " ");
const toGear = async () => { await p.locator("#t-gear").click(); await settle(); };
const toBuild = async () => { await p.locator("#t-build").click(); await settle(); };
const msg = async () => (await ui.locator('[aria-live="polite"].rk-msg').first().innerText()).trim();

await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${k === "p" ? "planner.html" : `build-${k}.html`}`)).href);
await p.waitForTimeout(process.env.RM ? 900 : 2800);
const planner = k === "p";
if (planner) { k = await p.evaluate(() => window.BUILD_IN_PLANNER || ""); expect(/^[abc]$/.test(k), "planner.html has no chosen Build tab"); }
const opensOnBuild = await p.locator("#p-build").isVisible();
/* design C reads before it loads; so does the planner's A, which took C's report */
const report = k === "c" || (planner && k === "a");
await toGear(); await p.locator("#gx-rec").click(); await settle(); await toBuild();
if (!planner) await step("opens on the Build sub-tab", async () => expect(opensOnBuild, "Build panel hidden on load"));

await step("the card shows the build: 17 of 17 slots, 140 hit, the talents", async () => {
  const t = await text(ui.locator(".bd-card").first());
  expect(/17 of 17 slots/.test(t) && /hit 140 \//.test(t) && /talents \d+ \/ \d+ \/ \d+/.test(t), "card: " + t);
});

let link = "";
await step("the share link is the app's format, and reads back here with no notes", async () => {
  link = await p.evaluate(async () => window.BuildKit.linkFor(window.BuildKit.snapshot()));
  expect(/^https:\/\/josephevenson08\.github\.io\/project-defeat\/#build=1\.[A-Za-z0-9_-]+$/.test(link), "link: " + link.slice(0, 120));
  const r = await p.evaluate(async l => { const r = await window.BuildKit.read(l); return { ok: r.ok, n: r.ok ? r.issues.length : -1, err: r.error }; }, link);
  expect(r.ok && r.n === 0, JSON.stringify(r));
});

if (APP !== "off") await step("the link opens the same build in the live app (dev server)", async () => {
  const app = await ctx.newPage();
  const hash = link.slice(link.indexOf("#"));
  try { await app.goto(APP + hash, { waitUntil: "domcontentloaded" }); } catch (e) { throw new Error(`the app isn't running at ${APP}: start it with npm run dev, or set APP=off`); }
  const notice = app.getByTestId("share-notice");
  await notice.waitFor({ timeout: 15000 });
  const n = (await notice.innerText()).replace(/\s+/g, " ");
  expect(/Loaded a shared build/.test(n), "notice: " + n);
  expect(!(await app.locator(".share-notice-issues li").count()), "the app noted: " + n);
  const head = (await app.getByRole("button", { name: "Head slot", exact: true }).innerText()).replace(/\s+/g, " ");
  expect(/Destroyer Battle-Helm/.test(head), "Head in the app: " + head);
  await app.close();
});

await step("a broken paste changes nothing and says so", async () => {
  if (k === "b") { await ui.locator('[data-act="adding"]').click(); await settle(); }
  await ui.locator("#importbox").fill("#build=1.this-was-cut-off");
  await ui.locator(report ? '[data-act="read"]' : k === "a" ? '[data-act="load"]' : '[data-act="add"]').click(); await settle();
  expect(/Nothing was (changed|added)/.test(await text()), "no refusal shown: " + (await text()).slice(0, 300));
  await toGear(); expect(/Destroyer Battle-Helm/.test(await gearSlot("Head")), "gear changed"); await toBuild();
  if (k === "b") { await ui.locator('[data-act="adding"]').click(); await settle(); }
});

await step("another class is refused, by name", async () => {
  const mage = await p.evaluate(() => { const b = window.BuildKit.snapshot(); b.character = { faction: "Alliance", race: "Gnome", className: "Mage", spec: "Fire" }; return JSON.stringify(b); });
  const r = await p.evaluate(async t => { const r = await window.BuildKit.read(t); return r.ok ? "ok" : r.error; }, mage);
  expect(/Fire Mage/.test(r) && /only plans a Fury Warrior/.test(r), "refusal: " + r);
});

if (k === "a") {
  await step("save a named build, change the gear, load it back", async () => {
    await ui.locator("#ba-name").fill("Fury BiS"); await ui.locator('[data-act="save"]').click(); await settle();
    expect(/Saved as "Fury BiS"/.test(await msg()), "save message: " + await msg());
    await toGear(); await p.locator("#gx-part").click(); await settle();
    expect(/Warbringer/.test(await gearSlot("Head")), "part-geared head not Warbringer"); await toBuild();
    await ui.locator('[data-load="Fury BiS"]').click(); await settle();
    await toGear(); expect(/Destroyer Battle-Helm/.test(await gearSlot("Head")), "Head after load: " + await gearSlot("Head")); await toBuild();
  });
  await step(report ? "paste the link: the report says it is clean, then Load wears it" : "paste the link: loaded from the link, every slot clean", async () => {
    await toGear(); await p.locator("#gx-part").click(); await settle(); await toBuild();
    await ui.locator("#importbox").fill(link);
    if (report) {
      await ui.locator('[data-act="read"]').click(); await settle();
      expect(/Read from a build link/.test(await text()) && /Everything resolved cleanly/.test(await text()) && /Nothing has changed yet/.test(await text()), "report: " + (await text()).slice(0, 400));
      await ui.locator('[data-act="wear"]').click(); await settle();
    } else {
      await ui.locator('[data-act="load"]').click(); await settle();
      expect(/Loaded from the link\. Every slot resolved cleanly/.test(await text()), "result: " + (await text()).slice(0, 400));
    }
    await toGear(); expect(/Destroyer Battle-Helm/.test(await gearSlot("Head")), "Head: " + await gearSlot("Head")); await toBuild();
  });
}

if (k === "b") {
  await step("two example builds join the list, and one loads into the planner", async () => {
    await ui.locator('[data-act="examples"]').click(); await settle();
    expect(await ui.locator(".bb-pick").count() === 3, "entries: " + await ui.locator(".bb-pick").count());
    await ui.locator('[data-sel="Part-geared example"]').click(); await settle();
    await ui.locator('[data-act="wear"]').click(); await settle();
    await toGear(); expect(/Warbringer/.test(await gearSlot("Head")), "Head: " + await gearSlot("Head")); await toBuild();
  });
  await step("save over, then delete", async () => {
    await ui.locator('[data-sel="Fury BiS (recommended set)"]').click(); await settle();
    await ui.locator('[data-act="over"]').click(); await settle();
    expect(/now holds the build in the planner/.test(await msg()), "over: " + await msg());
    await ui.locator('[data-act="del"]').click(); await settle();
    expect(await ui.locator(".bb-pick").count() === 2, "entries after delete: " + await ui.locator(".bb-pick").count());
  });
  await step("add from a paste: the addon's export becomes a new entry, the planner unchanged", async () => {
    await ui.locator('[data-act="adding"]').click(); await settle();
    await ui.locator("#importbox").fill(await p.evaluate(() => window.BuildKit.exampleAddon()));
    await ui.locator('[data-act="add"]').click(); await settle();
    expect(await ui.locator('[data-sel="From the addon"]').count() === 1, "no new entry: " + await msg());
  });
}

if (report && APP !== "off") await step("the example export loads cleanly in the live app's own importer", async () => {
  const ex = await p.evaluate(() => window.BuildKit.exampleAddon());
  const app = await ctx.newPage();
  await app.goto(APP + link.slice(link.indexOf("#")), { waitUntil: "domcontentloaded" });
  await app.getByTestId("share-notice").waitFor({ timeout: 15000 });
  await app.getByRole("tab", { name: /^Build$/ }).or(app.getByRole("button", { name: /^Build$/ })).first().click();
  await app.getByTestId("build-import-input").fill(ex);
  await app.getByTestId("build-import-button").click();
  const st = (await app.getByTestId("build-status").innerText()).replace(/\s+/g, " ");
  expect(/Build loaded/.test(st) && /Every slot resolved cleanly/.test(st), "the app says: " + st);
  await app.close();
});

if (report) {
  await step("read the example export: a report, and nothing changes yet", async () => {
    await ui.locator('[data-act="example"]').click(); await settle();
    await ui.locator('[data-act="read"]').click(); await settle();
    const t = await text(ui.locator(".bc2-rep"));
    const n = await p.evaluate(() => { const s = window.GearKit.partGeared(); return window.GearKit.SLOTS.filter(x => s[x.key] && s[x.key].item).length; });
    expect(new RegExp(`${n} of 17 slots`).test(t) && /Nothing has changed yet/.test(t), "report: " + t.slice(0, 300));
    await toGear(); expect(/Destroyer Battle-Helm/.test(await gearSlot("Head")), "gear changed before Load"); await toBuild();
  });
  await step("load it: the Gear tab wears the export, and the buffs stay", async () => {
    const before = await p.evaluate(() => window.BuffKit.store("planner").get().on.length);
    await ui.locator('[data-act="wear"]').click(); await settle();
    await toGear(); expect(/Warbringer/.test(await gearSlot("Head")), "Head: " + await gearSlot("Head")); await toBuild();
    const after = await p.evaluate(() => window.BuffKit.store("planner").get().on.length);
    expect(after === before, `buffs ${before} → ${after}`);
  });
  await step("an export with no talents asks which spec, and waits for the answer", async () => {
    const bare = await p.evaluate(() => { const d = JSON.parse(window.BuildKit.exampleAddon()); d.talents = []; return JSON.stringify(d); });
    await ui.locator("#importbox").fill(bare); await ui.locator('[data-act="read"]').click(); await settle();
    expect(/spent no talent points/.test(await text()), "no question asked");
    expect(await ui.locator('[data-act="wear"]').isDisabled(), "Load not held back");
    await ui.locator('[data-spec="Fury"]').click(); await settle();
    expect(!(await ui.locator('[data-act="wear"]').isDisabled()), "Load still disabled after answering");
    await ui.locator('[data-act="clear"]').click(); await settle();
  });
}

await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("Build controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#bdui button, #bdui input, #bdui summary")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
/* leave the shared character as the recommended set */
await toGear(); await p.locator("#gx-rec").click(); await settle();
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${planner ? "planner build (" + k + ")" : "build-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
