// Shared harness: serves the project's built dist/ with `vite preview` and opens headless Chromium.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const PROJECT = process.env.PROJECT ?? join(fileURLToPath(new URL('.', import.meta.url)), '..', 'smart-campus-room-checker');
const PORT = 4173;

async function waitFor(url, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start: ' + url);
}

export async function openApp({ viewport = { width: 1280, height: 900 } } = {}) {
  const server = spawn(join(PROJECT, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: PROJECT, stdio: 'ignore' });
  const url = `http://127.0.0.1:${PORT}/`;
  await waitFor(url);
  const executablePath = ['/usr/bin/chromium', '/usr/bin/google-chrome'].find(existsSync);
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.waitForSelector('#check');
  return {
    page, errors, url,
    async check(start, end) {
      await page.fill('#start', String(start));
      await page.fill('#end', String(end));
      await page.click('#check');
      return (await page.textContent('#result')).replace(/\s+/g, ' ').trim();
    },
    async setNow(v) { await page.fill('#now', String(v)); },
    async close() { await browser.close(); server.kill(); },
  };
}
