// Screenshots of the live site for the feature updates: one slice of a page
// each, as the feature update shows it scrolling in a browser window.
// Usage: node scripts/shots.mjs [home|docs ...]   (default: all)
// Writes public/shots/<name>.png, 1440 px wide.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = process.env.SITE ?? "https://barrelroyale.io";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "shots");
mkdirSync(out, { recursive: true });

// page path, and the slice to keep in page pixels: the homepage hero, and the
// docs' "What's live today" table
const SHOTS = {
  home: { path: "/", y: 0, h: 1420 },
  docs: { path: "/docs", y: 560, h: 1240 },
};
const only = process.argv.slice(2);

const browser = await chromium.launch({ args: ["--hide-scrollbars"] });
for (const [name, { path, y, h }] of Object.entries(SHOTS)) {
  if (only.length && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(SITE + path, { waitUntil: "networkidle" });
  // let fonts and any entrance animations settle
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(out, `${name}.png`), fullPage: true, clip: { x: 0, y, width: 1440, height: h } });
  console.log(join(out, `${name}.png`));
  await page.close();
}
await browser.close();
