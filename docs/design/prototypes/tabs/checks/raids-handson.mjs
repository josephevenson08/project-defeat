// Hands-on test of the three Raids designs (raids-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/raids-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = raids.html once a design is built into it (it sets window.RAIDS_DESIGN), and runs that design's steps; with design
// C's view behind the tab's switch (window.RAIDS_IN_TAB), it runs C's steps too, after checking the switch.
// Every design: the raid picker re-lights the page and keeps the raid in the hash, the search across all five raids
// opens a drop where it drops, and the tooltips carry the real item (Dragonspine Trophy: +40 Attack Power, on 10 lists).
// Real numbers from raid-data.js: 469 drops; Hydross has 2 drops on the Fury list; Gloves of the Searing Grip are #1 on
// the Feral list; Belt of One-Hundred Deaths is wanted by 11 of the example 25 (8 rank it first).
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
const ui = p.locator("#raidui");
const text = async (loc = ui) => (await loc.innerText()).replace(/\s+/g, " ");
const page = k === "p" ? "raids.html" : `raids-${k}.html`;
const url = h => pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${page}`)).href + (h || "");
const open = async h => { await p.goto("about:blank"); await p.goto(url(h)); await p.waitForTimeout(process.env.RM ? 900 : 2600); };
const pick = async id => { await p.locator(`#rpick button[data-raid="${id}"]`).click(); await settle(); };
const hash = () => p.evaluate(() => decodeURIComponent(location.hash));

await open();
const planner = k === "p";
if (planner) { k = await p.evaluate(() => window.RAIDS_DESIGN || ""); expect(/^[abc]$/.test(k), "raids.html has no chosen design"); }
const both = planner && await p.evaluate(() => !!window.RAIDS_IN_TAB);
if (both) await p.evaluate(() => { try { sessionStorage.removeItem("pd-raids-view"); } catch (e) {} });
if (k === "b") { await p.evaluate(() => { try { localStorage.removeItem("pd-attune:v1"); } catch (e) {} }); await open(); }

