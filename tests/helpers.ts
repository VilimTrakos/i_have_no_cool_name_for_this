
import type { Page } from '@playwright/test';

export async function handleCookies(page: Page) {
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

export async function menuSelector(
  page: Page,
  mainMenuItem: string,
  itemToSelect: string,
) {
  await page.waitForTimeout(700)
  await page.locator(mainMenuItem).hover();
  await page.waitForTimeout(700)
  await page
    .getByRole('link', { name: itemToSelect, exact: true })
    .filter({ visible: true })
    .click({ force: true });
}