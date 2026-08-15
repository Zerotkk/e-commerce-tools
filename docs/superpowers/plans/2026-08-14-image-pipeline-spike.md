# Image Pipeline Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove an image workflow that produces localized Ozon candidates while preserving the storage ottoman subject.

**Architecture:** Separate subject extraction from design composition. The subject cutout is never sent through a whole-image generative edit; backgrounds and decorative layers are created independently, then the unchanged cutout and Russian text are composed with deterministic image code.

**Tech Stack:** TypeScript, Sharp, Vitest, pluggable background-removal and background-generation providers, PNG/WebP, CSV human review.

## Global Constraints

- Allowed changes: background, scene, decoration, whitespace, Russian text, icons, layout, and output size.
- Forbidden changes: shape, structure, proportion, color, material, texture, brand, model, accessories, ports, opening method, and unshown angles.
- A failed cutout or fidelity check routes to manual handling; it never auto-passes.
- Candidate sets are clean commerce, localized scene, and feature/parameter layout.
- Store input, cutout, background, overlay, output, hashes, provider, cost, duration, and reviewer decision.

---

### Task 1: Define image manifests and immutable asset hashing

**Files:**
- Create: `spikes/images/package.json`
- Create: `spikes/images/tsconfig.json`
- Create: `spikes/images/vitest.config.ts`
- Create: `spikes/images/src/manifest.ts`
- Test: `spikes/images/src/manifest.test.ts`
- Create: `spikes/images/samples.json`

**Interfaces:**
- Consumes: 3–5 representative source images and factual Russian copy.
- Produces: validated `ImageSample` records and SHA-256 identifiers.

- [ ] **Step 1: Create the spike package configuration**

Create `spikes/images/package.json`:

```json
{
  "name": "@ecommerce/image-spike",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit",
    "extract": "tsx src/run-extraction.ts",
    "generate": "tsx src/generate-candidates.ts"
  },
  "dependencies": {
    "@ecommerce/contracts": "workspace:*",
    "sharp": "latest",
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

- [ ] **Step 2: Write the failing hash test**

```ts
import { expect, test } from "vitest";
import { sha256 } from "./manifest.js";

test("returns a stable lowercase SHA-256 hash", () => {
  expect(sha256(Buffer.from("ottoman"))).toBe("f928738eaaf5df14c29637f34b103f73557f9243b85e2705416b325b9844f739");
});
```

- [ ] **Step 3: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/image-spike test
```

Expected: FAIL because `sha256` does not exist.

- [ ] **Step 4: Implement the manifest schema and hash**

```ts
import { createHash } from "node:crypto";
import { z } from "zod";

export const ImageSampleSchema = z.object({
  sampleId: z.string().min(1),
  sourcePath: z.string().min(1),
  asin: z.string().regex(/^[A-Z0-9]{10}$/),
  color: z.string().min(1),
  size: z.string().min(1),
  facts: z.record(z.string(), z.string()),
});

export type ImageSample = z.infer<typeof ImageSampleSchema>;
export const sha256 = (bytes: Buffer): string => createHash("sha256").update(bytes).digest("hex");
```

- [ ] **Step 5: Create the sample manifest**

Choose samples covering rectangular, round, folding, opened-storage, light-color, and dark-color presentations where available. Each fact used in image text must include the exact Russian string and source reference; omit unsupported capacity or load claims.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/image-spike test
git add spikes/images pnpm-lock.yaml
git commit -m "spike: define immutable image samples"
```

### Task 2: Evaluate subject extraction behind a provider contract

**Files:**
- Create: `spikes/images/src/subject-extractor.ts`
- Create: `spikes/images/src/run-extraction.ts`
- Test: `spikes/images/src/subject-extractor.test.ts`
- Create: `artifacts/spikes/images/extraction-results.json`

**Interfaces:**
- Consumes: source image bytes.
- Produces: transparent PNG cutout, confidence, provider name, duration, cost, and source/cutout hashes.

- [ ] **Step 1: Write the failing extraction validation test**

```ts
import { expect, test } from "vitest";
import { validateExtraction } from "./subject-extractor.js";

test("rejects cutouts with clipped subject bounds", () => {
  expect(validateExtraction({ alphaTouchesTop: true, alphaTouchesRight: false, alphaTouchesBottom: false, alphaTouchesLeft: false, opaqueRatio: 0.5 })).toEqual({ accepted: false, reason: "SUBJECT_TOUCHES_EDGE" });
});
```

- [ ] **Step 2: Implement the provider and validator contracts**

```ts
export interface SubjectExtractionResult {
  png: Buffer;
  confidence: number | null;
  provider: string;
  durationMs: number;
  costUsd: number | null;
}

export interface SubjectExtractor {
  extract(source: Buffer): Promise<SubjectExtractionResult>;
}

