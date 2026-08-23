import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { chromium } from "playwright";
import { parseAmazonUsUrl } from "./amazon-url.js";
import { collectAmazonPage } from "./collect-page.js";
import { normalizeSnapshot } from "./normalize.js";
import type { FactStatus, VariantSnapshotDto } from "@ecommerce/contracts";

export const MINIMUM_DELAY_MS = 5_000;

export type SampleGroup = "development" | "regression" | "blind";

export interface Sample {
  sampleId: string;
  url: string;
  group: SampleGroup;
  excluded?: boolean;
  exclusionReason?: "CATEGORY_MISMATCH_PENDING_REVIEW";
}

export interface SampleManifest {
  samples: Sample[];
}

export interface RedactedFact {
  value: string | number | boolean | null;
  unit: string | null;
  status: FactStatus;
}

export interface RedactedSnapshot {
  asin: string;
  color?: string | null;
  size?: string | null;
  firstProductImagePresent?: boolean;
  facts: Record<string, RedactedFact>;
}

export interface SampleRunResult {
  sampleId: string;
  group: SampleGroup;
  asin?: string;
  status: "collected" | "failed" | "excluded";
  errorCode?: string;
  durationMs: number;
  reviewMethod?: "manual_visible_page";
  snapshot?: RedactedSnapshot;
}

export interface RunSamplesOptions {
  delayMs?: number;
  collect: (sample: Sample) => Promise<RedactedSnapshot>;
  delay?: (milliseconds: number) => Promise<void>;
}

const wait = (milliseconds: number) => new Promise<void>((done) => setTimeout(done, milliseconds));

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[^A-Z0-9_]/gi, "_").replace(/^_+|_+$/g, "").slice(0, 120) || "AMAZON_COLLECTION_FAILED";
}

export function accessBlockerCode(html: string): string | undefined {
  return /\/errors_page\/validateCaptcha/i.test(html) ? "AMAZON_CAPTCHA_INTERSTITIAL" : undefined;
}

export async function runSamples(manifest: SampleManifest, options: RunSamplesOptions): Promise<SampleRunResult[]> {
  const delayMs = options.delayMs ?? MINIMUM_DELAY_MS;
  if (delayMs < MINIMUM_DELAY_MS) throw new Error("AMAZON_DELAY_MS_MINIMUM_5000");

  const eligible = manifest.samples.filter((sample) => !sample.excluded);
  let eligibleIndex = 0;
  const results: SampleRunResult[] = [];

  for (const sample of manifest.samples) {
    if (sample.excluded) {
      results.push({
        sampleId: sample.sampleId,
        group: sample.group,
        status: "excluded",
        errorCode: sample.exclusionReason ?? "SAMPLE_EXCLUDED",
        durationMs: 0,
      });
      continue;
    }

    if (eligibleIndex > 0) await (options.delay ?? wait)(delayMs);
    eligibleIndex += 1;
    const startedAt = Date.now();

    try {
      const snapshot = await options.collect(sample);
      results.push({ sampleId: sample.sampleId, group: sample.group, asin: snapshot.asin, status: "collected", durationMs: Date.now() - startedAt, snapshot });
    } catch (error) {
      results.push({ sampleId: sample.sampleId, group: sample.group, status: "failed", errorCode: errorCode(error), durationMs: Date.now() - startedAt });
    }
  }

  if (eligibleIndex !== eligible.length) throw new Error("AMAZON_SAMPLE_RUN_INCOMPLETE");
  return results;
}

export function redactSnapshot(snapshot: VariantSnapshotDto): RedactedSnapshot {
  return {
    asin: snapshot.asin,
    color: snapshot.color,
    size: snapshot.size,
    firstProductImagePresent: snapshot.imageUrls.length > 0,
    facts: Object.fromEntries(snapshot.facts.map((fact) => [fact.key, { value: fact.value, unit: fact.unit, status: fact.status }])),
  };
}

export function resolveWorkspacePath(path: string, currentDirectory = process.cwd()): string {
  if (isAbsolute(path)) return path;
  return resolve(currentDirectory, "../..", path);
}

async function collectWithBrowser(sample: Sample, privateDirectory: string): Promise<RedactedSnapshot> {
  const { asin, canonicalUrl } = parseAmazonUsUrl(sample.url);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(canonicalUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await mkdir(privateDirectory, { recursive: true });
    const html = await page.content();
    await writeFile(resolve(privateDirectory, `${sample.sampleId}.html`), html, "utf8");
    const blocker = accessBlockerCode(html);
    if (blocker) throw new Error(blocker);
    const raw = await collectAmazonPage(page, asin, canonicalUrl);
    await writeFile(resolve(privateDirectory, `${sample.sampleId}.json`), `${JSON.stringify(raw, null, 2)}\n`, "utf8");
    return redactSnapshot(normalizeSnapshot(raw));
  } finally {
    await browser.close();
  }
}

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

export async function main(): Promise<void> {
  const samplesArgument = argumentValue("--samples") ?? "spikes/amazon/samples.json";
  const delayArgument = argumentValue("--delay-ms");
  const delayMs = delayArgument ? Number(delayArgument) : MINIMUM_DELAY_MS;
  if (!Number.isInteger(delayMs)) throw new Error("AMAZON_DELAY_MS_INTEGER_REQUIRED");

  const manifest = JSON.parse(await readFile(resolveWorkspacePath(samplesArgument), "utf8")) as SampleManifest;
  const privateDirectory = resolveWorkspacePath("artifacts/private/amazon");
  const results = await runSamples(manifest, { delayMs, collect: (sample) => collectWithBrowser(sample, privateDirectory) });
  const outputPath = resolveWorkspacePath("artifacts/spikes/amazon/results.json");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), delayMs, results }, null, 2)}\n`, "utf8");
}

if (process.argv[1]?.endsWith("run-samples.ts")) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
