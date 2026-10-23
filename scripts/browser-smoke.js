import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = process.env.ROOTINE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
const failedRequests = [];
const badResponses = [];
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', error => consoleErrors.push(error.message));
page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText || 'failed'}`));
page.on('response', response => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });

let createdId;
try {
  // Slow the initial API response just enough to confirm that the loading skeleton is real.
  await page.route('**/api/habits', async route => {
    if (route.request().method() === 'GET') await new Promise(resolve => setTimeout(resolve, 250));
    await route.continue();
  });
  await page.goto(`${origin}/garden`, { waitUntil: 'domcontentloaded' });
  const skeleton = page.locator('.skeleton-card').first();
  await skeleton.waitFor({ state: 'visible', timeout: 3000 });
  await skeleton.waitFor({ state: 'detached', timeout: 10000 });
  console.log('PASS initial skeleton appears and disappears');

  await page.getByRole('button', { name: 'New habit' }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible' });
  console.log('PASS New habit opens the dialog');

  const habitName = `Rootine browser smoke ${Date.now()}`;
  await page.locator('#habit-name').fill(habitName);
  const createResponse = page.waitForResponse(response => response.url().endsWith('/api/habits') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Plant habit' }).click();
  const created = await createResponse;
  assert.equal(created.status(), 201, 'habit create API should return 201');
  const card = page.locator('.habit-card').filter({ hasText: habitName });
  await card.waitFor({ state: 'visible' });
  const payload = await created.json();
  createdId = payload._id;
  console.log('PASS creating a habit renders its card');

  const toggleResponse = page.waitForResponse(response => response.url().includes(`/api/habits/${createdId}/toggle`) && response.request().method() === 'PATCH');
  await card.getByRole('button', { name: 'Mark ' + habitName + ' done today' }).click();
  await card.locator('.plant-wrap.level-up').waitFor({ state: 'visible' });
  assert.equal(await card.locator('.plant-particle').count(), 6, 'completion should emit leaf and sparkle particles around the plant');
  const toggle = await toggleResponse;
  assert.equal(toggle.status(), 200, 'toggle API should return 200');
  await card.locator('.check-button.done').waitFor({ state: 'visible' });
  console.log('PASS toggling a habit completes it');

  const beforeTheme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /switch to .* theme/i }).click();
  await page.waitForFunction(previous => document.documentElement.dataset.theme !== previous, beforeTheme);
  console.log(`PASS dark mode toggle switches ${beforeTheme} to ${await page.locator('html').getAttribute('data-theme')}`);

  // Remove only the uniquely named test habit so the connected database is left as found.
  const deleteResponse = await page.request.delete(`${origin}/api/habits/${createdId}`);
  assert.equal(deleteResponse.status(), 204, 'smoke-test cleanup should remove its test habit');
  createdId = null;
  console.log('PASS smoke-test habit cleaned up');

  assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(failedRequests, [], `failed browser requests: ${failedRequests.join(' | ')}`);
  assert.deepEqual(badResponses, [], `HTTP error responses: ${badResponses.join(' | ')}`);
  console.log('PASS zero console errors, failed requests, or HTTP error responses');
} finally {
  if (createdId) {
    try { await page.request.delete(`${origin}/api/habits/${createdId}`); } catch { /* Best-effort cleanup after a failed assertion. */ }
  }
  await browser.close();
}
