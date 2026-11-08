// Builds the submission PDF: node docs/report/build.mjs [output.pdf]
// 1) renders the recorded command outputs (docs/evidence/*.txt) as terminal screenshots,
// 2) inlines key source files into the report, 3) prints report.html to PDF with Chromium.
import { chromium } from "playwright-core";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(HERE, "..", "..");
const EVID = join(ROOT, "docs", "evidence");
const SHOTS = join(ROOT, "docs", "screenshots");
const OUT = process.argv[2] ?? join(HERE, "report.pdf");
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

const executablePath = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].find(existsSync);
const browser = await chromium.launch({ executablePath, headless: true });

// ---- 1. terminal screenshots of real, recorded outputs ---------------------
const TERMINALS = [
  ["term_char_baseline.png", "characterization-baseline.txt", "v1-baseline"],
  ["term_char_refactor.png", "characterization-refactored.txt", "v1.1-refactor"],
  ["term_unit.png", "run-unit.txt", "v2-final"],
  ["term_ui.png", "run-ui.txt", "v2-final"],
  ["term_all.png", "run-all-summary.txt", "v2-final"],
  ["term_first_run.png", "first-run-failures.txt", "first run of the new suite (before fixing the test helper)"],
];
const termPage = await browser.newPage({ viewport: { width: 760, height: 200 }, deviceScaleFactor: 2 });
for (const [png, txt, label] of TERMINALS) {
  let text = await readFile(join(EVID, txt), "utf8");
  if (txt === "first-run-failures.txt") text = "$ npm test\n" + text;
  const body = esc(text.trimEnd())
    .replace(/^(\$ .*)$/gm, '<span class="cmd">$1</span>')
    .replace(/^(\s*✔.*)$/gm, '<span class="pass">$1</span>')
    .replace(/^(\s*✖.*)$/gm, '<span class="fail">$1</span>')
    .replace(/^(ℹ (?:pass|fail|tests) .*)$/gm, '<span class="sum">$1</span>')
    .replace(/^(OK|Ran \d+ tests.*)$/gm, '<span class="pass">$1</span>')
    .replace(/(test_\d+ \(.*\) \.\.\. ok)$/gm, '<span class="pass">$1</span>');
  await termPage.setContent(`<html><body style="margin:0;background:#fff">
    <div id="t" style="width:740px;margin:10px;border-radius:8px;overflow:hidden;font:12px 'DejaVu Sans Mono',monospace;box-shadow:0 0 0 1px #2b3040">
      <div style="background:#2b3040;color:#c9d1e3;padding:6px 10px;font-family:sans-serif;font-size:11px">
        <span style="color:#ff5f57">●</span> <span style="color:#febc2e">●</span> <span style="color:#28c840">●</span>
        &nbsp; saintholly@arch: ~/smart-campus-a4 — ${esc(label)}</div>
      <pre style="margin:0;background:#151924;color:#d7dce8;padding:10px 12px;white-space:pre-wrap;line-height:1.35">${body}</pre>
    </div>
    <style>.cmd{color:#7fb4ff;font-weight:bold}.pass{color:#5fd38d}.fail{color:#ff6b6b}.sum{color:#ffd166}</style></body></html>`);
  await termPage.locator("#t").screenshot({ path: join(SHOTS, png) });
}
await termPage.close();

// ---- 2. inline key sources ---------------------------------------------------
let html = await readFile(join(HERE, "report.html"), "utf8");
for (const [key, file] of [["availability", "src/domain/availability.js"], ["filters", "src/domain/filters.js"], ["time", "src/domain/time.js"], ["app", "src/ui/app.js"]]) {
  html = html.replace(`%%${key}%%`, esc((await readFile(join(ROOT, file), "utf8")).trimEnd()));
}
const built = join(HERE, "report.build.html");
await writeFile(built, html);

// ---- 3. print to PDF ---------------------------------------------------------
const page = await browser.newPage();
await page.goto("file://" + built, { waitUntil: "networkidle" });
await page.pdf({
  path: OUT,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="font-size:8px;color:#6b7385;width:100%;padding:0 14mm;display:flex;justify-content:space-between">
    <span>Aliaidar Abilmansur — Software Engineering, Assignment #04</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  margin: { top: "15mm", bottom: "16mm", left: "14mm", right: "14mm" },
});
await browser.close();
console.log("PDF written to", OUT);
