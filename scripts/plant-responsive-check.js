import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.env.ROOTINE_URL || 'http://localhost:3000';
const outputDir = path.resolve('screenshots/plant-polish');
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const failedRequests = [];
const badResponses = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => consoleErrors.push(error.message));
page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}`));
page.on('response', response => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });

const now = new Date();
const dateString = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const completions = count => Array.from({ length: count }, (_, index) => {
  const date = new Date(now); date.setDate(date.getDate() - (count - index - 1)); return dateString(date);
});
const examples = [
  ['Seedling journal', 'sage', 0], ['Morning water', 'moss', 1], ['Stretch & breathe', 'sky', 3],
  ['A little reading', 'lavender', 7], ['Evening garden', 'peach', 14]
].map(([name, color, count], index) => ({
  _id: `visual-plant-${index}`, name, emoji: ['🌱','💧','🧘','📖','🌸'][index], color,
  createdAt: new Date().toISOString(), completedDates: completions(count)
}));

try {
  await page.addInitScript(() => localStorage.setItem('rootine-theme', 'light'));
  await page.route('**/api/habits', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(examples) });
    return route.continue();
  });
  await page.goto(`${origin}/garden`, { waitUntil: 'networkidle' });
  await page.locator('.habit-card').nth(4).waitFor({ state: 'visible' });
  assert.equal(await page.locator('.plant-wrap svg').count(), 5, 'all five plant stages should render');
  assert.deepEqual(await page.locator('.growth-label').allTextContents(), ['A little seed','A new sprout','Finding its roots','Growing leafy','In full bloom']);
  assert.deepEqual(await page.locator('.growth-hint').allTextContents(), ['1 more day to grow','2 more days to grow','4 more days to grow','7 more days to grow','Your little plant is in bloom ✨']);
  console.log('PASS all five growth stages and next-growth hints render');

  const widths = [360, 768, 1280];
  for (const theme of ['light', 'dark']) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      const currentTheme = await page.locator('html').getAttribute('data-theme');
      if (currentTheme !== theme) await page.getByRole('button', { name: /switch to .* theme/i }).click();
      await page.waitForFunction(expected => document.documentElement.dataset.theme === expected, theme);
      // Measure settled theme colors and capture stable visuals after the CSS transition.
      await page.waitForTimeout(260);
      await page.evaluate(() => document.fonts.ready);

      const metrics = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        heights: [...document.querySelectorAll('.habit-card')].map(card => ({ top: Math.round(card.getBoundingClientRect().top), height: Math.round(card.getBoundingClientRect().height) })),
        contrasts: (() => {
          const rgb = color => color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});
          const lum = color => {const [r,g,b]=rgb(color);return .2126*r+.7152*g+.0722*b;};
          const ratio=(fg,bg)=>{const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
          const primary=getComputedStyle(document.querySelector('.button-primary'));
          const quiet=getComputedStyle(document.querySelector('.check-button:not(.done)'));
          const surface=getComputedStyle(document.querySelector('.habit-card')).backgroundColor;
          const muted=getComputedStyle(document.querySelector('.growth-hint')).color;
          const brand=getComputedStyle(document.querySelector('.brand')).color;
          return {primary:ratio(primary.color,primary.backgroundColor),quiet:ratio(quiet.color,surface),muted:ratio(muted,surface),brand:ratio(brand,getComputedStyle(document.body).backgroundColor)};
        })()
      }));
      assert.equal(metrics.scroll, metrics.viewport, `no horizontal overflow at ${width}px ${theme}`);
      assert(metrics.contrasts.primary >= 4.5, `primary button contrast ${metrics.contrasts.primary} at ${theme}`);
      if (theme === 'dark') for (const [label, contrast] of Object.entries(metrics.contrasts)) assert(contrast >= 4.5, `${label} contrast ${contrast} should pass at ${theme}`);
      const firstRow = metrics.heights.filter(item => item.top === metrics.heights[0].top);
      assert(firstRow.every(item => item.height === firstRow[0].height), `cards in first row should have equal heights at ${width}px ${theme}`);

      if (width === 1280 && theme === 'light') {
        const before = await page.locator('.habit-card').nth(3).evaluate(el => el.getBoundingClientRect().top);
        await page.locator('.habit-card').first().getByRole('button', { name: /View 30-day garden stats/ }).click();
        const after = await page.locator('.habit-card').nth(3).evaluate(el => el.getBoundingClientRect().top);
        assert.equal(after, before, 'opening the stats popover must not move the next grid row');
        await page.locator('.habit-card').first().getByRole('button', { name: /View 30-day garden stats/ }).click();
      }

      const file = path.join(outputDir, `rootine-${width}-${theme}.png`);
      await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
      console.log(`PASS ${width}px ${theme} theme; primary ${metrics.contrasts.primary.toFixed(2)}:1, muted ${metrics.contrasts.muted.toFixed(2)}:1; ${file}`);
    }
  }
  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join(' | ')}`);
  assert.deepEqual(badResponses, [], `HTTP errors: ${badResponses.join(' | ')}`);
  console.log('PASS zero console errors, failed requests, or HTTP error responses across all six views');
} finally {
  await browser.close();
}
