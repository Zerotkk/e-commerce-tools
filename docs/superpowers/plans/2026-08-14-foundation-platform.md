# Foundation Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible TypeScript workspace, local infrastructure, shared contracts, and passing quality gates for all later MVP plans.

**Architecture:** Use a pnpm monorepo with separate web, API, worker, contract, database, connector, and core workspaces. Pin dependencies through the committed lockfile and keep external services behind shared contracts.

**Tech Stack:** pnpm, TypeScript, Next.js, NestJS, Vitest, PostgreSQL, Redis, MinIO, Docker Compose.

## Global Constraints

- Source platform is Amazon US; first category is storage ottomans.
- Daily baseline is 10–30 tasks; no distributed microservice platform is needed.
- One Ozon store, three internal roles, and no secret values in source control.
- All later plans import DTOs from `@ecommerce/contracts`; they must not duplicate them.
- Commit the generated `pnpm-lock.yaml` and do not change dependency versions inside later plans.

---

### Task 1: Initialize the repository and workspace

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`

**Interfaces:**
- Consumes: approved design and an empty non-Git workspace.
- Produces: root commands `lint`, `typecheck`, `test`, `test:integration`, and `test:e2e` used by every later plan.

- [ ] **Step 1: Initialize Git and write the root manifest**

Run:

```powershell
git init
pnpm init
```

Replace `package.json` with:

```json
{
  "name": "e-commerce-tools",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "test:integration": "pnpm -r --if-present test:integration",
    "test:e2e": "pnpm --filter @ecommerce/e2e test",
    "security:check": "pnpm audit --prod --audit-level high",
    "db:migrate:test": "pnpm --filter @ecommerce/database migrate:test"
  },
  "devDependencies": {
    "@types/node": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Define workspace and TypeScript settings**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
  - tests/*
  - spikes/*
catalog:
  typescript: latest
  vitest: latest
  zod: latest
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

Create `vitest.workspace.ts`:

```ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace(["apps/*/vitest.config.ts", "packages/*/vitest.config.ts", "tests/*/vitest.config.ts"]);
```

- [ ] **Step 3: Protect secrets and generated files**

Create `.gitignore`:

```gitignore
node_modules/
.next/
dist/
coverage/
.env
.env.*
!.env.example
artifacts/private/
.superpowers/
playwright-report/
test-results/
```

Create `.env.example`:

```dotenv
DATABASE_URL=postgresql://ecommerce:ecommerce@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=ecommerce-assets
S3_ACCESS_KEY=ecommerce
S3_SECRET_KEY=change-me
APP_ENCRYPTION_KEY_BASE64=replace-with-32-byte-base64-key
OZON_CLIENT_ID=
OZON_API_KEY=
TEXT_PROVIDER=
TEXT_MODEL=
TEXT_API_KEY=
IMAGE_EXTRACTION_PROVIDER=
IMAGE_EXTRACTION_API_KEY=
IMAGE_BACKGROUND_PROVIDER=
IMAGE_BACKGROUND_API_KEY=
```

- [ ] **Step 4: Install and verify the root toolchain**

Run:

```powershell
pnpm install
pnpm exec tsc --version
pnpm exec vitest --version
```

Expected: both tools print stable versions and `pnpm-lock.yaml` exists.

- [ ] **Step 5: Commit the workspace shell**

```powershell
git add .gitignore .env.example package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json vitest.workspace.ts
git commit -m "chore: initialize TypeScript workspace"
```

### Task 2: Define shared contracts with tests

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/vitest.config.ts`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/product.ts`
- Create: `packages/contracts/src/content.ts`
- Create: `packages/contracts/src/ozon.ts`
- Test: `packages/contracts/src/product.test.ts`

**Interfaces:**
- Consumes: root TypeScript and Vitest configuration.
- Produces: `FactStatus`, `ProductFactDto`, `VariantSnapshotDto`, `JobResult<T>`, and `TaskStatus` from `@ecommerce/contracts`.

- [ ] **Step 1: Write the failing contract test**

Create `packages/contracts/src/product.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isPublishableFact, type ProductFactDto } from "./product.js";

