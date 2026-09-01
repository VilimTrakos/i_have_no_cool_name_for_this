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
  const cards = page.getByTestId("product-container").filter({
    has: page.getByTestId("product-card-brand"),
  });

  await cards.first().waitFor({
    state: "visible",
  });

  const cardCount = await cards.count();

  for (let i = 0; i < cardCount; i++) {
    const card = cards.nth(i);

    await card.scrollIntoViewIfNeeded();

    const brand = await card.getByTestId("product-card-brand").innerText();

    console.log(i, brand);
  }

  await page.pause();
});
