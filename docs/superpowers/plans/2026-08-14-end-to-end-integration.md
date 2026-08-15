# End-to-End Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the accepted Amazon, text, image, review, and Ozon paths into one recoverable workflow and prove the MVP with regression and blind samples.

**Architecture:** Background jobs orchestrate stable adapters and persist each completed step before continuing. Server-side release validation builds an immutable internal Ozon draft; an explicit submission job invokes Seller API and polls its asynchronous result.

**Tech Stack:** NestJS API/worker, BullMQ, PostgreSQL/Prisma, Redis, S3-compatible storage, Vitest, Playwright, selected external adapters.

## Global Constraints

- Use only adapters accepted by the three spike reports.
- If Ozon-side drafts are unsupported, “保存草稿” remains internal and makes no Seller API call.
- Any required fact, image, rights, category, attribute, price, inventory, SKU, package dimension, or weight blocker prevents submission.
- Every external job is idempotent and recoverable after an unknown network outcome.
- Final acceptance uses at least three previously unused valid storage-ottoman samples.

---

### Task 1: Implement server-side release validation and draft building

**Files:**
- Create: `packages/core/src/ozon/release-validator.ts`
- Create: `packages/core/src/ozon/draft-builder.ts`
- Test: `packages/core/src/ozon/release-validator.test.ts`
- Test: `packages/core/src/ozon/draft-builder.test.ts`
- Create: `apps/api/src/modules/ozon-drafts/**`

**Interfaces:**
- Consumes: confirmed variant, facts, approved content version, approved image proposals, Ozon category/type/attributes, price, inventory, SKU, package data, rights confirmation, and reviewer identity.
- Produces: `ReleaseValidationResult` and immutable `OzonDraftPayload`.

- [ ] **Step 1: Write the failing blocking test**

```ts
import { expect, test } from "vitest";
import { validateRelease } from "./release-validator.js";

test("blocks a task with a failed subject check and missing package weight", () => {
  const result = validateRelease({
    variantConfirmed: true,
    missingRequiredFacts: [],
    images: [{ id: "i1", automatedChecksPassed: false, reviewDecision: "approved" }],
    contentApproved: true,
    missingOzonAttributes: [],
    price: "2990.00",
    inventory: 10,
    sku: "OTT-B092LVTSD4-GREY",
    productDimensionsComplete: true,
    packageDimensionsComplete: true,
    packageWeightGrams: null,
    rightsConfirmed: true,
  });
  expect(result.blockers.map((x) => x.code)).toEqual(["IMAGE_FIDELITY_FAILED", "PACKAGE_WEIGHT_REQUIRED"]);
});
```

- [ ] **Step 2: Implement complete release validation**

