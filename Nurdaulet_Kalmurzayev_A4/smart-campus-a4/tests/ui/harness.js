// Shared Playwright harness for UI tests: starts the static server and a headless Chromium.
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { startServer } from "../../scripts/serve.js";

const CANDIDATES = [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].filter(Boolean);

export async function openApp({ root, path = "/", viewport = { width: 1280, height: 900 } } = {}) {
  const { server, url } = await startServer({ root });
  const executablePath = CANDIDATES.find((p) => existsSync(p));
  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(5000); // fail fast instead of waiting 30 s for a missing element
  const errors = [];
  page.on("pageerror", (e) => errors.push(e));
  await page.goto(url + path);
  return { page, errors, url, close: async () => { await browser.close(); server.close(); } };
}
