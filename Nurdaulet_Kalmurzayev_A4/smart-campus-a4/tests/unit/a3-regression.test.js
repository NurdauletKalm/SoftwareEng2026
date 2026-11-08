// The 22 Assignment #03 cases from python/test_booking.py, ported 1:1 to the JS domain module.
// Contract: canBook(start, end, now, blocked, existing[(start, end)]).
import { test } from "node:test";
import assert from "node:assert/strict";
import { canBook } from "../../src/domain/availability.js";

const NOW = 540;
const EXISTING = [[600, 660]];

// [python test name, args, expected]
const CASES = [
  ["test_1 touching after booking", [660, 720, NOW, false, [[600, 660]]], true],
  ["test_2 overlap", [630, 690, NOW, false, EXISTING], false],
  ["test_3 blocked", [660, 720, NOW, true, EXISTING], false],
  ["test_4 exactly 120 min", [720, 840, NOW, false, EXISTING], true],
  ["test_5 121 min", [720, 841, NOW, false, EXISTING], false],
  ["test_6 starts now", [540, 570, NOW, false, EXISTING], false],
  ["test_7 inside booking", [615, 645, NOW, false, EXISTING], false],
  ["test_8 covers booking", [570, 690, NOW, false, EXISTING], false],
  ["test_9 touching before booking", [570, 600, NOW, false, EXISTING], true],
  ["test_10 identical interval", [600, 660, NOW, false, EXISTING], false],
  ["test_11 in the past", [500, 530, NOW, false, EXISTING], false],
  ["test_12 one minute after now", [541, 570, NOW, false, EXISTING], true],
  ["test_13 zero length", [700, 700, NOW, false, EXISTING], false],
  ["test_14 reversed", [720, 700, NOW, false, EXISTING], false],
  ["test_15 ends at 1440", [1380, 1440, NOW, false, EXISTING], true],
  ["test_16 ends at 1441", [1380, 1441, NOW, false, EXISTING], false],
  ["test_17 negative times", [-10, 30, -20, false, []], false],
  ["test_18 empty bookings", [660, 720, NOW, false, []], true],
  ["test_19 between two bookings (touching both)", [660, 720, NOW, false, [[600, 660], [720, 780]]], true],
  ["test_20 overlaps second booking", [660, 720, NOW, false, [[600, 660], [700, 760]]], false],
];

for (const [name, args, expected] of CASES) {
  test(`A3 ${name}`, () => assert.equal(canBook(...args), expected));
}

test("A3 test_21 existing list is not mutated (AC5)", () => {
  const existing = [[700, 760], [600, 660]];
  const snapshot = structuredClone(existing);
  canBook(660, 720, NOW, false, existing);
  canBook(630, 690, NOW, false, existing);
  assert.deepEqual(existing, snapshot);
});

test("A3 test_22 always returns a boolean (AC5)", () => {
  for (const args of [[660, 720, NOW, false, EXISTING], [630, 690, NOW, false, EXISTING], [720, 700, NOW, false, EXISTING]]) {
    assert.equal(typeof canBook(...args), "boolean");
  }
});
