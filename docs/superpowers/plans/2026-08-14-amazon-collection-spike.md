# Amazon Collection Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that the current variant and source facts can be collected from the supplied Amazon US storage-ottoman samples without mixing sibling variants.

**Architecture:** Build an isolated Playwright collector spike that produces raw snapshots and normalized `VariantSnapshotDto` records. Keep selectors and raw evidence inside the spike; expose only a stable adapter contract after the report is accepted.

**Tech Stack:** TypeScript, Playwright, Vitest, Zod, JSON and CSV artifacts.

## Global Constraints

- Use only user-provided Amazon US links and a conservative sequential request rate.
- Never collect reviews, buyer photos, membership, delivery, or promotion content as product facts.
- The link's ASIN is the identity anchor; color, size, price, image, and facts must belong to that ASIN.
- Unavailable or contradictory values map to `missing` or `conflict`, never to confirmed values.
- Live HTML is evidence, not a stable internal contract.

---

### Task 1: Parse and normalize Amazon URLs

**Files:**
- Create: `spikes/amazon/package.json`
- Create: `spikes/amazon/tsconfig.json`
- Create: `spikes/amazon/vitest.config.ts`
- Create: `spikes/amazon/src/amazon-url.ts`
- Test: `spikes/amazon/src/amazon-url.test.ts`

**Interfaces:**
- Consumes: arbitrary submitted URL string.
- Produces: `parseAmazonUsUrl(input: string): { asin: string; canonicalUrl: string }`.

- [ ] **Step 1: Create the spike package configuration**

Create `spikes/amazon/package.json`:

```json
{
  "name": "@ecommerce/amazon-spike",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit",
    "collect": "tsx src/run-samples.ts"
  },
  "dependencies": {
    "@ecommerce/contracts": "workspace:*",
    "playwright": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "tsx": "latest",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

Create a `tsconfig.json` extending `../../tsconfig.base.json` and a Node-environment `vitest.config.ts` matching the contracts package.

- [ ] **Step 2: Write the failing URL tests**

```ts
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
```

- [ ] **Step 3: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/amazon-spike test
```

Expected: FAIL because `parseAmazonUsUrl` does not exist.

- [ ] **Step 4: Implement canonical parsing**

```ts
const ASIN_PATTERN = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i;

export function parseAmazonUsUrl(input: string): { asin: string; canonicalUrl: string } {
  const url = new URL(input);
  if (url.hostname !== "www.amazon.com" && url.hostname !== "amazon.com") throw new Error("AMAZON_US_URL_REQUIRED");
  const match = url.pathname.match(ASIN_PATTERN);
  if (!match?.[1]) throw new Error("AMAZON_ASIN_NOT_FOUND");
  const asin = match[1].toUpperCase();
  return { asin, canonicalUrl: `https://www.amazon.com/dp/${asin}` };
}
```

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm --filter @ecommerce/amazon-spike test
git add spikes/amazon pnpm-lock.yaml
git commit -m "spike: normalize Amazon product URLs"
```

Expected: tests PASS.

### Task 2: Extract a raw current-variant snapshot

**Files:**
- Create: `spikes/amazon/src/raw-snapshot.ts`
- Create: `spikes/amazon/src/collect-page.ts`
- Create: `spikes/amazon/fixtures/product-page.html`
- Test: `spikes/amazon/src/collect-page.test.ts`

**Interfaces:**
- Consumes: canonical URL and a Playwright `Page`.
- Produces: `RawAmazonSnapshot` containing ASIN, title, selected color, selected size, images, bullets, price text, detail rows, and collection timestamp.

- [ ] **Step 1: Define the raw snapshot schema**

```ts
import { z } from "zod";

export const RawAmazonSnapshotSchema = z.object({
  asin: z.string().regex(/^[A-Z0-9]{10}$/),
  title: z.string().min(1),
  selectedColor: z.string().nullable(),
  selectedSize: z.string().nullable(),
  imageUrls: z.array(z.string().url()).min(1),
  bullets: z.array(z.string()),
  priceText: z.string().nullable(),
  detailRows: z.record(z.string(), z.string()),
  collectedAt: z.string().datetime(),
  sourceUrl: z.string().url(),
});

export type RawAmazonSnapshot = z.infer<typeof RawAmazonSnapshotSchema>;
```

- [ ] **Step 2: Write a failing fixture extraction test**

