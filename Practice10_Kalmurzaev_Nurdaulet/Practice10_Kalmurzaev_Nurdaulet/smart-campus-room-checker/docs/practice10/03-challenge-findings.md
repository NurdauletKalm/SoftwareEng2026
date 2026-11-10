# Task 03 — Challenging the AI findings

I chose 9 of the 11 proposed risks across **five** categories: correctness, security, privacy, maintainability/reliability
and agent operations. I checked the referenced code myself and ran the commands and UI probes listed below. Labels:
**Confirmed** means observed evidence reproduces it. **Plausible / unverified** means the code allows it, but there is no
failing observation yet. **Unsupported** means the evidence contradicts the claim.

| AI # | Category | My evidence (file / command / observation) | Label |
|---|---|---|---|
| AI-01 | Correctness | `evidence/t3-probe-baseline.txt` P1: start `660.5`, end `720` → **"Available — Room 304 is free from 11:00 to 12:00"**. `App.tsx:95` `parseInt` drops `.5` without any message. AC1 requires whole minutes. | **Confirmed** |
| AI-02 | Correctness | Probe P3: `now=2000` → "Start (11:00) must be strictly after now (**33:20**)", which is an impossible clock time. P4: `now=-30`, request 0–60 → **Available**. P5: clearing the field shows `0`. `App.tsx:139` `parseInt(...) \|\| 0`. | **Confirmed** |
| AI-11 | Correctness | `evidence/t3-verification-commands.txt`: `can_book(0, 60, -30, False, []) = True`. The Python reference does not check `now` either. | **Confirmed** (same root cause as AI-02) |
| AI-03 | Maintainability / Reliability | `evidence/t1-npm-test.txt`: `npm error Missing script: "test"`. No `*.test.*` / `*.spec.*` files exist. `canBook` is a private function inside `App.tsx` and cannot be imported by a test. The Python tests cover only `booking.py`. | **Confirmed** (missing safeguard) |
| AI-04 | Security (supply chain) | `evidence/t1-npm-audit.txt`: 9 vulnerabilities (8 moderate, 1 high). The advisories concern the **Vite/esbuild dev server** and the lint tool chain. `dist/` is static and contains none of these packages at runtime. | **Confirmed** (impact limited to development) |
| AI-05 | Agent operations | `AGENTS.md` has 27 lines. It has no scope statement, AC list, forbidden actions, secrets rule, deployment rule, test-before-done rule or approval gate (see Task 06). | **Confirmed** |
| AI-06 | Reliability / Agent operations | `ls -a .github .husky .env.example` → all missing. There is no CI and there are no hooks. | **Confirmed** |
| AI-07 | Correctness (AC5) | `canBook` only iterates with `for...of`, and timeline sorting uses a copy (`[...bookings].sort`). Probe P6: the bookings list is unchanged after 4 checks. There is no structural protection (`Object.freeze`) and no TS test. | **Plausible / unverified** (no mutation observed) |
| AI-08 | Security (XSS) | `grep -rn "dangerouslySetInnerHTML\|innerHTML" src` → no matches. All values are rendered as React text nodes, which React escapes. | **Unsupported** |
| AI-09 | Privacy | The only booking labels are "Robotics Club (fictional)" and "Study Group B (fictional)". The app has no input field for names, no storage and no network calls (`grep fetch/localStorage` → none). | **Unsupported** |
| AI-10 | Reliability | `key={b.start}` (`App.tsx:272,298`). Both datasets have unique starts, so this cannot happen with the current data. | **Plausible / unverified** (low) |

**No unexecuted test is presented as passed.** At this stage no TypeScript test existed. The only executed suite was
`python3 test_booking.py` (10/10 OK, `evidence/t1-python-tests.txt`).
