# Russian Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate versioned Russian Ozon content from confirmed product facts without unsupported claims or Amazon-specific language.

**Architecture:** Build an allowlisted fact input, a provider-neutral structured-text adapter, deterministic output validation, and immutable content versions. Human edits create new versions and remain distinguishable from generated text.

**Tech Stack:** TypeScript, Zod, Vitest, selected structured-output text provider, PostgreSQL/Prisma, NestJS worker jobs.

## Global Constraints

- Only `confirmed_source` and `confirmed_manual` facts enter the generation context.
- Do not include Amazon membership, delivery, promotion, review, or buyer language.
- Output language is Russian and output fields are title, bullets, description, keywords, and image copy.
- Unsupported numeric claims, materials, functions, capacities, and load ratings block approval.
- Every generated and manually saved result creates a new `ContentVersion`.

---

### Task 1: Build a confirmed-fact generation context

**Files:**
- Create: `packages/core/src/content/content-context.ts`
- Test: `packages/core/src/content/content-context.test.ts`

**Interfaces:**
- Consumes: task identity and `ProductFactDto[]`.
- Produces: `ContentContextDto` containing only confirmed, allowlisted facts and source references.

- [ ] **Step 1: Write the failing context test**

```ts
import { expect, test } from "vitest";
import { buildContentContext } from "./content-context.js";

test("excludes suggested and missing facts", () => {
  const context = buildContentContext("B092LVTSD4", [
    { key: "color", value: "Grey", unit: null, status: "confirmed_source", sourceRef: "amazon:color" },
    { key: "load_capacity", value: 300, unit: "lb", status: "suggested", sourceRef: null },
    { key: "material", value: null, unit: null, status: "missing", sourceRef: null },
  ]);
  expect(context.facts.map((fact) => fact.key)).toEqual(["color"]);
});
```

- [ ] **Step 2: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/core test -- content-context
```

Expected: FAIL because `buildContentContext` does not exist.

- [ ] **Step 3: Implement the allowlisted context**

```ts
import type { ContentContextDto, ProductFactDto } from "@ecommerce/contracts";

const allowedKeys = new Set([
  "product_type", "brand", "model", "color", "size", "product_dimensions", "item_weight",
  "material", "frame_material", "surface_finish", "load_capacity", "storage_capacity",
  "folding", "assembly_required", "included_components", "room", "care_instructions",
]);

export function buildContentContext(asin: string, facts: ProductFactDto[]): ContentContextDto {
  return {
    asin,
    facts: facts
      .filter((fact) => allowedKeys.has(fact.key))
      .filter((fact) => fact.status === "confirmed_source" || fact.status === "confirmed_manual")
      .filter((fact): fact is ProductFactDto & { value: string | number | boolean; sourceRef: string } => fact.value !== null && fact.sourceRef !== null)
      .map(({ key, value, unit, sourceRef }) => ({ key, value, unit, sourceRef })),
  };
}
```

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test -- content-context
git add packages/core/src/content
git commit -m "feat: build confirmed product content context"
```

### Task 2: Generate and validate structured Russian content

**Files:**
- Create: `packages/connectors/src/text/text-generator.contract.ts`
- Create: `packages/connectors/src/text/selected-text-generator.ts`
- Create: `docs/validation/russian-content-provider-report.md`
- Create: `packages/core/src/content/generated-content.ts`
- Create: `packages/core/src/content/content-validator.ts`
- Test: `packages/core/src/content/content-validator.test.ts`

**Interfaces:**
- Consumes: `ContentContextDto`.
- Produces: validated `GeneratedContentDto` with cited fact keys for every factual claim group.

- [ ] **Step 1: Define the structured result schema**

```ts
import { z } from "zod";

export const GeneratedContentSchema = z.object({
  titleRu: z.string().min(10).max(200),
  bulletsRu: z.array(z.string().min(5).max(300)).min(3).max(6),
  descriptionRu: z.string().min(50).max(5000),
  keywordsRu: z.array(z.string().min(2).max(80)).max(30),
  imageCopy: z.array(z.object({ heading: z.string().max(80), bullets: z.array(z.string().max(120)).max(4), factKeys: z.array(z.string()).min(1) })).min(1),
  usedFactKeys: z.array(z.string()).min(1),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;
```

- [ ] **Step 2: Write the failing unsupported-fact test**

```ts
import { expect, test } from "vitest";
import { validateGeneratedContent } from "./content-validator.js";

test("rejects output that cites an unavailable fact", () => {
  const output = { titleRu: "Пуф для хранения серого цвета", bulletsRu: ["Практичное хранение", "Складная конструкция", "Для прихожей"], descriptionRu: "Пуф подходит для хранения вещей в прихожей и используется как подставка для ног.", keywordsRu: ["пуф"], imageCopy: [{ heading: "Выдерживает 300 кг", bullets: [], factKeys: ["load_capacity"] }], usedFactKeys: ["color", "load_capacity"] };
  expect(() => validateGeneratedContent(output, new Set(["color"]))).toThrow("UNSUPPORTED_FACT_KEY:load_capacity");
});
```

