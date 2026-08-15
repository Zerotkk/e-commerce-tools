import { expect, test } from "vitest";
import { sha256 } from "./manifest.js";

test("returns a stable lowercase SHA-256 hash", () => {
  expect(sha256(Buffer.from("ottoman"))).toBe("f928738eaaf5df14c29637f34b103f73557f9243b85e2705416b325b9844f739");
});