```ts
import { expect, test } from "vitest";
import { chromium } from "playwright";
import { collectAmazonPage } from "./collect-page.js";

test("extracts the selected variant and excludes review images", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(new URL("../fixtures/product-page.html", import.meta.url).href);
  const result = await collectAmazonPage(page, "B092LVTSD4", "https://www.amazon.com/dp/B092LVTSD4");
  expect(result.selectedColor).toBe("Grey");
  expect(result.selectedSize).toBe("17 x 13 x 13 in");
  expect(result.imageUrls).not.toContain("https://example.test/review.jpg");
  await browser.close();
});
```

- [ ] **Step 3: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/amazon-spike test
```

Expected: FAIL because `collectAmazonPage` does not exist.

- [ ] **Step 4: Implement visible product extraction**

```ts
import type { Page } from "playwright";
import { RawAmazonSnapshotSchema, type RawAmazonSnapshot } from "./raw-snapshot.js";

export async function collectAmazonPage(page: Page, asin: string, sourceUrl: string): Promise<RawAmazonSnapshot> {
  const data = await page.evaluate(() => {
    const text = (selector: string) => document.querySelector(selector)?.textContent?.trim() || null;
    const detailRows = Object.fromEntries(
      [...document.querySelectorAll("#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr")]
        .map((row) => [row.querySelector("th")?.textContent?.trim(), row.querySelector("td")?.textContent?.trim()])
        .filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1])),
    );
    const imageUrls = [...document.querySelectorAll("#altImages img, #landingImage")]
      .map((node) => (node as HTMLImageElement).dataset.oldHires || (node as HTMLImageElement).src)
      .filter((url) => /^https?:\/\//.test(url));
    return {
      title: text("#productTitle"),
      selectedColor: text("#variation_color_name .selection"),
      selectedSize: text("#variation_size_name .selection"),
      imageUrls: [...new Set(imageUrls)],
      bullets: [...document.querySelectorAll("#feature-bullets li span")].map((node) => node.textContent?.trim() || "").filter(Boolean),
      priceText: text(".a-price .a-offscreen"),
      detailRows,
    };
  });
  return RawAmazonSnapshotSchema.parse({ ...data, asin, sourceUrl, collectedAt: new Date().toISOString() });
}
```

- [ ] **Step 5: Run the test and commit**

```powershell
pnpm --filter @ecommerce/amazon-spike test
git add spikes/amazon
git commit -m "spike: extract Amazon current variant snapshot"
```

### Task 3: Normalize facts and preserve provenance

**Files:**
- Create: `spikes/amazon/src/normalize.ts`
- Test: `spikes/amazon/src/normalize.test.ts`

**Interfaces:**
- Consumes: `RawAmazonSnapshot`.
- Produces: `VariantSnapshotDto` from `@ecommerce/contracts`.

- [ ] **Step 1: Write the failing normalization test**

```ts
import { expect, test } from "vitest";
import { normalizeSnapshot } from "./normalize.js";

test("marks conflicting dimensions instead of choosing one", () => {
  const result = normalizeSnapshot({
    asin: "B092LVTSD4", title: "Ottoman", selectedColor: "Grey", selectedSize: "17 in",
    imageUrls: ["https://example.test/main.jpg"], bullets: [], priceText: "$29.99",
    detailRows: { "Product Dimensions": "17 x 13 x 13 in", "Size": "20 x 15 x 15 in" },
    collectedAt: "2026-08-14T00:00:00.000Z", sourceUrl: "https://www.amazon.com/dp/B092LVTSD4",
  });
  expect(result.facts.find((fact) => fact.key === "product_dimensions")?.status).toBe("conflict");
});
```

- [ ] **Step 2: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/amazon-spike test
```

Expected: FAIL because `normalizeSnapshot` does not exist.

- [ ] **Step 3: Implement explicit fact mapping**

