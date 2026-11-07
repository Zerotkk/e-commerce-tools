import { expect, test, vi } from "vitest";
import { chromium } from "playwright";
import { collectAmazonPage } from "./collect-page.js";

vi.setConfig({ testTimeout: 15_000 });

test("extracts the selected variant and excludes review images", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(new URL("../fixtures/product-page.html", import.meta.url).href);
    const result = await collectAmazonPage(page, "B092LVTSD4", "https://www.amazon.com/dp/B092LVTSD4");

    expect(result.selectedColor).toBe("Grey");
    expect(result.selectedSize).toBe("17 x 13 x 13 in");
    expect(result.imageUrls).not.toContain("https://example.test/review.jpg");
  } finally {
    await browser.close();
  }
});

test("rejects a noncanonical Amazon US source URL", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(new URL("../fixtures/product-page.html", import.meta.url).href);

    await expect(collectAmazonPage(page, "B092LVTSD4", "https://amazon.com/dp/B092LVTSD4")).rejects.toThrow(
      "AMAZON_US_CANONICAL_URL_REQUIRED",
    );
  } finally {
    await browser.close();
  }
});

test("rejects a page whose ASIN differs from the supplied ASIN", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(new URL("../fixtures/product-page.html", import.meta.url).href);

    await expect(collectAmazonPage(page, "B000000000", "https://www.amazon.com/dp/B000000000")).rejects.toThrow(
      "AMAZON_PAGE_ASIN_MISMATCH",
    );
  } finally {
    await browser.close();
  }
});
