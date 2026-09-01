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

  await cards.first().waitFor({
    state: "visible",
  });
  var totalNumberOfProducts: number = 1;
  const cardCount = await cards.count();
  for (let k = 0; k < numberOfPages; k++) {
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);

      await card.scrollIntoViewIfNeeded();

      const productBrand = await card
        .getByTestId("product-card-brand")
        .innerText();
      const productName = await card
        .getByTestId("product-card-name")
        .innerText();
      const productPrice = await card
        .getByTestId("price-component")
        .innerText();

      console.log(
        totalNumberOfProducts,
        productBrand,
        "-",
        productName,
        " - price: ",
        productPrice,
      );
      totalNumberOfProducts++;
    }
    await page
      .getByTestId("footer-page-item")
      .getByTestId("icon-regular-chevron-right")
      .click();
  }

  await page.pause();
});
