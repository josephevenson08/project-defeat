// Hands-on test of the three Gear designs (gear-a/b/c.html). Run from the repo root:
//   node docs/design/prototypes/tabs/checks/gear-handson.mjs a|b|c|p   (WIDTH=400 for a phone, RM=1 for reduced motion)
// p = planner.html, the chosen Gear tab (B's character sheet with C's checklist as "What's left").
// The hit-rating checks use real numbers: Destroyer Battle-Helm has 21 hit, Furious Gizmatic Goggles 13, Glyph of
// Ferocity 16, Rigid Dawnstone 8; the recommended set totals 140 against the 142 cap.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const k = (process.argv[2] || "a").toLowerCase(), WIDTH = +(process.env.WIDTH || 1280);
const AD = {
  a: { open: s => `#gearui [data-slot="${s}"]`, back: s => `#gearui [data-slot="${s}"]`, name: s => `[data-slot="${s}"] .ga-name` },
  b: { open: s => `#gearui [data-slot="${s}"]`, back: s => `#gearui [data-slot="${s}"]`, name: s => `[data-slot="${s}"] .gb-lab b` },
  c: { open: s => `#gearui [data-open="${s}"]`, back: s => `#gearui [data-open="${s}"]`, name: s => `[data-row="${s}"] .gc-item b` },
  p: { open: s => `#gearui-b [data-slot="${s}"]`, back: s => `#gearui-b [data-slot="${s}"]`, name: s => `#gearui-b [data-slot="${s}"] .gb-lab b` },
}[k];
const FILE = k === "p" ? "planner.html" : `gear-${k}.html`;
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH < 700 ? 860 : 900 }, reducedMotion: process.env.RM ? "reduce" : "no-preference" });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", e => errs.push("pageerror: " + e.message)); p.on("console", m => { if (m.type() === "error" && !/WebGL/.test(m.text())) errs.push("console: " + m.text()); });
p.setDefaultTimeout(4000); p.setDefaultNavigationTimeout(30000);
const results = [];
async function step(name, fn) { try { await fn(); results.push(["PASS", name]); } catch (e) { results.push(["FAIL", name, String(e.message || e).split("\n").filter(l => l.trim()).slice(0, 6).join(" / ").slice(0, 600)]); } }
const expect = (c, m) => { if (!c) throw new Error(m); };
const settle = () => p.waitForTimeout(process.env.RM ? 120 : 450);
const hit = async () => +((await p.locator("#hitwarn").innerText()).match(/(\d+) \/ 142/) || [0, -1])[1];
const nameOf = async s => (await p.locator(AD.name(s)).first().innerText()).trim();
const openSlot = async s => { await p.locator(AD.open(s)).first().click(); await settle(); };

