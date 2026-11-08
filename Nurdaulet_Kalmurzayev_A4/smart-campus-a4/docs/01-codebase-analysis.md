# Task 01 — Codebase analysis (performed on tag `v1-baseline`, before any code edits)

## 1. Context given to the AI assistant (Claude Code, model Claude Opus 5.5, 2026-11-07)

**Repository map**

| Path | Role | Size |
|---|---|---|
| `index.html` | Markup + inline CSS of the single-room page (Room 304) | 106 lines |
| `app.js` | ALL logic: data (`ROOM_NAME`, `DATASETS`, `state`), rules (`onCheck`), live hint (`updateHints`), rendering (`renderBookings`, `renderTimeline`), event wiring | 151 lines |
| `python/booking.py` | `can_book(start, end, now, blocked, existing)` — second implementation of AC1–AC4 | 33 lines |
| `python/test_booking.py` | 22 `unittest` cases for `can_book` | 86 lines |

**Acceptance criteria to preserve:** AC1 valid time (0 ≤ start < end ≤ 1440, start > now) · AC2 ≤ 120 min ·
AC3 blocked room rejects everything · AC4 overlap `start < b_end && end > b_start`, touching allowed ·
AC5 unambiguous verdict, bookings never mutated · AC6 clear feedback, usable mobile layout.

**New requirements:** ≥ 4 fictional rooms (id, name, capacity, equipment, blocked, own bookings);
F1 capacity ≥ attendees; F2 room has ALL selected equipment; F3 blocked room never reported available;
F4 clear empty state; F5 changing the selected room refreshes the result.

**Constraints:** no login, payments, live APIs or database; fictional data; fixed current time; responsive UI;
small incremental changes, no full rewrite.

**Prompt summary:** *"Here is the repository map, AC1–AC6, F1–F5 and the constraints above. Read `app.js` and
`python/booking.py`. List at least three maintainability risks with file/function references, then propose a
prioritised, small-step improvement plan. Do not edit code yet."*

## 2. Baseline record (measured, see `docs/evidence/baseline-measurements.txt`)

* Python unit tests: `cd python && python3 -m unittest -v test_booking` → **22 / 22 passed**.
* Web prototype automated tests: **0** (only manual checks in A3).
* Characterization UI test written for this assignment (`tests/ui/characterization.test.js`) → **12 / 12 passed** on the baseline.

## 3. Maintainability risks (with references)

| # | Risk | Evidence (file:line / function) | Impact |
|---|---|---|---|
| R1 | **The same business rule is implemented in several places.** The overlap rule exists 4× (`app.js:59` in `onCheck`, `app.js:84` in `updateHints`, `app.js:117` in `renderTimeline`, `python/booking.py:30`); the 120-minute rule 4× (`app.js:51,80,119`, `booking.py:21`); the day-bounds rule 4× (`app.js:39,79,114`, `booking.py:12`). | grep output in baseline measurements | A rule change (e.g. a 90-min limit) must be edited in 4 places; the copies already disagree — `renderTimeline` ignores `now`, so a past slot is painted green while `onCheck` says *Unavailable*. |
| R2 | **No separation of concerns — rules are welded to the DOM.** `onCheck()` (`app.js:24-67`) reads inputs with `document.getElementById`, validates, and writes `innerHTML` in one function. | `app.js:24-67` | The rules cannot be unit-tested without a browser; this is why the web app had 0 automated tests and a separate Python copy was needed. |
| R3 | **Single-room assumptions are hard-coded globals.** `ROOM_NAME` (`app.js:5`), `DATASETS` (`app.js:7`) and the mutable `state.blocked` / `state.dataset` (`app.js:12-16`) model exactly one room. | `app.js:5-16`, `index.html:63` (`#room-title`) | Adding a room catalog would multiply globals; there is no notion of "the selected room", so availability could accidentally use another room's bookings (the F-requirement explicitly forbids that). |
| R4 | **Duplicated rendering.** The result banner markup is built 6 times inside `onCheck` (`app.js:33-65`); HH:MM formatting exists twice (`fmt()` at `app.js:18` and inline `padStart` at `app.js:98-99`). | grep `banner.innerHTML` = 6 | Inconsistent wording/styling; every new message copies markup again. |
| R5 | **Weak input contract.** `parseInt("660.5")` silently becomes `660` (`app.js:25-27`), while the Python version rejects non-integers via its type guard. Booking data is not frozen, so AC5 relies on discipline only. | `app.js:25-27`, `app.js:7-10` | Hidden divergence between the two implementations; immutability not enforced. |

## 4. Prioritised improvement plan (agreed before editing)

1. **Safety net first** — keep the characterization UI test green on every step (done: 12/12 on baseline).
2. **Extract pure domain modules** (`src/domain/time.js`, `src/domain/availability.js`) with ONE implementation of AC1–AC4; port the 22 Python cases to JS unit tests; remove the Python duplicate. *(R1, R2, R5)*
3. **Extract presentation** (`src/ui/render.js`) — one result renderer, one HH:MM formatter. *(R4)*
4. **Move data to `src/data/rooms.js`** as a deep-frozen catalog of rooms. *(R3, R5)* — re-run characterization test → must stay 12/12 (behaviour unchanged).
5. **Feature:** add `src/domain/filters.js` (F1, F2) and room selection UI (F3–F5) on top of the clean modules.
6. **Tests:** unit tests for AC1–AC5 + F1–F3 boundaries, Playwright UI tests for F4, F5, AC6 and room switching.
7. **Evaluate** original vs final with measured numbers only.

## 5. AI suggestion that was rejected / modified

* **Rejected:** the assistant's first plan proposed rebuilding the prototype with **React + Vite + TypeScript**
  (mirroring the Bolt.new stack) and adding a test framework such as Vitest/Jest. I rejected this: it is a full
  rewrite, adds a build step and ~hundreds of transitive packages for a 150-line app, and would make the
  "before vs after" comparison meaningless. Final decision: **plain ES modules, no build step**, Node's built-in
  `node:test` runner, and a single dev dependency (`playwright-core`) used only for UI tests with the system Chromium.
* **Modified:** the assistant suggested that blocked rooms be **hidden** from the filtered list. That conflicts with
  "display only rooms satisfying the user's selected requirements" (blocking is not a user requirement) and would hide
  useful information. I changed it to: blocked rooms are listed with a red **Blocked** badge, and any availability check
  on them returns *Unavailable (AC3)* — F3 is enforced in the domain layer, not by hiding UI.
