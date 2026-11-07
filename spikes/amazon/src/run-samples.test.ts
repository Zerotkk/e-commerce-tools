import { describe, expect, it } from "vitest";
import { accessBlockerCode, resolveWorkspacePath, runSamples, type SampleManifest } from "./run-samples.js";

const manifest: SampleManifest = {
  samples: [
    { sampleId: "development-1", url: "https://www.amazon.com/dp/B092LVTSD4", group: "development" },
    { sampleId: "excluded-1", url: "https://www.amazon.com/dp/B0BLNJLY94", group: "blind", excluded: true, exclusionReason: "CATEGORY_MISMATCH_PENDING_REVIEW" },
    { sampleId: "blind-1", url: "https://www.amazon.com/dp/B08R93BQ3D", group: "blind" },
  ],
};

describe("runSamples", () => {
  it("resolves the documented workspace-relative manifest path from the spike package", () => {
    expect(resolveWorkspacePath("spikes/amazon/samples.json", "C:/repo/spikes/amazon")).toMatch(/spikes[\\/]amazon[\\/]samples\.json$/);
  });

  it("classifies Amazon's captured CAPTCHA interstitial before extraction", () => {
    expect(accessBlockerCode('<form action="/errors_page/validateCaptcha"><button>Continue shopping</button></form>')).toBe("AMAZON_CAPTCHA_INTERSTITIAL");
  });

  it("collects eligible samples in manifest order, waits between them, and records the exclusion", async () => {
    const events: string[] = [];

    const result = await runSamples(manifest, {
      delayMs: 5_000,
      collect: async (sample) => {
        events.push(`collect:${sample.sampleId}`);
        return { asin: sample.sampleId === "development-1" ? "B092LVTSD4" : "B08R93BQ3D", facts: {} };
      },
      delay: async (milliseconds) => {
        events.push(`delay:${milliseconds}`);
      },
    });

    expect(events).toEqual(["collect:development-1", "delay:5000", "collect:blind-1"]);
    expect(result).toEqual([
      expect.objectContaining({ sampleId: "development-1", status: "collected" }),
      expect.objectContaining({ sampleId: "excluded-1", status: "excluded", errorCode: "CATEGORY_MISMATCH_PENDING_REVIEW" }),
      expect.objectContaining({ sampleId: "blind-1", status: "collected" }),
    ]);
  });

  it("rejects a delay below the Amazon-safe minimum", async () => {
    await expect(runSamples(manifest, { delayMs: 4_999, collect: async () => ({ asin: "B092LVTSD4", facts: {} }) })).rejects.toThrow(
      "AMAZON_DELAY_MS_MINIMUM_5000",
    );
  });
});
