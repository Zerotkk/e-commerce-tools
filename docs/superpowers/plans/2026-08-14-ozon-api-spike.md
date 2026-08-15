# Ozon Seller API Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the live Ozon category, attribute, product import, status, duplicate prevention, and draft behavior required by the MVP.

**Architecture:** Build a typed HTTP adapter with redacted diagnostics and run it against the user's test store. Keep live credentials in environment variables and save only sanitized request and response evidence.

**Tech Stack:** TypeScript, native `fetch`, Zod, Vitest, Ozon Seller API, PostgreSQL-backed publication identity in later integration.

## Global Constraints

- Use one Ozon test store and user-provided `Client-Id` and `Api-Key` environment variables.
- Never log or persist authentication headers.
- Verify current endpoint versions against Ozon's official Seller API documentation and live responses before accepting the spike.
- Use a deterministic `offer_id` and one product only; do not create uncontrolled test catalog entries.
- A network timeout is an unknown outcome, not an automatic failure; query import and offer status before retrying.
- If the Seller API cannot create a true Ozon-side draft, stop and return the contract change: “draft” must be an internal approved draft until explicit submission.

---

### Task 1: Build a redacting Ozon HTTP client

**Files:**
- Create: `spikes/ozon/package.json`
- Create: `spikes/ozon/tsconfig.json`
- Create: `spikes/ozon/vitest.config.ts`
- Create: `spikes/ozon/src/ozon-http.ts`
- Test: `spikes/ozon/src/ozon-http.test.ts`

**Interfaces:**
- Consumes: `OZON_CLIENT_ID`, `OZON_API_KEY`, method path, and JSON body.
- Produces: `OzonHttpClient.post<T>(path, body): Promise<T>` and redacted diagnostic records.

- [ ] **Step 1: Create the spike package configuration**

Create `spikes/ozon/package.json`:

```json
{
  "name": "@ecommerce/ozon-spike",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit",
    "category:find": "tsx src/find-storage-ottoman.ts",
    "product:import": "tsx src/import-product.ts"
  },
  "dependencies": {
    "@ecommerce/contracts": "workspace:*",
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

- [ ] **Step 2: Write the failing redaction test**

```ts
import { describe, expect, it, vi } from "vitest";
import { OzonHttpClient } from "./ozon-http.js";

describe("OzonHttpClient", () => {
  it("never includes credentials in diagnostics", async () => {
    const diagnostics: unknown[] = [];
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: [] }), { status: 200 }));
    const client = new OzonHttpClient({ clientId: "secret-client", apiKey: "secret-key", fetcher, onDiagnostic: (x) => diagnostics.push(x) });
    await client.post("/v1/description-category/tree", { language: "RU" });
    expect(JSON.stringify(diagnostics)).not.toContain("secret-client");
    expect(JSON.stringify(diagnostics)).not.toContain("secret-key");
  });
});
```

- [ ] **Step 3: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/ozon-spike test
```

Expected: FAIL because `OzonHttpClient` does not exist.

- [ ] **Step 4: Implement the client**

```ts
type Fetcher = typeof fetch;

export class OzonHttpClient {
  constructor(private readonly options: {
    clientId: string;
    apiKey: string;
    fetcher?: Fetcher;
    onDiagnostic?: (record: { path: string; status: number; requestBody: unknown; responseBody: unknown }) => void;
  }) {}

  async post<T>(path: string, requestBody: unknown): Promise<T> {
    const fetcher = this.options.fetcher ?? fetch;
    const response = await fetcher(`https://api-seller.ozon.ru${path}`, {
      method: "POST",
      headers: { "Client-Id": this.options.clientId, "Api-Key": this.options.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const responseBody = await response.json();
    this.options.onDiagnostic?.({ path, status: response.status, requestBody, responseBody });
    if (!response.ok) throw Object.assign(new Error("OZON_API_ERROR"), { status: response.status, responseBody });
    return responseBody as T;
  }
}
```

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm --filter @ecommerce/ozon-spike test
git add spikes/ozon pnpm-lock.yaml
git commit -m "spike: add redacting Ozon API client"
```

### Task 2: Verify description category and required attributes

**Files:**
- Create: `spikes/ozon/src/category-api.ts`
- Create: `spikes/ozon/src/category-api.test.ts`
- Create: `spikes/ozon/src/find-storage-ottoman.ts`
- Create: `artifacts/spikes/ozon/redacted-responses/category-tree.json`
- Create: `artifacts/spikes/ozon/redacted-responses/category-attributes.json`

