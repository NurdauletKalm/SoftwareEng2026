# Release decision: **CONDITIONAL**

**Decision by:** Kalmurzaev Nurdaulet · **Date:** 2026-11-10 · **Candidate:** branch `p10/risk-mitigations`
(commits `5e22f6a`, `e2c42e4`, `1c14022`, `03276c3` on top of `p09-final-checkpoint`)

## Why not GO

The GO criterion is "key checks pass and no unacceptable unresolved risks remain". The key checks do pass. Some risks are
still unresolved and need named owners and controls:

- **R5 / R9:** the dev tool chain has 13 advisories: `vite` (1 high), `vitest`/`tinypool` (2 critical), and moderates.
  They are not in the shipped bundle (`npm audit --omit=dev` → 0 vulnerabilities), but they are real for anyone running
  `npm run dev` or `npm test`.
- **R6:** there is no CI and there are no hooks. Every check depends on a person running it.
- **Readiness:** Level 1 has no formatter yet, Level 2 is only partly met, and Level 3 is not met.

## Why not NO-GO

NO-GO means "serious unmitigated risks or missing critical verification". Neither applies:

- Every **confirmed correctness risk** in the shipped app is mitigated and verified. R1 (score 6 → 1) and R2 (4 → 1) were
  shown failing in the UI and in 11 regression tests before the fix, and passing after (`t7-*`, `t8-*`).
- The **critical verification exists now:** 32/32 Vitest, 12/12 Python, lint/typecheck/build exit 0, and a manual UI
  check on desktop and at 375 px with 0 px overflow and no page errors.
- AC5 holds: bookings were unchanged in probe P6 and in the parity test. No secrets, network calls or personal data exist
  (Task 03: AI-08 and AI-09 are unsupported).

## Conditions (owner and control for each known limitation)

| # | Limitation | Owner | Control until fixed | Exit criterion |
|---|---|---|---|---|
| C1 | R5/R9 dev-tool advisories | Kalmurzaev Nurdaulet | Run `npm run dev`/`preview` only on `127.0.0.1`. Never start the Vitest UI server. Run tests only on trusted code. | Separate reviewed PR: `vite ≥ 6.4.4`, `vitest ≥ 4.1.12`, all checks green, and `npm audit` with no high/critical |
| C2 | R6 no CI/hooks | Kalmurzaev Nurdaulet | AGENTS.md review gate: the full check list (lint, typecheck, `npm test`, Python, build) runs by hand before every merge, and the output is attached. | A CI workflow green on a pull request |
| C3 | No formatter (Level 1 gap) | Kalmurzaev Nurdaulet | ESLint and review keep the style consistent | Prettier + `format:check` in CI |
| C4 | Tested only in headless Chromium | Kalmurzaev Nurdaulet | Manual check in one more browser before a demo | Playwright UI tests in the repo (Chromium + Firefox) |
| C5 | Parity between TS and Python is kept by hand | Kalmurzaev Nurdaulet | Parity suite mirrors `test_booking.py` 1:1, and any rule change must touch both | A CI job runs both suites |

## Remaining uncertainty

- The project was **reconstructed locally** from the Practice #09 / A3 description (see the report). Results apply to
  this repository. The original Bolt.new workspace was not available for testing.
- The advisory impact assessment (dev-only) is based on `npm audit` metadata and the advisory titles. I did not try to
  exploit them.
- Browser support beyond Chromium was not verified.

**Merge to `main`:** allowed only after the human reviewer accepts these conditions. The branch is left unmerged so
that the approval stays an explicit human step.
