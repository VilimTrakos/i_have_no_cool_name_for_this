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

            const href = await card
                .locator("a[href]")
                .first()
                .getAttribute("href");

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

    // Open individual URl and fetch ML + price values

    type ProductVariant = {
        volume: string;
        price: string;
        couponPrice: string | null;
        couponCode: string | null;
        url: string;
    };

    type ProductDetails = {
        brand: string;
        name: string;
        url: string;
        variants: ProductVariant[];
    };

    const detailPage = await page.context().newPage();

    for (const product of products) {
        // open product URL
        await detailPage.goto(product.url, {
            waitUntil: "domcontentloaded",
        });

        const currentProduct: ProductDetails = {
            brand: product.brand,
            name: product.name,
            url: product.url,
            variants: [],
        };

        //Some have first some have second name for a box with variants for some reason ...
        const variantContainers = detailPage.locator(
            '[data-testid="pd-variants-thumbnail"]:visible, ' +
                '[data-testid="pd-variants-tile"]:visible',
        );

        const variantCards = variantContainers.locator("li");
        const variantCount = await variantCards.count();

        const variantUrls: string[] = [];
        // console.log(`${product.brand} ${product.name}: ${variantCount} varijanti`);

        for (let i = 0; i < variantCount; i++) {
            const variantCard = variantCards.nth(i);
            const href = await variantCard
                .locator("a[href]")
                .first()
                .getAttribute("href");

            if (!href) {
                continue;
            }

            const variantUrl = new URL(href, detailPage.url()).href;
            variantUrls.push(variantUrl);
        }
        // Ako nema variantnih kartica, osnovni proizvod je jedina varijanta
        if (variantUrls.length === 0) {
            variantUrls.push(product.url);
        }
        for (const variantUrl of variantUrls) {
            await detailPage.goto(variantUrl, {
                waitUntil: "domcontentloaded",
            });
            console.log("Trenutno na:", variantUrl);
        }
    }

    await page.pause();
});
