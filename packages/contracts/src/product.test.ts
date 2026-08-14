import { describe, expect, it } from "vitest";
import { isPublishableFact, type ProductFactDto } from "./product.js";

describe("isPublishableFact", () => {
  it.each(["confirmed_source", "confirmed_manual"] as const)("accepts %s", (status) => {
    const fact: ProductFactDto = { key: "color", value: "grey", unit: null, status, sourceRef: "amazon:A1" };

    expect(isPublishableFact(fact)).toBe(true);
  });

  it.each(["suggested", "missing", "conflict"] as const)("rejects %s", (status) => {
    const fact: ProductFactDto = { key: "weight", value: null, unit: "kg", status, sourceRef: null };

    expect(isPublishableFact(fact)).toBe(false);
  });
});