**Interfaces:**
- Consumes: live Ozon category tree and a selected storage-ottoman description category/type.
- Produces: `OzonAttributeDefinitionDto[]` with required flags, dictionary IDs, collection flags, and value types.

- [ ] **Step 1: Write the failing response-mapping test**

```ts
import { expect, test } from "vitest";
import { mapAttributeDefinitions } from "./category-api.js";

test("keeps required and dictionary metadata", () => {
  const result = mapAttributeDefinitions({ result: [{ id: 10, name: "Материал", is_required: true, dictionary_id: 20, is_collection: true, type: "String" }] });
  expect(result).toEqual([{ id: 10, name: "Материал", required: true, dictionaryId: 20, collection: true, valueType: "String" }]);
});
```

- [ ] **Step 2: Implement the typed mapping**

```ts
import type { OzonAttributeDefinitionDto } from "@ecommerce/contracts";

export function mapAttributeDefinitions(input: { result: Array<{ id: number; name: string; is_required: boolean; dictionary_id: number; is_collection: boolean; type: string }> }): OzonAttributeDefinitionDto[] {
  return input.result.map((item) => ({
    id: item.id,
    name: item.name,
    required: item.is_required,
    dictionaryId: item.dictionary_id,
    collection: item.is_collection,
    valueType: item.type,
  }));
}
```

- [ ] **Step 3: Run mapping tests**

```powershell
pnpm --filter @ecommerce/ozon-spike test
```

Expected: PASS.

- [ ] **Step 4: Query live category methods**

Use the current official method names. Start with the currently documented description-category family:

```text
POST /v1/description-category/tree
POST /v1/description-category/attribute
POST /v1/description-category/attribute/values
```

Run:

```powershell
pnpm --filter @ecommerce/ozon-spike category:find -- --query "пуф с ящиком для хранения"
```

Expected: one reviewed `description_category_id` and `type_id`, plus redacted category and attribute response files. If Ozon reports a newer endpoint, update only endpoint constants, rerun the contract tests, and record the replacement in the report.

- [ ] **Step 5: Commit category evidence**

```powershell
git add spikes/ozon artifacts/spikes/ozon/redacted-responses/category-*.json
git commit -m "spike: verify Ozon storage ottoman attributes"
```

### Task 3: Verify product import, status, and offer lookup

**Files:**
- Create: `spikes/ozon/src/product-api.ts`
- Test: `spikes/ozon/src/product-api.test.ts`
- Create: `spikes/ozon/fixtures/minimal-product.json`
- Create: `artifacts/spikes/ozon/redacted-responses/import.json`
- Create: `artifacts/spikes/ozon/redacted-responses/import-status.json`
- Create: `artifacts/spikes/ozon/redacted-responses/product-info.json`

**Interfaces:**
- Consumes: selected category/type, required attributes, public test image URLs, price, dimensions, weight, and deterministic offer ID.
- Produces: `taskId`, import status, validation errors, Ozon product ID, and SKU when assigned.

- [ ] **Step 1: Write the failing import response test**

```ts
import { expect, test } from "vitest";
import { parseImportResponse } from "./product-api.js";

test("extracts the asynchronous import task id", () => {
  expect(parseImportResponse({ result: { task_id: 12345 } })).toEqual({ taskId: 12345 });
});
```

- [ ] **Step 2: Implement typed product methods**

```ts
import type { OzonHttpClient } from "./ozon-http.js";

export const parseImportResponse = (input: { result: { task_id: number } }) => ({ taskId: input.result.task_id });

export class OzonProductApi {
  constructor(private readonly http: OzonHttpClient) {}
  async importProduct(item: unknown) {
    return parseImportResponse(await this.http.post<{ result: { task_id: number } }>("/v3/product/import", { items: [item] }));
  }
  async getImportStatus(taskId: number) {
    return this.http.post<unknown>("/v1/product/import/info", { task_id: taskId });
  }
  async getByOfferId(offerId: string) {
    return this.http.post<unknown>("/v3/product/info/list", { offer_id: [offerId], product_id: [], sku: [] });
  }
}
```

- [ ] **Step 3: Run unit tests**

```powershell
pnpm --filter @ecommerce/ozon-spike test
```

Expected: PASS.

- [ ] **Step 4: Submit one controlled live product**

Use offer ID `E2E-OTTOMAN-<YYYYMMDD>-01`. Before import, query that exact offer ID. After import, poll the returned task ID until terminal status, then query the offer ID again.

```powershell
pnpm --filter @ecommerce/ozon-spike product:import -- --fixture spikes/ozon/fixtures/minimal-product.json
```

