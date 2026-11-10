# Task 06 — Audit of the agent playbook (AGENTS.md)

## Prompt used (verbatim)

> Review AGENTS.md and project documentation only. Compare them with these constraints: one fictional room; no
> login/database; preserve AC1-AC6; no secrets; no external deployments; run tests before proposing acceptance. Report
> missing or conflicting rules. Draft a minimal patch to AGENTS.md, but wait for my approval before applying it.

Documents reviewed: `AGENTS.md` (27 lines) and `README.md` at tag `p09-final-checkpoint`.

## Constraint-by-constraint comparison

| Constraint | AGENTS.md (before) | README.md | Finding |
|---|---|---|---|
| One fictional room | Mentions Room 304; "Bookings are fictional sample data" | "one fictional campus room" | **Partial.** It does not forbid adding rooms or real data. |
| No login / database | — | "No login, no database, no backend, no external APIs" | **Missing** in AGENTS.md. An agent reading only AGENTS.md is not told. |
| Preserve AC1–AC6 | — | AC table present | **Missing.** AGENTS.md says "keep rules in sync with `python/booking.py`" but never names AC1–AC6 or which file is authoritative. |
| No secrets | — | — | **Missing everywhere.** |
| No external deployments | — | — | **Missing everywhere.** |
| Run tests before proposing acceptance | Lists install/dev/build/lint only | Python tests only | **Missing.** There is no test command, no typecheck command and no "done" criterion. |
| Review/approval gate, isolated branch | — | — | **Missing.** |

**Conflicting or ambiguous rules.** I found no direct contradiction. One rule is ambiguous: *"Keep the availability rules
in sync with `python/booking.py`"* could be read as "Python is the source of truth". The patch makes README's AC1–AC6
the single source of truth instead. "Do not add booking creation or deletion" is correct and is kept.

## Minimal patch (draft — `docs/practice10/agents-md.patch`)

The patch only **adds** 4 short sections and 2 command lines. It deletes nothing and changes no existing rule. Full diff:

```diff
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -6,11 +6,19 @@
 Smart Campus Room Availability Checker for Room 304 (Innovation Lab). React + TypeScript + Tailwind,
 built with Vite. Python reference in `python/`.
 
+## Scope (fixed constraints)
+- One fictional room (Room 304) with fictional bookings only. No real names or personal data.
+- No login, no database, no backend, no external APIs or production services.
+- Preserve the acceptance contract AC1–AC6 in `README.md`. That contract is the source of truth;
+  `src/lib/availability.ts` and `python/booking.py` must both implement it.
+
 ## Commands
 - Install: `npm install`
 - Dev server: `npm run dev`
 - Build: `npm run build`
 - Lint: `npm run lint`
+- Type check: `npm run typecheck`
+- Tests: `npm test` and `cd python && python3 test_booking.py`
 
 ## Coding guidelines
 - Use functional React components and hooks.
@@ -20,3 +28,15 @@
 
 ## Data
 - Bookings are fictional sample data. Do not add booking creation or deletion.
+
+## Forbidden actions
+- Never add, read or commit secrets, tokens or `.env` files.
+- Never deploy, publish or push to a remote, and never call external services.
+- Do not add dependencies or change the stack without asking first.
+- Do not refactor code that is unrelated to the requested change.
+
+## Review gate
+- Work on a separate branch, never directly on `main`.
+- Before proposing a change as done, run lint, typecheck, `npm test`, the Python tests and `npm run build`.
+  Report the real output; never describe an unexecuted test as passed.
+- A human reviews the diff and approves it before any merge.
```

## Approval log

| Step | Date | Who | Result |
|---|---|---|---|
| Draft produced, not applied (`git diff AGENTS.md` empty at that point) | 2026-11-10 | AI agent (Claude Code) | Waiting for approval |
| Reviewed against the 6 constraints. Applied only after M1, because the patch refers to `npm test` and `src/lib/availability.ts`, which M1 creates. | 2026-11-10 | Kalmurzaev Nurdaulet | **Approved** |
| Applied as a separate commit on branch `p10/risk-mitigations` | 2026-11-10 | Agent, after approval | See `git log` |
