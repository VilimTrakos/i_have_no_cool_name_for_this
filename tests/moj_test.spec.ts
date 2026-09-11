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
        filler: boolean;
        currency: string;
        coupon: boolean;
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

            const variantVolume = detailPage
                .locator("#pdSelectedVariant")
                .locator("span")
                .filter({ hasText: /^\s*\d+(?:[.,]\d+)?\s*ml\b/i });

            const text = (await variantVolume.count())
                ? (await variantVolume.innerText()).trim()
                : "";

            const volumeText = text.match(/[\d.,]+\s*ml/i)?.[0] ?? "";
            const nadopuna = /nadopuna/i.test(text);

            const originalPriceAndVolume =
                detailPage.locator("#pdSelectedVariant");

            const variantText = (await originalPriceAndVolume.count())
                ? await originalPriceAndVolume.innerText()
                : "";

            const giftWithPurchase = /poklon uz kupnju/i.test(variantText);
            const freeShipping = /besplatna dostava/i.test(variantText);
            const promotionalOffer = /akcija/i.test(variantText);

            const regularPrice = originalPriceAndVolume.getByTestId("pd-price");

            const promotionalPrice = detailPage
                .getByTestId("sticky-side-bar")
                .locator("#pdSelectedVariant + div")
                .getByTestId("pd-price-wrapper")
                .locator('span[content]:not([data-testid="currency-variant"])');

            const unavailable = await detailPage
                .getByTestId("product-specifications")
                .getByText(/trenutno nedostupno/i)
                .count();

            const originalVolumePrice = unavailable
                ? "Trenutno nedostupno"
                : (await regularPrice.count()) === 1
                  ? await regularPrice.innerText()
                  : (await promotionalPrice.count()) === 1
                    ? await promotionalPrice.innerText()
                    : "ERROR";

            const stickSideBar =
                await detailPage.getByTestId("sticky-side-bar");

            const couponLocator = await stickSideBar
                .locator("span")
                .filter({ hasText: /s kodom/i })
                .locator(":scope > span"); //find coupon by text "s kodom" because there is no id or anything :(

            const coupon = (await couponLocator.count())
                ? (await couponLocator.innerText()).trim()
                : "";

            // const priceContainer = detailPage.locator(
            //     "#pdSelectedVariant #pd-price",
            // ); // There is more places where currency-variant appears so need to limit search to specific one
            // const variantCurrency = await priceContainer
            //     .getByTestId("currency-variant")
            //     .getAttribute("content");

            // const couponPrice = coupon
            //     ? (
            //           await stickSideBar
            //               .getByTestId("pd-price-wrapper")
            //               .locator(
            //                   ':scope > span[content]:not([data-testid="currency-variant"])',
            //               )
            //               .innerText()
            //       ).trim()
            //     : "";
            // console.log(
            //     "VolumeText: ",
            //     volumeText,
            //     "- nadopuna: ",
            //     nadopuna,
            //     "- gift: ",
            //     giftWithPurchase,
            //     "- shipping: ",
            //     freeShipping,
            //     "- promo:",
            //     promotionalOffer,
            //     "- original price:",
            //     originalVolumePrice,
            // );
            // console.log(
            //     " Product name ",
            //     currentProduct.name,
            //     " Product brand: ",
            //     currentProduct.brand,
            // );
            console.log(
                " Product brand: ",
                currentProduct.brand,
                " Product name ",
                currentProduct.name,
                "\n",
                "VolumeText: ",
                volumeText,
                "original price:",
                originalVolumePrice,
                "coupon:",
                coupon,
                // "Coupon price:",
                // couponPrice,
                // variantCurrency,
                // "Coupon:",
                // coupon,
            );

            //await detailPage.pause();
        }
    }

    await page.pause();
});
