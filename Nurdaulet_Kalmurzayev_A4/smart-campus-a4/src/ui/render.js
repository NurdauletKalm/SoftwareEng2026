// Presentation helpers: pure functions that turn domain objects into HTML strings / text.
import { DAY_MINUTES, toHHMM } from "../domain/time.js";
import { isWellFormedInterval } from "../domain/availability.js";

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** The ONE place that renders an availability verdict (AC5 + AC6). `room` labels whose result it is (F5). */
export function resultHTML(result, room, { refreshed = false } = {}) {
  const title = result.available ? "Available" : "Unavailable";
  const prefix = result.rule ? `${result.rule}: ` : "";
  const note = refreshed ? " · re-checked after the room changed" : "";
  const forRoom = room ? `<span class="for">Result for ${escapeHtml(room.name)}${note}</span>` : "";
  return `${forRoom}<strong>${title}</strong><p>${escapeHtml(prefix + result.message)}</p>`;
}

export const resultClass = (result) => `result ${result.available ? "ok" : "bad"}`;

export function bookingsHTML(bookings) {
  if (bookings.length === 0) return `<li class="muted">No bookings today.</li>`;
  return bookings
    .map((b) => `<li>${toHHMM(b.start)} – ${toHHMM(b.end)} <span class="badge">(${b.start}, ${b.end})</span></li>`)
    .join("");
}

const segment = (cls, start, end) =>
  `<div class="seg ${cls}" style="left:${(start / DAY_MINUTES) * 100}%;width:${((end - start) / DAY_MINUTES) * 100}%"></div>`;

/** Day timeline; the candidate colour comes from the SAME verdict used for the result banner. */
export function timelineHTML(bookings, request, preview) {
  let html = bookings.map((b) => segment("booked", b.start, b.end)).join("");
  if (isWellFormedInterval(request)) {
    html += segment(preview.available ? "cand-ok" : "cand-bad", request.start, request.end);
  }
  return html;
}

/** Short live hint shown while typing (before pressing Check). */
export const hintText = (preview) => (preview.available ? "" : `${preview.rule}: ${preview.message}`);

const labelOf = (equipment, id) => equipment.find((item) => item.id === id)?.label ?? id;

export function equipmentOptionsHTML(equipment) {
  return equipment
    .map((item) => `<label><input type="checkbox" name="equipment" value="${escapeHtml(item.id)}"> ${escapeHtml(item.label)}</label>`)
    .join("");
}

/** One selectable room card. Blocked rooms carry a "Blocked" status, never "Open" (F3). */
export function roomCardHTML(room, { selected, required, equipment }) {
  const chips = room.equipment
    .map((id) => `<span class="chip${required.includes(id) ? " req" : ""}">${escapeHtml(labelOf(equipment, id))}</span>`)
    .join("");
  const status = room.blocked ? `<span class="status blocked">Blocked</span>` : `<span class="status open">Open</span>`;
  return `<button type="button" class="room" role="radio" aria-checked="${selected}" data-room-id="${escapeHtml(room.id)}">
  <span class="top"><span class="name">${escapeHtml(room.name)}</span>${status}</span>
  <span class="meta">${escapeHtml(room.id)} · capacity ${room.capacity} · ${room.bookings.length} booking(s) today</span>
  <span class="chips">${chips}</span>
</button>`;
}

export const matchCountText = (shown, total) => `${shown} of ${total} rooms`;

/** F4 empty-state explanation, built from the active requirements. */
export function emptyStateText({ attendees, equipment: required }, equipment) {
  const items = required.map((id) => labelOf(equipment, id));
  const needs = items.length ? ` with ${items.join(" + ")}` : "";
  return `No room seats ${attendees} attendee(s)${needs}. Lower the number of attendees or remove an equipment requirement.`;
}
