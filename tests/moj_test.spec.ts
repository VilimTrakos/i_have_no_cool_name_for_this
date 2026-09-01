import { test, expect } from '@playwright/test';

async function handleCookies(page) {
  const necessaryCookies = page.getByRole('link', {
    name: 'Prihvati samo potrebne cookies',
    exact: true,
  });

  const appeared = await necessaryCookies
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);

  if (appeared) {
    await necessaryCookies.click();
  }
}

async function menuSelector(page, mainMenuItem:string, hoverItemToSelect:string){
  page.locator(mainMenuItem,).hover();
  page.getByRole('link', {name:hoverItemToSelect, exact:true,}).click();
}

test('otvori stranicu', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => false,
      configurable: true,
    });
  });

  await page.goto('https://www.notino.hr/', {
    waitUntil: 'domcontentloaded',
  });

  await handleCookies(page);


  menuSelector(page, '[data-cypress="mainMenu-Muškarci"]', "Muški parfemi");
  await page.pause();
  menuSelector(page, '[data-cypress="mainMenu-Zubi"]', "Za djecu");
  await page.pause();
  menuSelector(page, '[data-cypress="mainMenu-Tijelo"]', "Kreme za ruke");
  await page.pause();

});