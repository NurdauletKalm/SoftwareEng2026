# Task 01 — Prepare the baseline

**Project.** Smart Campus Room Availability Checker: Room 304 — Innovation Lab, one fictional room, no login and no
database. It was built in Bolt.new in A3/Practice #09 as Vite + React + TypeScript + Tailwind, with a Python reference in
`python/`.

**Note on provenance.** The original Bolt.new workspace (`bolt.new/p/72188517`) was not available as a local export. The
final Practice #09 project was therefore **reconstructed locally** from the documented A3/Practice #09 design: the same
file roles, AC1–AC6, datasets, presets, `can_book()` and its 10 tests. All findings and results in Practice #10 apply to
this repository.

**Checkpoint before any agent-assisted change:** `git tag p09-final-checkpoint` → commit `c9e80c4` on `main`. All
Practice #10 changes happen on the separate branch `p10/risk-mitigations`.

## Located files

| Item | Location | Status |
|---|---|---|
| README | `README.md` | present (scope, AC1–AC6, run commands, file list) |
| AGENTS.md | `AGENTS.md` | present (27 lines: project, commands, style, data) |
| Tests | `python/test_booking.py` (10 tests) | present for Python only. **No TS/JS tests**, no `tests/` folder |
| Package scripts | `package.json` | `dev`, `build`, `lint`, `preview`, `typecheck`. **No `test`** |
| CI / hooks / `.env.example` | — | missing |

## Existing checks (executed, raw output in `evidence/t1-*.txt`)

| Command | Result |
|---|---|
| `cd python && python3 test_booking.py` | **PASS**: Ran 10 tests, OK |
| `npm run typecheck` | **PASS**: exit 0 |
| `npm run lint` | **PASS**: exit 0 |
| `npm run build` | **PASS**: vite 5.4.21, built in 1.42 s |
| `npm test` | **MISSING COMMAND**: `npm error Missing script: "test"` (exit 1) |
| `npm audit` | **FAIL**: 9 vulnerabilities (8 moderate, 1 high), exit 1 |
