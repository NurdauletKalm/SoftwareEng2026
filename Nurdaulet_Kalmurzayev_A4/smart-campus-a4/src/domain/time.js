// Time helpers — the ONLY place that knows how minutes are parsed and formatted.
export const DAY_MINUTES = 1440;

/** Strictly parse a whole number ("660" -> 660, "6.5" / "" / "abc" -> NaN). Used for minutes and attendees. */
export function parseWholeNumber(raw) {
  const text = String(raw ?? "").trim();
  return /^-?\d+$/.test(text) ? Number(text) : NaN;
}

/** 660 -> "11:00", 1440 -> "24:00"; invalid input -> "--:--". */
export function toHHMM(minutes) {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > DAY_MINUTES) return "--:--";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
