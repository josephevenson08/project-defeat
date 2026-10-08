// Checks the seven tab prototypes after the per-tab background change.
// Run from the repo root: node <this file>
import { createRequire } from "node:module";
import path from "node:path";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
import { pathToFileURL } from "node:url";

const TABS = path.resolve("docs/design/prototypes/tabs");
const OUT = process.env.OUT;
const PAGES = {
  home: "ssc", planner: "planner", simulation: "tk", "raid-composition": null,
  "tier-lists": "tiers", raids: null, professions: "profs",
};
const MODES = [
  { name: "1280", viewport: { width: 1280, height: 800 } },
  { name: "400", viewport: { width: 400, height: 860 } },
  { name: "reduced", viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" },
  { name: "nogl", viewport: { width: 1280, height: 800 }, noGL: true },
];

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let problems = 0;
for (const [page, theme] of Object.entries(PAGES)) {
  for (const m of MODES) {
    const ctx = await browser.newContext({ viewport: m.viewport, reducedMotion: m.reducedMotion || "no-preference" });
    if (m.noGL) await ctx.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : orig.call(this, t, ...a); };
    });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", e => errs.push("pageerror: " + e.message));
    p.on("console", msg => { if (msg.type() === "error" || (msg.type() === "warning" && /TBCKit/.test(msg.text()))) errs.push(msg.type() + ": " + msg.text()); });
    p.on("requestfailed", r => errs.push("failed: " + r.url()));
    await p.goto(pathToFileURL(path.join(TABS, page + ".html")).href, { waitUntil: "load" });
    await p.waitForTimeout(m.name === "reduced" || m.noGL ? 1500 : 3500);
    const info = await p.evaluate(() => ({
      theme: document.documentElement.dataset.tbcTheme || null,
      gl: document.documentElement.classList.contains("gl"),
      kitOk: !!(window.TBCKit && window.TBCKit.ok),
      sideways: document.documentElement.scrollWidth - innerWidth,
      fallbackBg: getComputedStyle(document.querySelector(".fallback") || document.body).backgroundImage.slice(0, 60),
      raidpick: !!document.querySelector(".raidpick button"),
    }));
    const bad = [];
    if (errs.length) bad.push(...errs);
    if (info.sideways > 0) bad.push("sideways scroll " + info.sideways + "px");
    if (theme && info.theme !== theme) bad.push("theme " + info.theme + " (expected " + theme + ")");
    if (!m.noGL && !info.kitOk) bad.push("kit 3D extras not running");
    if (page === "home" && info.raidpick) bad.push("raid backdrop switch still present");
    problems += bad.length;
    console.log(`${page.padEnd(17)} ${m.name.padEnd(8)} theme=${info.theme} gl=${info.gl} kit=${info.kitOk} ${bad.length ? "PROBLEMS: " + bad.join(" | ") : "ok"}`);
    if (OUT && m.name !== "reduced") await p.screenshot({ path: path.join(OUT, `${page}-${m.name}.png`) });
    await ctx.close();
  }
}
await browser.close();
console.log(problems ? `${problems} problem(s)` : "all clear");
