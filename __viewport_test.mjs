import { chromium } from 'playwright';
import fs from 'fs';

const sizes = [
  { name: 'ZFold5_cover_344x882', width: 344, height: 882, expected: 'compact' },
  { name: 'ZFold5_main_690x829', width: 690, height: 829, expected: 'expanded' },
  { name: 'ZFold6_cover_369x905', width: 369, height: 905, expected: 'compact' },
  { name: 'ZFold6_main_707x823', width: 707, height: 823, expected: 'expanded' },
  { name: 'ZFold7_cover_411x960', width: 411, height: 960, expected: 'compact' },
  { name: 'ZFold7_main_750x832', width: 750, height: 832, expected: 'expanded' },
];

const pages = ['Aujourd’hui', 'Semaine', 'Projets'];

const browser = await chromium.launch();
const results = [];

for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/cadence/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const mode = await page.evaluate(() => {
    const root = document.querySelector('[data-viewport-mode]');
    return root ? root.getAttribute('data-viewport-mode') : null;
  });

  results.push({ size: size.name, width: size.width, height: size.height, expected: size.expected, detected: mode, match: mode === size.expected });

  await page.screenshot({ path: `/home/user/cadence/__shot_${size.name}_initial.png`, fullPage: false });

  // try navigating between pages
  for (const navLabel of pages) {
    try {
      const link = page.getByRole('link', { name: navLabel }).first();
      if (await link.count() > 0) {
        await link.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `/home/user/cadence/__shot_${size.name}_${navLabel.replace(/[^a-zA-Z]/g,'')}.png`, fullPage: false });
      } else {
        results[results.length-1][`nav_${navLabel}`] = 'NOT FOUND';
      }
    } catch (e) {
      results[results.length-1][`nav_${navLabel}`] = 'ERROR: ' + e.message;
    }
  }

  await context.close();
}

await browser.close();
fs.writeFileSync('/home/user/cadence/__viewport_results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
