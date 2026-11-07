import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import type { SampleRunResult } from "./run-samples.js";

export const REVIEW_FIELDS = ["asin", "color", "size", "first_product_image", "product_dimensions", "material", "price"] as const;
export type ReviewField = (typeof REVIEW_FIELDS)[number];
export type ReviewStatus = "pass" | "fail" | "uncertain";

export interface FieldCoverageRow {
  sampleId: string;
  group: "blind";
  field: ReviewField;
  extractedStatus: "confirmed" | "missing" | "conflict" | "not_collected";
  reviewStatus: ReviewStatus;
  evidence: string;
}

export interface Decision {
  status: "accepted" | "not_accepted";
  reason: "NO_KNOWN_CROSS_VARIANT_CONTAMINATION" | "KNOWN_CROSS_VARIANT_CONTAMINATION" | "BLIND_VISIBLE_PAGE_REVIEW_INCOMPLETE";
}

type ManualReviews = Partial<Record<string, Partial<Record<ReviewField, ReviewStatus>>>>;

function extractedStatus(result: SampleRunResult, field: ReviewField): FieldCoverageRow["extractedStatus"] {
  if (result.status !== "collected" || !result.snapshot) return "not_collected";
  if (field === "asin") return result.snapshot.asin ? "confirmed" : "missing";
  if (field === "first_product_image") return result.snapshot.firstProductImagePresent ? "confirmed" : "missing";
  if (field === "color") return result.snapshot.color ? "confirmed" : "missing";
  if (field === "size") return result.snapshot.size ? "confirmed" : "missing";
  const factName = field === "price" ? "source_price" : field;
  const fact = result.snapshot.facts[factName];
  if (!fact || fact.status === "missing") return "missing";
  return fact.status === "conflict" ? "conflict" : "confirmed";
}

export function buildFieldCoverage(results: SampleRunResult[], reviews: ManualReviews = {}): FieldCoverageRow[] {
  return results
    .filter((result) => result.group === "blind" && result.status !== "excluded")
    .flatMap((result) =>
      REVIEW_FIELDS.map((field) => {
        const status = extractedStatus(result, field);
        const manualStatus = reviews[result.sampleId]?.[field];
        const reviewStatus = manualStatus ?? "uncertain";
        const evidence = result.status !== "collected"
          ? `COLLECTION_BLOCKED:${result.errorCode ?? "AMAZON_COLLECTION_FAILED"}`
          : manualStatus
            ? "MANUAL_VISIBLE_PAGE_COMPARISON"
            : "MANUAL_VISIBLE_PAGE_REVIEW_NOT_PERFORMED";
        return { sampleId: result.sampleId, group: "blind" as const, field, extractedStatus: status, reviewStatus, evidence };
      }),
    );
}

export function buildDecision(results: SampleRunResult[], coverage: FieldCoverageRow[]): Decision {
  const blindResults = results.filter((result) => result.group === "blind" && result.status !== "excluded");
  if (coverage.some((row) => row.reviewStatus === "fail")) {
    return { status: "not_accepted", reason: "KNOWN_CROSS_VARIANT_CONTAMINATION" };
  }
  if (blindResults.length === 0 || blindResults.some((result) => result.reviewMethod !== "manual_visible_page") || coverage.some((row) => row.reviewStatus === "uncertain")) {
    return { status: "not_accepted", reason: "BLIND_VISIBLE_PAGE_REVIEW_INCOMPLETE" };
  }
  return { status: "accepted", reason: "NO_KNOWN_CROSS_VARIANT_CONTAMINATION" };
}

function csvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function coverageCsv(rows: FieldCoverageRow[]): string {
  return ["sampleId,group,field,extractedStatus,reviewStatus,evidence", ...rows.map((row) => [row.sampleId, row.group, row.field, row.extractedStatus, row.reviewStatus, row.evidence].map(csvValue).join(","))].join("\n") + "\n";
}

export function reportMarkdown(results: SampleRunResult[], coverage: FieldCoverageRow[], decision: Decision): string {
  const successful = coverage.filter((row) => row.extractedStatus === "confirmed").map((row) => `${row.sampleId}:${row.field}`);
  const missing = coverage.filter((row) => row.extractedStatus === "missing" || row.extractedStatus === "not_collected").map((row) => `${row.sampleId}:${row.field}`);
  const conflicts = coverage.filter((row) => row.extractedStatus === "conflict").map((row) => `${row.sampleId}:${row.field}`);
  const blockers = results.filter((result) => result.status === "failed").map((result) => `${result.sampleId}:${result.errorCode}`);
  const sampleRows = results.map((result) => `| ${result.sampleId} | ${result.group} | ${result.status} | ${result.asin ?? "—"} | ${result.durationMs} | ${result.errorCode ?? "—"} |`).join("\n");

  return `# Amazon current-variant collection report\n\nGenerated from the supplied workbook manifest. No credentials or cookies were used. Raw page content and raw snapshots, when available, are stored only under ignored \`artifacts/private/amazon/\`.\n\n## Sample grouping and outcomes\n\n| Sample | Group | Outcome | ASIN | Request duration (ms) | Evidence |\n| --- | --- | --- | --- | ---: | --- |\n${sampleRows}\n\nExcluded: DocSafe B0BLNJLY94 is recorded as \`CATEGORY_MISMATCH_PENDING_REVIEW\` and is not counted as a collection success.\n\n## Blind field coverage\n\n| Sample | Field | Extracted status | Visible-page review | Evidence |\n| --- | --- | --- | --- | --- |\n${coverage.map((row) => `| ${row.sampleId} | ${row.field} | ${row.extractedStatus} | ${row.reviewStatus} | ${row.evidence} |`).join("\n")}\n\nSuccessful fields: ${successful.join(", ") || "none"}.\n\nMissing or uncollected fields: ${missing.join(", ") || "none"}.\n\nConflicting fields: ${conflicts.join(", ") || "none"}.\n\nBlocking selector/acquisition failures: ${blockers.join(", ") || "none"}.\n\n## Decision gate\n\n**${decision.status}** — \`${decision.reason}\`. Acceptance requires completed visible-page comparison for every blind field and no known cross-variant contamination.\n\n## Acquisition path\n\nSelected validation path: canonical \`https://www.amazon.com/dp/{ASIN}\` loaded with Playwright without credentials or cookies; verify page ASIN; extract selected color, selected size, first product image, technical-details dimensions/material, and displayed price; save raw page/snapshot privately; normalize with provenance; publish only URL-free normalized output. This remains a spike path and is not approved for product implementation until the gate is accepted.\n`;
}

function workspacePath(path: string): string {
  if (isAbsolute(path)) return path;
  return resolve(process.cwd(), "../..", path);
}

export async function main(): Promise<void> {
  const resultsPath = workspacePath("artifacts/spikes/amazon/results.json");
  const data = JSON.parse(await readFile(resultsPath, "utf8")) as { results: SampleRunResult[] };
  const coverage = buildFieldCoverage(data.results);
  const decision = buildDecision(data.results, coverage);
  const coveragePath = workspacePath("artifacts/spikes/amazon/field-coverage.csv");
  const reportPath = workspacePath("docs/validation/amazon-collection-report.md");
  await mkdir(dirname(coveragePath), { recursive: true });
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(coveragePath, coverageCsv(coverage), "utf8");
  await writeFile(reportPath, reportMarkdown(data.results, coverage, decision), "utf8");
}

if (process.argv[1]?.endsWith("write-report.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
