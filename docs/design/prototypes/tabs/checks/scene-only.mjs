import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const OUT = process.env.OUT, TABS = path.resolve("docs/design/prototypes/tabs");
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const page of ["home","planner","simulation","raid-composition","tier-lists","raids","professions"]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
  await p.goto(pathToFileURL(path.join(TABS, page + ".html")).href);
  await p.waitForTimeout(4500);
  await p.addStyleTag({ content: "body>*:not(#scene):not(.fallback){visibility:hidden!important}" });
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, `scene-${page}.png`) });
  await ctx.close();
}
await b.close();
