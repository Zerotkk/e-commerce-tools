import { describe, expect, it } from "vitest";
import { buildDecision, buildFieldCoverage } from "./write-report.js";
import type { SampleRunResult } from "./run-samples.js";

const failedBlind: SampleRunResult = {
  sampleId: "blind-1",
  group: "blind",
  asin: "B092LVTSD4",
  status: "failed",
  errorCode: "AMAZON_ACCESS_BLOCKED",
  durationMs: 321,
};

describe("sample report", () => {
  it("marks every blind review field uncertain when collection did not produce a page for comparison", () => {
    const coverage = buildFieldCoverage([failedBlind]);

    expect(coverage).toHaveLength(7);
    expect(coverage.every((row) => row.reviewStatus === "uncertain")).toBe(true);
    expect(coverage[0]?.evidence).toBe("COLLECTION_BLOCKED:AMAZON_ACCESS_BLOCKED");
  });

  it("does not accept a blind set without completed visible-page review", () => {
    expect(buildDecision([failedBlind], buildFieldCoverage([failedBlind]))).toMatchObject({
      status: "not_accepted",
      reason: "BLIND_VISIBLE_PAGE_REVIEW_INCOMPLETE",
    });
  });

  it("rejects known blind cross-variant contamination after visible-page review", () => {
    const collected: SampleRunResult = {
      sampleId: "blind-1",
      group: "blind",
      asin: "B092LVTSD4",
      status: "collected",
      durationMs: 100,
      reviewMethod: "manual_visible_page",
      snapshot: {
        asin: "B092LVTSD4",
        facts: { color: { value: "Grey", unit: null, status: "confirmed_source" } },
      },
    };
    const coverage = buildFieldCoverage([collected], { "blind-1": { color: "fail" } });

    expect(buildDecision([collected], coverage)).toMatchObject({
      status: "not_accepted",
      reason: "KNOWN_CROSS_VARIANT_CONTAMINATION",
    });
  });
});