Expected: redacted request/response evidence and exactly one offer with the deterministic ID.

- [ ] **Step 5: Submit an intentionally invalid payload**

Remove one required attribute from a copy held only in memory, import it, and record whether the asynchronous status identifies the missing attribute ID and message.

Expected: a terminal validation failure that can be mapped to a specific field.

- [ ] **Step 6: Commit product API evidence**

```powershell
git add spikes/ozon artifacts/spikes/ozon/redacted-responses
git commit -m "spike: verify Ozon product import lifecycle"
```

### Task 4: Test duplicate and timeout recovery behavior

**Files:**
- Create: `spikes/ozon/src/import-safely.ts`
- Test: `spikes/ozon/src/import-safely.test.ts`

**Interfaces:**
- Consumes: deterministic offer ID, local publication attempt state, and `OzonProductApi`.
- Produces: one of `already_exists`, `submitted`, `confirmed_after_timeout`, or `failed`.

- [ ] **Step 1: Write the failing timeout test**

```ts
import { expect, test, vi } from "vitest";
import { importSafely } from "./import-safely.js";

test("queries the offer after an unknown import outcome", async () => {
  const api = { importProduct: vi.fn().mockRejectedValue(new DOMException("timeout", "AbortError")), getByOfferId: vi.fn().mockResolvedValue({ result: { items: [{ offer_id: "E2E-01" }] } }) };
  await expect(importSafely(api, "E2E-01", {})).resolves.toEqual({ state: "confirmed_after_timeout" });
  expect(api.getByOfferId).toHaveBeenCalledWith("E2E-01");
});
```

- [ ] **Step 2: Implement safe import behavior**

```ts
export async function importSafely(api: { importProduct(item: unknown): Promise<unknown>; getByOfferId(offerId: string): Promise<any> }, offerId: string, item: unknown) {
  const existing = await api.getByOfferId(offerId);
  if (existing?.result?.items?.length) return { state: "already_exists" as const };
  try {
    await api.importProduct(item);
    return { state: "submitted" as const };
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "AbortError") throw error;
    const afterTimeout = await api.getByOfferId(offerId);
    return afterTimeout?.result?.items?.length ? { state: "confirmed_after_timeout" as const } : { state: "failed" as const };
  }
}
```

- [ ] **Step 3: Run tests and repeat the live deterministic import**

```powershell
pnpm --filter @ecommerce/ozon-spike test
pnpm --filter @ecommerce/ozon-spike product:import -- --fixture spikes/ozon/fixtures/minimal-product.json
```

Expected: unit tests PASS and the second live run reports `already_exists`; no second offer is created.

- [ ] **Step 4: Commit duplicate prevention behavior**

```powershell
git add spikes/ozon
git commit -m "spike: prove Ozon duplicate prevention behavior"
```

### Task 5: Publish the accepted gateway contract and report

**Files:**
- Create: `packages/connectors/src/ozon/ozon.contract.ts`
- Create: `docs/validation/ozon-api-report.md`

**Interfaces:**
- Consumes: accepted live endpoint behavior.
- Produces: `OzonGateway` interface and a decision on Ozon-side versus internal drafts.

- [ ] **Step 1: Define the gateway contract**

```ts
import type { OzonAttributeDefinitionDto, OzonImportRequestDto, OzonImportStatusDto } from "@ecommerce/contracts";

export interface OzonGateway {
  getRequiredAttributes(descriptionCategoryId: number, typeId: number): Promise<OzonAttributeDefinitionDto[]>;
  findByOfferId(offerId: string): Promise<{ productId: string; sku: string | null } | null>;
  importProduct(request: OzonImportRequestDto): Promise<{ taskId: number }>;
  getImportStatus(taskId: number): Promise<OzonImportStatusDto>;
}
```

Use the shared `OzonImportRequestDto` and `OzonImportStatusDto` from `@ecommerce/contracts`; do not create connector-local copies.

- [ ] **Step 2: Write the validation report**

Record the exact official endpoint versions tested, UTC test time, category/type IDs, required attributes, dictionary behavior, import lifecycle, invalid-field response, duplicate test, timeout recovery, rate limits observed, and redaction rules.

The report must explicitly answer: “Can Seller API save an Ozon-side draft without starting product creation/moderation?” If no, specify that the MVP “Save draft” action stores an internal approved `OzonDraft`, and only “Submit” invokes Seller API.

- [ ] **Step 3: Commit the accepted decision**

```powershell
git add packages/connectors/src/ozon/ozon.contract.ts docs/validation/ozon-api-report.md
git commit -m "spike: accept Ozon gateway contract"
```
