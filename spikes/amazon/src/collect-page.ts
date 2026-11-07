import type { Page } from "playwright";
import { parseAmazonUsUrl } from "./amazon-url.js";
import { RawAmazonSnapshotSchema, type RawAmazonSnapshot } from "./raw-snapshot.js";

export async function collectAmazonPage(page: Page, asin: string, sourceUrl: string): Promise<RawAmazonSnapshot> {
  const parsedSource = parseAmazonUsUrl(sourceUrl);

  if (sourceUrl !== parsedSource.canonicalUrl || asin !== parsedSource.asin) {
    throw new Error("AMAZON_US_CANONICAL_URL_REQUIRED");
  }

  const data = await page.evaluate(() => {
    const text = (selector: string) => document.querySelector(selector)?.textContent?.trim() || null;
    const detailRows = Object.fromEntries(
      [...document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr")]
        .map((row) => [row.querySelector("th")?.textContent?.trim(), row.querySelector("td")?.textContent?.trim()])
        .filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1])),
    );
    const imageUrls = [...document.querySelectorAll("#altImages img, #landingImage")]
      .map((node) => (node as HTMLImageElement).dataset.oldHires || (node as HTMLImageElement).src)
      .filter((url) => /^https?:\/\//.test(url));

    return {
      pageAsin: (document.querySelector("#ASIN") as HTMLInputElement | null)?.value ?? null,
      title: text("#productTitle"),
      selectedColor: text("#variation_color_name .selection"),
      selectedSize: text("#variation_size_name .selection"),
      imageUrls: [...new Set(imageUrls)],
      bullets: [...document.querySelectorAll("#feature-bullets li span")]
        .map((node) => node.textContent?.trim() || "")
        .filter(Boolean),
      priceText: text(".a-price .a-offscreen"),
      detailRows,
    };
  });

  if (data.pageAsin !== asin) {
    throw new Error("AMAZON_PAGE_ASIN_MISMATCH");
  }

  const { pageAsin: _pageAsin, ...snapshotData } = data;
  return RawAmazonSnapshotSchema.parse({ ...snapshotData, asin, sourceUrl, collectedAt: new Date().toISOString() });
}
