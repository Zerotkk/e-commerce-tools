import { expect, test } from "vitest";
import { normalizeSnapshot } from "./normalize.js";

test("marks conflicting dimensions instead of choosing one", () => {
  const result = normalizeSnapshot({
    asin: "B092LVTSD4",
    title: "Ottoman",
    selectedColor: "Grey",
    selectedSize: "17 in",
    imageUrls: ["https://example.test/main.jpg"],
    bullets: [],
    priceText: "$29.99",
    detailRows: { "Product Dimensions": "17 x 13 x 13 in", Size: "20 x 15 x 15 in" },
    collectedAt: "2026-08-14T00:00:00.000Z",
    sourceUrl: "https://www.amazon.com/dp/B092LVTSD4",
  });

  expect(result.facts.find((fact) => fact.key === "product_dimensions")?.status).toBe("conflict");
});
