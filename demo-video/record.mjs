import { chromium } from 'playwright';

const SITE = process.env.SITE || 'https://verigate.staifdev.codes';
const W = 1440;
const H = 900;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, total, step = 90, delay = 28) {
  for (let y = 0; y <= total; y += step) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await pause(delay);
  }
}

console.log('recording demo against', SITE);
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  recordVideo: { dir: 'out', size: { width: W, height: H } },
});
const page = await context.newPage();

try {
  // 1) Landing — scroll through the sections
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await pause(2800);
  await smoothScroll(page, 3400);
  await pause(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await pause(800);

  // 2) Playground — run a grounding check that catches a hallucination
  await page.goto(SITE + '/playground', { waitUntil: 'networkidle' });
  await pause(1600);
  await page.selectOption('#service', 'grounding').catch(() => {});
  await pause(1400);
  await page.click('button').catch(() => {});
  await page.waitForSelector('pre', { timeout: 45000 }).catch(() => {});
  await pause(4500);

  // 3) Dashboard — live orders + metrics
  await page.goto(SITE + '/dashboard', { waitUntil: 'networkidle' });
  await pause(3800);

  // 4) An order's verification page — report + on-chain proof + badge
  const link = page.locator('td.mono a').first();
  if (await link.count()) {
    await link.click();
    await page.waitForLoadState('networkidle');
    await pause(2200);
    await smoothScroll(page, 1500);
    await pause(3200);
  }

  // 5) Back to landing — Why CAP / Get started
  await page.goto(SITE + '/#why', { waitUntil: 'networkidle' });
  await pause(3400);
} catch (e) {
  console.error('demo step error (continuing to finalize video):', e.message);
}

await context.close(); // finalizes the .webm
await browser.close();
console.log('done — video written to demo-video/out/');
