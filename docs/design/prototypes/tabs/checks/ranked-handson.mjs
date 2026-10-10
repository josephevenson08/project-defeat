// Hands-on test of the three Ranked Gear designs (ranked-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/ranked-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = planner.html: the chosen Ranked Gear tab (window.RANKED_IN_PLANNER = "a+c": design A with design C as a second view,
// behind a "Slot by slot" / "Where it drops" switch), so p runs both sets of steps and checks the switch.
// Real numbers: Wowhead ranks 57 items over 15 lists (56 different items: Rod of the Sun King is ranked for both
// hands). Head is Destroyer Battle-Helm, Furious Gizmatic Goggles, Warbringer Battle-Helm. The goggles are −8 hit
// against the helm (140 → 132 for the recommended set); with the Buffs tab by hand the cap is 95, so 37 over it.
// Ring of Reciprocity is unique, so it can't go in a second ring slot. The part-geared example leaves 13 items ranked
// above what it wears, and wears Warbringer Battle-Helm (#3) on Head. Gloves of the Searing Grip drop from Al'ar.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
let k = (process.argv[2] || "a").toLowerCase();
const WIDTH = +(process.env.WIDTH || 1280);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
/* the Buffs tab starts "by hand", so the hit cap is the talents' 95 rather than the example raid's 48 */
await ctx.addInitScript(() => { try { if (!sessionStorage.getItem("pd-buffs-c")) sessionStorage.setItem("pd-buffs-c", JSON.stringify({ src: "hand", seat: null, edits: 0 })); } catch (e) {} });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 120 : 450);
const ui = p.locator("#rkui");
const text = async (loc = ui) => (await loc.innerText()).replace(/\s+/g, " ");
const gearHead = async () => (await p.locator('#gearui-b [data-slot="Head"]').innerText()).replace(/\s+/g, " ");
const toGear = async () => { await p.locator("#t-gear").click(); await settle(); };
const toRanked = async () => { await p.locator("#t-ranked").click(); await settle(); };

