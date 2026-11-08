// Room filtering rules F1–F2 (pure functions, no DOM).

/** Validates user requirements; returns an error message or null. */
export function requirementsError({ attendees }) {
  return Number.isInteger(attendees) && attendees >= 1 ? null : "Attendees must be a whole number of 1 or more.";
}

/** F1: capacity >= attendees.  F2: room has ALL required equipment items. */
export function roomMatches(room, { attendees, equipment }) {
  return room.capacity >= attendees && equipment.every((item) => room.equipment.includes(item));
}

/** Rooms satisfying the requirements, in catalog order. Invalid requirements match nothing. */
export function filterRooms(rooms, requirements) {
  if (requirementsError(requirements)) return [];
  return rooms.filter((room) => roomMatches(room, requirements));
}
