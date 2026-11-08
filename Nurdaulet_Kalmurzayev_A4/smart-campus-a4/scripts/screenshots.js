// Reproducible evidence screenshots of the final app: node scripts/screenshots.js
// Writes PNG files to docs/screenshots/.
import { openApp } from "../tests/ui/harness.js";
import { mkdir } from "node:fs/promises";

const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const app = await openApp({ root: "src", viewport: { width: 1200, height: 900 } });
const { page } = app;
const shot = (name, opts = {}) => page.screenshot({ path: OUT + name, fullPage: true, ...opts });
const times = async (s, e) => { await page.fill("#start", String(s)); await page.fill("#end", String(e)); };
const reset = async () => { await page.reload(); };

// 01 — initial state, AC4 touching interval is available in Room 304
await times(660, 720); await page.click("#check");
await shot("01_initial_available.png");

// 02 — successful filtering: 24 attendees + projector
await reset(); await page.fill("#attendees", "24"); await page.check('#equipment-options input[value="projector"]');
await times(660, 720); await page.click("#check");
await shot("02_filter_success.png");

// 03 — capacity boundary: 25 attendees removes Room 304 (capacity 24); selection & result move to Room 101
await page.fill("#attendees", "25");
await shot("03_filter_capacity_boundary.png");

// 04 — unsuccessful filtering: smart board + video conferencing -> empty state
await reset(); await page.check('#equipment-options input[value="smart-board"]'); await page.check('#equipment-options input[value="video-conf"]');
await shot("04_filter_empty_state.png");

// 05/06 — room switching: 780–840 available in Room 304, unavailable in Room 210
await reset(); await times(780, 840); await page.click("#check");
await shot("05_switch_before_r304.png");
await page.click('[data-room-id="R210"]');
await shot("06_switch_after_r210.png");

// 07 — blocked room (F3)
await reset(); await page.click('[data-room-id="R415"]'); await times(660, 720); await page.click("#check");
await shot("07_blocked_room.png");

// 08 — AC2 121 minutes, 09 — AC1 starts now, 10 — AC4 overlap
await reset(); await times(720, 841); await page.click("#check");
await shot("08_ac2_121_minutes.png");
await times(540, 570);
await shot("09_ac1_starts_now.png");
await times(630, 690);
await shot("10_ac4_overlap.png");

// 11/12 — mobile layout (AC6)
await page.setViewportSize({ width: 375, height: 812 });
await reset(); await page.fill("#attendees", "10"); await page.check('#equipment-options input[value="video-conf"]');
await times(630, 690); await page.click("#check");
await shot("11_mobile_result.png");
await page.fill("#attendees", "500");
await shot("12_mobile_empty_state.png", { fullPage: false });

if (app.errors.length) console.error("page errors:", app.errors);
await app.close();
console.log("screenshots written to", OUT);
