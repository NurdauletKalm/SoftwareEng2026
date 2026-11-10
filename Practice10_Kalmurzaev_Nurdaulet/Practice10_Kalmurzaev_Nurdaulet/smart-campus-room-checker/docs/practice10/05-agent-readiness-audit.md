# Task 05 — Agent-readiness audit

Rubric: the Lecture #10 repository readiness levels. **Level 1 Baseline**: formatter, linter, type checks, unit tests,
pinned dependencies. **Level 2 Documented**: `.env.example`, architecture notes, `AGENTS.md`. **Level 3 Agent-ready**:
CI, hooks, integration checks, reviewable evidence. I use the levels as an audit rubric, not as an automatic certificate.

## Checklist (baseline `p09-final-checkpoint` → after `p10/risk-mitigations`)

| Area | Check | Baseline evidence | Before | After |
|---|---|---|---|---|
| README accuracy | Describes scope, AC1–AC6, run commands | `README.md` is accurate for the app. Its "Files" list said `App.tsx` holds "the whole UI and the availability check", and it gave no test command for TS. | Partial | ✔ README lists `npm test`, `src/lib`, `tests/`, `AGENTS.md` |
| Folder layout | Logic separated from UI | All rules inside `src/App.tsx`. `canBook` is private and cannot be tested. | ✘ | ✔ `src/lib/availability.ts` (pure) + `src/App.tsx` (UI) |
| Documented setup | Install, run, build | `npm install`, `npm run dev`, `npm run build`; Python test command | ✔ | ✔ |
| Formatter | Prettier or similar | none (`node_modules/.bin/prettier` missing, no config) | ✘ | ✘ **gap** |
| Linter | `npm run lint` | ESLint 9 + typescript-eslint, exit 0 (`t1-lint.txt`) | ✔ | ✔ |
| Type checks | `npm run typecheck` | `tsc --noEmit`, strict mode, exit 0 (`t1-typecheck.txt`) | ✔ | ✔ |
| Unit tests | Automated tests for the shipped logic | Python only (10). TS: `Missing script: "test"` (`t1-npm-test.txt`) | ✘ for TS | ✔ 32 Vitest tests + 12 Python (`t8-final-*.txt`) |
| Pinned dependencies | Reproducible install | `package-lock.json` committed. `package.json` uses `^` ranges. README says `npm install`, not `npm ci`. | Partial | Partial (vitest pinned exactly; README still `npm install`) |
| Build reproducibility | `npm run build` succeeds from the lockfile | exit 0, same bundle hash for CSS (`t1-build.txt`) | ✔ | ✔ |
| Security checks | `npm audit` / secret scanning | Run manually only: 1 high + 8 moderate (dev tool chain) | Manual | Manual: runtime deps 0; dev deps 13 (see R5/R9) |
| `.env.example` | Env vars documented | none. The app uses **no** env vars (`grep import.meta.env` → none), so this is N/A. | N/A | N/A (stated in this audit) |
| Architecture notes | Short design description | Only the README file list | ✘ | Partial (README file roles; no separate notes) |
| AGENTS.md: scope | Constraints stated | Not stated (Task 06) | ✘ | ✔ |
| AGENTS.md: safe commands | Verification commands | install/dev/build/lint only | Partial | ✔ + typecheck, `npm test`, Python tests |
| AGENTS.md: forbidden actions | Secrets, deploy, deps, refactoring | none | ✘ | ✔ |
| AGENTS.md: review gates | Branch + tests + human approval | none | ✘ | ✔ |
| CI | Workflow running the checks | `.github` missing | ✘ | ✘ **gap** |
| Hooks | Pre-commit lint/test | `.husky` missing | ✘ | ✘ **gap** |
| Integration / UI checks | Automated browser checks | none in repo. UI probes exist only as external evidence scripts (`tools/`). | ✘ | Partial (probes recorded, not in CI) |
| Reviewable evidence | Commands + outputs, diffs | none | ✘ | ✔ `docs/practice10/evidence/` |

## Assigned level

**Baseline: Level 1 not fully met ("Level 1 – partial").** Lint, strict type checks, a lockfile and a reproducible build
existed. But the shipped TypeScript logic had **no unit tests** and there was **no formatter**. Python tests do not verify
the code users run.

**After mitigations: Level 1 met for tests/lint/types (formatter still missing), Level 2 partially met.** `AGENTS.md` now
has scope, safe commands, forbidden actions and a review gate. The README is accurate. `.env.example` is not applicable.
Architecture notes are minimal. **Level 3 is not met.** There is no CI, no hooks, and no integration tests inside the repo.

## Missing evidence / gaps to close

1. A formatter (Prettier) and a `format:check` script. This is the last missing Level 1 item.
2. A CI workflow running `npm ci`, lint, typecheck, `npm test`, Python tests and build on every pull request.
3. Pre-commit hooks (lint + tests).
4. Automated UI/integration tests inside the repo (the `tools/probe.mjs` scenarios turned into Playwright tests).
5. A dependency upgrade (`vite ≥ 6.4.4`, `vitest ≥ 4.1.12`) to clear the dev-tool advisories (R5, R9).
6. A README switch from `npm install` to `npm ci` for reproducible installs.
