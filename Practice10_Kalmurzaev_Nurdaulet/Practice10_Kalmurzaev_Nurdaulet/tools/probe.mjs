// Read-only probe of the running app (no project files are modified).
// Usage: node probe.mjs   (expects `npm run build` to have produced dist/)
import { openApp } from './harness.mjs';

const app = await openApp();
const { page } = app;
const rows = [];
const run = async (id, desc, fn) => rows.push([id, desc, await fn()]);

await run('P1', 'start=660.5 end=720 now=540 (AC1 whole minutes)', () => app.check('660.5', '720'));
await run('P2', 'start=600.9 end=720 (overlaps 600-660 if read as 600.9)', () => app.check('600.9', '720'));
await page.reload();
await app.setNow(2000);
await run('P3', 'now=2000 (outside 0..1439), request 660-720', () => app.check(660, 720));
await page.reload();
await app.setNow(-30);
await run('P4', 'now=-30 (outside 0..1439), request 0-60', () => app.check(0, 60));
await page.reload();
await page.fill('#now', '');
await run('P5', 'now field cleared -> value shown in #now', async () => 'now input value = "' + (await page.inputValue('#now')) + '"');
await page.reload();
const before = await page.textContent('ul');
for (const [s, e] of [[660, 720], [630, 690], [720, 841], [540, 570]]) await app.check(s, e);
const after = await page.textContent('ul');
await run('P6', 'AC5 bookings list unchanged after 4 checks', async () => (before === after ? 'unchanged: ' : 'CHANGED: ') + after.replace(/\s+/g, ' '));
await run('P7', 'AC4 touching 660-720 (control case)', () => app.check(660, 720));

for (const [id, d, r] of rows) console.log(`${id}  ${d}\n    -> ${r}`);
console.log(app.errors.length ? 'page errors: ' + app.errors.join('; ') : 'page errors: none');
await app.close();
