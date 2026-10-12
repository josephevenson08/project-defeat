// Hands-on test of the three Spec Tier Lists designs (tiers-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/tiers-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = tier-lists.html once a design is built into it (it sets window.TIERS_DESIGN), and runs that design's steps
// (and those of any design merged into it, listed in window.TIERS_ALSO).
// Real numbers from tier-data.js: 3 lists, 28 placements, 27 specs, 20 with archon.gg DPS. Retribution Paladin is B on
// Wowhead's DPS list and 5th by observed DPS (1,785); Fury Warrior is S on Wowhead, A on archon, 3rd (2,053). Wowhead and
// archon agree on 9 of the 20; Bloodlust comes from the three Shaman specs; the example raid lacks only Winter's Chill.
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
const ui = p.locator("#tierui");
const text = async (loc = ui) => (await loc.innerText()).replace(/\s+/g, " ");
const page = k === "p" ? "tier-lists.html" : `tiers-${k}.html`;
const url = pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${page}`)).href;
const open = async () => { await p.goto("about:blank"); await p.goto(url); await p.waitForTimeout(process.env.RM ? 900 : 2600); };
await p.goto(url); await p.evaluate(() => { try { ["pd-tiers-sel", "pd-tiers-sort", "pd-raidcomp-a:v1"].forEach(x => sessionStorage.removeItem(x)); } catch (e) {} });
await open();
const planner = k === "p";
let also = [];
if (planner) { k = await p.evaluate(() => window.TIERS_DESIGN || ""); also = await p.evaluate(() => window.TIERS_ALSO || []); expect(/^[abc]$/.test(k), "tier-lists.html has no chosen design"); }
const runs = d => k === d || also.includes(d);

/* ---------- every design ---------- */
await step("the live app's data: 3 lists, 28 placements, 27 specs, 20 with log numbers", async () => {
  const c = await p.evaluate(() => window.TIER_DATA.counts);
  expect(c.lists === 3 && c.placements === 28 && c.specs === 27 && c.archon === 20, JSON.stringify(c));
});
await step("the tab keeps its emerald scene", async () => {
  const t = await p.evaluate(() => document.documentElement.dataset.tbcTheme || (window.TBCKit && window.TBCKit.themeName) || "");
  expect(t === "tiers", "theme " + t);
});
await step("tooltip: Retribution Paladin is B for damage, 1,785 DPS in the logs, 5th of 20", async () => {
  const el = ui.locator('[data-spec="Paladin|Retribution"]').first();
  await el.scrollIntoViewIfNeeded();
  if (WIDTH < 700) await el.focus(); else await el.hover();
  await settle(200);
  const t = (await p.locator("#tk-tip").innerText()).replace(/\s+/g, " ");
  expect(/Retribution Paladin/.test(t) && /B for damage/.test(t) && /1,785 DPS in the logs · archon B · 5th of 20/.test(t), "tooltip: " + t);
  await p.mouse.move(2, 2); await p.keyboard.press("Escape");
});
await step("your spec, the planner's Fury Warrior, is marked", async () => {
  expect(await ui.locator(".tk-you").count() > 0, "no 'You' mark");
});

/* ---------- A · the tier board ---------- */
if (runs("a")) {
  await step("the boards: 20 damage specs in 5 rows, 5 healers, 3 tanks; Feral on two lists", async () => {
    const n = await p.evaluate(() => [...document.querySelectorAll(".ta-board")].map(b => b.querySelectorAll(".ta-row").length + ":" + b.querySelectorAll(".ta-t").length).join(","));
    expect(n === "5:20,3:5,3:3", n);
    expect(await ui.locator('.ta-t[data-sel="Druid|Feral"]').count() === 2, "Feral not on two boards");
  });
  await step("the card opens on your spec: Fury, 2,053 DPS, 3rd of 20, Bloodthirst", async () => {
    const t = await text(p.locator("#ta-card"));
    expect(/Fury Warrior/.test(t) && /2,053 DPS average, 3rd of 20/.test(t) && /Bloodthirst/.test(t), "card: " + t.slice(0, 300));
  });
  await step("pressing Feral lights it on both lists and shows C for damage, S for tanking", async () => {
    await ui.locator('.ta-t[data-sel="Druid|Feral"]').first().click(); await settle();
    expect(await ui.locator('.ta-t[data-sel="Druid|Feral"][aria-pressed="true"]').count() === 2, "not both pressed");
    const t = await text(p.locator("#ta-card"));
    expect(/Wowhead · DPS C of/i.test(t) && /Wowhead · Tank S of/i.test(t) && /1,655 DPS average, 10th of 20/.test(t), "card: " + t.slice(0, 300));
  });
  await step("a healer's card says the app has no log numbers for healers", async () => {
    await ui.locator('.ta-t[data-sel="Priest|Holy"]').click(); await settle();
    expect(/No log numbers in the app for healers/.test(await text(p.locator("#ta-card"))), "card");
  });
  await step("the class filter lights Rogue's three and dims the rest", async () => {
    await ui.locator('[data-cls="Rogue"]').click(); await settle();
    const lit = await p.evaluate(() => [...document.querySelectorAll(".ta-board")][0].querySelectorAll(".ta-t:not(.dim)").length);
    expect(lit === 3, "lit " + lit);
    await ui.locator('[data-cls="all"]').click(); await settle();
  });
  await step("the chosen spec survives a reload", async () => {
    await ui.locator('.ta-t[data-sel="Paladin|Retribution"]').click(); await settle();
    await open();
    expect(/Retribution Paladin/.test(await text(p.locator("#ta-card"))), "lost the choice");
  });
}

/* ---------- the tab's switch: The board / Against the logs ---------- */
if (planner && also.includes("b")) {
  await step("the switch: the board first, Against the logs shows the chart, and the link says so", async () => {
    await p.evaluate(() => sessionStorage.removeItem("pd-tiers-view")); await open();
    expect(await ui.locator('[data-view="board"]').getAttribute("aria-pressed") === "true" && await ui.locator(".ta-board").count() === 3, "board not first");
    await ui.locator('[data-view="logs"]').click(); await settle();
    expect(await ui.locator(".tb-chart .tb-row").count() === 20 && !(await ui.locator(".ta-board").count()), "chart not shown");
    expect(await p.evaluate(() => location.hash) === "#logs", "hash " + await p.evaluate(() => location.hash));
  });
  await step("the view is remembered across a reload, and #board opens the board", async () => {
    await open(); expect(await ui.locator(".tb-chart").count() === 1, "forgot the chart view");
    await p.goto("about:blank"); await p.goto(url + "#board"); await p.waitForTimeout(process.env.RM ? 900 : 2600);
    expect(await ui.locator(".ta-board").count() === 3, "#board didn't open the board");
    await ui.locator('[data-view="logs"]').click(); await settle();
  });
}

/* ---------- B · two opinions ---------- */
if (runs("b")) {
  await step("by the logs: 20 rows, Arcane first at 2,084, Fury 3rd", async () => {
    const rows = await ui.locator(".tb-chart .tb-row").count();
    const first = await text(ui.locator(".tb-chart .tb-row").first());
    const third = await text(ui.locator(".tb-chart .tb-row").nth(2));
    expect(rows === 20 && /Arcane/.test(first) && /2,084/.test(first) && /Fury/.test(third), `${rows} | ${first} | ${third}`);
  });
  await step("the summary: agree on 9 of 20, logs higher 3, Wowhead higher 5, three D-tier specs", async () => {
    const t = await text(ui.locator(".tb-facts"));
    expect(/Agree ?9 of 20/.test(t) && /Logs higher ?3/.test(t) && /Wowhead higher ?5/.test(t) && /Wowhead D, archon C ?3/.test(t), t);
    expect(/Feral Druid averages the 10th-highest DPS of 20, yet sits in Wowhead's C tier/.test(await text(ui.locator(".tb-notes"))), "notes");
  });
  await step("by Wowhead's tier: the four S specs first, the three D specs last", async () => {
    await ui.locator('[data-sort="wowhead"]').click(); await settle(900);
    const ks = await p.evaluate(() => [...document.querySelectorAll(".tb-chart .tb-row")].map(r => r.dataset.k));
    const S = ["Mage|Arcane", "Hunter|Beast Mastery", "Warrior|Fury", "Warlock|Destruction"], Dt = ["Hunter|Marksmanship", "Rogue|Assassination", "Rogue|Subtlety"];
    expect(ks.slice(0, 4).every(x => S.includes(x)) && ks.slice(-3).every(x => Dt.includes(x)), ks.join(","));
  });
  await step("only where they disagree: 11 rows", async () => {
    await ui.locator("#tb-only").check(); await settle(900);
    expect(await ui.locator(".tb-chart .tb-row").count() === 11, "rows " + await ui.locator(".tb-chart .tb-row").count());
    await ui.locator("#tb-only").uncheck(); await settle(900);
  });
  await step("a row opens the spec's card", async () => {
    await ui.locator('[data-row="Paladin|Retribution"]').click(); await settle();
    const t = await text(ui.locator('.tb-row[data-k="Paladin|Retribution"]'));
    expect(/1,785 DPS average, 5th of 20/.test(t) && /Crusader Strike/.test(t), "card: " + t.slice(0, 200));
  });
  await step("healers and tanks say they're Wowhead's opinion alone", async () => {
    expect(/no log numbers for healers/.test(await text()) && /no log numbers for tanks/.test(await text()), "missing note");
  });
  await step("the sort survives a reload", async () => {
    await open();
    expect(await ui.locator('[data-sort="wowhead"]').getAttribute("aria-pressed") === "true", "sort forgotten");
  });
}

/* ---------- C · what each spec brings ---------- */
if (runs("c")) {
  await p.evaluate(() => { try { sessionStorage.removeItem("pd-raidcomp-a:v1"); } catch (e) {} }); await open();
  await step("40 buffs and debuffs to pick from", async () => {
    expect(await ui.locator(".tc-bf").count() === 40, "count " + await ui.locator(".tc-bf").count());
  });
  await step("Bloodlust lights the three Shaman specs", async () => {
    await ui.locator('[data-b="bloodlust"]').click(); await settle();
    const hits = await p.evaluate(() => [...document.querySelectorAll(".tc-card.hit")].map(c => c.dataset.k).sort().join(","));
    expect(hits === "Shaman|Elemental,Shaman|Enhancement,Shaman|Restoration", hits);
    expect(/Bloodlust/.test(await text(ui.locator(".tc-now"))), "no line");
    await ui.locator('[data-act="clear"]').click(); await settle();
    expect(await ui.locator(".tc-card.dim").count() === 0, "still dimmed");
  });
  await step("the example raid lacks only Winter's Chill, which a Frost Mage would add", async () => {
    const t = await text(ui.locator(".tc-raid"));
    expect(/brings 39 of the 40; nobody brings Winter's Chill/.test(t) && /Frost Mage/.test(t), t.slice(0, 300));
  });
  await step("your two Fury Warriors are counted on the card", async () => {
    expect(/×2 in raid/i.test(await text(ui.locator('.tc-card[data-k="Warrior|Fury"]').first())), "no count");
  });
  await step("the page says what the buff data doesn't count yet", async () => {
    expect(/Not every spec's utility is counted yet/.test(await text()), "no gap note");
  });
  await step("a raid built on Raid Composition replaces the example", async () => {
    await p.evaluate(() => sessionStorage.setItem("pd-raidcomp-a:v1", JSON.stringify({ groups: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ id: "warrior-fury" }))) })));
    await open();
    const t = await text(ui.locator(".tc-raid"));
    expect(/Your raid/.test(t) && /×25 in raid/i.test(await text(ui.locator('.tc-card[data-k="Warrior|Fury"]').first())), t.slice(0, 200));
    await p.evaluate(() => sessionStorage.removeItem("pd-raidcomp-a:v1"));
  });
}

await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("Tier Lists controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#tierui button, #tierui input, #tierui summary, #tierui select")]
    .filter(x => x.offsetParent && x.type !== "checkbox" && x.getBoundingClientRect().height < 44)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${planner ? "tier-lists.html (" + [k, ...also].join("+") + ")" : "tiers-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
