import { describe, expect, it } from "vitest";
import { parseAmazonUsUrl } from "./amazon-url.js";

describe("parseAmazonUsUrl", () => {
  it("extracts the ASIN and removes tracking", () => {
    expect(parseAmazonUsUrl("https://www.amazon.com/example/dp/B092LVTSD4/ref=abc")).toEqual({
      asin: "B092LVTSD4",
      canonicalUrl: "https://www.amazon.com/dp/B092LVTSD4",
    });
  });

  it("rejects non-US hosts", () => {
    expect(() => parseAmazonUsUrl("https://www.amazon.de/dp/B092LVTSD4")).toThrow("AMAZON_US_URL_REQUIRED");
  });
});