- [ ] **Step 3: Implement deterministic validation**

```ts
import { GeneratedContentSchema } from "./generated-content.js";

const amazonTerms = [/amazon/i, /prime/i, /доставка amazon/i, /рейтинг покупателей/i, /отзыв/i];

export function validateGeneratedContent(input: unknown, availableFactKeys: Set<string>) {
  const output = GeneratedContentSchema.parse(input);
  for (const key of output.usedFactKeys) if (!availableFactKeys.has(key)) throw new Error(`UNSUPPORTED_FACT_KEY:${key}`);
  for (const item of output.imageCopy) for (const key of item.factKeys) if (!availableFactKeys.has(key)) throw new Error(`UNSUPPORTED_FACT_KEY:${key}`);
  const combined = [output.titleRu, ...output.bulletsRu, output.descriptionRu, ...output.keywordsRu].join(" ");
  if (amazonTerms.some((term) => term.test(combined))) throw new Error("AMAZON_SPECIFIC_LANGUAGE");
  return output;
}
```

- [ ] **Step 4: Define the provider adapter contract**

```ts
import type { ContentContextDto, GeneratedContentDto } from "@ecommerce/contracts";

export interface TextGenerator {
  generate(context: ContentContextDto): Promise<{ content: GeneratedContentDto; provider: string; model: string; durationMs: number; costUsd: number | null }>;
}
```

- [ ] **Step 5: Select the configured structured-output model**

Run two candidate model configurations supplied through environment variables against three development samples. Score each output for schema validity, unsupported fact keys, Amazon-specific language, Russian reviewer approval, duration, and estimated cost. Write all scores and the selected provider/model to `docs/validation/russian-content-provider-report.md`. A candidate is ineligible if any output passes deterministic validation while containing a reviewer-identified fabricated fact.

- [ ] **Step 6: Implement the selected provider adapter**

Implement the provider/model accepted in the report using its structured JSON output feature and `GeneratedContentSchema`. The system instruction must state: use only supplied facts, write natural Russian for Ozon, omit Amazon-specific language, and cite fact keys in `usedFactKeys` and each image-copy item. Read the model name from validated configuration and include provider, model, duration, and cost in every return value.

- [ ] **Step 7: Run validator and adapter contract tests**

```powershell
pnpm --filter @ecommerce/core test -- content-validator
pnpm --filter @ecommerce/connectors test -- text-generator
```

Expected: invalid fixtures fail with exact codes and valid fixtures PASS.

- [ ] **Step 8: Commit the generator boundary**

```powershell
git add packages/core/src/content packages/connectors/src/text docs/validation/russian-content-provider-report.md pnpm-lock.yaml
git commit -m "feat: generate fact-constrained Russian content"
```

### Task 3: Persist generated and manual versions

**Files:**
- Create: `packages/core/src/content/content-service.ts`
- Test: `packages/core/src/content/content-service.test.ts`
- Modify: `apps/worker/src/processors/task.processor.ts`
- Create: `apps/api/src/modules/content/**`

**Interfaces:**
- Consumes: task ID, actor, generated output or reviewed manual edits.
- Produces: immutable sequential `ContentVersion` records and audit events.

- [ ] **Step 1: Write the failing version test**

```ts
import { expect, test, vi } from "vitest";
import { ContentService } from "./content-service.js";

test("creates a new version instead of overwriting", async () => {
  const repo = { latestVersion: vi.fn().mockResolvedValue(2), create: vi.fn().mockResolvedValue({ version: 3 }) };
  const service = new ContentService(repo as never);
  await expect(service.save("task-1", "user-1", "manual", { titleRu: "Новая версия" } as never)).resolves.toMatchObject({ version: 3 });
});
```

- [ ] **Step 2: Implement sequential version creation**

```ts
export class ContentService {
  constructor(private readonly repo: { latestVersion(taskId: string): Promise<number>; create(input: unknown): Promise<unknown> }) {}
  async save(taskId: string, actorId: string, generator: string, content: Record<string, unknown>) {
    const version = (await this.repo.latestVersion(taskId)) + 1;
    return this.repo.create({ taskId, version, createdBy: actorId, generator, ...content });
  }
}
```

- [ ] **Step 3: Wire the background generation step**

`GENERATE_CONTENT` loads confirmed facts, builds `ContentContextDto`, calls `TextGenerator.generate`, validates output, saves a version, writes provider metrics to the job result, and transitions the task to `GENERATING_IMAGES` or `PENDING_REVIEW` according to requested image work.

- [ ] **Step 4: Add content API routes**

Implement list versions, get a version, regenerate, and save manual edit routes. Regeneration requires operator or admin; final content approval remains in the reviewer workflow.

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test -- content
pnpm --filter @ecommerce/worker test
pnpm --filter @ecommerce/api test:integration -- content
git add packages/core apps/worker apps/api
git commit -m "feat: version Russian content generation and edits"
```
