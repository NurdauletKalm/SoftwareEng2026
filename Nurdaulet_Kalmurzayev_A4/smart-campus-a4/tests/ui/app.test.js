// UI / integration tests: real browser (headless Chromium via playwright-core) against src/index.html.
// They exercise the full chain DOM -> controller -> filters/availability -> render.
import { describe, test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { openApp } from "./harness.js";

let app;
let page;
before(async () => { app = await openApp({ root: "src" }); page = app.page; });
after(async () => { await app.close(); });
beforeEach(async () => { await page.reload(); });

const roomIds = () => page.$$eval("#rooms [data-room-id]", (cards) => cards.map((c) => c.dataset.roomId));
const resultText = async () => (await page.innerText("#result")).replace(/\s+/g, " ").trim();
async function setTimes(start, end) {
  await page.fill("#start", String(start));
  await page.fill("#end", String(end));
}
async function setEquipment(...items) {
  for (const item of items) await page.check(`#equipment-options input[value="${item}"]`);
}

describe("initial render", () => {
  test("shows all 5 rooms, selects Room 304, no JS errors", async () => {
    assert.deepEqual(await roomIds(), ["R304", "R101", "R210", "R415", "R112"]);
    assert.equal(await page.textContent("#selected-room"), "Room 304 — Innovation Lab");
    assert.equal(await page.textContent("#match-count"), "5 of 5 rooms");
    assert.equal(await page.isHidden("#empty-state"), true);
    assert.deepEqual(app.errors, []);
  });
});

describe("AC1–AC5 regression through the UI (Room 304)", () => {
  // [start, end, expected prefix, rule]
  const cases = [
    [660, 720, "Available", null], // touching
    [630, 690, "Unavailable", "AC4"], // overlapping
    [720, 840, "Available", null], // exactly 120
    [720, 841, "Unavailable", "AC2"], // 121
    [540, 570, "Unavailable", "AC1"], // starts now
  ];
  for (const [start, end, verdict, rule] of cases) {
    test(`${start}–${end} -> ${verdict}${rule ? ` (${rule})` : ""}`, async () => {
      await setTimes(start, end);
      await page.click("#check");
      const text = await resultText();
      assert.ok(text.startsWith(`Result for Room 304 — Innovation Lab ${verdict}`), text);
      if (rule) assert.match(text, new RegExp(`${rule}:`));
    });
  }
  test("bookings list is unchanged after checks (AC5)", async () => {
    const before = await page.innerHTML("#bookings");
    for (const [s, e] of [[630, 690], [660, 720], [720, 841]]) { await setTimes(s, e); await page.click("#check"); }
    assert.equal(await page.innerHTML("#bookings"), before);
  });
});

describe("F1/F2 filtering in the UI", () => {
  test("successful filtering: 24 attendees + projector -> Room 304, Room 101, Room 415", async () => {
    await page.fill("#attendees", "24");
    await setEquipment("projector");
    assert.deepEqual(await roomIds(), ["R304", "R101", "R415"]);
    assert.equal(await page.textContent("#match-count"), "3 of 5 rooms");
  });
  test("capacity boundary: 25 attendees removes Room 304 and moves the selection", async () => {
    await page.fill("#attendees", "25");
    assert.deepEqual(await roomIds(), ["R101", "R415"]);
    assert.equal(await page.textContent("#selected-room"), "Room 101 — Lecture Hall");
  });
});

describe("F3 blocked room", () => {
  test("Room 415 is shown as Blocked and the check is Unavailable (AC3)", async () => {
    await page.click('[data-room-id="R415"]');
    assert.equal(await page.textContent('[data-room-id="R415"] .status'), "Blocked");
    await setTimes(660, 720);
    await page.click("#check");
    const text = await resultText();
    assert.match(text, /^Result for Room 415 — Computer Lab Unavailable AC3:/);
  });
});

describe("F4 empty state", () => {
  test("unsuccessful filtering shows a clear empty state and disables the check", async () => {
    await page.fill("#attendees", "200");
    assert.deepEqual(await roomIds(), []);
    assert.equal(await page.isVisible("#empty-state"), true);
    assert.match(await page.textContent("#empty-detail"), /No room seats 200 attendee\(s\)/);
    assert.equal(await page.isDisabled("#check"), true);
    assert.equal(await page.isHidden("#result"), true);
  });
  test("equipment combination with no match explains which items were requested; Clear filters recovers", async () => {
    await setEquipment("smart-board", "video-conf");
    assert.match(await page.textContent("#empty-detail"), /Smart board \+ Video conferencing/);
    await page.click("#clear-filters");
    assert.equal((await roomIds()).length, 5);
    assert.equal(await page.isEnabled("#check"), true);
  });
});

describe("F5 room switching refreshes the result", () => {
  test("780–840: Available in Room 304, switching to Room 210 re-checks -> Unavailable (AC4)", async () => {
    await setTimes(780, 840);
    await page.click("#check");
    assert.match(await resultText(), /^Result for Room 304 — Innovation Lab Available/);
    await page.click('[data-room-id="R210"]');
    const text = await resultText();
    assert.match(text, /^Result for Room 210 — Seminar Room · re-checked after the room changed Unavailable AC4: overlaps the existing booking 13:00–14:00/);
    assert.equal(await page.getAttribute("#result", "data-room-id"), "R210");
    assert.equal(await page.getAttribute('[data-room-id="R210"]', "aria-checked"), "true");
  });
  test("when a filter removes the selected room, the result follows the new selection", async () => {
    await setTimes(630, 690);
    await page.click("#check");
    assert.match(await resultText(), /Room 304 — Innovation Lab Unavailable AC4/);
    await setEquipment("video-conf"); // Room 304 has no video conferencing
    assert.equal(await page.textContent("#selected-room"), "Room 101 — Lecture Hall");
    assert.match(await resultText(), /^Result for Room 101 — Lecture Hall · re-checked after the room changed Available/);
  });
});

describe("AC6 responsive layout", () => {
  test("at 375 px wide there is no horizontal scroll and the result is readable", async () => {
    await page.setViewportSize({ width: 375, height: 800 });
    await setTimes(630, 690);
    await page.click("#check");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `horizontal overflow of ${overflow}px`);
    const box = await page.locator("#result").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 375, JSON.stringify(box));
    await page.setViewportSize({ width: 1280, height: 900 });
  });
});
