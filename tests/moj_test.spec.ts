import { test, expect } from '@playwright/test';


test('otvori stranicu', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => false,
      configurable: true,
    });
  });

  await page.goto('https://bot.sannysoft.com/', {
    waitUntil: 'domcontentloaded',
  });

  console.log(await page.evaluate(() => navigator.webdriver));
  await page.pause();
});