export function validateExtraction(metrics: { alphaTouchesTop: boolean; alphaTouchesRight: boolean; alphaTouchesBottom: boolean; alphaTouchesLeft: boolean; opaqueRatio: number }) {
  if (metrics.alphaTouchesTop || metrics.alphaTouchesRight || metrics.alphaTouchesBottom || metrics.alphaTouchesLeft) return { accepted: false as const, reason: "SUBJECT_TOUCHES_EDGE" };
  if (metrics.opaqueRatio < 0.05 || metrics.opaqueRatio > 0.95) return { accepted: false as const, reason: "INVALID_ALPHA_RATIO" };
  return { accepted: true as const };
}
```

- [ ] **Step 3: Run automated tests**

```powershell
pnpm --filter @ecommerce/image-spike test
```

Expected: PASS.

- [ ] **Step 4: Run at least two extraction paths**

Implement thin provider adapters for the two candidate extraction services available to the project. Run both against every sample and save outputs under `artifacts/private/images/<sampleId>/<provider>/subject.png`. Store only hashes, metrics, duration, cost, and human-safe filenames in `extraction-results.json`.

- [ ] **Step 5: Review cutouts at original resolution**

Check outline completeness, feet, seams, handles, hinges, storage opening, shadows, internal cavities, brand marks, and semi-transparent material edges. Mark each provider/sample `pass`, `manual_fix`, or `fail`.

- [ ] **Step 6: Commit redacted evidence**

```powershell
git add spikes/images artifacts/spikes/images/extraction-results.json
git commit -m "spike: evaluate storage ottoman subject extraction"
```

### Task 3: Compose candidates without regenerating the subject

**Files:**
- Create: `spikes/images/src/compose.ts`
- Create: `spikes/images/src/russian-overlay.ts`
- Test: `spikes/images/src/compose.test.ts`

**Interfaces:**
- Consumes: transparent subject PNG, separately generated background, approved Russian copy, and a template.
- Produces: flattened candidate image plus a manifest proving the subject layer hash used.

- [ ] **Step 1: Write the failing composition manifest test**

```ts
import { expect, test } from "vitest";
import { composeCandidate } from "./compose.js";

test("records the exact subject hash used in composition", async () => {
  const result = await composeCandidate({ subject: Buffer.from("subject"), background: Buffer.from("background"), width: 1200, height: 1200, overlays: [] });
  expect(result.manifest.subjectHash).toMatch(/^[a-f0-9]{64}$/);
});
```

- [ ] **Step 2: Implement deterministic composition**

```ts
import sharp from "sharp";
import { sha256 } from "./manifest.js";

export async function composeCandidate(input: { subject: Buffer; background: Buffer; width: number; height: number; overlays: Buffer[] }) {
  const subjectLayer = await sharp(input.subject).resize({ width: Math.round(input.width * 0.72), height: Math.round(input.height * 0.72), fit: "inside", withoutEnlargement: true }).png().toBuffer();
  const overlayInputs = [
    { input: subjectLayer, gravity: "centre" as const },
    ...input.overlays.map((buffer) => ({ input: buffer, gravity: "centre" as const })),
  ];
  const image = await sharp(input.background).resize(input.width, input.height, { fit: "cover" }).composite(overlayInputs).png().toBuffer();
  return { image, manifest: { sourceSubjectHash: sha256(input.subject), subjectHash: sha256(subjectLayer), outputHash: sha256(image) } };
}
```

- [ ] **Step 3: Render Russian text as an SVG overlay**

Implement `renderRussianOverlay({ heading, bullets, width, height }): Buffer` using XML-escaped text, embedded project-approved font files, maximum line lengths, and fixed safe margins. Reject copy that exceeds the template's line and character limits instead of shrinking it below the readable minimum.

- [ ] **Step 4: Run composition tests**

```powershell
pnpm --filter @ecommerce/image-spike test
```

Expected: PASS and fixture images render at exactly 1200×1200.

- [ ] **Step 5: Commit the deterministic composer**

```powershell
git add spikes/images
git commit -m "spike: compose localized images from immutable subjects"
```

### Task 4: Produce three candidate styles and human review evidence

**Files:**
- Create: `spikes/images/src/generate-candidates.ts`
- Create: `artifacts/spikes/images/manifest.json`
- Create: `artifacts/spikes/images/review.csv`
- Create: `docs/validation/image-pipeline-report.md`
- Create: `packages/connectors/src/images/image-pipeline.contract.ts`

**Interfaces:**
- Consumes: approved cutout, facts, Russian copy, and one of `clean`, `scene`, or `feature` templates.
- Produces: 2–3 candidate sets per sample, review decisions, metrics, and the accepted `ImagePipeline` contract.

- [ ] **Step 1: Generate candidate sets**

```powershell
pnpm --filter @ecommerce/image-spike generate -- --samples spikes/images/samples.json --styles clean,scene,feature
```

Expected: candidates under `artifacts/private/images/<sampleId>/candidates/` and a redacted `manifest.json` containing hashes, provider, template, cost, and duration.

- [ ] **Step 2: Complete human review**

Create one CSV row per image with columns:

```text
sample_id,style,output_hash,shape_ok,proportion_ok,color_ok,texture_ok,accessories_ok,brand_ok,text_ok,reviewer,decision,reason
```

The only allowed decisions are `approved`, `manual_fix`, and `rejected`. Any failed fidelity field forces `rejected`.

- [ ] **Step 3: Define the product contract**

```ts
export type ImageStyle = "clean" | "scene" | "feature";

export interface ImageGenerationRequest {
  taskId: string;
  sourceAssetId: string;
  style: ImageStyle;
  russianCopy: { heading: string; bullets: string[] };
}

export interface ImageGenerationResult {
  outputAssetId: string;
  sourceHash: string;
  subjectHash: string;
  outputHash: string;
  automatedChecksPassed: boolean;
  manualReviewRequired: true;
}

export interface ImagePipeline {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResult>;
}
```

- [ ] **Step 4: Write and apply the decision report**

The report must compare extraction paths, identify the selected path, list failure patterns, document the immutable-subject composition rule, report cost and duration distributions, and state which image types always require manual work.

Accept only if every automatically passed candidate also passes human fidelity review. Otherwise the report must reject automation and specify a template/manual workflow.

- [ ] **Step 5: Commit the decision**

```powershell
git add spikes/images artifacts/spikes/images docs/validation/image-pipeline-report.md packages/connectors/src/images/image-pipeline.contract.ts
git commit -m "spike: validate immutable-subject image pipeline"
```