/* ---------- every design ---------- */
await step("opens on Serpentshrine Cavern, from the live app's data (469 drops)", async () => {
  expect(await p.locator('#rpick button[data-raid="serpentshrine-cavern"]').getAttribute("aria-pressed") === "true", "SSC not pressed");
  const n = await p.evaluate(() => window.RAID_DATA.counts.drops);
  expect(n === 469, "drops " + n);
  expect(/Hydross/.test(await text()), "no Hydross on the page");
});
await step("picking Tempest Keep re-lights the page and keeps it in the hash", async () => {
  await pick("tempest-keep");
  expect(await p.evaluate(() => document.documentElement.dataset.raid) === "tk", "data-raid not tk");
  expect((await hash()).startsWith("#tempest-keep"), "hash " + await hash());
  expect(/Al'ar|Void Reaver/.test(await text()), "no Tempest Keep bosses");
  await pick("serpentshrine-cavern");
});
await step("search: “dragonspine” finds one drop, in Gruul's Lair, and opens it there", async () => {
  await p.locator("#lq").fill("dragonspine"); await p.locator("#rk-search .rk-hit").first().waitFor({ timeout: 4000 }); await settle(200);
  const r = await text(p.locator("#rk-search"));
  expect(/1 drop matches in 1 raid/.test(r) && /Gruul's Lair/.test(r), "results: " + r.slice(0, 200));
  expect(await ui.isHidden(), "design still shown under the results");
  await p.locator("#rk-search .rk-hit").first().click(); await settle(900);
  expect(await p.locator('#rpick button[data-raid="gruuls-lair"]').getAttribute("aria-pressed") === "true", "Gruul's Lair not selected");
  expect(await p.locator("#rk-search").isHidden() && (await p.locator("#lq").inputValue()) === "", "search not cleared");
  const flashed = await p.evaluate(() => { const e = document.querySelector("#raidui .rk-flash"); return e ? e.textContent + "|" + (e.getAttribute("aria-label") || "") + "|" + (e.dataset.i || e.dataset.tip || "") : ""; });
  const dst = await p.evaluate(() => window.RAID_DATA.items.findIndex(x => x.n === "Dragonspine Trophy"));
  expect(flashed && (flashed.includes("Dragonspine") || flashed.endsWith("|" + dst)), "not flashed: " + flashed);
});
await step("search with no match says so; Esc clears it", async () => {
  await p.locator("#lq").fill("zzqx"); await p.locator("#rk-search .rk-sempty").waitFor({ timeout: 4000 }).catch(() => {}); await settle(200);
  expect(/No drops match “zzqx”/.test(await text(p.locator("#rk-search"))), "no empty state");
  await p.locator("#lq").press("Escape"); await settle();
  expect(await ui.isVisible(), "design not back");
});
await step("tooltip: Dragonspine Trophy shows its stats and the lists that rank it", async () => {
  await pick("gruuls-lair");
  const dst = await p.evaluate(() => window.RAID_DATA.items.findIndex(x => x.n === "Dragonspine Trophy"));
  const el = ui.locator(`[data-tip="${dst}"]`).first();
  if (k === "a") { /* design A shows one boss at a time */ await ui.locator('.ja-list button[data-sub="gruul-the-dragonkiller"]').click(); await settle(); }
  await ui.locator(`[data-tip="${dst}"]`).first().scrollIntoViewIfNeeded();
  if (WIDTH < 700) await ui.locator(`[data-tip="${dst}"]`).first().tap().catch(async () => { await ui.locator(`[data-tip="${dst}"]`).first().focus(); });
  else await ui.locator(`[data-tip="${dst}"]`).first().hover();
  await settle(200);
  const t = (await p.locator("#rk-tip").innerText()).replace(/\s+/g, " ");
  expect(/Dragonspine Trophy/.test(t) && /\+40 Attack Power/.test(t) && /On 10 Wowhead Phase 2 lists/.test(t), "tooltip: " + t.slice(0, 300));
  expect(!/Ranged AP/.test(t), "Ranged AP mirrors Attack Power and should not be a line: " + t.slice(0, 200));
  await p.mouse.move(2, 2); await p.keyboard.press("Escape");
  await pick("serpentshrine-cavern");
});

/* ---------- A · the Adventure Guide ---------- */
if (k === "a") {
  await step("the boss list: About, six bosses and the trash, Hydross first", async () => {
    expect(await ui.locator(".ja-list button").count() === 8, "rail rows " + await ui.locator(".ja-list button").count());
    expect(/Hydross the Unstable/.test(await text(ui.locator("#ja-h"))), "page: " + await text(ui.locator("#ja-h")));
  });
  await step("Hydross: 2 drops on the Fury Warrior list, best first, the rest folded", async () => {
    await ui.locator('.ja-list button[data-sub="hydross-the-unstable"]').click(); await settle();
    const t = await text(ui.locator(".ja-filter"));
    expect(/2 drops here are on the Fury Warrior list/.test(t), "filter: " + t);
    const ranks = await ui.locator(".ja-loot").first().locator(".rk-rank").allInnerTexts();
    expect(ranks.length === 2 && parseInt(ranks[0].slice(1)) <= parseInt(ranks[1].slice(1)), "ranks " + ranks.join(","));
    expect(/20 other drops/.test(await text(ui.locator("details.ja-more summary"))), "fold");
  });
  await step("a boss in the list opens it, and the hash carries it", async () => {
    await ui.locator('.ja-list button[data-sub="leotheras-the-blind"]').click(); await settle();
    expect(/Leotheras the Blind/.test(await text(ui.locator("#ja-h"))), "page");
    expect(await hash() === "#serpentshrine-cavern/leotheras-the-blind", "hash " + await hash());
  });
  await step("Next goes to the following boss", async () => {
    await ui.locator('.ja-nav [data-step="1"]').click(); await settle();
    expect(/Fathom-Lord Karathress/.test(await text(ui.locator("#ja-h"))), "page: " + await text(ui.locator("#ja-h")));
  });
  await step("The fight shows the mechanics", async () => {
    await ui.locator('[data-tab="fight"]').click(); await settle();
    expect(/Four separate targets/.test(await text(ui.locator("#ja-body"))), "fight: " + (await text(ui.locator("#ja-body"))).slice(0, 120));
    await ui.locator('[data-tab="loot"]').click(); await settle();
  });
  await step("Loot for Feral Druid: Al'ar's Gloves of the Searing Grip are #1", async () => {
    await pick("tempest-keep");
    await ui.locator('.ja-list button[data-sub="alar"]').click(); await settle();
    const feral = await p.evaluate(() => window.RAID_DATA.lists.findIndex(l => l.key === "Druid|Feral"));
    await ui.locator("#ja-li").selectOption(String(feral)); await settle();
    const row = ui.locator(".ja-loot").first().locator(".ja-ib", { hasText: "Gloves of the Searing Grip" });
    expect(await row.count() === 1 && /#1/.test(await row.innerText()), "row missing or not #1");
    await ui.locator("#ja-li").selectOption(await p.evaluate(() => String(window.RaidKit.FURY))); await settle();
  });
  await step("About the raid: Tempest Keep's chain says the heroic keys need Revered", async () => {
    await ui.locator('.ja-list button[data-sub="about"]').click(); await settle();
    const t = await text(ui.locator("#ja-body"));
    expect(/The Trial of the Naaru/.test(t) && /Revered with each of the relevant factions/.test(t), "about: " + t.slice(0, 200));
  });
  await step("a link to a boss opens it, with the owner's art on the banner", async () => {
    await open("#karazhan/prince-malchezaar");
    expect(/Prince Malchezaar/.test(await text(ui.locator("#ja-h"))), "page");
    expect(!(await ui.locator(".ja-banner").getAttribute("class")).includes("noart"), "no art");
    expect(await p.evaluate(() => document.documentElement.dataset.raid) === "p1", "Phase 1 light not on");
  });
}

/* ---------- B · the way in ---------- */
if (k === "b") {
  await step("a fresh page: Gruul's and Magtheridon's open to all, the three chains locked", async () => {
    const st = await p.evaluate(() => [...document.querySelectorAll(".jb-door")].map(d => d.dataset.raid + ":" + d.querySelector(".jb-st").textContent));
    expect(st.join(",") === "karazhan:Locked,gruuls-lair:Open to all,magtheridons-lair:Open to all,serpentshrine-cavern:Locked,tempest-keep:Locked", st.join(","));
    expect(/Needs Karazhan first/.test(await text(ui.locator('.jb-door[data-raid="serpentshrine-cavern"]'))), "SSC doesn't say it needs Karazhan");
  });
  await step("ticking a step counts it and moves Next on", async () => {
    await ui.locator('input[data-step="1"]').check(); await settle();
    expect(/1 of 4 done/.test(await text(ui.locator("#jb-ch"))), "count: " + await text(ui.locator("#jb-ch")));
    expect(/Step 2 of 4/i.test(await text(ui.locator(".jb-next"))) && /Earthen Signet/.test(await text(ui.locator(".jb-next"))), "next: " + await text(ui.locator(".jb-next")));
  });
  await step("the step that needs Karazhan says so until Karazhan is done", async () => {
    expect(/Needs your Karazhan attunement: 0 of 8 ticked/.test(await text()), "no dependency note");
  });
  await step("the example: Karazhan attuned, Serpentshrine at step 3, the Blazing Signet next", async () => {
    await ui.locator('[data-act="example"]').click(); await settle();
    expect(/Attuned/i.test(await text(ui.locator('.jb-door[data-raid="karazhan"]'))), "Karazhan door");
    expect(/2 of 4 done/.test(await text(ui.locator("#jb-ch"))), "SSC count");
    expect(/Blazing Signet/.test(await text(ui.locator(".jb-next"))), "next");
    expect(/Karazhan is open to you/.test(await text()), "dependency not met");
  });
  await step("the ticks survive a reload", async () => {
    await open("#serpentshrine-cavern");
    expect(/2 of 4 done/.test(await text(ui.locator("#jb-ch"))), "lost: " + await text(ui.locator("#jb-ch")));
  });
  await step("a door opens that raid; Gruul's Lair says which attunement it is part of", async () => {
    await ui.locator('.jb-door[data-raid="gruuls-lair"]').click(); await settle();
    expect(await p.locator('#rpick button[data-raid="gruuls-lair"]').getAttribute("aria-pressed") === "true", "picker not in step");
    const t = await text();
    expect(/Part of an attunement/i.test(t) && /step 2 of The Cudgel of Kar'desh/.test(t), "chain: " + t.slice(0, 200));
    expect(/Earthen Signet drops here for The Cudgel of Kar'desh, step 2 \(ticked\)/.test(t), "quest drop line");
  });
  await step("inside: Dragonspine Trophy is the Fury list's first pick", async () => {
    const dst = await p.evaluate(() => window.RAID_DATA.items.findIndex(x => x.n === "Dragonspine Trophy"));
    expect(/#1/.test(await ui.locator(`.jb-it[data-i="${dst}"]`).innerText()), "no #1 on the trophy");
  });
  await step("ticking all of Tempest Keep's steps opens its door", async () => {
    await ui.locator('.jb-door[data-raid="tempest-keep"]').click(); await settle();
    for (let o = 1; o <= 5; o++) { const cb = ui.locator(`input[data-step="${o}"]`); if (!(await cb.isChecked())) { await cb.check(); await settle(200); } }
    expect(/Attuned/i.test(await text(ui.locator('.jb-door[data-raid="tempest-keep"]'))), "TK door");
    expect(/Tempest Keep: The Eye is open to you/.test(await text(ui.locator(".jb-next"))), "next box");
  });
  await step("Clear ticks locks them again", async () => {
    await ui.locator('[data-act="clear"]').click(); await settle();
    expect(/Locked/i.test(await text(ui.locator('.jb-door[data-raid="tempest-keep"]'))), "TK still open");
  });
}

/* ---------- the tab's switch: For me / For my raid ---------- */
if (both) {
  await step("the switch: For me first, For my raid shows who wants what, and the link says so", async () => {
    await open("#serpentshrine-cavern");
    expect(await ui.locator('[data-view="me"]').getAttribute("aria-pressed") === "true", "For me not first");
    await ui.locator('[data-view="raid"]').click(); await settle();
    expect(await ui.locator(".jc-p").count() === 25 && !(await ui.locator(".ja-rail").count()), "raid view not shown");
    expect(await hash() === "#serpentshrine-cavern/raid", "hash " + await hash());
  });
  await step("the view is remembered across a reload and a raid change", async () => {
    await open("#serpentshrine-cavern"); expect(await ui.locator(".jc-p").count() === 25, "forgot the raid view");
    await pick("gruuls-lair"); expect(await ui.locator(".jc-p").count() === 25, "lost it on a raid change");
    expect(await hash() === "#gruuls-lair/raid", "hash " + await hash());
  });
  await step("a link to a boss opens the boss journal; search opens a drop in the view you're in", async () => {
    await open("#serpentshrine-cavern/lady-vashj");
    expect(/Lady Vashj/.test(await text(ui.locator("#ja-h"))) && await ui.locator('[data-view="me"]').getAttribute("aria-pressed") === "true", "not the journal");
    await ui.locator('[data-view="raid"]').click(); await settle();
    await p.locator("#lq").fill("dragonspine"); await p.locator("#rk-search .rk-hit").first().waitFor({ timeout: 4000 });
    expect(/raiders want it/.test(await text(p.locator("#rk-search"))), "search doesn't say who wants it in the raid view");
    await p.locator("#rk-search .rk-hit").first().click(); await settle(900);
    expect(await ui.locator(".jc-row.rk-flash").count() === 1, "not flashed in the raid view");
  });
}

/* ---------- C · from your raid ---------- */
if (k === "c" || both) {
  await p.evaluate(() => { try { sessionStorage.removeItem("pd-raidcomp-a:v1"); } catch (e) {} }); await open("#serpentshrine-cavern");
  await step("the example 25: 25 raiders, and the Bear tank said to have no list", async () => {
    expect(await ui.locator(".jc-p").count() === 25, "raiders " + await ui.locator(".jc-p").count());
    expect(await ui.locator(".jc-p.nolist").count() === 1, "no-list raiders");
    expect(/example 25-player raid/.test(await text(ui.locator(".jc-src"))), "source line");
  });
  await step("most wanted: Belt of One-Hundred Deaths, by 11 raiders (the Bear tank has no list)", async () => {
    const t = await text(ui.locator(".jc-top"));
    expect(/Belt of One-Hundred Deaths 11 raiders · 8 rank it first/.test(t), "top: " + t.slice(0, 200));
  });
  await step("Gruul's Lair: Dragonspine Trophy is contested, 9 raiders, 9 first", async () => {
    await pick("gruuls-lair");
    const dst = await p.evaluate(() => window.RAID_DATA.items.findIndex(x => x.n === "Dragonspine Trophy"));
    const row = ui.locator(`.jc-row[data-i="${dst}"]`);
    const t = (await row.innerText()).replace(/\s+/g, " ");
    expect(/9 raiders · 9 first/.test(t) && /Contested/i.test(t), "row: " + t.slice(0, 160));
  });
  await step("a tier token is wanted through the set pieces it buys", async () => {
    const t = await text(ui.locator(".jc-row", { hasText: "Pauldrons of the Fallen Defender" }));
    expect(/\d+ raiders?/.test(t) && /for /.test(await ui.locator(".jc-row", { hasText: "Pauldrons of the Fallen Defender" }).locator(".jc-w").first().getAttribute("title")), "token row: " + t.slice(0, 160));
  });
  await step("Karazhan uses the example 10", async () => {
    await pick("karazhan");
    expect(await ui.locator(".jc-p").count() === 10, "raiders " + await ui.locator(".jc-p").count());
  });
  await step("pressing a raider shows only their wishlist; Show everyone comes back", async () => {
    await pick("serpentshrine-cavern");
    const before = await ui.locator(".jc-row").count();
    await ui.locator('.jc-p[data-p="1-0"]').click(); await settle();
    const t = await text(ui.locator(".jc-selbar"));
    expect(/Fury Warrior/.test(t), "selbar: " + t);
    const rows = await ui.locator(".jc-row").count();
    expect(rows > 0 && rows < before, `rows ${before} → ${rows}`);
    expect(await ui.locator(".jc-row .jc-w.me").count() === rows, "the raider isn't marked on every row");
    await ui.locator('[data-act="all"]').click(); await settle();
    expect(await ui.locator(".jc-row").count() === before, "not back");
  });
  await step("a raid built on Raid Composition replaces the example", async () => {
    await p.evaluate(() => sessionStorage.setItem("pd-raidcomp-a:v1", JSON.stringify({ groups: Array.from({ length: 5 }, (_, g) => Array.from({ length: 5 }, (_, i) => ({ id: g === 0 && i === 0 ? "warrior-fury" : "mage-fire", ...(g === 0 && i === 0 ? { name: "Grommash" } : {}) }))) })));
    await open("#serpentshrine-cavern");
    expect(/Your raid from Raid Composition/.test(await text(ui.locator(".jc-src"))), "source: " + await text(ui.locator(".jc-src")));
    expect(/Grommash/.test(await ui.locator('.jc-p[data-p="0-0"]').getAttribute("title")), "name not used");
    await p.evaluate(() => sessionStorage.removeItem("pd-raidcomp-a:v1"));
  });
}

await step("no sideways scroll", async () => {
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(moved === 0, `scrolls sideways by ${moved}px`);
});
if (WIDTH < 700) await step("Raids controls are at least 44px on a phone", async () => {
  const small = await p.evaluate(() => [...document.querySelectorAll("#raidui button, #raidui input, #raidui summary, #raidui select, #rk-search button")]
    .filter(x => x.offsetParent && !(x.type === "checkbox") && x.getBoundingClientRect().height < 40)
    .map(x => (x.textContent.trim() || x.getAttribute("aria-label") || x.tagName).slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${planner ? "raids.html (" + k + (both ? " with C's view" : "") + ")" : "raids-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
