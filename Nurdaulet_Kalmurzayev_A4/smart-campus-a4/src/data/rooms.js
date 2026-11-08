// Fictional data only (no API / database). Deep-frozen so no code path can mutate it (AC5).
export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export const DEFAULT_NOW = 540; // fixed "current time": 09:00

export const EQUIPMENT = deepFreeze([
  { id: "projector", label: "Projector" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "smart-board", label: "Smart board" },
  { id: "video-conf", label: "Video conferencing" },
  { id: "computers", label: "Computers" },
  { id: "microphone", label: "Microphone" },
]);

// Each room owns its blocked flag and its bookings ([start, end) in minutes after midnight).
export const ROOMS = deepFreeze([
  {
    id: "R304",
    name: "Room 304 — Innovation Lab",
    capacity: 24,
    equipment: ["projector", "whiteboard", "smart-board"],
    blocked: false,
    bookings: [{ start: 600, end: 660 }], // A3 default dataset
  },
  {
    id: "R101",
    name: "Room 101 — Lecture Hall",
    capacity: 120,
    equipment: ["projector", "microphone", "video-conf"],
    blocked: false,
    bookings: [{ start: 480, end: 600 }, { start: 780, end: 840 }],
  },
  {
    id: "R210",
    name: "Room 210 — Seminar Room",
    capacity: 16,
    equipment: ["whiteboard", "video-conf"],
    blocked: false,
    bookings: [{ start: 600, end: 660 }, { start: 780, end: 840 }], // A3 multi dataset
  },
  {
    id: "R415",
    name: "Room 415 — Computer Lab",
    capacity: 30,
    equipment: ["projector", "whiteboard", "computers"],
    blocked: true, // closed for maintenance: no bookings, but still never available (F3)
    bookings: [],
  },
  {
    id: "R112",
    name: "Room 112 — Huddle Room",
    capacity: 6,
    equipment: ["whiteboard", "video-conf"],
    blocked: false,
    bookings: [],
  },
]);

export const findRoom = (id) => ROOMS.find((room) => room.id === id) ?? null;