await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${k === "p" ? "planner.html" : `ranked-${k}.html`}`)).href);
await p.waitForTimeout(process.env.RM ? 900 : 2800);
if (k === "p") { k = await p.evaluate(() => window.RANKED_IN_PLANNER || ""); expect(/^[abc](\+[abc])?$/.test(k), "planner.html has no chosen Ranked Gear tab"); }
const has = d => k.includes(d), both = k.length > 1;
const view = async v => { if (both) { await ui.locator(`[data-rview="${v}"]`).click(); await settle(); } };
const opensOnRanked = await p.locator("#p-ranked").isVisible();
/* start from the recommended set */
await toGear(); await p.locator("#gx-rec").click(); await settle(); await toRanked();
if (!process.argv[2] || process.argv[2] !== "p") await step("opens on the Ranked Gear sub-tab", async () => expect(opensOnRanked, "Ranked Gear panel hidden on load"));

if (has("a")) {
  await view("slot");
  const pick = async slot => { await ui.locator(`[data-rslot="${slot}"]`).click(); await settle(); };
  await step("Head: the guide's three in order, with what you wear marked", async () => {
    await pick("Head");
    const cards = ui.locator(".ra-card");
    expect(await cards.count() === 3, "cards: " + await cards.count());
    const t = await text(cards.nth(0));
    expect(/#1/.test(t) && /Best/i.test(t) && /Destroyer Battle-Helm/.test(t) && /You wear this/i.test(t) && /Equipped/.test(t), "card 1: " + t.slice(0, 160));
    expect(/Furious Gizmatic Goggles/.test(await text(cards.nth(1))) && /Great/i.test(await text(cards.nth(1))), "card 2 not the goggles");
    expect(/Warbringer Battle-Helm/.test(await text(cards.nth(2))) && /P1 BiS/i.test(await text(cards.nth(2))), "card 3 not Warbringer");
  });
  await step("an item you don't wear is shown as Wowhead gems it", async () => {
    const t = await text(ui.locator(".ra-card").nth(1));
    expect(/Relentless Earthstorm Diamond/.test(t) && /Engineering/.test(t), "goggles tooltip: " + t.slice(0, 240));
  });
  await step("rings: one list for both slots, and a unique ring can't go in twice", async () => {
    await pick("Finger 1");
    const t = await text();
    expect(/one list for both rings slots/.test(t), "no shared-list note");
    expect(/Unique: already in Finger 2/.test(t), "Ring of Reciprocity not blocked: " + t.slice(0, 300));
  });
  await step("equip the goggles: the Gear tab wears them, and the card says so", async () => {
    await pick("Head");
    await ui.locator('[data-eq="furious-gizmatic-goggles"]').click(); await settle();
    expect(/Furious Gizmatic Goggles/.test(await text(ui.locator(".ra-card.on"))), "goggles card not marked");
    await toGear(); expect(/Furious Gizmatic Goggles/.test(await gearHead()), "Gear tab Head: " + await gearHead());
  });
  await step("a Gear-tab change shows here: part-geared wears #3 on Head", async () => {
    await p.locator("#gx-part").click(); await settle(); await toRanked(); await pick("Head");
    expect(/you wear #3/.test(await text(ui.locator(".ra-head"))), "head line: " + await text(ui.locator(".ra-head")));
  });
}

if (has("b")) {
  await step("every item you don't wear is listed: 40 for the recommended set", async () => {
    const t = await text(ui.locator(".rb-count"));
    expect(/^40 you don't wear/.test(t), "count: " + t);
    expect(await ui.locator(".rb-row").count() === 40, "rows: " + await ui.locator(".rb-row").count());
  });
  await step("the goggles row: −8 Hit, 140 → 132, 37 over the cap of 95", async () => {
    /* the goggles don't beat the helm by the example score, so they sit in the closed "would not help" list */
    if (await ui.locator(".rb-more:not([open])").count()) { await ui.locator(".rb-more summary").click(); await settle(); }
    const row = ui.locator(".rb-row", { hasText: "Furious Gizmatic Goggles" });
    const t = await text(row);
    expect(/replaces Destroyer Battle-Helm \(#1\)/.test(t), "replaces: " + t);
    expect(/[−-]8 Hit/.test(t) && /Hit 140 → 132/.test(t) && /keeps you 37 over the hit cap/.test(t), "trade: " + t);
    expect(/example/i.test(t), "no example label");
  });
  await step("rows are sorted by the example score, best first", async () => {
    const scores = await ui.locator(".rb-list").first().locator(".rb-score b").allInnerTexts();
    const n = scores.map(s => +s.replace("−", "-").replace("+", ""));
    expect(n.length > 1 && n.every((v, i) => i === 0 || n[i - 1] >= v), "not sorted: " + n.join(","));
  });
  await step("the slot filter shows only Head's two", async () => {
    await ui.locator("#rb-list").selectOption("Head"); await settle();
    expect(await ui.locator(".rb-row").count() === 2, "Head rows: " + await ui.locator(".rb-row").count());
  });
  await step("equip from the list: the Gear tab wears the goggles", async () => {
    await ui.locator('[data-eq="furious-gizmatic-goggles"]').click(); await settle();
    expect(!(await ui.locator('[data-eq="furious-gizmatic-goggles"]').count()), "goggles still listed after equipping");
    await toGear(); expect(/Furious Gizmatic Goggles/.test(await gearHead()), "Gear tab Head: " + await gearHead());
    await toRanked(); await ui.locator("#rb-list").selectOption("all"); await settle();
  });
  await step("part-geared: more of the list would help", async () => {
    await toGear(); await p.locator("#gx-rec").click(); await settle(); await toRanked();
    const before = +(await text(ui.locator(".rb-count"))).match(/(\d+) would help/)[1];
    await toGear(); await p.locator("#gx-part").click(); await settle(); await toRanked();
    const after = +(await text(ui.locator(".rb-count"))).match(/(\d+) would help/)[1];
    expect(after > before, `would help: ${before} → ${after}`);
  });
}

if (has("c")) {
  if (both) { await toGear(); await p.locator("#gx-rec").click(); await settle(); await toRanked(); }
  await view("where");
  await step("grouped by where it drops, raids first and in order", async () => {
    const h = (await ui.locator(".rc-grp > h4").allInnerTexts()).map(s => s.split(/\s/)[0]);
    expect(h.join(",") === "Serpentshrine,Tempest,Karazhan,Gruul's,Magtheridon's,World,Crafted,Everything", "groups: " + h.join(","));
    expect(await ui.locator(".rc-it").count() === 56, "rows: " + await ui.locator(".rc-it").count());
  });
  await step("Al'ar is Tempest Keep's first boss, with Gloves of the Searing Grip", async () => {
    const tk = ui.locator('.rc-grp[aria-label="Tempest Keep"] .rc-boss').first();
    const t = await text(tk); expect(/^1 Al'ar/i.test(t) && /Gloves of the Searing Grip/.test(t), "first TK boss: " + t.slice(0, 160));
  });
  await step("the recommended set: no upgrades left, and the example is offered", async () => {
    expect(/No upgrades left/.test(await text(ui.locator(".rc-sum"))), "summary: " + await text(ui.locator(".rc-sum")));
    expect(await ui.locator('[data-act="example"]').count() === 1, "no example button");
  });
  await step("part-geared: 13 upgrades, and Only upgrades shows just those", async () => {
    await ui.locator('[data-act="example"]').click(); await settle();
    expect(/^13 upgrades left/.test(await text(ui.locator(".rc-sum"))), "summary: " + await text(ui.locator(".rc-sum")));
    if (both) expect(/13 upgrades left/.test(await ui.locator('[data-rview="where"]').getAttribute("aria-label")), "switch label: " + await ui.locator('[data-rview="where"]').getAttribute("aria-label"));
    await ui.locator('[data-act="only"]').click(); await settle();
    expect(await ui.locator(".rc-it").count() === 13 && await ui.locator(".rc-it.above").count() === 13, "rows: " + await ui.locator(".rc-it").count());
  });
  await step("equip an upgrade: fewer left, it is ticked, and the Gear tab wears it", async () => {
    const first = ui.locator(".rc-it.above [data-eq]").first();
    const id = await first.getAttribute("data-eq"), slot = await first.getAttribute("data-slot");
    await first.click(); await settle();
    /* a top pick can clear more than one upgrade in its slot, so only "fewer" is certain */
    const left = +(await text(ui.locator(".rc-sum"))).match(/^(\d+) upgrades? left/)[1];
    expect(left < 13, "summary: " + await text(ui.locator(".rc-sum")));
    await ui.locator('[data-act="only"]').click(); await settle();
    const name = await p.evaluate(i => window.GEAR_DATA.items[i].name, id);
    expect(/You wear it/i.test(await text(ui.locator(".rc-it", { hasText: name }).first())), name + " not ticked");
    await toGear(); const g = (await p.locator(`#gearui-b [data-slot="${slot}"]`).innerText()).replace(/\s+/g, " ");
    expect(g.includes(name), `Gear tab ${slot}: ${g}`); await toRanked();
  });
}

await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("Ranked Gear controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#rkui button, #rkui select, #rkui summary")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
if (both) await step("the view switch is remembered after a reload", async () => {
  await view("where"); await p.reload(); await p.waitForTimeout(process.env.RM ? 900 : 2500); await toRanked();
  expect(await ui.locator('[data-rview="where"]').getAttribute("aria-pressed") === "true" && await p.locator("#rkui-c").isVisible() && !(await p.locator("#rkui-a").isVisible()), "the Where it drops view didn't come back");
  await view("slot");
});
/* leave the shared character as the recommended set */
await toGear(); await p.locator("#gx-rec").click(); await settle();
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${process.argv[2] === "p" ? "planner ranked (" + k + ")" : "ranked-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
