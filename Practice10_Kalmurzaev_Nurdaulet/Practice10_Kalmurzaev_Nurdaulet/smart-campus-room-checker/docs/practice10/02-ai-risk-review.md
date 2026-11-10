# Task 02 — Read-only AI risk review

**Student:** Kalmurzaev Nurdaulet · **Date:** 2026-11-10 · **Reviewed revision:** tag `p09-final-checkpoint` (commit `c9e80c4`)
**AI reviewer:** Claude Code (model Claude Opus 5.5), read-only: it was told not to edit files. Afterwards `git status --porcelain`
showed only the new `docs/` evidence folder, and no tracked file had changed.

## Prompt used (verbatim)

> Act as a cautious software reviewer. Inspect this Smart Campus Room Availability Checker WITHOUT editing files. Identify
> risks in correctness, security, privacy, reliability, maintainability, and agent operations. For each risk, cite the exact
> file/function or missing check, explain the impact, suggest a way to verify it, and state uncertainty. Do not invent test
> results.

## AI output (as returned, lightly formatted)

| # | Category | Location | Proposed risk and impact | How to verify | Uncertainty |
|---|---|---|---|---|---|
| AI-01 | Correctness | `src/App.tsx:95-96`, `parseInt(startInput, 10)` | `parseInt` truncates non-integer input (`"660.5"` → 660, `"6e2"` → 6). A non-whole-minute request can be reported as **Available**, which breaks AC1's "whole minutes" rule. | Enter start `660.5`, end `720` and press Check. | High confidence from reading the code. Browser behaviour of `type=number` not yet observed. |
| AI-02 | Correctness | `src/App.tsx:136-139`, `now` input (`min/max` + `parseInt(...) \|\| 0`) | HTML `min/max` only hint at the range and do not enforce it on typed values. `now` outside 0..1439 (e.g. 2000, -30) is accepted, and an empty field silently becomes 0. The verdict and messages are then wrong (e.g. "after now (33:20)"). | Type `2000` and `-30` into *now*, clear the field, then run a check. | High confidence. |
| AI-03 | Maintainability / Reliability | `src/App.tsx:46` `canBook` vs `python/booking.py` `can_book` | The rules exist twice. Only the Python copy has tests (10). The TypeScript copy is not exported and has **no automated tests**, and there is no `npm test` script. The two copies can drift without anyone noticing. | `npm test`; search for `*.test.*`; compare the branch order of both functions. | Drift is not observed today. It is a risk, not a defect. |
| AI-04 | Security (supply chain) | `package.json` / `package-lock.json` | `npm audit` reports 9 vulnerabilities (1 high: `vite <=6.4.3`; moderate: `esbuild` dev server, `minimatch` via `typescript-eslint`). | Run `npm audit`. Check whether the advisories affect the production bundle or only the dev server. | The impact depends on how the dev server is exposed. The static build is likely unaffected. |
| AI-05 | Agent operations | `AGENTS.md` | No forbidden actions (deploy, secrets, new dependencies, network services), no review or approval gate, no verification command before "done", AC1–AC6 not listed, and the scope is not stated. | Read `AGENTS.md` against the course constraints. | Confident (documentation review). |
| AI-06 | Reliability / Agent operations | repository root | No CI workflow, no pre-commit hooks, no `.env.example`. Checks run only when a person remembers to run them. | `ls .github`; check `package.json` for hooks. | Confident. |
| AI-07 | Correctness (AC5) | `src/App.tsx:16` `DATASETS` | The bookings arrays are plain mutable objects. Immutability depends on convention only, and no test asserts it for the TypeScript code. | Unit test: call `canBook` and deep-compare the dataset. | `canBook` only reads (`for...of`), so I see no mutation today. |
| AI-08 | Security | `src/App.tsx` rendering | Booking labels and the result message might allow script injection (XSS). | Search for `dangerouslySetInnerHTML` or `innerHTML`. | Low. React escapes text by default. |
| AI-09 | Privacy | `src/App.tsx:16` booking labels | Booking labels may contain personal data about students. | Inspect the data. | Low. The labels look fictional. |
| AI-10 | Reliability | `src/App.tsx:272,298` `key={b.start}` | React keys use `start`, so two bookings with the same start would produce duplicate keys and rendering glitches. | Add a dataset with equal starts. | Low. The datasets are fixed and have no equal starts. |
| AI-11 | Correctness | `python/booking.py` `can_book` | `now` is not range-checked here either, so the Python reference has the same gap as AI-02. | `can_book(0, 60, -30, False, [])` returns True. | Medium. The contract *assumes* a valid `now`. |

**Statement about tests in the AI output:** the reviewer did not run any test during this step. All results quoted later
come from commands that were actually executed and recorded in `docs/practice10/evidence/`.
