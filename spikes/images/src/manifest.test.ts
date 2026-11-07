import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { parseImageSamples, sha256 } from "./manifest.js";

test("parses the sample manifest as validated image samples", () => {
  const manifest: unknown = JSON.parse(readFileSync(new URL("../samples.json", import.meta.url), "utf8"));

  const samples = parseImageSamples(manifest);

  expect(samples).toHaveLength(5);
  expect(samples[0]?.sampleId).toBe("rectangular-folding-unknown");
});

test("returns a stable lowercase SHA-256 hash", () => {
  expect(sha256(Buffer.from("ottoman"))).toBe("f928738eaaf5df14c29637f34b103f73557f9243b85e2705416b325b9844f739");
});
