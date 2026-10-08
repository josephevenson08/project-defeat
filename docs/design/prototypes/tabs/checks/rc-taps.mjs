import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
const { chromium } = createRequire(path.resolve("package.json"))("playwright");
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const short = sel => `[...document.querySelectorAll(${JSON.stringify(sel)})].filter(x=>x.offsetParent&&x.getBoundingClientRect().height<44).map(x=>(x.id||x.className||x.tagName)+" '"+x.textContent.trim().slice(0,22)+"' "+Math.round(x.getBoundingClientRect().height))`;
for (const [d, file, ex, pickSel] of [["A","raid-composition.html","#examplebtn","#picker button"],["B","raid-comp-b.html","#resetbtn","#groups .picker button"]]) {
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, reducedMotion: "reduce" }), p = await ctx.newPage();
  await p.goto(pathToFileURL(path.resolve("docs/design/prototypes/tabs", file)).href); await p.waitForTimeout(800);
  await p.click(ex); await p.waitForTimeout(200);
  const page = await p.evaluate(s => eval(s), short("main button, main input, main select, main summary"));
  await p.click('#groups [data-act="move"][data-g="0"][data-i="0"]'); await p.waitForTimeout(200);
  const here = await p.evaluate(s => eval(s), short('#groups [data-act="here"]'));
  await p.keyboard.press("Escape");
  if (d === "A") { console.log(d, "page:", page.join(" | ") || "all ≥44"); console.log(d, "move targets:", here.join(" | ") || "all ≥44"); console.log(d, "picker: none (the palette and pencils are in the page check)"); await ctx.close(); continue; }
  await p.click('#groups [data-act="remove"][data-g="0"][data-i="0"]'); await p.waitForTimeout(200);
  await p.click('#groups [data-act="add"][data-g="0"][data-i="0"]'); await p.waitForTimeout(200);
  const pk1 = await p.evaluate(s => eval(s), short(pickSel));
  await p.click(d === "A" ? '#pk-classes button[data-cls="Druid"]' : '#groups .picker button[data-cls="Druid"]'); await p.waitForTimeout(200);
  const pk2 = await p.evaluate(s => eval(s), short(pickSel + ", #pk-name"));
  console.log(d, "page:", page.join(" | ") || "all ≥44");
  console.log(d, "move targets:", here.join(" | ") || "all ≥44");
  console.log(d, "picker classes:", pk1.join(" | ") || "all ≥44");
  console.log(d, "picker specs:", pk2.join(" | ") || "all ≥44");
  await ctx.close();
}
await b.close();
