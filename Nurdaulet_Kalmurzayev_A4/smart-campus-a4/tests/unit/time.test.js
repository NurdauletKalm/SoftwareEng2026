import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWholeNumber, toHHMM } from "../../src/domain/time.js";

test("toHHMM formats minutes and rejects out-of-range values", () => {
  assert.equal(toHHMM(0), "00:00");
  assert.equal(toHHMM(660), "11:00");
  assert.equal(toHHMM(1440), "24:00");
  assert.equal(toHHMM(1441), "--:--");
  assert.equal(toHHMM(Number.NaN), "--:--");
});

test("parseWholeNumber is strict (no parseInt truncation)", () => {
  assert.equal(parseWholeNumber("660"), 660);
  assert.equal(parseWholeNumber(" 24 "), 24);
  assert.equal(parseWholeNumber("-5"), -5);
  for (const bad of ["660.5", "", "abc", "12px", null, undefined]) assert.ok(Number.isNaN(parseWholeNumber(bad)), String(bad));
});
