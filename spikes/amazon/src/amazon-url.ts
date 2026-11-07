const ASIN_PATTERN = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i;

export function parseAmazonUsUrl(input: string): { asin: string; canonicalUrl: string } {
  const url = new URL(input);

  if (url.hostname !== "www.amazon.com" && url.hostname !== "amazon.com") {
    throw new Error("AMAZON_US_URL_REQUIRED");
  }

  const match = url.pathname.match(ASIN_PATTERN);

  if (!match?.[1]) {
    throw new Error("AMAZON_ASIN_NOT_FOUND");
  }

  const asin = match[1].toUpperCase();

  return {
    asin,
    canonicalUrl: `https://www.amazon.com/dp/${asin}`,
  };
}
