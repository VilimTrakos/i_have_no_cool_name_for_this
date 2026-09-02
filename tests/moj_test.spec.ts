import { test, expect } from "@playwright/test";

import { handleCookies, menuSelector } from "./helpers";

test("otvori stranicu", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", {
      get: () => false,
      configurable: true,
    });
  });

  await page.goto("https://www.notino.hr/", {
    waitUntil: "domcontentloaded",
  });

  await handleCookies(page);

  await menuSelector(
    page,
    '[data-cypress="mainMenu-Muškarci"]',
    "Muški parfemi",
  );

  await page.getByTestId("product-container").first().waitFor({
    state: "visible",
  });

  await page.pause();
  ////////////////////////////////////////////////////////////////////////////////////

  const numberOfPagesText = await page
    .getByTestId("footer-page-item")
    .getByTestId("page-item")
    .last()
    .innerText();

  const numberOfPages = Number(numberOfPagesText);

  const cards = page.getByTestId("product-container").filter({
    has: page.getByTestId("product-card-brand"),
  });

  //var totalNumberOfProducts: number = 0;
  const cardCount = await cards.count();

  const products: {
    brand: string;
    name: string;
    url: string;
  }[] = [];

  // Fetch all from single page, go through all pages
  for (let k = 0; k < 2; k++) {
    // ^ replace 2 with numberOfPages to get all ^
    await cards.first().waitFor({
      state: "visible",
    });
    const cardCount = await cards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);

      await card.scrollIntoViewIfNeeded();

      const productBrand = await card
        .getByTestId("product-card-brand")
        .innerText();
      const productName = await card
        .getByTestId("product-card-name")
        .innerText();

      const href = await card.locator("a[href]").first().getAttribute("href");

      if (href) {
        products.push({
          brand: productBrand,
          name: productName,
          url: new URL(href, page.url()).href,
        });
      }
      //totalNumberOfProducts++;
    }
    await page
      .getByTestId("footer-page-item")
      .getByTestId("icon-regular-chevron-right")
      .click();
  }

  await page.pause();
});
