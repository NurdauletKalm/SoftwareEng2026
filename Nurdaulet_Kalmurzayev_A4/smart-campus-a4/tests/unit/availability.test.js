// AC1–AC5 regression tests on the room-based domain API + required boundaries.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { checkAvailability, overlaps, MAX_DURATION } from "../../src/domain/availability.js";
import { ROOMS, findRoom } from "../../src/data/rooms.js";

const NOW = 540;
const room304 = findRoom("R304"); // bookings [600, 660)
const check = (start, end, room = room304, now = NOW) => checkAvailability({ start, end }, room, now);

describe("AC1 — valid time", () => {
  test("rejects a request that starts exactly at now (540–570)", () => {
    const r = check(540, 570);
    assert.equal(r.available, false);
    assert.equal(r.rule, "AC1");
  });
  test("accepts a request starting one minute after now (541–570)", () => {
    assert.equal(check(541, 570).available, true);
  });
  test("rejects reversed and zero-length intervals", () => {
    assert.equal(check(720, 660).rule, "AC1");
    assert.equal(check(700, 700).rule, "AC1");
  });
  test("day bounds: end 1440 allowed, end 1441 rejected", () => {
    assert.equal(check(1380, 1440).available, true);
    assert.equal(check(1380, 1441).rule, "AC1");
  });
  test("non-integer minutes are rejected (no silent truncation)", () => {
    assert.equal(check(660.5, 720).rule, "AC1");
    assert.equal(check(Number.NaN, 720).rule, "AC1");
  });
});

describe("AC2 — 120-minute maximum (boundary)", () => {
  test("exactly 120 minutes (720–840) is available", () => {
    assert.equal(MAX_DURATION, 120);
    assert.equal(check(720, 840).available, true);
  });
  test("121 minutes (720–841) is rejected by AC2", () => {
    const r = check(720, 841);
    assert.equal(r.available, false);
    assert.equal(r.rule, "AC2");
    assert.match(r.message, /121 min/);
  });
});

describe("AC3 — blocked room", () => {
  test("a blocked room rejects an otherwise valid, free slot", () => {
    const blocked = { ...room304, blocked: true };
    const r = check(660, 720, blocked);
    assert.equal(r.available, false);
    assert.equal(r.rule, "AC3");
  });
});

describe("AC4 — overlap rules (touching vs overlapping)", () => {
  test("touching the end of a booking (660–720 after 600–660) is available", () => {
    assert.equal(check(660, 720).available, true);
  });
  test("touching the start of a booking (570–600 before 600–660) is available", () => {
    assert.equal(check(570, 600).available, true);
  });
  test("overlapping by one minute (659–720) is rejected and names the conflict", () => {
    const r = check(659, 720);
    assert.equal(r.rule, "AC4");
    assert.deepEqual(r.conflict, { start: 600, end: 660 });
  });
  test("partial overlap (630–690) is rejected", () => {
    assert.equal(check(630, 690).rule, "AC4");
  });
  test("overlaps() is symmetric and half-open", () => {
    const a = { start: 600, end: 660 };
    assert.equal(overlaps(a, { start: 660, end: 720 }), false);
    assert.equal(overlaps({ start: 660, end: 720 }, a), false);
    assert.equal(overlaps(a, { start: 615, end: 645 }), true);
  });
});

describe("AC5 — unambiguous verdict, no mutation", () => {
  test("verdict is always a strict boolean with a message", () => {
    for (const [s, e] of [[660, 720], [630, 690], [720, 841], [540, 570]]) {
      const r = check(s, e);
      assert.equal(typeof r.available, "boolean");
      assert.ok(r.message.length > 0);
    }
  });
  test("room data is deep-frozen and unchanged after many checks", () => {
    const snapshot = structuredClone(ROOMS);
    for (const room of ROOMS) for (let s = 541; s < 1440; s += 37) checkAvailability({ start: s, end: s + 60 }, room, NOW);
    assert.deepEqual(ROOMS, snapshot);
    assert.ok(Object.isFrozen(room304.bookings) && Object.isFrozen(room304.bookings[0]));
    assert.throws(() => { "use strict"; room304.bookings.push({ start: 0, end: 1 }); }, TypeError);
  });
});

describe("Room isolation — the check uses the chosen room's bookings", () => {
  test("780–840 is free in Room 304 but booked in Room 210", () => {
    assert.equal(check(780, 840, findRoom("R304")).available, true);
    const r = check(780, 840, findRoom("R210"));
    assert.equal(r.rule, "AC4");
    assert.deepEqual(r.conflict, { start: 780, end: 840 });
  });
  test("630–690 is booked in Room 304 but free in Room 112", () => {
    assert.equal(check(630, 690, findRoom("R304")).rule, "AC4");
    assert.equal(check(630, 690, findRoom("R112")).available, true);
  });
});
