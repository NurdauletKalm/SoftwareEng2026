// Parity suite: the 10 Python cases from python/test_booking.py ported 1:1 to the TypeScript rules.
import { describe, expect, it } from 'vitest';
import { type Booking, canBook } from '../src/lib/availability';

const b = (start: number, end: number): Booking => ({ start, end, label: 'fictional' });
const BASE = [b(600, 660)];
const ok = (s: number, e: number, now: number, blocked: boolean, existing: Booking[]) =>
  canBook(s, e, now, blocked, existing).available;

describe('canBook — parity with python/test_booking.py', () => {
  it('AC1 starts now is rejected (540-570, now=540)', () => expect(ok(540, 570, 540, false, BASE)).toBe(false));
  it('AC1 reversed times are rejected (720-660)', () => expect(ok(720, 660, 540, false, BASE)).toBe(false));
  it('AC1 valid day bound 1320-1440 is allowed', () => expect(ok(1320, 1440, 540, false, BASE)).toBe(true));
  it('AC1 end 1441 is rejected', () => expect(ok(1350, 1441, 540, false, BASE)).toBe(false));
  it('AC2 exactly 120 minutes is allowed (720-840)', () => expect(ok(720, 840, 540, false, BASE)).toBe(true));
  it('AC2 121 minutes is rejected (720-841)', () => expect(ok(720, 841, 540, false, BASE)).toBe(false));
  it('AC3 blocked room is rejected', () => expect(ok(660, 720, 540, true, BASE)).toBe(false));
  it('AC4 touching endpoint is allowed (660-720 vs 600-660)', () => expect(ok(660, 720, 540, false, BASE)).toBe(true));
  it('AC4 overlap is rejected (630-690 vs 600-660)', () => expect(ok(630, 690, 540, false, BASE)).toBe(false));
  it('AC5 existing bookings are not mutated', () => {
    const existing = [b(600, 660), b(780, 840)];
    const snapshot = structuredClone(existing);
    expect(ok(660, 720, 540, false, existing)).toBe(true);
    expect(existing).toEqual(snapshot);
  });
});

describe('canBook — rule reported to the user (AC6 feedback)', () => {
  it.each([
    [540, 570, false, 'AC1'],
    [720, 841, false, 'AC2'],
    [660, 720, true, 'AC3'],
    [630, 690, false, 'AC4'],
    [660, 720, false, 'OK'],
  ])('%i-%i blocked=%s -> %s', (s, e, blocked, rule) => {
    expect(canBook(s, e, 540, blocked, BASE).rule).toBe(rule);
  });
});
