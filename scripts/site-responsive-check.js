import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = process.env.ROOTINE_URL || 'http://localhost:3000';
const screenshotDir = path.resolve('screenshots/multipage');
await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const consoleErrors = [];
const failedRequests = [];
const badResponses = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => consoleErrors.push(error.message));
page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}`));
page.on('response', response => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });

const today = new Date();
const dateString = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const fixtureDates = count => Array.from({ length: count }, (_, index) => { const date = new Date(today); date.setDate(date.getDate() - (count - index - 1)); return dateString(date); });
const habits = [
  ['A quiet start', 'sage', 0], ['A little stretch', 'moss', 1], ['Read a page', 'sky', 3]
].map(([name, color, count], index) => ({ _id: `site-visual-${index}`, name, color, emoji: ['🌱','🧘','📖'][index], createdAt: new Date().toISOString(), completedDates: fixtureDates(count) }));

const routes = [
  { path: '/', file: 'home', title: /Rootine — Small habits/ },
  { path: '/garden', file: 'garden', title: /My Garden — Rootine/ },
  { path: '/why', file: 'why', title: /The Science of Small Habits/ },
  { path: '/about', file: 'about', title: /About Rootine/ }
];

try {
  await page.route('**/api/habits', route => route.request().method() === 'GET'
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(habits) })
    : route.continue());
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('rootine-theme', 'light'));
  await page.getByRole('button', { name: /switch to .* theme/i }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.goto(`${origin}/why`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark', 'theme choice should persist on navigation');
  console.log('PASS dark mode preference persists between pages');

  for (const theme of ['light', 'dark']) {
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of routes) {
        await page.evaluate(value => localStorage.setItem('rootine-theme', value), theme);
        const response = await page.goto(`${origin}${route.path}`, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200, `${route.path} should return 200`);
        await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme);
        await page.evaluate(() => document.fonts.ready);
        assert.match(await page.title(), route.title, `${route.path} title should be descriptive`);
        assert.equal(await page.locator('.nav-link[aria-current="page"]').getAttribute('href'), route.path, `${route.path} should be highlighted in the navbar`);
        assert.equal(await page.locator('link[rel="icon"]').count(), 1, `${route.path} should include its emoji favicon`);

        if (route.path === '/') {
          assert.equal(await page.locator('#days-range').count(), 1, 'landing page has the compounding slider');
          assert.equal(await page.locator('#preview-plants svg').count(), 3, 'landing preview reuses three plant SVGs');
          assert.equal(await page.locator('body').getAttribute('data-hero-image'), 'landscape', 'layered landscape is used when no hero.jpg exists');
        } else if (route.path === '/garden') {
          await page.locator('.habit-card').first().waitFor({ state: 'visible' });
        } else if (route.path === '/why') {
          assert.equal(await page.locator('.idea-card').count(), 6, 'why page includes the six habit ideas');
          await page.getByText('cue, a craving, a response, a reward', { exact: false }).waitFor({ state: 'visible' });
        } else {
          assert.equal(await page.locator('.step-card').count(), 3, 'about page includes the three steps');
        }

        const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
        assert.equal(viewport.scroll, viewport.width, `${route.path} has no horizontal overflow at ${width}px (${theme})`);
        if (width === 360) {
          const menu = page.locator('#menu-toggle');
          await menu.click();
          assert.equal(await menu.getAttribute('aria-expanded'), 'true', 'mobile hamburger should open navigation');
          await page.keyboard.press('Escape');
          assert.equal(await menu.getAttribute('aria-expanded'), 'false', 'Escape should close mobile navigation');
        }

        // Scroll once to activate every IntersectionObserver reveal before capturing a full-page image.
        await page.evaluate(async () => {
          document.documentElement.style.scrollBehavior = 'auto';
          for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
            window.scrollTo(0, y);
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(100);
        assert.equal(await page.locator('.reveal:not(.is-visible)').count(), 0, `${route.path} reveals should finish before screenshot`);
        const screenshot = path.join(screenshotDir, `${route.file}-${width}-${theme}.png`);
        await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
        console.log(`PASS ${route.path} at ${width}px ${theme}; ${screenshot}`);
      }
    }
  }

  const missingPage = await browser.newPage();
  const missingResponse = await missingPage.goto(`${origin}/this-page-does-not-exist`, { waitUntil: 'domcontentloaded' });
  assert.equal(missingResponse.status(), 404);
  await missingPage.getByRole('heading', { name: 'Looks like this path wandered off.' }).waitFor({ state: 'visible' });
  await missingPage.close();
  console.log('PASS unknown paths show a friendly 404 page');

  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(failedRequests, [], `failed requests: ${failedRequests.join(' | ')}`);
  assert.deepEqual(badResponses, [], `HTTP errors: ${badResponses.join(' | ')}`);
  console.log('PASS zero console errors, failed requests, or 404s on the four product routes');
} finally {
  await browser.close();
}
