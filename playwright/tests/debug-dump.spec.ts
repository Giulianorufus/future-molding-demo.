import { test } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3000';

test('dump raccolta-dati content', async ({ page }) => {
  page.on('console', (msg) => console.log('PAGE_CONSOLE>', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE_ERROR>', err.message, '\n', err.stack));
  await page.goto(`${BASE_URL}/#/raccolta-dati`, { waitUntil: 'networkidle' });
  // wait a bit to allow app to hydrate
  await page.waitForTimeout(1500);
  const html = await page.content();
  console.log('PAGE CONTENT START');
  console.log(html);
  console.log('PAGE CONTENT END');
});
