# Smart Campus Room Availability Checker — Room 304 (Innovation Lab)

Single-page prototype that checks whether a requested time interval in **one fictional campus room**
(Room 304 — Innovation Lab) is available. It only *checks* availability against fictional in-memory
bookings; it never creates, saves or confirms reservations. No login, no database, no backend, no
external APIs.

Built with Bolt.new (Vite + React + TypeScript + Tailwind CSS). A Python reference implementation of the
same contract lives in `python/`.

## Acceptance contract

| ID | Rule |
|----|------|
| AC1 | Start/end are whole minutes after midnight, `0 <= start < end <= 1440`, and `start > now` (`now` in 0..1439). |
| AC2 | Duration `end - start <= 120` (exactly 120 is allowed). |
| AC3 | If the room is blocked, every request is rejected. |
| AC4 | Reject overlap with an existing booking (`start < b_end and end > b_start`); touching endpoints are allowed. |
| AC5 | Unambiguous Available / Unavailable verdict; existing bookings are never mutated. |
| AC6 | Clear validation feedback and a usable layout on narrow/mobile screens. |

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run lint && npm run typecheck
npm test           # Vitest: parity with python/test_booking.py + regression tests
```

## Python reference

```bash
cd python
python3 test_booking.py
```

## Files

- `src/App.tsx` — the UI (test conditions, request form, result banner, timeline, rules card).
- `src/lib/availability.ts` — `canBook()`, `parseMinutes()`, `toHHMM()`: the AC1–AC5 rules as pure functions.
- `tests/` — Vitest suites: `availability.parity.test.ts` (Python cases ported 1:1) and
  `availability.regression.test.ts` (whole-minute input and `now` range, risks R1/R2).
- `python/booking.py` — `can_book()` reference implementation.
- `python/test_booking.py` — 12 unit tests.
- `AGENTS.md` — rules for AI coding agents (scope, safe commands, forbidden actions, review gate).
- `docs/practice10/` — Practice #10 risk review, risk register, audits and recorded evidence.