await p.goto(pathToFileURL(path.resolve(`docs/design/prototypes/tabs/${FILE}`)).href);
await p.waitForTimeout(process.env.RM ? 900 : 2800);
await step("loads: 17 slots, real icons, hit 140 / 142", async () => {
  await p.locator("#gx-rec").click(); await settle();
  const r = await p.evaluate(() => ({ slots: document.querySelectorAll("#gearui [data-slot], #gearui [data-open]").length, ok: [...document.querySelectorAll("#gearui img")].filter(i => i.complete && i.naturalWidth > 0).length, broken: [...document.querySelectorAll("#gearui img")].filter(i => i.complete && i.naturalWidth === 0).length }));
  /* icons below the first screen load when scrolled to, so only count the broken ones */
  expect(r.slots >= 17, `${r.slots} slot controls`); expect(r.ok > 0 && !r.broken, `${r.ok} icons loaded, ${r.broken} broken`);
  expect(await hit() === 140, "hit is " + await hit());
});
await step("swap Head to rank 2 (Furious Gizmatic Goggles): hit 140 → 132", async () => {
  await openSlot("Head"); await p.locator('#gearui [data-pick="furious-gizmatic-goggles"]').click(); await settle();
  expect(/Furious Gizmatic Goggles/.test(await nameOf("Head")), "Head reads " + await nameOf("Head"));
  expect(await hit() === 132, "hit is " + await hit());
});
await step("remove the Head enchant (Glyph of Ferocity, 16 hit): 132 → 116", async () => {
  await p.locator('#gearui [data-ench=""]').first().click(); await settle();
  expect(await hit() === 116, "hit is " + await hit());
});
await step("Rigid Dawnstone (8 hit, yellow) in the blue socket: 116 → 124, socket bonus off", async () => {
  await p.locator('#gearui [data-gem="1"][data-id="rigid-dawnstone"]').first().click(); await settle();
  expect(await hit() === 124, "hit is " + await hit());
  const txt = (await p.locator("#gearui").innerText()).replace(/\s+/g, " ");
  expect(/Socket bonus[^.]*off/i.test(txt), "no 'socket bonus off' text near the gems");
});
await step("Escape closes the slot and returns focus to it", async () => {
  await p.keyboard.press("Escape"); await settle();
  const f = await p.evaluate(() => { const a = document.activeElement; return a && (a.dataset.slot || a.dataset.open); });
  expect(f === "Head", "focus is on " + f);
  expect(!(await p.locator("#ga-pane:not([hidden]), #gb-fly:not([hidden]), .gc-drawer").count()), "the pane, flyout or drawer is still open");
});
await step("unique rings: Finger 2 can't take the ring already in Finger 1", async () => {
  await openSlot("Finger 2");
  const n = await p.locator('#gearui [data-pick="band-of-the-ranger-general"]:disabled').count();
  expect(n === 1, "Band of the Ranger-General is not disabled in Finger 2");
  await p.keyboard.press("Escape"); await settle();
});
await step("part-geared example: hit changes and the design reports problems", async () => {
  await p.locator("#gx-part").click(); await settle();
  expect(await hit() !== 140, "hit still 140");
  const txt = (await p.locator("#gearui").innerText()).replace(/\s+/g, " ");
  expect(/No enchant|no enchant/.test(txt), "the unenchanted gloves aren't shown");
});
await step("empty every slot: hit 0, and a way back", async () => {
  await p.locator("#gx-empty").click(); await settle();
  expect(await hit() === 0, "hit is " + await hit());
  const txt = (await p.locator("#gearui").innerText()).replace(/\s+/g, " ");
  expect(/empty|Empty|Nothing equipped/.test(txt), "no empty-state text");
});
await step("equip the recommended set: back to 140", async () => {
  await p.locator("#gx-rec").first().click(); await settle();
  expect(await hit() === 140, "hit is " + await hit());
});
await step("gear survives a reload (kept for the session)", async () => {
  await openSlot("Head"); await p.locator('#gearui [data-pick="warbringer-battle-helm"]').click(); await settle();
  await p.reload(); await p.waitForTimeout(process.env.RM ? 900 : 2800);
  expect(/Warbringer Battle-Helm/.test(await nameOf("Head")), "Head reads " + await nameOf("Head"));
  await p.locator("#gx-rec").click(); await settle();
});
await step("the other sub-tabs still work (Compare, Ranked Gear)", async () => {
  await p.locator("#t-compare").click(); await settle();
  expect(await p.locator("#p-compare").isVisible(), "Compare panel not visible");
  await p.locator("#t-ranked").click(); await settle();
  expect(await p.locator("#p-ranked").isVisible(), "Ranked Gear panel not visible");
  await p.locator("#t-gear").click(); await settle();
  expect(await p.locator("#gearui").isVisible(), "Gear panel not back");
});
if (k === "p") {
  const lst = () => p.locator("#gearui-c"), sheet = () => p.locator("#gearui-b");
  await step("view switch: What's left shows the checklist, Character sheet brings the sheet back", async () => {
    await p.locator('[data-gview="list"]').click(); await settle();
    expect(await lst().isVisible() && !(await sheet().isVisible()), "checklist not shown alone");
    await p.locator('[data-gview="sheet"]').click(); await settle();
    expect(await sheet().isVisible() && !(await lst().isVisible()), "sheet not shown alone");
  });
  await step("the toggle counts what's left (part-geared: 7)", async () => {
    await p.locator("#gx-part").click(); await settle();
    const n = (await p.locator("#gp-n").innerText()).trim();
    expect(n === "(7)", "count reads " + n);
  });
  await step("a fix in the checklist shows on the sheet (Hands gets Major Strength)", async () => {
    await p.locator('[data-gview="list"]').click(); await settle();
    await p.locator('#gearui-c [data-fix="ench"][data-slot="Hands"]').click(); await settle();
    await p.locator('[data-gview="sheet"]').click(); await settle();
    const t = (await p.locator('#gearui-b [data-slot="Hands"]').innerText()).replace(/s+/g, " ");
    expect(/enchanted/.test(t) && !/no enchant/.test(t), "Hands reads " + t);
    expect((await p.locator("#gp-n").innerText()).trim() === "(6)", "count reads " + await p.locator("#gp-n").innerText());
  });
  await step("the sheet's counts open the checklist, filtered to what's left", async () => {
    await p.locator("#gearui-b .gb-go").first().click(); await settle();
    expect(await lst().isVisible(), "checklist not shown");
    expect(await p.locator('#gearui-c [data-show="todo"]').getAttribute("aria-pressed") === "true", "not filtered to what's left");
    const rows = await p.locator("#gearui-c .gc-row").count();
    expect(rows === 6, rows + " rows shown");
    await p.locator('[data-gview="sheet"]').click(); await p.locator("#gx-rec").click(); await settle();
  });
}
await step("no sideways scroll", async () => {
  const r = await p.evaluate(() => { const W = document.documentElement.clientWidth;
    const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o !== "visible") return true; } return false; };
    return { sw: document.documentElement.scrollWidth - W, who: [...document.querySelectorAll("body *")].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.right > W + .5 && getComputedStyle(e).position !== "fixed" && !clipped(e); }).slice(0, 5).map(e => (e.id ? "#" + e.id : e.tagName.toLowerCase() + "." + [...e.classList].join(".")) + "→" + Math.round(e.getBoundingClientRect().right)) }; });
  /* the planner's pointer parallax nudges panels a pixel or two when the mouse moves; what matters is whether the
     page can actually be scrolled sideways */
  const moved = await p.evaluate(() => { const y = scrollY; scrollTo(60, y); const x = scrollX; scrollTo(0, y); return x; });
  expect(r.sw <= 0 || moved === 0, `scrolls sideways by ${moved}px, from: ` + r.who.join(", "));
});
if (WIDTH < 700) await step("gear controls are at least 44px on a phone", async () => {
  await openSlot("Chest");
  const small = await p.evaluate(() => [...document.querySelectorAll("#gearui button")].filter(x => x.offsetParent && x.getBoundingClientRect().height < 44).map(x => (x.textContent.trim() || x.getAttribute("aria-label") || "").slice(0, 24) + " " + Math.round(x.getBoundingClientRect().height)).slice(0, 8));
  expect(!small.length, "short: " + small.join(" | "));
});
if (errs.length) results.push(["FAIL", "script errors", errs.slice(0, 4).join(" | ")]);
await b.close();
for (const r of results) console.log(r.join("  "));
console.log(`${k === "p" ? "planner" : "gear-" + k} @${WIDTH}${process.env.RM ? " reduced" : ""}: ${results.filter(r => r[0] === "PASS").length} pass, ${results.filter(r => r[0] === "FAIL").length} fail`);
