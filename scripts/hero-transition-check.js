import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const base = 'http://localhost:3000';
const out = 'screenshots/hero-polish';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
const failures = [];

async function makePage(theme, width, takeScreenshot = true) {
  const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error') errors.push(`${theme}/${width}: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`${theme}/${width}: ${error.message}`));
  page.on('requestfailed', request => failures.push(`${theme}/${width}: ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${theme}/${width}: HTTP ${response.status()} ${response.url()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(value => {
    localStorage.setItem('rootine-theme', value);
    sessionStorage.setItem('rootine-intro-seen', '1');
    sessionStorage.removeItem('rootine-curtain-next');
  }, theme);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.documentElement.dataset.curtain);
  if (takeScreenshot) await page.locator('.hero').screenshot({ path: `${out}/hero-${width}-${theme}.png` });
  const geometry = await page.evaluate(() => {
    const title = document.querySelector('.hero h1');
    const spans = [...title.querySelectorAll('span')];
    const hero = document.querySelector('.hero').getBoundingClientRect();
    const layout = document.querySelector('.hero-layout').getBoundingClientRect();
    const copy = document.querySelector('.hero-copy').getBoundingClientRect();
    const card = document.querySelector('.hero-preview').getBoundingClientRect();
    return { heroWidth: hero.width, layoutWidth: layout.width, copyWidth: copy.width, cardWidth: card.width, columns: getComputedStyle(document.querySelector('.hero-layout')).gridTemplateColumns, titleLines: spans.length, overflow: spans.map(span => span.getBoundingClientRect().right > copy.right + 1) };
  });
  if (geometry.overflow.some(Boolean)) throw new Error(`Hero headline overflows at ${width}px/${theme}: ${JSON.stringify(geometry)}`);
  return { context, page, geometry };
}

for (const theme of ['light', 'dark']) {
  for (const width of [1440, 1024, 390]) {
    const { context, page, geometry } = await makePage(theme, width);
    console.log(`PASS hero screenshot ${width}px ${theme}: ${JSON.stringify(geometry)}`);
    await context.close();
  }
}

for (const theme of ['light', 'dark']) {
  const { context, page } = await makePage(theme, 1280, false);
  const visited = ['/garden', '/why', '/about'];
  for (const path of visited) {
    const nav = page.locator(`#primary-nav a[href="${path}"]`).first();
    const previousQuote = await page.evaluate(() => sessionStorage.getItem('rootine-last-transition-quote'));
    await nav.click();
    await page.waitForFunction(() => document.documentElement.dataset.curtain === 'out');
    const currentQuote = await page.evaluate(() => document.documentElement.dataset.curtainQuote);
    if (currentQuote === previousQuote) throw new Error(`Transition repeated its previous quote at ${path}`);
    await page.waitForURL(`**${path}`);
    await page.waitForFunction(() => !document.documentElement.dataset.curtain, null, { timeout: 5000 });
    const title = await page.title();
    if (!title.includes('Rootine') && path !== '/why') throw new Error(`Unexpected page title at ${path}: ${title}`);
    console.log(`PASS ${theme}: link navigation to ${path}, curtain cleared (${title})`);
  }
  for (const _ of visited) {
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.documentElement.dataset.curtain, null, { timeout: 5000 });
    console.log(`PASS ${theme}: browser back to ${new URL(page.url()).pathname}, curtain cleared`);
  }
  await context.close();
}

// A fresh session gets the longer branded intro; the page must be covered immediately and then revealed.
const introContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const introPage = await introContext.newPage();
introPage.on('console', message => { if (message.type() === 'error') errors.push(`intro: ${message.text()}`); });
introPage.on('pageerror', error => errors.push(`intro: ${error.message}`));
await introPage.goto(base, { waitUntil: 'domcontentloaded' });
const introShown = await introPage.evaluate(() => document.documentElement.dataset.curtain === 'intro' && getComputedStyle(document.documentElement, '::before').opacity === '1');
if (!introShown) throw new Error('First session intro curtain was not present immediately');
await introPage.waitForFunction(() => !document.documentElement.dataset.curtain, null, { timeout: 5000 });
console.log('PASS first session intro appears immediately and clears');
await introContext.close();

const reducedContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await reducedContext.addInitScript(() => {
  localStorage.setItem('rootine-theme', 'light');
  sessionStorage.setItem('rootine-intro-seen', '1');
});
const reducedPage = await reducedContext.newPage();
reducedPage.on('console', message => { if (message.type() === 'error') errors.push(`reduced motion: ${message.text()}`); });
reducedPage.on('pageerror', error => errors.push(`reduced motion: ${error.message}`));
await reducedPage.goto(base, { waitUntil: 'networkidle' });
const reducedStart = Date.now();
await reducedPage.locator('#primary-nav a.nav-link[href="/garden"]').click();
await reducedPage.waitForURL('**/garden');
await reducedPage.waitForFunction(() => !document.documentElement.dataset.curtain, null, { timeout: 2000 });
if (Date.now() - reducedStart > 1000) throw new Error('Reduced-motion navigation did not use a quick transition');
console.log('PASS reduced-motion navigation uses a quick, clear transition');
await reducedContext.close();
await browser.close();

if (errors.length || failures.length) {
  console.error('Browser errors:', errors);
  console.error('Failed requests:', failures);
  process.exitCode = 1;
} else {
  console.log('PASS zero console errors, failed requests, or HTTP errors');
}