describe("isPublishableFact", () => {
  it.each(["confirmed_source", "confirmed_manual"] as const)("accepts %s", (status) => {
    const fact: ProductFactDto = { key: "color", value: "grey", unit: null, status, sourceRef: "amazon:A1" };
    expect(isPublishableFact(fact)).toBe(true);
  });

  it.each(["suggested", "missing", "conflict"] as const)("rejects %s", (status) => {
    const fact: ProductFactDto = { key: "weight", value: null, unit: "kg", status, sourceRef: null };
    expect(isPublishableFact(fact)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run:

```powershell
pnpm exec vitest run packages/contracts/src/product.test.ts
```

Expected: FAIL because `product.ts` and `isPublishableFact` do not exist.

- [ ] **Step 3: Implement the contracts**

Create `packages/contracts/src/product.ts`:

```ts
export type FactStatus = "confirmed_source" | "confirmed_manual" | "suggested" | "missing" | "conflict";

export type TaskStatus =
  | "pending_collection"
  | "collecting"
  | "pending_variant_confirmation"
  | "processing_content"
  | "generating_images"
  | "pending_review"
  | "pending_publish"
  | "publishing"
  | "published"
  | "publish_failed"
  | "abandoned";

export interface ProductFactDto {
  key: string;
  value: string | number | boolean | null;
  unit: string | null;
  status: FactStatus;
  sourceRef: string | null;
}

export interface VariantSnapshotDto {
  asin: string;
  color: string | null;
  size: string | null;
  imageUrls: string[];
  facts: ProductFactDto[];
}

export interface JobResult<T> {
  ok: boolean;
  value?: T;
  errorCode?: string;
  retryable?: boolean;
}

export const isPublishableFact = (fact: ProductFactDto): boolean =>
  fact.status === "confirmed_source" || fact.status === "confirmed_manual";
```

Create `packages/contracts/src/index.ts`:

```ts
export * from "./product.js";
export * from "./content.js";
export * from "./ozon.js";
```

Create `packages/contracts/src/content.ts`:

```ts
export interface ContentFactDto {
  key: string;
  value: string | number | boolean;
  unit: string | null;
  sourceRef: string;
}

export interface ContentContextDto {
  asin: string;
  facts: ContentFactDto[];
}

export interface ImageCopyDto {
  heading: string;
  bullets: string[];
  factKeys: string[];
}

export interface GeneratedContentDto {
  titleRu: string;
  bulletsRu: string[];
  descriptionRu: string;
  keywordsRu: string[];
  imageCopy: ImageCopyDto[];
  usedFactKeys: string[];
}
```

Create `packages/contracts/src/ozon.ts`:

```ts
export interface OzonAttributeDefinitionDto {
  id: number;
  name: string;
  required: boolean;
  dictionaryId: number;
  collection: boolean;
  valueType: string;
}

export interface OzonFieldErrorDto {
  code: string;
  field: string;
  message: string;
  retryable: boolean;
}

export interface OzonImportRequestDto {
  offerId: string;
  name: string;
  descriptionCategoryId: number;
  typeId: number;
  price: string;
  inventory: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  weightGrams: number;
  imageUrls: string[];
  attributes: Array<{ id: number; values: Array<{ dictionaryValueId?: number; value?: string }> }>;
}

export type OzonImportStatusDto =
  | { state: "pending" }
  | { state: "succeeded"; productId: string; sku: string | null }
  | { state: "failed"; errors: OzonFieldErrorDto[] };
```

Create `packages/contracts/package.json`:

```json
{
  "name": "@ecommerce/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

Create `packages/contracts/tsconfig.json`:

```json
{ "extends": "../../tsconfig.base.json", "include": ["src/**/*.ts"] }
```

Create `packages/contracts/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node" } });
```

- [ ] **Step 4: Run tests and type checking**

```powershell
pnpm --filter @ecommerce/contracts test
pnpm --filter @ecommerce/contracts typecheck
```

Expected: both commands PASS.

- [ ] **Step 5: Commit contracts**

```powershell
git add packages/contracts
git commit -m "feat: define shared product contracts"
```

### Task 3: Add local infrastructure and validated configuration

**Files:**
- Create: `compose.yaml`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/vitest.config.ts`
- Create: `packages/config/src/env.ts`
- Test: `packages/config/src/env.test.ts`

**Interfaces:**
- Consumes: `.env.example` names.
- Produces: `loadAppEnv(input: NodeJS.ProcessEnv): AppEnv` and local PostgreSQL, Redis, and MinIO services.

- [ ] **Step 1: Write the failing environment test**

Create `packages/config/src/env.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadAppEnv } from "./env.js";

describe("loadAppEnv", () => {
  it("rejects an encryption key that is not 32 bytes", () => {
    expect(() => loadAppEnv({ DATABASE_URL: "postgresql://x", REDIS_URL: "redis://x", APP_ENCRYPTION_KEY_BASE64: "bad" })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

```powershell
pnpm exec vitest run packages/config/src/env.test.ts
```

Expected: FAIL because the package and loader do not exist.

- [ ] **Step 3: Implement configuration validation**

Create `packages/config/src/env.ts`:

```ts
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  APP_ENCRYPTION_KEY_BASE64: z.string().refine((value) => Buffer.from(value, "base64").length === 32),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().default("ecommerce-assets"),
  S3_ACCESS_KEY: z.string().min(1).default("ecommerce"),
  S3_SECRET_KEY: z.string().min(8),
});

export type AppEnv = z.infer<typeof schema>;
export const loadAppEnv = (input: NodeJS.ProcessEnv): AppEnv => schema.parse(input);
```

Create `packages/config/package.json`:

```json
{
  "name": "@ecommerce/config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/env.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": { "typescript": "catalog:", "vitest": "catalog:" }
}
```

Create `packages/config/tsconfig.json` as `{ "extends": "../../tsconfig.base.json", "include": ["src/**/*.ts"] }` and a Node-environment `vitest.config.ts` matching the contracts package.

- [ ] **Step 4: Define local services**

Create `compose.yaml`:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: ecommerce
      POSTGRES_PASSWORD: ecommerce
      POSTGRES_DB: ecommerce
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecommerce"]
      interval: 3s
      timeout: 3s
      retries: 20
  redis:
    image: redis:8-alpine
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 3s
      timeout: 3s
      retries: 20
  minio:
    image: minio/minio:latest
    command: server /data --console-address :9001
    environment:
      MINIO_ROOT_USER: ecommerce
      MINIO_ROOT_PASSWORD: change-me-now
    ports: ["9000:9000", "9001:9001"]
```

- [ ] **Step 5: Verify configuration and service health**

```powershell
pnpm install
pnpm --filter @ecommerce/config test
docker compose config --quiet
docker compose up -d
docker compose ps
```

Expected: the test passes and all three containers report healthy or running.

- [ ] **Step 6: Commit local infrastructure**

```powershell
git add compose.yaml packages/config pnpm-lock.yaml
git commit -m "chore: add validated local infrastructure"
```

### Task 4: Scaffold API, worker, web, and end-to-end workspaces

**Files:**
- Create: `apps/api/**`
- Create: `apps/worker/**`
- Create: `apps/web/**`
- Create: `packages/core/**`
- Create: `packages/connectors/**`
- Create: `packages/database/**`
- Create: `tests/e2e/**`

**Interfaces:**
- Consumes: root scripts, configuration package, and contracts package.
- Produces: `/health` API route, worker startup check, web health page, and Playwright smoke test.

- [ ] **Step 1: Scaffold the applications**

Use stable generators, then remove generated example controllers and tests:

```powershell
pnpm dlx @nestjs/cli@latest new apps/api --package-manager pnpm --skip-git
pnpm dlx @nestjs/cli@latest new apps/worker --package-manager pnpm --skip-git
pnpm dlx create-next-app@latest apps/web --ts --eslint --app --src-dir --no-tailwind --use-pnpm
```

Rename package manifests to `@ecommerce/api`, `@ecommerce/worker`, and `@ecommerce/web`. Add Vitest scripts to API and worker, Testing Library/Vitest to web, and `supertest` plus its types to API development dependencies.

Create focused workspace shells for `packages/core`, `packages/connectors`, and `packages/database`. Core and connectors use this manifest shape, with their respective package name:

```json
{
  "name": "@ecommerce/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "dependencies": { "@ecommerce/contracts": "workspace:*" },
  "devDependencies": { "typescript": "catalog:", "vitest": "catalog:" }
}
```

Create `packages/connectors/package.json` explicitly:

```json
{
  "name": "@ecommerce/connectors",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts",
  "scripts": { "test": "vitest run", "typecheck": "tsc --noEmit", "lint": "tsc --noEmit", "build": "tsc --noEmit" },
  "dependencies": { "@ecommerce/contracts": "workspace:*" },
  "devDependencies": { "typescript": "catalog:", "vitest": "catalog:" }
}
```

Create `packages/database/package.json` explicitly:

```json
{
  "name": "@ecommerce/database",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/client.ts",
  "scripts": {
    "test": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "tsc --noEmit"
  },
  "devDependencies": { "typescript": "catalog:", "vitest": "catalog:" }
}
```

Add Prisma dependencies during the core-domain plan. Create `src/index.ts`, `tsconfig.json`, and Node-environment Vitest configuration in each package.

Create `tests/e2e/package.json`:

```json
{
  "name": "@ecommerce/e2e",
  "version": "0.0.0",
  "private": true,
  "scripts": { "test": "playwright test", "lint": "tsc --noEmit", "typecheck": "tsc --noEmit", "build": "tsc --noEmit" },
  "devDependencies": { "@playwright/test": "latest", "typescript": "catalog:" }
}
```

- [ ] **Step 2: Write the failing API smoke test**

Create `apps/api/src/health.e2e-spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "./main.js";

describe("GET /health", () => {
  it("returns ok", async () => {
    const app = await buildApp();
    await app.init();
    const response = await request(app.getHttpServer()).get("/health").expect(200);
    expect(response.body).toEqual({ status: "ok" });
    await app.close();
  });
});
```

- [ ] **Step 3: Run the smoke test and confirm failure**

```powershell
pnpm --filter @ecommerce/api test
```

Expected: FAIL because `buildApp` does not exist.

- [ ] **Step 4: Implement the health route and worker entry point**

Implement `apps/api/src/main.ts` so `buildApp()` creates a Nest application and registers `GET /health` returning `{ status: "ok" }`. Export `buildApp()` for tests and start listening only when the module is the process entry point. Implement the worker entry point to start a Nest application context without an HTTP listener.

- [ ] **Step 5: Add the web and browser smoke test**

Create `tests/e2e/tests/health.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("shows the internal product task app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "E-commerce Tools" })).toBeVisible();
});
```

Configure `tests/e2e/playwright.config.ts` with `baseURL: "http://localhost:3000"` and a web server command `pnpm --filter @ecommerce/web dev`.

- [ ] **Step 6: Run all foundation gates**

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Expected: all commands PASS.

- [ ] **Step 7: Commit the foundation**

```powershell
git add apps tests package.json pnpm-lock.yaml
git commit -m "chore: establish MVP platform foundation"
```
