// Booking / availability rules AC1–AC5 — single source of truth (pure functions, no DOM).
import { DAY_MINUTES, toHHMM } from "./time.js";

export const MAX_DURATION = 120;

/** Half-open intervals [start, end) overlap; touching endpoints do NOT overlap (AC4). */
export function overlaps(a, b) {
  return a.start < b.end && a.end > b.start;
}

/** AC1 shape rule: whole minutes with 0 <= start < end <= 1440. */
export function isWellFormedInterval({ start, end }) {
  return Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start < end && end <= DAY_MINUTES;
}

const verdict = (available, rule, message, extra = {}) => ({ available, rule, message, ...extra });

/**
 * Check a request against ONE room (its own blocked flag and its own bookings).
 * Never mutates `room` or `room.bookings` (AC5). Returns { available, rule, message[, conflict] }.
 */
export function checkAvailability(request, room, now) {
  const { start, end } = request;
  if (room.blocked) {
    return verdict(false, "AC3", `${room.name} is blocked, so every request is rejected.`);
  }
  if (!isWellFormedInterval(request)) {
    return verdict(false, "AC1", `times must be whole minutes with 0 ≤ start < end ≤ ${DAY_MINUTES}.`);
  }
  if (!Number.isInteger(now) || now < 0 || now >= DAY_MINUTES) {
    return verdict(false, "AC1", `the current time must be a whole minute between 0 and ${DAY_MINUTES - 1}.`);
  }
  if (start <= now) {
    return verdict(false, "AC1", `start (${toHHMM(start)}) must be after the current time (${toHHMM(now)}).`);
  }
  if (end - start > MAX_DURATION) {
    return verdict(false, "AC2", `duration is ${end - start} min; the maximum is ${MAX_DURATION} min.`);
  }
  const conflict = room.bookings.find((booking) => overlaps(request, booking));
  if (conflict) {
    return verdict(false, "AC4", `overlaps the existing booking ${toHHMM(conflict.start)}–${toHHMM(conflict.end)}.`, { conflict });
  }
  return verdict(true, null, `${room.name} is free from ${toHHMM(start)} to ${toHHMM(end)}.`);
}

/** Assignment #03 contract kept for regression tests: can_book(start, end, now, blocked, existing[(s, e)]). */
export function canBook(start, end, now, blocked, existing) {
  const bookings = existing.map(([s, e]) => ({ start: s, end: e }));
  return checkAvailability({ start, end }, { name: "Room", blocked, bookings }, now).available;
}
