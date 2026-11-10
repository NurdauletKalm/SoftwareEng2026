// Availability rules for Room 304 (AC1–AC5). Pure functions, no React, so they can be unit-tested.
// Mirrors python/booking.py can_book(start, end, now, blocked, existing).

export type Booking = { start: number; end: number; label: string };

export type CheckResult = {
  available: boolean;
  rule: string;
  message: string;
};

export const DAY_MINUTES = 1440;
export const MAX_DURATION = 120;

// Accepts only plain whole numbers ("660"); anything else ("660.5", "6e2", "", "-30") becomes NaN (R1).
export function parseMinutes(input: string): number {
  return /^\d+$/.test(input) ? Number(input) : NaN;
}

export function toHHMM(minutes: number): string {
  if (Number.isNaN(minutes)) return '--:--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function canBook(
  start: number,
  end: number,
  now: number,
  blocked: boolean,
  existing: readonly Booking[],
): CheckResult {
  if (!Number.isInteger(now) || now < 0 || now >= DAY_MINUTES) {
    return { available: false, rule: 'AC1', message: 'Current time now must be a whole minute 0–1439.' };
  }
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { available: false, rule: 'AC1', message: 'Enter start and end as whole minutes after midnight.' };
  }
  if (blocked) {
    return { available: false, rule: 'AC3', message: 'Room 304 is blocked — every request is rejected.' };
  }
  if (start < 0 || end > DAY_MINUTES || start >= end) {
    return {
      available: false,
      rule: 'AC1',
      message: `Times must satisfy 0 ≤ start < end ≤ ${DAY_MINUTES} (got ${start} → ${end}).`,
    };
  }
  if (start <= now) {
    return {
      available: false,
      rule: 'AC1',
      message: `Start (${toHHMM(start)}) must be strictly after now (${toHHMM(now)}).`,
    };
  }
  if (end - start > MAX_DURATION) {
    return {
      available: false,
      rule: 'AC2',
      message: `Duration is ${end - start} min; the maximum is ${MAX_DURATION} min.`,
    };
  }
  for (const b of existing) {
    if (start < b.end && end > b.start) {
      return {
        available: false,
        rule: 'AC4',
        message: `Overlaps existing booking ${toHHMM(b.start)}–${toHHMM(b.end)} (${b.label}).`,
      };
    }
  }
  return { available: true, rule: 'OK', message: `Room 304 is free from ${toHHMM(start)} to ${toHHMM(end)}.` };
}
