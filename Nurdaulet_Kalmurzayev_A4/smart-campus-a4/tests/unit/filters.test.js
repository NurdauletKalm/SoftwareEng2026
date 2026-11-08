// F1–F3 tests for room filtering, plus catalog integrity.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { filterRooms, roomMatches, requirementsError } from "../../src/domain/filters.js";
import { checkAvailability } from "../../src/domain/availability.js";
import { ROOMS, EQUIPMENT, findRoom } from "../../src/data/rooms.js";

const ids = (rooms) => rooms.map((room) => room.id);
const req = (attendees, equipment = []) => ({ attendees, equipment });

describe("Catalog (fictional data)", () => {
  test("has at least four rooms, each with id, name, capacity, equipment, blocked and own bookings", () => {
    assert.ok(ROOMS.length >= 4);
    const known = new Set(EQUIPMENT.map((e) => e.id));
    for (const room of ROOMS) {
      assert.equal(typeof room.id, "string");
      assert.equal(typeof room.name, "string");
      assert.ok(Number.isInteger(room.capacity) && room.capacity > 0);
      assert.ok(Array.isArray(room.equipment) && room.equipment.every((e) => known.has(e)));
      assert.equal(typeof room.blocked, "boolean");
      assert.ok(Array.isArray(room.bookings));
    }
    assert.equal(new Set(ids(ROOMS)).size, ROOMS.length, "room ids are unique");
    assert.ok(ROOMS.some((r) => r.blocked), "catalog contains a blocked room");
  });
});

describe("F1 — capacity filter (boundary)", () => {
  test("exact capacity matches: 24 attendees -> Room 304 (capacity 24) included", () => {
    assert.ok(ids(filterRooms(ROOMS, req(24))).includes("R304"));
  });
  test("insufficient capacity: 25 attendees -> Room 304 excluded", () => {
    assert.ok(!ids(filterRooms(ROOMS, req(25))).includes("R304"));
  });
  test("1 attendee and no equipment shows the whole catalog", () => {
    assert.deepEqual(ids(filterRooms(ROOMS, req(1))), ids(ROOMS));
  });
  test("invalid attendee counts match nothing and produce a message", () => {
    for (const bad of [0, -3, 2.5, Number.NaN]) {
      assert.deepEqual(filterRooms(ROOMS, req(bad)), []);
      assert.ok(requirementsError(req(bad)));
    }
    assert.equal(requirementsError(req(1)), null);
  });
});

describe("F2 — equipment filter (ALL items required)", () => {
  test("projector + computers -> only Room 415", () => {
    assert.deepEqual(ids(filterRooms(ROOMS, req(1, ["projector", "computers"]))), ["R415"]);
  });
  test("a room with only SOME of the items is excluded", () => {
    const room304 = findRoom("R304"); // has projector, not video-conf
    assert.equal(roomMatches(room304, req(1, ["projector"])), true);
    assert.equal(roomMatches(room304, req(1, ["projector", "video-conf"])), false);
  });
  test("capacity and equipment combine (AND): 20 people + video-conf -> Room 101 only", () => {
    assert.deepEqual(ids(filterRooms(ROOMS, req(20, ["video-conf"]))), ["R101"]);
  });
  test("no room has smart board + video conferencing -> empty result (feeds F4)", () => {
    assert.deepEqual(filterRooms(ROOMS, req(1, ["smart-board", "video-conf"])), []);
  });
});

describe("F3 — blocked room is never reported available", () => {
  test("Room 415 is blocked, has no bookings, and still returns Unavailable (AC3) for every valid slot", () => {
    const room = findRoom("R415");
    assert.equal(room.blocked, true);
    assert.equal(room.bookings.length, 0);
    for (let start = 541; start + 60 <= 1440; start += 30) {
      const r = checkAvailability({ start, end: start + 60 }, room, 540);
      assert.equal(r.available, false);
      assert.equal(r.rule, "AC3");
    }
  });
  test("blocked rooms that meet the requirements are still listed (with a Blocked status in the UI)", () => {
    assert.ok(ids(filterRooms(ROOMS, req(30, ["computers"]))).includes("R415"));
  });
});
