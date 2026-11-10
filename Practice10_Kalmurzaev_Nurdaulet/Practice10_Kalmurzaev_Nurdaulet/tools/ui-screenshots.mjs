// UI evidence screenshots + manual-check measurements.
// Usage: PROJECT=<dir> node ui-screenshots.mjs <before|after> <outDir>
import { openApp } from './harness.mjs';

const [phase, OUT] = process.argv.slice(2);
const log = [];
const shot = async (page, name, opts = {}) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true, ...opts });
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const app = await openApp({ viewport: { width: 1280, height: 900 } });
const { page } = app;
const n = phase === 'before' ? ['ui01', 'ui02', 'ui03', 'ui04'] : ['ui05', 'ui06', 'ui07', 'ui08', 'ui09'];

if (phase === 'before') {
  log.push(['660-720 desktop', await app.check(660, 720)]);
  await shot(page, `${n[0]}_before_desktop_660-720_available`);
  log.push(['660.5-720 desktop', await app.check('660.5', 720)]);
  await shot(page, `${n[1]}_before_R1_fractional_660.5_accepted`);
  await page.reload(); await app.setNow(2000);
  log.push(['now=2000, 660-720', await app.check(660, 720)]);
  await shot(page, `${n[2]}_before_R2_now_2000_misleading`);
  await page.setViewportSize({ width: 375, height: 812 }); await page.reload();
  log.push(['mobile 375px, 630-690', await app.check(630, 690)]);
  log.push(['mobile horizontal overflow (px)', String(await overflow(page))]);
  await shot(page, `${n[3]}_before_mobile_375_overlap`);
} else {
  log.push(['660.5-720 desktop', await app.check('660.5', 720)]);
  await shot(page, `${n[0]}_after_R1_fractional_rejected`);
  await page.reload(); await app.setNow(-30);
  log.push(['now=-30, 0-60', await app.check(0, 60)]);
  await shot(page, `${n[1]}_after_R2_now_-30_rejected`);
  await page.reload();
  log.push(['660-720 desktop (control)', await app.check(660, 720)]);
  await shot(page, `${n[2]}_after_desktop_660-720_available`);
  await page.setViewportSize({ width: 375, height: 812 }); await page.reload();
  log.push(['mobile 375px, 630-690', await app.check(630, 690)]);
  log.push(['mobile horizontal overflow (px)', String(await overflow(page))]);
  await shot(page, `${n[3]}_after_mobile_375_overlap`);
  await page.click('#toggle-blocked');
  log.push(['mobile 375px, blocked room, 660-720', await app.check(660, 720)]);
  await shot(page, `${n[4]}_after_mobile_375_blocked`, { fullPage: false });
}
for (const [k, v] of log) console.log(`${phase.padEnd(6)} ${k.padEnd(38)} -> ${v}`);
console.log(`${phase.padEnd(6)} page errors: ${app.errors.length ? app.errors.join('; ') : 'none'}`);
await app.close();
