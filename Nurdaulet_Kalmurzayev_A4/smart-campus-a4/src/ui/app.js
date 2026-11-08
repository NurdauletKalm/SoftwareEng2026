// Controller: owns UI state, reads inputs, calls the domain, writes the DOM.
// All rendering goes through render(), so every view is derived from the same state.
import { DEFAULT_NOW, EQUIPMENT, ROOMS, findRoom } from "../data/rooms.js";
import { checkAvailability } from "../domain/availability.js";
import { filterRooms, requirementsError } from "../domain/filters.js";
import { parseWholeNumber, toHHMM } from "../domain/time.js";
import * as view from "./render.js";

const $ = (id) => document.getElementById(id);

const state = {
  selectedId: ROOMS[0].id, // Room 304 — the A3 room — is selected by default
  checked: false, // becomes true after the first "Check availability"; result then stays in sync
  refreshedFor: null, // room id whose result was re-computed because the selection changed (F5)
};

const readRequirements = () => ({
  attendees: parseWholeNumber($("attendees").value),
  equipment: [...document.querySelectorAll("#equipment-options input:checked")].map((box) => box.value),
});
const readRequest = () => ({ start: parseWholeNumber($("start").value), end: parseWholeNumber($("end").value) });
const readNow = () => parseWholeNumber($("now").value);

function selectRoom(id) {
  if (id === state.selectedId) return;
  state.selectedId = id;
  state.refreshedFor = state.checked ? id : null;
  render();
}

function renderRooms(requirements, matches) {
  const error = requirementsError(requirements);
  $("req-error").hidden = !error;
  $("req-error").textContent = error ?? "";
  $("match-count").textContent = view.matchCountText(matches.length, ROOMS.length);
  $("rooms").innerHTML = matches
    .map((room) => view.roomCardHTML(room, { selected: room.id === state.selectedId, required: requirements.equipment, equipment: EQUIPMENT }))
    .join("");
  const empty = matches.length === 0;
  $("empty-state").hidden = !empty;
  $("empty-detail").textContent = empty && !error ? view.emptyStateText(requirements, EQUIPMENT) : error ?? "";
}

function renderCheck(room) {
  const request = readRequest();
  const now = readNow();
  $("start-hhmm").textContent = toHHMM(request.start);
  $("end-hhmm").textContent = toHHMM(request.end);
  $("now-hhmm").textContent = toHHMM(now);
  $("selected-room").textContent = room ? room.name : "none — no room matches the requirements";
  $("check").disabled = !room;

  const banner = $("result");
  if (!room) {
    $("hint").textContent = "";
    $("bookings").innerHTML = "";
    $("timeline").innerHTML = "";
    banner.hidden = true;
    return;
  }
  const verdict = checkAvailability(request, room, now); // ONE call feeds hint, timeline and banner
  $("hint").textContent = state.checked ? "" : view.hintText(verdict);
  $("bookings").innerHTML = view.bookingsHTML(room.bookings);
  $("timeline").innerHTML = view.timelineHTML(room.bookings, request, verdict);
  banner.hidden = !state.checked;
  if (state.checked) {
    banner.className = view.resultClass(verdict);
    banner.innerHTML = view.resultHTML(verdict, room, { refreshed: state.refreshedFor === room.id });
    banner.dataset.roomId = room.id;
  }
}

function render() {
  const requirements = readRequirements();
  const matches = filterRooms(ROOMS, requirements);
  // If the selected room no longer matches, move the selection to the first match (F5) or to none (F4).
  if (!matches.some((room) => room.id === state.selectedId)) {
    const next = matches[0]?.id ?? null;
    state.refreshedFor = state.checked && next ? next : null;
    state.selectedId = next;
  }
  renderRooms(requirements, matches);
  renderCheck(findRoom(state.selectedId));
}

// ---- wiring ---------------------------------------------------------------
$("equipment-options").innerHTML = view.equipmentOptionsHTML(EQUIPMENT);
$("now").value = String(DEFAULT_NOW);

$("attendees").addEventListener("input", render);
$("equipment-options").addEventListener("change", render);
const onTimeInput = () => { state.refreshedFor = null; render(); };
["start", "end", "now"].forEach((id) => $(id).addEventListener("input", onTimeInput));
$("rooms").addEventListener("click", (event) => {
  const card = event.target.closest("[data-room-id]");
  if (card) selectRoom(card.dataset.roomId);
});
$("check").addEventListener("click", () => {
  state.checked = true;
  state.refreshedFor = null;
  render();
});
$("clear-filters").addEventListener("click", () => {
  $("attendees").value = "1";
  document.querySelectorAll("#equipment-options input").forEach((box) => { box.checked = false; });
  render();
});
document.querySelectorAll(".preset").forEach((btn) =>
  btn.addEventListener("click", () => {
    $("start").value = btn.dataset.s;
    $("end").value = btn.dataset.e;
    onTimeInput();
  }),
);

render();
