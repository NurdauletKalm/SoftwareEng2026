// Regression tests for confirmed risks R1 (non-integer minutes accepted) and R2 (invalid `now` accepted).
import { describe, expect, it } from 'vitest';
import { canBook, parseMinutes } from '../src/lib/availability';

const BASE = [{ start: 600, end: 660, label: 'fictional' }];

describe('R1 — start/end must be whole minutes (AC1)', () => {
  it.each(['660.5', '6e2', '', ' ', '-30', '12abc'])('parseMinutes(%j) is rejected (NaN)', (raw) => {
    expect(parseMinutes(raw)).toBeNaN();
  });
  it.each([
    ['0', 0],
    ['660', 660],
    ['1440', 1440],
  ])('parseMinutes(%j) === %i', (raw, value) => expect(parseMinutes(raw)).toBe(value));
  it('UI probe P1: 660.5-720 is Unavailable with an AC1 message', () => {
    const r = canBook(parseMinutes('660.5'), parseMinutes('720'), 540, false, BASE);
    expect(r.available).toBe(false);
    expect(r.rule).toBe('AC1');
  });
  it('a non-integer number passed directly is rejected', () => {
    expect(canBook(660.5, 720, 540, false, BASE).available).toBe(false);
  });
});

describe('R2 — now must be a whole minute in 0..1439 (AC1)', () => {
  it('UI probe P4: now=-30 does not make 0-60 Available', () => {
    const r = canBook(0, 60, -30, false, BASE);
    expect(r.available).toBe(false);
    expect(r.message).toMatch(/now/i);
  });
  it('UI probe P3: now=2000 explains the invalid now instead of "33:20"', () => {
    const r = canBook(660, 720, 2000, false, BASE);
    expect(r.available).toBe(false);
    expect(r.message).toMatch(/0.1439/);
    expect(r.message).not.toMatch(/33:20/);
  });
  it.each([NaN, 1440, 540.5])('now=%s is rejected', (now) => {
    expect(canBook(660, 720, now, false, BASE).available).toBe(false);
  });
  it('boundaries now=0 and now=1439 are still valid', () => {
    expect(canBook(60, 120, 0, false, BASE).available).toBe(true);
    expect(canBook(1439, 1440, 1438, false, BASE).available).toBe(true);
    expect(canBook(1439, 1440, 1439, false, BASE).available).toBe(false); // starts now
  });
});
