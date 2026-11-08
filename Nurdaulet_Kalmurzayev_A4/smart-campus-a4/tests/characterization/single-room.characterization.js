// Characterization (golden-master) UI test for the SINGLE-ROOM prototype.
// It records the observable behaviour of the A3 baseline so that the refactored
// single-room version (commit "refactor: split ...") can be proven equivalent.
// Not part of `npm test` (the final UI has a room catalog instead of the blocked/dataset toggles).
// Run against the single-room versions with:
//   CHARACTERIZATION=1 APP_ROOT=<dir> node --test tests/characterization/single-room.characterization.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { openApp } from "../ui/harness.js";

const ROOT = process.env.APP_ROOT;
const ENABLED = process.env.CHARACTERIZATION === "1";
let app;

before(async () => { if (ENABLED) app = await openApp({ root: ROOT }); });
after(async () => { if (app) await app.close(); });

async function check(start, end, { now = 540, blocked = false, dataset = "default" } = {}) {
  const { page } = app;
  await page.fill("#now", String(now));
  await page.setChecked("#blocked", blocked);
  await page.selectOption("#dataset", dataset);
  await page.fill("#start", String(start));
  await page.fill("#end", String(end));
  await page.click("#check");
  return (await page.textContent("#result")).replace(/\s+/g, " ").trim();
}

// [start, end, options, expected verdict, expected rule tag]
const CASES = [
  [660, 720, {}, "Available", null],               // touching endpoint
  [630, 690, {}, "Unavailable", "AC4"],            // overlap
  [660, 720, { blocked: true }, "Unavailable", "AC3"],
  [720, 840, {}, "Available", null],               // exactly 120
  [720, 841, {}, "Unavailable", "AC2"],            // 121
  [540, 570, {}, "Unavailable", "AC1"],            // starts now
  [720, 660, {}, "Unavailable", "AC1"],            // reversed
  [1320, 1440, {}, "Available", null],             // day bound
  [1350, 1441, {}, "Unavailable", "AC1"],          // past midnight
  [660, 720, { dataset: "multi" }, "Available", null],
  [800, 860, { dataset: "multi" }, "Unavailable", "AC4"],
];

for (const [start, end, opts, verdict, rule] of CASES) {
  test(`characterization ${start}-${end} ${JSON.stringify(opts)} -> ${verdict}${rule ? " (" + rule + ")" : ""}`, { skip: !ENABLED }, async () => {
    const text = await check(start, end, opts);
    assert.ok(text.startsWith(verdict), `got: ${text}`);
    if (rule) assert.match(text, new RegExp(rule));
  });
}

test("characterization: existing bookings list is unchanged after checks (AC5)", { skip: !ENABLED }, async () => {
  const items = await app.page.$$eval("#bookings li", (lis) => lis.map((li) => li.textContent.replace(/\s+/g, " ").trim()));
  assert.deepEqual(items, ["10:00 – 11:00 (600, 660)", "13:00 – 14:00 (780, 840)"]);
});
