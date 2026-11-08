# Smart Campus Room Availability Checker — Assignment #04

Software Engineering, Assignment #04 — *AI-assisted software evolution, refactoring and quality improvement.*
Student: **Nurdaulet Kalmurzayev**. AI assistant: **Claude Code (model Claude Opus 5.5)**, 2026-11-07.

The A3 single-room prototype (Room 304) is extended to a catalog of **5 fictional rooms** with
capacity and equipment filters, refactored into separate data / domain / UI modules, and covered by
**67 automated tests** (52 unit + 15 browser UI tests). No login, payments, live APIs or database.

## Requirements

* Node.js ≥ 20 (tested with v26.10.0)
* A Chromium/Chrome binary for the UI tests (auto-detected at `/usr/bin/chromium`,
  `/usr/bin/chromium-browser`, `/usr/bin/google-chrome`, or set `CHROMIUM_PATH=/path/to/chrome`)

## Setup, run, test

```bash
npm install          # installs the only dev dependency: playwright-core (no browser download)
npm start            # serves the repo on http://127.0.0.1:8080  ->  open http://127.0.0.1:8080/src/
npm test             # all 67 tests  (node --test tests/)
npm run test:unit    # 52 unit tests (domain + data, no browser)
npm run test:ui      # 15 Playwright UI/integration tests (headless Chromium)
```

The app is plain HTML + ES modules (no build step). Because browsers block ES modules on `file://`,
open it through `npm start` (or any static server) rather than double-clicking `index.html`.

## Project structure

```
src/
  index.html, styles.css      page markup and responsive styles
  data/rooms.js               fictional, deep-frozen catalog (5 rooms), equipment list, DEFAULT_NOW
  domain/time.js              parseWholeNumber(), toHHMM(), DAY_MINUTES
  domain/availability.js      AC1–AC5: checkAvailability(), overlaps(), isWellFormedInterval(), canBook()
  domain/filters.js           F1–F2: roomMatches(), filterRooms(), requirementsError()
  ui/render.js                pure HTML/text builders (result, room cards, empty state, timeline)
  ui/app.js                   controller: state, events, single render() path (F3–F5 behaviour)
tests/
  unit/a3-regression.test.js  the 22 Python cases from A3, ported 1:1
  unit/availability.test.js   AC1–AC5 + boundaries (120/121, touching/overlap) + room isolation
  unit/filters.test.js        catalog integrity, F1 (24 vs 25), F2 (ALL items), F3
  unit/time.test.js           parsing / formatting
  ui/app.test.js              browser tests: filtering, empty state, room switching, AC6 mobile
  characterization/           golden-master test for the single-room versions (see below)
scripts/serve.js              zero-dependency static server (also used by UI tests)
docs/                         analysis, design, evaluation, AI evidence, screenshots, test logs
```

## Versions (Git references)

| Tag / commit | Content |
|---|---|
| `v1-baseline` | A3 single-room prototype (`index.html` + monolithic `app.js`) + `python/booking.py` + 22 Python tests |
| `v1.1-refactor` | same behaviour, split into data/domain/ui modules; Python duplicate removed, tests ported |
| `v2-final` | room catalog + filters F1–F5, 67 tests, final de-duplication |

Characterization test for the single-room versions:

```bash
git worktree add ../baseline v1-baseline
CHARACTERIZATION=1 APP_ROOT=../baseline node --test tests/characterization/single-room.characterization.js   # 12/12
git checkout v1.1-refactor
CHARACTERIZATION=1 APP_ROOT=src node --test tests/characterization/single-room.characterization.js           # 12/12
```

## Fictional data

| ID | Name | Capacity | Equipment | Blocked | Bookings |
|---|---|---|---|---|---|
| R304 | Room 304 — Innovation Lab | 24 | projector, whiteboard, smart board | no | 600–660 |
| R101 | Room 101 — Lecture Hall | 120 | projector, microphone, video conferencing | no | 480–600, 780–840 |
| R210 | Room 210 — Seminar Room | 16 | whiteboard, video conferencing | no | 600–660, 780–840 |
| R415 | Room 415 — Computer Lab | 30 | projector, whiteboard, computers | **yes** | — |
| R112 | Room 112 — Huddle Room | 6 | whiteboard, video conferencing | no | — |

Fixed current time: `now = 540` (09:00), editable on the page for testing AC1.