```ts
export interface ReleaseBlocker { code: string; field: string; message: string }

export function validateRelease(input: {
  variantConfirmed: boolean;
  missingRequiredFacts: string[];
  images: Array<{ id: string; automatedChecksPassed: boolean; reviewDecision: string | null }>;
  contentApproved: boolean;
  missingOzonAttributes: number[];
  price: string | null;
  inventory: number | null;
  sku: string | null;
  productDimensionsComplete: boolean;
  packageDimensionsComplete: boolean;
  packageWeightGrams: number | null;
  rightsConfirmed: boolean;
}) {
  const blockers: ReleaseBlocker[] = [];
  if (!input.variantConfirmed) blockers.push({ code: "VARIANT_NOT_CONFIRMED", field: "variant", message: "请确认当前颜色、尺寸、图片和参数" });
  for (const key of input.missingRequiredFacts) blockers.push({ code: "REQUIRED_FACT_MISSING", field: key, message: `请补充并确认 ${key}` });
  if (input.images.some((image) => !image.automatedChecksPassed)) blockers.push({ code: "IMAGE_FIDELITY_FAILED", field: "images", message: "存在主体一致性检查失败的图片" });
  if (!input.images.some((image) => image.automatedChecksPassed && image.reviewDecision === "approved")) blockers.push({ code: "APPROVED_IMAGE_REQUIRED", field: "images", message: "至少选择一张通过自动检查和人工审核的图片" });
  if (!input.contentApproved) blockers.push({ code: "CONTENT_APPROVAL_REQUIRED", field: "content", message: "俄语内容尚未审核" });
  for (const id of input.missingOzonAttributes) blockers.push({ code: "OZON_ATTRIBUTE_MISSING", field: `ozon.attribute.${id}`, message: `请补充 Ozon 属性 ${id}` });
  if (!input.price) blockers.push({ code: "PRICE_REQUIRED", field: "price", message: "请填写售价" });
  if (input.inventory === null) blockers.push({ code: "INVENTORY_REQUIRED", field: "inventory", message: "请填写库存" });
  if (!input.sku) blockers.push({ code: "SKU_REQUIRED", field: "sku", message: "请填写 SKU" });
  if (!input.productDimensionsComplete) blockers.push({ code: "PRODUCT_DIMENSIONS_REQUIRED", field: "productDimensions", message: "请填写商品长、宽、高" });
  if (!input.packageDimensionsComplete) blockers.push({ code: "PACKAGE_DIMENSIONS_REQUIRED", field: "packageDimensions", message: "请填写包装长、宽、高" });
  if (input.packageWeightGrams === null) blockers.push({ code: "PACKAGE_WEIGHT_REQUIRED", field: "packageWeight", message: "请填写包装重量" });
  if (!input.rightsConfirmed) blockers.push({ code: "RIGHTS_CONFIRMATION_REQUIRED", field: "rights", message: "请完成权利和商品一致性确认" });
  return { publishable: blockers.length === 0, blockers };
}
```

- [ ] **Step 3: Write the failing draft hash test**

```ts
import { expect, test } from "vitest";
import { buildOzonDraft } from "./draft-builder.js";

test("builds the same payload hash for equivalent inputs", () => {
  const first = buildOzonDraft({ offerId: "OTT-1", name: "Пуф", price: "2990.00", attributes: [{ id: 2, values: ["Grey"] }, { id: 1, values: ["Ottoman"] }] } as never);
  const second = buildOzonDraft({ offerId: "OTT-1", name: "Пуф", price: "2990.00", attributes: [{ id: 1, values: ["Ottoman"] }, { id: 2, values: ["Grey"] }] } as never);
  expect(first.payloadHash).toBe(second.payloadHash);
});
```

- [ ] **Step 4: Implement canonical draft construction**

Sort attributes by numeric ID and image IDs by stable display order before JSON serialization. Hash canonical JSON with SHA-256. Return `{ payload, payloadHash }`; persist both in one transaction with approval actor and timestamp.

- [ ] **Step 5: Add draft routes and tests**

Implement `GET /tasks/:id/release-validation`, `POST /tasks/:id/drafts`, and `GET /tasks/:id/drafts/latest`. Draft creation requires reviewer/admin and returns blockers with HTTP 422 when not publishable.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test -- ozon
pnpm --filter @ecommerce/api test:integration -- ozon-drafts
git add packages/core/src/ozon apps/api/src/modules/ozon-drafts
git commit -m "feat: validate and build immutable Ozon drafts"
```

### Task 2: Integrate accepted adapters into recoverable jobs

**Files:**
- Create: `packages/connectors/src/amazon/accepted-amazon-collector.ts`
- Create: `packages/connectors/src/images/accepted-image-pipeline.ts`
- Create: `packages/connectors/src/ozon/accepted-ozon-gateway.ts`
- Modify: `apps/worker/src/processors/task.processor.ts`
- Create: `apps/worker/src/processors/ozon.processor.ts`
- Test: `apps/worker/src/processors/task.processor.test.ts`
- Test: `apps/worker/src/processors/ozon.processor.test.ts`

**Interfaces:**
- Consumes: contracts and exact acquisition paths accepted in spike reports.
- Produces: end-to-end steps `COLLECT`, `GENERATE_CONTENT`, `GENERATE_IMAGES`, `BUILD_OZON_DRAFT`, `SUBMIT_OZON`, and `POLL_OZON`.

- [ ] **Step 1: Write the failing resume test**

```ts
import { expect, test, vi } from "vitest";
import { TaskProcessor } from "./task.processor.js";

