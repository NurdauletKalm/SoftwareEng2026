# Tasks 07 & 08 — Verify safely, mitigate two risks

All work was done on the isolated branch **`p10/risk-mitigations`**. `main` still points at the untouched checkpoint
`p09-final-checkpoint`. Every command below was actually executed. Its full output is in `evidence/`.

## Task 07 — Verification log

| Step | Command | Result | Evidence |
|---|---|---|---|
| Baseline Python tests | `cd python && python3 test_booking.py` | 10/10 OK | `t1-python-tests.txt` |
| Baseline lint / typecheck / build | `npm run lint`, `npm run typecheck`, `npm run build` | all exit 0 | `t1-lint.txt`, `t1-typecheck.txt`, `t1-build.txt` |
| Baseline TS tests | `npm test` | **not runnable**: `Missing script: "test"` | `t1-npm-test.txt` |
| Baseline dependency audit | `npm audit` | 9 vulnerabilities (1 high, 8 moderate) | `t1-npm-audit.txt` |
| Baseline UI probe (read-only) | `node tools/probe.mjs` | P1 `660.5` → Available; P3/P4/P5 invalid `now` accepted | `t3-probe-baseline.txt` |
| Targeted regression tests **before** the fix | `npx vitest run tests/availability.regression.test.ts` | **10 failed / 7 passed** (17) | `t7-regression-before-fix.txt` |
| Python regression **before** the fix | `python3 test_booking.py` | **FAILED (failures=1)**: `can_book(0,60,-30)` returned True | `t7-python-regression-before-fix.txt` |
| Manual UI check, desktop 1280 px + mobile 375 px | `node tools/ui-screenshots.mjs before/after` | Feedback text correct for AC1–AC4. **Horizontal overflow 0 px** at 375 px before and after. No page errors. | `t7-manual-ui-check.txt`, screenshots `ui01`–`ui09` |

**Tests not run (stated explicitly):**
- No real mobile device or Safari/Firefox. Only headless Chromium with a 375 px viewport.
- No screen-reader or accessibility audit.
- No CI run, because no CI exists.
- No test of the original Bolt.new deployment (`*.bolt.host`). Only the local build was tested.
- No load or performance testing; it is not relevant for a static single-page app.

## Task 08 — Two mitigations

The top two risks from the register were R3 and R1. R2 has the same root cause as R1 and is closed by the same change.

### M1 — R3: TypeScript rules untested and duplicated (commit `5e22f6a`)

- **Request to the agent:** "Minimal patch: move `canBook` and its helpers out of `App.tsx` into a pure module, with no
  behaviour change. Add a `test` script and port the 10 Python cases 1:1. Do not touch styling or the layout."
- **Diff reviewed first** (`t8-m1-diff.txt`): `App.tsx` had 61 lines deleted and 3 added: one import and two `parseMinutes(...)` calls that replace `parseInt`, with identical behaviour. A new file
  `src/lib/availability.ts`. `package.json` gained `"test": "vitest run"` and `vitest` pinned at `2.1.9`.
- **Approved:** yes, the change is within scope. **Rejected:** nothing, because the agent proposed no unrelated changes.
- **Behaviour unchanged:** the UI probe before and after M1 is identical, 7/7 (`t8-m1-behaviour-unchanged.txt`).
- **Tests:** 15/15 Vitest passed (`t8-m1-npm-test.txt`). Lint, typecheck and build exit 0 (`t8-m1-checks.txt`).

### M2 — R1 + R2: non-integer minutes and invalid `now` accepted (commit `e2c42e4`)

- **Request to the agent:** "Minimal patch so that AC1 is enforced. Start, end and now accept only whole minutes. `now`
  must be 0..1439 in both `canBook` and `can_book`. An empty `now` field must not become 0. Keep all other rules and
  messages."
- **Diff reviewed first** (`t8-m2-diff.txt`, 22 insertions / 5 deletions in 4 source files):
  `parseMinutes` changed from `parseInt` to `/^\d+$/`. There is a new first guard for `now` and `Number.isInteger` for
  start/end. `App.tsx` keeps the raw `now` text. `booking.py` got a 2-line `now` range check. Plus the regression tests.
- **Rejected / not accepted:** upgrading Vite/Vitest to clear `npm audit` (a breaking, unrelated change, recorded as R5/R9).
  Also rejected: "clamping" `now` to 0..1439. It would hide invalid input instead of reporting it.
- **First run after the fix:** 1 test still failed. The test expected the message to contain `0–1439`, but the message
  said "from 0 to 1439" (`t8-m2-first-run-after-fix.txt`). I aligned the message with the UI label "(minutes, 0–1439)".
- **After:** regression suite **17/17**, full suite **32/32** (`t8-m2-regression-after-fix.txt`, `t8-final-npm-test.txt`),
  Python **12/12 OK** (`t8-final-python-tests.txt`), lint/typecheck/build exit 0 (`t8-final-lint-typecheck-build.txt`).
  UI probe after: P1–P4 rejected with AC1 messages. P5 keeps the empty field. P6 bookings unchanged. P7 control case
  still Available (`t8-probe-after.txt`).

### Before / after summary

| Check | Before (p09-final-checkpoint) | After (p10/risk-mitigations) |
|---|---|---|
| `npm test` | missing script | 32 passed / 0 failed |
| Python tests | 10 passed | 12 passed |
| UI: start `660.5` | **Available** ✘ | Unavailable (AC1) ✔ |
| UI: `now = -30`, 0–60 | **Available** ✘ | Unavailable (AC1, "now must be 0–1439") ✔ |
| UI: `now = 2000` | "after now (33:20)" ✘ | "now must be a whole minute 0–1439" ✔ |
| UI: 660–720 control | Available | Available (unchanged) |
| Mobile 375 px overflow | 0 px | 0 px |
| `npm audit --omit=dev` (runtime) | 0 | 0 |
| `npm audit` (incl. dev) | 9 (1 high) | **13 (2 critical, 1 high)**, because Vitest 2.1.9 added 4 advisories (R9) |

## Residual risk (revised with evidence)

| ID | Before | After | Reason |
|---|---|---|---|
| R1 | L2 × I3 = 6 | **L1 × I1 = 1** | Strict parser and 9 regression cases. Residual: input that browsers transform before it reaches the parser was not tested in non-Chromium browsers. |
| R2 | L2 × I2 = 4 | **L1 × I1 = 1** | Guard in both TS and Python, plus regression tests and probes P3–P5. |
| R3 | L3 × I2 = 6 | **L2 × I1 = 2** | 32 TS tests, 10 of them parity cases. Residual: parity is kept by hand and no CI enforces it (R6). |
| R4 | L3 × I2 = 6 | **L2 × I1 = 2** | AGENTS.md patched and approved. Residual: the rules are advisory only and nothing enforces them. |
| R5 | L1 × I3 = 3 | 3 (unchanged) | Not mitigated. Needs a breaking Vite upgrade. |
| R6 | L2 × I2 = 4 | 4 (unchanged) | No CI or hooks yet. |
| **R9 (new)** | — | **L1 × I2 = 2** | Introduced by M1: `vitest@2.1.9` → `tinypool` (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr), `@vitest/mocker`, `vite-node`. They apply only while tests run locally on trusted code, with no Vitest UI server and no network input. They are not part of the shipped bundle (`npm audit --omit=dev` → 0). Fix: `vitest ≥ 4.1.12`, which requires `vite ≥ 6`, done together with R5. |