```ts
import type { ProductFactDto, VariantSnapshotDto } from "@ecommerce/contracts";
import type { RawAmazonSnapshot } from "./raw-snapshot.js";

function normalizedValues(values: Array<string | null | undefined>): string[] {
  return [...new Map(values.filter((value): value is string => Boolean(value?.trim())).map((value) => [value.trim().toLowerCase(), value.trim()])).values()];
}

function fact(asin: string, key: string, values: Array<string | null | undefined>, unit: string | null = null): ProductFactDto {
  const unique = normalizedValues(values);
  if (unique.length === 0) return { key, value: null, unit, status: "missing", sourceRef: null };
  if (unique.length > 1) return { key, value: null, unit, status: "conflict", sourceRef: `amazon:${asin}:${key}` };
  return { key, value: unique[0]!, unit, status: "confirmed_source", sourceRef: `amazon:${asin}:${key}` };
}

const row = (raw: RawAmazonSnapshot, ...labels: string[]) => {
  const wanted = new Set(labels.map((label) => label.toLowerCase()));
  return Object.entries(raw.detailRows).filter(([label]) => wanted.has(label.trim().toLowerCase())).map(([, value]) => value);
};

export function normalizeSnapshot(raw: RawAmazonSnapshot): VariantSnapshotDto {
  const facts: ProductFactDto[] = [
    fact(raw.asin, "title", [raw.title]),
    fact(raw.asin, "brand", row(raw, "Brand")),
    fact(raw.asin, "model", row(raw, "Item model number", "Model Name")),
    fact(raw.asin, "color", [raw.selectedColor, ...row(raw, "Color")]),
    fact(raw.asin, "size", [raw.selectedSize]),
    fact(raw.asin, "product_dimensions", [...row(raw, "Product Dimensions"), ...row(raw, "Size")]),
    fact(raw.asin, "item_weight", row(raw, "Item Weight")),
    fact(raw.asin, "material", row(raw, "Material")),
    fact(raw.asin, "load_capacity", row(raw, "Maximum Weight Recommendation", "Load Capacity")),
    fact(raw.asin, "storage_capacity", row(raw, "Capacity")),
    fact(raw.asin, "source_price", [raw.priceText], "USD"),
  ];
  return { asin: raw.asin, color: raw.selectedColor, size: raw.selectedSize, imageUrls: raw.imageUrls, facts };
}
```

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @ecommerce/amazon-spike test
git add spikes/amazon
git commit -m "spike: normalize Amazon facts with provenance"
```

### Task 4: Run the supplied samples and write the decision report

**Files:**
- Create: `spikes/amazon/samples.json`
- Create: `spikes/amazon/src/run-samples.ts`
- Create: `spikes/amazon/src/write-report.ts`
- Create: `packages/connectors/src/amazon/amazon.contract.ts`
- Create: `artifacts/spikes/amazon/results.json`
- Create: `artifacts/spikes/amazon/field-coverage.csv`
- Create: `docs/validation/amazon-collection-report.md`

**Interfaces:**
- Consumes: valid storage-ottoman links from `测试链接.xlsx`.
- Produces: evidence artifacts and `AmazonCollector.collect(url): Promise<JobResult<VariantSnapshotDto>>` contract.

- [ ] **Step 1: Create the sample manifest**

Store each link with `sampleId`, `url`, and one group value from `development`, `regression`, or `blind`. Mark the suspicious non-ottoman link as `excluded` with reason `CATEGORY_MISMATCH_PENDING_REVIEW`; do not silently count it as a passing sample.

- [ ] **Step 2: Run samples sequentially**

```powershell
pnpm --filter @ecommerce/amazon-spike collect -- --samples spikes/amazon/samples.json --delay-ms 5000
```

Expected: raw snapshots under `artifacts/private/amazon/` and redacted normalized results in `artifacts/spikes/amazon/results.json`.

- [ ] **Step 3: Perform manual variant review**

For every blind sample, compare ASIN, selected color, selected size, first product image, dimensions, material, and price with the visible page. Record `pass`, `fail`, or `uncertain` per field in `field-coverage.csv`.

- [ ] **Step 4: Define the accepted connector contract**

```ts
import type { JobResult, VariantSnapshotDto } from "@ecommerce/contracts";

export interface AmazonCollector {
  collect(url: string): Promise<JobResult<VariantSnapshotDto>>;
}
```

- [ ] **Step 5: Write the report and apply the gate**

The report must list sample grouping, successful fields, missing fields, conflicting fields, blocking selector failures, request duration, and the exact acquisition path selected for product implementation. The result is `accepted` only when no blind sample contains known cross-variant contamination.

- [ ] **Step 6: Commit spike evidence**

```powershell
git add spikes/amazon artifacts/spikes/amazon docs/validation/amazon-collection-report.md packages/connectors/src/amazon/amazon.contract.ts
git commit -m "spike: validate Amazon current variant collection"
```