test("does not recollect when collection already succeeded", async () => {
  const jobs = { begin: vi.fn().mockResolvedValue({ execute: false, result: { snapshotId: "s1" } }) };
  const collector = { collect: vi.fn() };
  const processor = new TaskProcessor(jobs as never, collector as never);
  await processor.collect({ taskId: "t1", url: "https://www.amazon.com/dp/B092LVTSD4" });
  expect(collector.collect).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Implement accepted connector adapters**

Move only production-worthy code selected by each spike into the three accepted adapter files. Keep selector sets, endpoint versions, provider identifiers, timeouts, and retry classifications explicit and covered by fixture tests. Do not import code directly from `spikes/`.

- [ ] **Step 3: Implement task processor sequencing**

Each handler must:

1. call `JobService.begin` with `step:<taskId>:<inputVersion>`;
2. return the stored result when `execute` is false;
3. call exactly one adapter/use case;
4. persist output and job success in a transaction;
5. enqueue the next allowed step only after commit;
6. record structured failure and retryability without changing confirmed prior outputs.

- [ ] **Step 4: Implement safe Ozon submission and polling**

Before import, query deterministic `offerId`. If found, link the existing product to the publication attempt. For a new import, save returned task ID, poll with bounded backoff, and map terminal field errors. On timeout, set `UNKNOWN`, query by offer ID, and never issue a second import until the unknown outcome is resolved.

- [ ] **Step 5: Run processor tests and commit**

```powershell
pnpm --filter @ecommerce/worker test
pnpm --filter @ecommerce/connectors test
git add packages/connectors apps/worker
git commit -m "feat: integrate recoverable external processing jobs"
```

### Task 3: Add server-side Ozon attribute mapping and error translation

**Files:**
- Create: `packages/core/src/ozon/attribute-mapper.ts`
- Create: `packages/core/src/ozon/error-translator.ts`
- Test: `packages/core/src/ozon/attribute-mapper.test.ts`
- Test: `packages/core/src/ozon/error-translator.test.ts`
- Create: `apps/api/src/modules/ozon-attributes/**`

**Interfaces:**
- Consumes: normalized facts, Ozon attribute definitions and dictionary values, and live Ozon field errors.
- Produces: mapped attribute candidates, blockers, and actionable Chinese error messages.

- [ ] **Step 1: Write the failing exact-enum test**

```ts
import { expect, test } from "vitest";
import { mapDictionaryValue } from "./attribute-mapper.js";

test("does not silently fuzzy-match a dictionary value", () => {
  const values = [{ id: 10, value: "Серый" }, { id: 11, value: "Серо-бежевый" }];
  expect(mapDictionaryValue("Grey", values, {})).toEqual({ status: "missing", candidates: values });
});
```

- [ ] **Step 2: Implement explicit mapping rules**

```ts
export function mapDictionaryValue(source: string, values: Array<{ id: number; value: string }>, approvedMap: Record<string, number>) {
  const approvedId = approvedMap[source.trim().toLowerCase()];
  if (approvedId) return { status: "confirmed" as const, valueId: approvedId };
  return { status: "missing" as const, candidates: values };
}
```

Store approved mappings in visible database rows keyed by source field, normalized source value, description category ID, type ID, attribute ID, and Ozon dictionary value ID. Never hardcode fuzzy results inside prompts.

- [ ] **Step 3: Write field-error translation fixtures**

Cover missing required attribute, invalid dictionary value, invalid dimensions, invalid image URL, duplicate offer ID, moderation failure, authentication failure, and rate limit. Each fixture maps to `code`, `field`, `messageZh`, and `retryable`.

- [ ] **Step 4: Add attribute routes**

Implement list definitions, search dictionary values, save approved mappings, and calculate blockers. Only administrator/reviewer can approve a reusable mapping; operator can select a value for the current draft.

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test -- attribute-mapper error-translator
pnpm --filter @ecommerce/api test:integration -- ozon-attributes
git add packages/core/src/ozon apps/api/src/modules/ozon-attributes
git commit -m "feat: map Ozon attributes and actionable errors"
```

### Task 4: Run regression, blind acceptance, security, and capacity checks

**Files:**
- Create: `tests/e2e/tests/full-product-flow.spec.ts`
- Create: `tests/integration/src/idempotent-publication.test.ts`
- Create: `scripts/check-secrets.mjs`
- Create: `docs/validation/mvp-acceptance-report.md`
- Create: `artifacts/acceptance/task-results.json`
- Create: `artifacts/acceptance/cost-and-duration.csv`

**Interfaces:**
- Consumes: accepted application and development, regression, and blind sample groups.
- Produces: release-gate evidence and a go/no-go result.

- [ ] **Step 1: Add the complete browser flow test**

```ts
import { expect, test } from "@playwright/test";

test("moves one confirmed variant to an internal Ozon draft", async ({ page }) => {
  await page.goto("/tasks/new");
  await page.getByLabel("Amazon 商品链接").fill("https://www.amazon.com/dp/B092LVTSD4");
  await page.getByRole("button", { name: "创建任务" }).click();
  await expect(page.getByText("待确认变体")).toBeVisible();
  await page.getByLabel("颜色、尺寸、图片和参数属于同一变体").check();
  await page.getByRole("button", { name: "确认当前变体" }).click();
  await page.getByRole("link", { name: "人工审核" }).click();
  await expect(page.getByText("阻断项 0")).toBeVisible();
  await page.getByLabel("我确认拥有图片和文案的使用权").check();
  await page.getByLabel("我确认商品与实际发货商品一致").check();
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByText("草稿已保存")).toBeVisible();
});
```

- [ ] **Step 2: Add the duplicate-publication integration test**

Submit the same approved draft twice with the same idempotency key through the service layer. Assert one `PublicationAttempt`, at most one Ozon import call, and one linked offer ID.

- [ ] **Step 3: Add secret scanning**

`scripts/check-secrets.mjs` scans tracked text files for the configured live Client ID/API key values and common credential header dumps. It exits 1 on any match and ignores `.env.example` blank placeholders.

- [ ] **Step 4: Run development and regression samples**

Complete all known failure fixes before blind samples. Do not modify collection selectors, prompts, mapping rules, or image acceptance thresholds after viewing blind expected values unless the blind run is discarded and replaced with new unseen samples.

- [ ] **Step 5: Run at least three blind samples**

For each sample record ASIN/variant correctness, missing/conflict behavior, Russian reviewer result, image fidelity result, Ozon field blockers, final Ozon action/result, duration by step, and cost by provider.

- [ ] **Step 6: Run the complete release gate**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm security:check
```

Expected: all commands exit 0.

- [ ] **Step 7: Write the acceptance report**

The report is `GO` only when all three blind samples reach an explicit Ozon result and none contains cross-variant data, fabricated facts, duplicate offers/SKUs, unapproved subject changes, missing rights confirmation, or secret exposure. Otherwise list each blocking violation and mark `NO-GO`.

- [ ] **Step 8: Commit the release candidate**

```powershell
git add tests scripts docs/validation/mvp-acceptance-report.md artifacts/acceptance
git commit -m "test: verify Amazon to Ozon MVP acceptance"
```
