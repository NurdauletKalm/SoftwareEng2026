Mutation check at HEAD 32977cb: each defect injected alone with sed, `node --test tests/` run, file restored with `git checkout`.

| Injected defect | File | npm test result | First failing test |
|---|---|---|---|
| AC4 touching treated as overlap (< → <=) | `src/domain/availability.js` | pass 60 fail 7  | AC1–AC5 regression through the UI (Room 304) |
| AC2 limit off-by-one (> → >=) | `src/domain/availability.js` | pass 64 fail 3  | AC1–AC5 regression through the UI (Room 304) |
| AC1 allows start == now (<= → <) | `src/domain/availability.js` | pass 64 fail 3  | AC1–AC5 regression through the UI (Room 304) |
| AC3/F3 blocked check removed | `src/domain/availability.js` | pass 63 fail 4  | F3 blocked room |
| F1 capacity strict (>= → >) | `src/domain/filters.js` | pass 64 fail 3  | F1/F2 filtering in the UI |
| F2 ANY instead of ALL (every → some) | `src/domain/filters.js` | pass 49 fail 18  | initial render |
| F5 result not refreshed on room change | `src/ui/app.js` | pass 66 fail 1  | F5 room switching refreshes the result |
| F4 empty state never shown | `src/ui/app.js` | pass 65 fail 2  | F4 empty state |
| AC5 data no longer frozen | `src/data/rooms.js` | pass 66 fail 1  | AC5 — unambiguous verdict, no mutation |
