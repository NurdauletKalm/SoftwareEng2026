# Task 09 — Background agent thought experiment

**Scenario.** A coding agent works asynchronously, without a person watching, on the next change for Room 304. It might
add Prettier and close readiness gap 1, or clear R5/R9 by upgrading Vite and Vitest.

## 1. Isolation

- It works on its **own branch** created from `main`, e.g. `agent/upgrade-vite`, inside a **separate git worktree** or a
  disposable container/sandbox. It never works in my working copy and never on `main`.
- **No credentials** are mounted: no SSH keys, no Git push token, no npm token, no cloud keys, and no `.env` files (the
  app has none).
- **Network:** only the npm registry, read-only, for `npm ci` and the approved dependency change. Nothing else.
- **Shared resources:** the dev/preview server uses its own port (e.g. 5180 instead of 5173/4173) bound to `127.0.0.1`.
  There is no shared database because the project has none by design.
- Time and size limits: 30 minutes, at most 10 changed files. If it hits either limit, it stops and reports.

## 2. Permitted files

| Allowed to edit | Read-only | Forbidden |
|---|---|---|
| `src/**`, `tests/**`, `python/**`, `package.json`, `package-lock.json` (only for the approved dependency), config files (`vite.config.ts`, `eslint.config.js`, `tsconfig*.json`, new `.prettierrc`) | `README.md` contract table (AC1–AC6), `AGENTS.md`, `docs/practice10/**` evidence | `.git/` internals, `.github/` (CI changes need a separate human-reviewed PR), any `.env*`, anything outside the repository |

## 3. Commands

- **Permitted:** `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
  `cd python && python3 test_booking.py`, `npx vite preview --host 127.0.0.1 --port 5180`, `git status`, `git diff`,
  `git add`, `git commit` (on its own branch only).
- **Permitted only with prior approval named in the task:** `npm install <pkg>@<exact version>`.
- **Prohibited:** `git push`, `git merge`, `git rebase main`, `git reset --hard`, `git push --force`, `npm publish`,
  any deploy command (Bolt/Netlify/Vercel), `curl`/`wget` to external hosts, `rm -rf` outside `dist/` and `node_modules/`,
  `sudo`, editing the global git config, disabling or deleting tests, adding `.skip` / `.only`.

## 4. Prohibited actions (scope)

Adding login, a database, a backend, extra rooms, real names or personal data, booking creation or deletion, secrets,
analytics or network calls. Changing AC1–AC6. Refactoring outside the task. Claiming a test passed without running it.

## 5. Required evidence (delivered with the branch)

1. **Diff:** `git diff main...agent/<branch>` plus `--stat`, with every changed file listed and justified in one line.
2. **Test output:** the full raw output of `npm test` and `python3 test_booking.py`, including counts. Failures must be
   reported, not hidden. Any test not run must be listed with the reason.
3. **Build result:** raw output of `npm run lint`, `npm run typecheck` and `npm run build` with exit codes. For dependency
   changes, `npm audit` before and after.
4. **Review note:** what was changed and why, which risk-register IDs it affects, new risks introduced (as with R9 in
   this practice), what is still uncertain, and a log of the tool commands it actually executed.

## 6. Before merging or deploying

1. A human (me) reads the diff line by line and rejects anything outside scope.
2. A human reruns the checks locally or in CI on a **clean checkout** (`npm ci` → lint → typecheck → test → build →
   Python tests). The agent's report alone is not proof.
3. A manual UI check of AC6 at desktop width and at 375 px.
4. The risk register is updated: residual scores and any new risks with an owner.
5. The release decision (GO / CONDITIONAL / NO-GO) is recorded and the merge is **explicitly approved by a human**.
   Only then does a person merge into `main`.
6. **Deployment** is a separate, later, human-only action. The agent never deploys. For this course project nothing
   is deployed to production services at all.
