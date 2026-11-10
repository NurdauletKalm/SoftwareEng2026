# Task 04 — Risk register

Scoring follows the lecture: **Likelihood** 1 unlikely · 2 possible · 3 likely; **Impact** 1 minor · 2 moderate · 3 serious;
**Score = L × I** (1–9). Owner for every engineering action: **Kalmurzaev Nurdaulet** (developer). The release decision is
made by the developer and reviewed by the course instructor.

| ID | Category | Cause → Event → Consequence | Component | Evidence | Status | L | I | Score | Proposed mitigation | Owner | Verification method |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **R1** | Correctness | `parseInt` truncates input → a non-integer request such as `660.5` is checked as `660` → a wrong **Available** verdict that breaks AC1 (whole minutes). | `src/App.tsx` start/end parsing | Probe P1 | Confirmed | 2 | 3 | **6** | Strict whole-number parser (`/^\d+$/`). Non-integers are rejected with an AC1 message. | Nurdaulet | Regression unit tests + UI probe P1 |
| **R2** | Correctness | The `now` control has no range validation and `\|\| 0` hides an empty field → `now` outside 0..1439 is used → misleading messages (`33:20`) or a wrong **Available** (`now=-30`). | `src/App.tsx` now input; `python/booking.py` | Probes P3–P5, `can_book(0,60,-30)=True` | Confirmed | 2 | 2 | **4** | Validate `now` as a whole minute 0..1439 in `canBook` and `can_book`. Keep the raw field text instead of coercing it to 0. | Nurdaulet | Regression tests (TS + Python) + probes P3–P5 |
| **R3** | Maintainability / Reliability | The rules are duplicated in TS and Python and the TS copy has no tests → an agent or person edits `App.tsx` and breaks AC1–AC5 → the regression ships unnoticed. | `src/App.tsx` `canBook`; missing `npm test` | `t1-npm-test.txt` (missing script), no test files | Confirmed | 3 | 2 | **6** | Extract `canBook` into `src/lib/availability.ts` (no behaviour change). Add Vitest with the 10 A3 cases ported 1:1 (parity) and an `npm test` script. | Nurdaulet | `npm test` output; parity table |
| **R4** | Agent operations | `AGENTS.md` lacks scope, forbidden actions and review gates → an agent adds a login, a database, secrets or a deployment, or claims "done" without tests → scope and security violations. | `AGENTS.md` | Task 06 audit | Confirmed | 3 | 2 | **6** | Minimal AGENTS.md patch: constraints, AC1–AC6, safe commands, forbidden actions, human approval gate. | Nurdaulet | Review of the diff against the 6 constraints |
| **R5** | Security (supply chain) | Vulnerable `vite@5.4.21`/`esbuild@0.21.5` dev server → a malicious site or local path trick reads dev-server files while `npm run dev` is running → source exposure on the developer machine. | `package.json` dev dependencies | `t1-npm-audit.txt` (1 high, 8 moderate) | Confirmed (dev only) | 1 | 3 | **3** | Run the dev server on `127.0.0.1` only. Plan an upgrade to `vite ≥6.4.4` in a separate reviewed change (breaking). | Nurdaulet | `npm audit` after the upgrade |
| **R6** | Reliability / Agent operations | No CI and no pre-commit hooks → checks are skipped on some changes → unverified changes are merged. | repository root | `ls .github .husky` → missing | Confirmed | 2 | 2 | **4** | Add a CI workflow (`npm ci && npm run lint && npm run typecheck && npm test && npm run build` + Python tests). | Nurdaulet | A green CI run on a pull request |
| R7 | Correctness (AC5) | Datasets are mutable objects → a future change mutates bookings during a check → AC5 violation. | `src/App.tsx` `DATASETS` | Code reading; probe P6 unchanged | Plausible | 1 | 2 | 2 | Unit test asserting that the inputs are deep-equal after `canBook`. | Nurdaulet | Unit test |
| R8 | Reliability | `key={b.start}` → duplicate keys if two bookings share a start → rendering glitch. | `src/App.tsx` timeline/list | Code reading | Plausible | 1 | 1 | 1 | Use `${start}-${end}` as the key when datasets change. | Nurdaulet | React warning check |

Rejected as **unsupported** and not registered as risks: AI-08 (XSS) and AI-09 (privacy). The evidence is in Task 03.

## Top two for action

1. **R1 (score 6)** is a user-visible contract violation: the app answers **Available** for an input AC1 forbids. It is
   confirmed in the UI. → Mitigation **M2** (it also fixes R2, because the same validation step covers `now`).
2. **R3 (score 6, likelihood 3)** blocks verification of every other fix. Without TypeScript tests, R1/R2 regressions
   cannot be caught. → Mitigation **M1**, done first so that M2 can be regression-tested.

R4 (score 6) is a documentation risk. It is handled by the approved AGENTS.md patch (Task 06), not by a code change.
