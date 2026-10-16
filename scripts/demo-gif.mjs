// Records docs/demo.gif for the README: the built extension in Chromium, driven like a user would,
// one screenshot per step, with a caption on each scene. Run `npm run build` first.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import gifenc from 'gifenc';
import { PNG } from 'pngjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const WIDTH = 1000;
const HEIGHT = 620;
const dist = path.resolve('dist');
const sample = readFileSync('docs/sample.log', 'utf8');

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(sample);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

const context = await chromium.launchPersistentContext(mkdtempSync(path.join(tmpdir(), 'logbeam-demo-')), {
  channel: 'chromium',
  headless: true,
  viewport: { width: WIDTH, height: HEIGHT },
  locale: 'en-US',
  colorScheme: 'dark',
  args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
});
let [worker] = context.serviceWorkers();
worker ??= await context.waitForEvent('serviceworker');
const extensionId = new URL(worker.url()).host;

const gif = GIFEncoder();
let frames = 0;

/** Adds the page as it is now, shown for `ms`. */
async function frame(page, ms) {
  const shot = await page.screenshot();
  // DEMO_FRAMES=dir keeps each frame as a PNG, to look at them one by one
  if (process.env.DEMO_FRAMES) writeFileSync(path.join(process.env.DEMO_FRAMES, `${frames}.png`), shot);
  const png = PNG.sync.read(shot);
  const palette = quantize(png.data, 256);
  gif.writeFrame(applyPalette(png.data, palette), png.width, png.height, { palette, delay: ms });
  frames++;
}

/** A caption at the bottom of the page, as in a screencast. */
async function caption(page, text) {
  await page.evaluate((text) => {
    let box = document.getElementById('demo-caption');
    if (!box) {
      box = document.createElement('div');
      box.id = 'demo-caption';
      Object.assign(box.style, {
        position: 'fixed',
        left: '50%',
        bottom: '18px',
        transform: 'translateX(-50%)',
        zIndex: '99',
        padding: '8px 18px',
        borderRadius: '8px',
        background: '#ffb454',
        color: '#0f1419',
        font: '600 17px ui-sans-serif, system-ui, sans-serif',
        boxShadow: '0 6px 24px rgba(0,0,0,.45)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      });
      document.body.append(box);
    }
    box.textContent = text;
  }, text);
}

/** Types into the search box a few characters per frame. */
async function typeSlowly(page, selector, text) {
  for (let i = 2; i <= text.length + 1; i += 2) {
    await page.locator(selector).fill(text.slice(0, i));
    await frame(page, 160);
  }
}

// ---- the log viewer ---------------------------------------------------------------------
const page = await context.newPage();
await page.goto(`${base}/app.log`);
await caption(page, 'A raw log: GitHub Actions, Jenkins, kubectl, a .log file…');
await frame(page, 1800);

await page.addScriptTag({ path: path.join(dist, 'logViewer.js') });
await page.waitForSelector('.row');
await caption(page, 'Ctrl+Shift+L: levels in colour, stack traces grouped, secrets flagged');
await frame(page, 2600);

await page.keyboard.press('e');
await caption(page, 'e jumps to the next error');
await frame(page, 2200);
await page.keyboard.press('Escape');

await caption(page, 'Filter by fields, with units');
await typeSlowly(page, '.search', 'took>150ms');
await page.waitForTimeout(300);
await frame(page, 2000);
await page.locator('.search').fill('');
await page.waitForTimeout(300);

const timed = page.locator('.row', { hasText: 'took=' }).first();
await timed.locator('.txt').click();
// clicking scrolls the long line into view sideways; a person's click wouldn't
await page.evaluate(() => (document.querySelector('.scroller').scrollLeft = 0));
await page.locator('.inspector .field', { hasText: 'took' }).click();
await caption(page, 'Field statistics: p95 latency in one click');
await frame(page, 2600);
await page.locator('.inspector .percentile', { hasText: 'p95' }).click();
await page.waitForTimeout(300);
await caption(page, '…and only the slow requests are left');
await frame(page, 2200);

// ---- Compare: what broke this run? ------------------------------------------------------
const ciRun = (day, sha, lines) =>
  [
    `2026-10-${day}T09:00:01.120Z INFO  Checking out ${sha}`,
    `2026-10-${day}T09:00:04.310Z INFO  npm ci: added 812 packages in 3.1s`,
    `2026-10-${day}T09:00:12.448Z INFO  Starting payments-service on port 8080`,
    ...lines,
    `2026-10-${day}T09:01:40.900Z INFO  Done in 99.8s`,
  ].join('\n');
const green = ciRun('03', '41aa0be9c2', [
  '2026-10-03T09:00:20.100Z ERROR Flaky probe timed out after 3012ms',
  '2026-10-03T09:01:30.500Z INFO  Tests: 120 passed',
]);
const red = ciRun('04', '9f2c71d03e', [
  '2026-10-04T09:00:20.300Z ERROR Connection refused: db:5432 after 3 retries',
  '\tat org.postgresql.Driver.connect(Driver.java:285)',
  '2026-10-04T09:00:24.700Z ERROR Connection refused: db:5432 after 3 retries',
  '\tat org.postgresql.Driver.connect(Driver.java:285)',
  '2026-10-04T09:01:30.800Z ERROR PaymentsIT.refundsPartially failed: expected 200 but was 500',
  '2026-10-04T09:01:31.000Z INFO  Tests: 119 passed, 1 failed',
]);
const compare = await context.newPage();
await compare.goto(`chrome-extension://${extensionId}/diff.html`);
await compare.locator('#ignore-volatile').check();
await compare.locator('#left').fill(green);
await compare.locator('#right').fill(red);
await compare.waitForSelector('#errors:not([hidden]) .error');
await compare.evaluate(() => document.activeElement.blur());
await caption(compare, 'Compare a green and a red CI run: what broke this time?');
await frame(compare, 3200);
await compare.locator('#errors > .error').first().click();
await caption(compare, 'Timestamps, SHAs and durations ignored: only real changes');
await frame(compare, 3000);

gif.finish();
writeFileSync('docs/demo.gif', gif.bytes());
console.log(`docs/demo.gif: ${frames} frames, ${(readFileSync('docs/demo.gif').length / 1024 / 1024).toFixed(1)} MB`);
await context.close();
server.close();
