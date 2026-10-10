// Checks the prototypes as GitHub Pages will serve them: built into dist/ and opened under /project-defeat/.
// Run from the repo root after `npm run build && node tools/publish/copy-prototypes.mjs`, with the
// `project-defeat-preview` server running (vite preview on port 4173). BASE overrides the site address, e.g.
// BASE=https://josephevenson08.github.io/project-defeat/ to check the live site.
// For every page the gallery links to: the file was published, the page loads with no script errors or failed
// requests, and every icon it asks for comes back as an image. Then the app itself still loads.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");

const BASE = process.env.BASE || "http://localhost:4173/project-defeat/";
const DIST = path.resolve("dist");
const local = BASE.startsWith("http://localhost");

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
let fails = 0;
const say = (ok, msg) => { if (!ok) fails++; console.log((ok ? "PASS  " : "FAIL  ") + msg); };

async function visit(url, wait) {
  const p = await ctx.newPage();
  const errs = [], icons = [];
  p.on("pageerror", e => errs.push("pageerror: " + e.message));
  // a 404 is reported below with its address, so the console's copy of it (which has none) is dropped
  p.on("console", m => { if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) errs.push("console: " + m.text()); });
  // the gallery parks each live preview on about:blank and loads it only near the screen, which cancels its first load
  p.on("requestfailed", r => {
    const why = (r.failure() || {}).errorText || "";
    if (!(/ERR_ABORTED/.test(why) && r.frame() !== p.mainFrame())) errs.push(`failed (${why}): ${r.url()}`);
  });
  p.on("response", r => {
    const u = r.url();
    if (r.status() >= 400) errs.push(r.status() + ": " + u);
    if (/\/icons\/[^/]+\.(jpg|png)$/.test(u)) icons.push({ u, ok: r.status() === 200 && /^image\//.test(r.headers()["content-type"] || "") });
  });
  const res = await p.goto(url, { waitUntil: "load" });
  await p.waitForTimeout(wait);
  const brokenImgs = await p.evaluate(() => [...document.images].filter(i => i.complete && i.src && i.naturalWidth === 0).map(i => i.src));
  const title = await p.title();
  const links = await p.evaluate(() => [...document.querySelectorAll("a[href]")].map(a => a.href));
  await p.close();
  return { status: res && res.status(), errs, icons, brokenImgs, title, links };
}

const gallery = BASE + "prototypes/index.html";
const g = await visit(gallery, 1500);
say(g.status === 200 && g.errs.length === 0, `gallery loads (${g.title})${g.errs.length ? ": " + g.errs.join(" | ") : ""}`);
const pages = [...new Set(g.links.filter(h => h.startsWith(BASE + "prototypes/")).map(h => h.split("#")[0]))];
say(pages.length > 30, `gallery links to ${pages.length} prototype pages`);

let iconTotal = 0;
for (const url of pages) {
  const rel = decodeURIComponent(url.slice(BASE.length));
  // vite preview answers a missing file with the app's index.html, so check the file itself was published
  if (local && !fs.existsSync(path.join(DIST, rel))) { say(false, `${rel}: not in dist/`); continue; }
  const r = await visit(url, 2000);
  const badIcons = r.icons.filter(i => !i.ok).map(i => i.u);
  iconTotal += r.icons.length;
  const ok = r.status === 200 && r.errs.length === 0 && badIcons.length === 0 && r.brokenImgs.length === 0;
  const extra = [...r.errs, ...badIcons.map(u => "bad icon: " + u), ...r.brokenImgs.map(u => "broken img: " + u)];
  say(ok, `${rel}${r.icons.length ? ` (${r.icons.length} icons)` : ""}${extra.length ? ": " + extra.slice(0, 4).join(" | ") : ""}`);
}
say(iconTotal > 0, `${iconTotal} icon requests across the pages, all images`);

const app = await visit(BASE, 2500);
say(app.status === 200 && app.errs.length === 0, `the app still loads at ${BASE} (${app.title})${app.errs.length ? ": " + app.errs.join(" | ") : ""}`);

await browser.close();
console.log(`${fails ? fails + " failed" : "all passed"}`);
process.exit(fails ? 1 : 0);
