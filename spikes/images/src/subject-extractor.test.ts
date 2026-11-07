import { expect, test } from "vitest";
import { runExtraction } from "./run-extraction.js";
import { validateExtraction } from "./subject-extractor.js";

test("rejects cutouts with clipped subject bounds", () => {
  expect(
    validateExtraction({
      alphaTouchesTop: true,
      alphaTouchesRight: false,
      alphaTouchesBottom: false,
      alphaTouchesLeft: false,
      opaqueRatio: 0.5,
    }),
  ).toEqual({ accepted: false, reason: "SUBJECT_TOUCHES_EDGE" });
});

test("rejects cutouts with an invalid alpha ratio", () => {
  expect(
    validateExtraction({
      alphaTouchesTop: false,
      alphaTouchesRight: false,
      alphaTouchesBottom: false,
      alphaTouchesLeft: false,
      opaqueRatio: 0.04,
    }),
  ).toEqual({ accepted: false, reason: "INVALID_ALPHA_RATIO" });
});

test("accepts cutouts with unbounded subjects and a valid alpha ratio", () => {
  expect(
    validateExtraction({
      alphaTouchesTop: false,
      alphaTouchesRight: false,
      alphaTouchesBottom: false,
      alphaTouchesLeft: false,
      opaqueRatio: 0.5,
    }),
  ).toEqual({ accepted: true });
});

test("refuses to run without two configured extraction providers", async () => {
  await expect(
    runExtraction({ sourcePath: "missing-authorized-source.png", extractors: [] }),
  ).rejects.toThrow("At least two subject-extraction providers must be configured");
});

test("refuses to run without an authorized source image", async () => {
  const extractor = {
    extract: async () => {
      throw new Error("must not run");
    },
  };

  await expect(
    runExtraction({
      sourcePath: "missing-authorized-source.png",
      extractors: [extractor, extractor],
    }),
  ).rejects.toThrow("Authorized source image is unavailable");
});
