# Core Domain and Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the persistent business model, roles, encrypted Ozon connection, product task state machine, fact provenance, versions, audit, and background job records.

**Architecture:** Keep domain rules in `packages/core` and persistence in `packages/database`. API controllers translate HTTP requests into domain commands; they never manipulate Prisma directly.

**Tech Stack:** TypeScript, NestJS, PostgreSQL, Prisma, Vitest, Argon2, AES-256-GCM.

## Global Constraints

- One Ozon store connection; multiple internal users with administrator, operator, and reviewer roles.
- Only `confirmed_source` and `confirmed_manual` facts may enter an Ozon payload.
- Task transitions follow the approved state machine and cannot skip variant confirmation or review.
- Credentials are encrypted at rest and absent from API responses and ordinary logs.
- Every meaningful mutation writes an audit event in the same database transaction.

---

### Task 1: Create the persistent domain schema

**Files:**
- Modify: `packages/database/package.json`
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/src/client.ts`
- Create: `packages/database/src/test-database.ts`
- Test: `packages/database/src/schema.integration.test.ts`

**Interfaces:**
- Consumes: PostgreSQL `DATABASE_URL`.
- Produces: `prisma` client and transactional storage for all approved entities.

- [ ] **Step 0: Add Prisma to the database workspace**

```powershell
pnpm --filter @ecommerce/database add @prisma/client
pnpm --filter @ecommerce/database add -D prisma
```

Expected: the database manifest and lockfile contain the pinned Prisma client and CLI versions.

- [ ] **Step 1: Write the failing empty-database integration test**

```ts
import { afterAll, beforeAll, expect, test } from "vitest";
import { createTestDatabase } from "./test-database.js";

const db = createTestDatabase();
beforeAll(() => db.reset());
afterAll(() => db.close());

test("persists a product task and sourced fact", async () => {
  const user = await db.prisma.user.create({ data: { email: "operator@example.test", passwordHash: "hash", role: "OPERATOR" } });
  const task = await db.prisma.productTask.create({ data: { amazonUrl: "https://www.amazon.com/dp/B092LVTSD4", asin: "B092LVTSD4", status: "PENDING_COLLECTION", createdById: user.id } });
  const fact = await db.prisma.productFact.create({ data: { taskId: task.id, key: "color", stringValue: "Grey", status: "CONFIRMED_SOURCE", sourceRef: "amazon:B092LVTSD4:selectedColor" } });
  expect(fact.taskId).toBe(task.id);
});
```

- [ ] **Step 2: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/database test:integration
```

Expected: FAIL because the schema and generated client do not exist.

- [ ] **Step 3: Define enums and identity models**

Add to `schema.prisma`:

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql" url = env("DATABASE_URL") }

enum UserRole { ADMIN OPERATOR REVIEWER }
enum TaskStatus { PENDING_COLLECTION COLLECTING PENDING_VARIANT_CONFIRMATION PROCESSING_CONTENT GENERATING_IMAGES PENDING_REVIEW PENDING_PUBLISH PUBLISHING PUBLISHED PUBLISH_FAILED ABANDONED }
enum FactStatus { CONFIRMED_SOURCE CONFIRMED_MANUAL SUGGESTED MISSING CONFLICT }
enum JobStatus { QUEUED RUNNING SUCCEEDED FAILED CANCELLED }
enum ReviewOutcome { APPROVED RETURN_CONTENT RETURN_IMAGES ABANDONED }
enum PublicationAction { SAVE_INTERNAL_DRAFT SUBMIT }
enum PublicationStatus { CREATED SUBMITTED PENDING SUCCEEDED FAILED UNKNOWN }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         UserRole
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  tasksCreated ProductTask[] @relation("TasksCreated")
  tasksAssigned ProductTask[] @relation("TasksAssigned")
  auditEvents  AuditEvent[]
  sessions     Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@index([userId, expiresAt])
}

model StoreConnection {
  id                  String   @id @default(cuid())
  displayName         String
  clientIdCiphertext  Bytes
  apiKeyCiphertext    Bytes
  encryptionIv        Bytes
  encryptionAuthTag   Bytes
  active              Boolean  @default(true)
  connectionStatus    String   @default("UNTESTED")
  lastCheckedAt       DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  drafts              OzonDraft[]
}
```

- [ ] **Step 4: Define task, fact, asset, review, and publication models**

Add the complete models below:

```prisma
model ProductTask {
  id              String      @id @default(cuid())
  amazonUrl       String
  asin            String
  status          TaskStatus  @default(PENDING_COLLECTION)
  assignedToId    String?
  assignedTo      User?       @relation("TasksAssigned", fields: [assignedToId], references: [id])
  createdById     String
  createdBy       User        @relation("TasksCreated", fields: [createdById], references: [id])
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  snapshots       SourceSnapshot[]
  variants        ProductVariant[]
  facts           ProductFact[]
  contentVersions ContentVersion[]
  imageAssets     ImageAsset[]
  imageProposals  ImageProposal[]
  drafts          OzonDraft[]
  reviews         ReviewDecision[]
  jobs            BackgroundJob[]
  auditEvents     AuditEvent[]
  @@index([status, updatedAt])
  @@index([asin])
}

model SourceSnapshot {
  id          String   @id @default(cuid())
  taskId      String
  task        ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  sourceUrl   String
  payload     Json
  collector   String
  collectedAt DateTime
  createdAt   DateTime @default(now())
}

model ProductVariant {
  id          String   @id @default(cuid())
  taskId      String
  task        ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  asin        String
  color       String?
  size        String?
  imageUrls   Json
  selected    Boolean  @default(false)
  confirmedAt DateTime?
  confirmedBy String?
  @@unique([taskId, asin])
}

model ProductFact {
  id           String     @id @default(cuid())
  taskId       String
  task         ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  key          String
  stringValue  String?
  numberValue  Decimal?
  booleanValue Boolean?
  unit         String?
  status       FactStatus
  sourceRef    String?
  confirmedBy  String?
  confirmedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  @@unique([taskId, key])
}

model ContentVersion {
  id          String   @id @default(cuid())
  taskId      String
  task        ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  version     Int
  titleRu     String
  bulletsRu   Json
  descriptionRu String
  keywordsRu  Json
  factKeys    Json
  generator   String
  createdBy   String
  createdAt   DateTime @default(now())
  @@unique([taskId, version])
}

model ImageAsset {
  id          String   @id @default(cuid())
  taskId      String
  task        ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  kind        String
  objectKey   String
  sha256      String
  sourceRef   String?
  width       Int
  height      Int
  createdAt   DateTime @default(now())
  proposals   ImageProposal[]
  @@unique([sha256, kind])
}

model ImageProposal {
  id                    String   @id @default(cuid())
  taskId                String
  task                  ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  outputAssetId         String
  outputAsset           ImageAsset @relation(fields: [outputAssetId], references: [id])
  style                 String
  subjectHash           String
  automatedChecksPassed Boolean
  reviewDecision        String?
  reviewedBy            String?
  reviewedAt            DateTime?
  createdAt             DateTime @default(now())
}

model OzonDraft {
  id                    String   @id @default(cuid())
  taskId                String
  task                  ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  storeConnectionId     String
  storeConnection       StoreConnection @relation(fields: [storeConnectionId], references: [id])
  offerId               String   @unique
  descriptionCategoryId BigInt
  typeId                BigInt
  payload               Json
  validationErrors      Json
  approvedAt            DateTime?
  approvedBy            String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  attempts              PublicationAttempt[]
}

model ReviewDecision {
  id          String   @id @default(cuid())
  taskId      String
  task        ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  reviewerId  String
  outcome     ReviewOutcome
  checklist   Json
  reason      String?
  createdAt   DateTime @default(now())
}

model PublicationAttempt {
  id             String   @id @default(cuid())
  draftId        String
  draft          OzonDraft @relation(fields: [draftId], references: [id], onDelete: Cascade)
  action         PublicationAction
  idempotencyKey String   @unique
  payloadHash    String
  status         PublicationStatus
  ozonTaskId     String?
  ozonProductId  String?
  ozonSku        String?
  response       Json?
  fieldErrors    Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model BackgroundJob {
  id            String   @id @default(cuid())
  taskId        String
  task          ProductTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  step          String
  idempotencyKey String  @unique
  status        JobStatus
  attempts      Int      @default(0)
  errorCode     String?
  errorDetail   Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model AuditEvent {
  id          String   @id @default(cuid())
  taskId      String?
  task        ProductTask? @relation(fields: [taskId], references: [id], onDelete: SetNull)
  actorId     String
  actor       User     @relation(fields: [actorId], references: [id])
  action      String
  entityType  String
  entityId    String
  before      Json?
  after       Json?
  createdAt   DateTime @default(now())
  @@index([entityType, entityId, createdAt])
}
```

- [ ] **Step 5: Generate, migrate, and run integration tests**

```powershell
pnpm --filter @ecommerce/database prisma generate
pnpm --filter @ecommerce/database prisma migrate dev --name initial_domain
pnpm --filter @ecommerce/database test:integration
```

Expected: migration applies and test PASS.

- [ ] **Step 6: Commit the schema**

```powershell
git add packages/database pnpm-lock.yaml
git commit -m "feat: add persistent MVP domain schema"
```

### Task 2: Implement authentication, roles, and encrypted store credentials

**Files:**
- Create: `packages/core/src/auth/password.ts`
- Create: `packages/core/src/auth/authorize.ts`
- Create: `packages/core/src/stores/credential-cipher.ts`
- Test: `packages/core/src/auth/authorize.test.ts`
- Test: `packages/core/src/stores/credential-cipher.test.ts`
- Create: `apps/api/src/modules/auth/**`
- Create: `apps/api/src/modules/stores/**`

**Interfaces:**
- Consumes: `APP_ENCRYPTION_KEY_BASE64`, user role, Ozon Client ID, and API key.
- Produces: authenticated session, `requireRole(user, roles)`, and `CredentialCipher.encrypt/decrypt`.

- [ ] **Step 1: Write failing authorization and encryption tests**

```ts
import { expect, test } from "vitest";
import { requireRole } from "./authorize.js";

test("blocks operators from approving publication", () => {
  expect(() => requireRole({ role: "OPERATOR" }, ["REVIEWER", "ADMIN"])).toThrow("FORBIDDEN");
});
```

```ts
import { expect, test } from "vitest";
import { CredentialCipher } from "./credential-cipher.js";

test("round trips credentials without storing plaintext", () => {
  const cipher = new CredentialCipher(Buffer.alloc(32, 7));
  const encrypted = cipher.encrypt("ozon-secret");
  expect(Buffer.concat([encrypted.ciphertext, encrypted.iv, encrypted.authTag]).toString()).not.toContain("ozon-secret");
  expect(cipher.decrypt(encrypted)).toBe("ozon-secret");
});
```

- [ ] **Step 2: Run tests and confirm failure**

```powershell
pnpm --filter @ecommerce/core test
```

Expected: FAIL because authorization and cipher functions do not exist.

- [ ] **Step 3: Implement role enforcement**

```ts
export type InternalRole = "ADMIN" | "OPERATOR" | "REVIEWER";

export function requireRole(user: { role: InternalRole }, allowed: InternalRole[]): void {
  if (!allowed.includes(user.role)) throw new Error("FORBIDDEN");
}
```

- [ ] **Step 4: Implement AES-256-GCM credential encryption**

```ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export class CredentialCipher {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new Error("INVALID_ENCRYPTION_KEY");
  }
  encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return { ciphertext, iv, authTag: cipher.getAuthTag() };
  }
  decrypt(value: { ciphertext: Buffer; iv: Buffer; authTag: Buffer }) {
    const decipher = createDecipheriv("aes-256-gcm", this.key, value.iv);
    decipher.setAuthTag(value.authTag);
    return Buffer.concat([decipher.update(value.ciphertext), decipher.final()]).toString("utf8");
  }
}
```

- [ ] **Step 5: Add API routes and response redaction**

Add `argon2` to `@ecommerce/core` and implement password functions:

```ts
import argon2 from "argon2";

export const hashPassword = (password: string) => argon2.hash(password, { type: argon2.argon2id });
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);
```

Create opaque sessions with `randomBytes(32)`, store only the SHA-256 token hash in `Session`, set the raw token in an HttpOnly, Secure-in-production, SameSite=Lax cookie, and delete the session row on logout.

Then add API routes and response redaction:

Implement session login/logout, current user, user management, and store connection create/test routes. Store routes may accept secrets but responses contain only `id`, `displayName`, `active`, and `connectionStatus`. Apply reviewer/admin guards to publication approval and admin guards to user/store management.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test
pnpm --filter @ecommerce/api test:integration
git add packages/core apps/api pnpm-lock.yaml
git commit -m "feat: secure internal accounts and Ozon credentials"
```

### Task 3: Implement task transitions and fact confirmation

**Files:**
- Create: `packages/core/src/tasks/task-state.ts`
- Create: `packages/core/src/tasks/task-service.ts`
- Create: `packages/core/src/facts/fact-service.ts`
- Test: `packages/core/src/tasks/task-state.test.ts`
- Test: `packages/core/src/facts/fact-service.test.ts`
- Create: `apps/api/src/modules/tasks/**`

**Interfaces:**
- Consumes: authenticated actor, Amazon URL, normalized variant snapshot, and fact edits.
- Produces: `TaskService.create`, `TaskService.transition`, `FactService.ingest`, and `FactService.confirmManual`.

- [ ] **Step 1: Write the failing state-machine test**

```ts
import { expect, test } from "vitest";
import { assertTransition } from "./task-state.js";

test("cannot skip variant confirmation", () => {
  expect(() => assertTransition("COLLECTING", "PROCESSING_CONTENT")).toThrow("INVALID_TASK_TRANSITION");
});
```

- [ ] **Step 2: Implement allowed transitions**

```ts
const transitions: Record<string, string[]> = {
  PENDING_COLLECTION: ["COLLECTING", "ABANDONED"],
  COLLECTING: ["PENDING_VARIANT_CONFIRMATION", "PENDING_COLLECTION", "ABANDONED"],
  PENDING_VARIANT_CONFIRMATION: ["PROCESSING_CONTENT", "PENDING_COLLECTION", "ABANDONED"],
  PROCESSING_CONTENT: ["GENERATING_IMAGES", "PENDING_REVIEW", "ABANDONED"],
  GENERATING_IMAGES: ["PENDING_REVIEW", "PROCESSING_CONTENT", "ABANDONED"],
  PENDING_REVIEW: ["PENDING_PUBLISH", "PROCESSING_CONTENT", "GENERATING_IMAGES", "ABANDONED"],
  PENDING_PUBLISH: ["PUBLISHING", "PENDING_REVIEW", "ABANDONED"],
  PUBLISHING: ["PUBLISHED", "PUBLISH_FAILED"],
  PUBLISH_FAILED: ["PENDING_REVIEW", "PUBLISHING", "ABANDONED"],
  PUBLISHED: [],
  ABANDONED: [],
};

export function assertTransition(from: string, to: string): void {
  if (!transitions[from]?.includes(to)) throw new Error("INVALID_TASK_TRANSITION");
}
```

- [ ] **Step 3: Write the failing fact-precedence test**

```ts
import { expect, test } from "vitest";
import { mergeFact } from "./fact-service.js";

test("does not overwrite a manually confirmed fact with collected data", () => {
  const existing = { key: "color", value: "Серый", status: "confirmed_manual" as const, sourceRef: "user:1" };
  const incoming = { key: "color", value: "Grey", status: "confirmed_source" as const, sourceRef: "amazon:1" };
  expect(mergeFact(existing, incoming)).toBe(existing);
});
```

- [ ] **Step 4: Implement fact precedence and publishability**

```ts
import type { ProductFactDto } from "@ecommerce/contracts";

const priority = { missing: 0, suggested: 1, conflict: 2, confirmed_source: 3, confirmed_manual: 4 } as const;

export function mergeFact(existing: ProductFactDto | undefined, incoming: ProductFactDto): ProductFactDto {
  if (!existing) return incoming;
  return priority[existing.status] >= priority[incoming.status] ? existing : incoming;
}

export function blockingFacts(facts: ProductFactDto[], requiredKeys: string[]): string[] {
  return requiredKeys.filter((key) => !facts.some((fact) => fact.key === key && (fact.status === "confirmed_source" || fact.status === "confirmed_manual")));
}
```

- [ ] **Step 5: Add task and fact API commands**

Implement endpoints to create a task, read a task, list tasks, confirm the current variant, edit a fact, and abandon a task. Each mutation calls the domain service and writes an AuditEvent within one Prisma transaction.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test
pnpm --filter @ecommerce/api test:integration
git add packages/core apps/api
git commit -m "feat: enforce task and fact domain rules"
```

### Task 4: Implement durable job and audit records

**Files:**
- Create: `packages/core/src/jobs/job-service.ts`
- Create: `packages/core/src/audit/audit-service.ts`
- Test: `packages/core/src/jobs/job-service.test.ts`
- Create: `apps/worker/src/processors/task.processor.ts`
- Create: `apps/worker/src/queue.ts`

**Interfaces:**
- Consumes: task ID, step, idempotency key, and actor/system identity.
- Produces: durable job state, retry decisions, and immutable audit records.

- [ ] **Step 1: Write the failing idempotent job test**

```ts
import { expect, test, vi } from "vitest";
import { JobService } from "./job-service.js";

test("returns the existing success for a repeated idempotency key", async () => {
  const repo = { findByKey: vi.fn().mockResolvedValue({ status: "SUCCEEDED", result: { snapshotId: "s1" } }), create: vi.fn() };
  const service = new JobService(repo as never);
  await expect(service.begin("collect:task-1:v1", "COLLECT")).resolves.toEqual({ execute: false, result: { snapshotId: "s1" } });
  expect(repo.create).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Implement begin/succeed/fail behavior**

Implement `JobService.begin(key, step)`, `succeed(jobId, result)`, and `fail(jobId, { errorCode, retryable, detail })`. `begin` returns `execute: false` for an existing success or currently running job; a failed retryable job increments attempts and returns `execute: true`.

- [ ] **Step 3: Add worker processor boundaries**

The task processor recognizes exact steps `COLLECT`, `GENERATE_CONTENT`, `GENERATE_IMAGES`, `BUILD_OZON_DRAFT`, `SUBMIT_OZON`, and `POLL_OZON`. Each handler starts one JobService record and transitions task state only after durable success.

Create `apps/worker/src/queue.ts`:

```ts
import { Queue, Worker, type JobsOptions } from "bullmq";
import IORedis from "ioredis";

export type ProductJobName = "COLLECT" | "GENERATE_CONTENT" | "GENERATE_IMAGES" | "BUILD_OZON_DRAFT" | "SUBMIT_OZON" | "POLL_OZON";
export interface ProductJobPayload { taskId: string; inputVersion: string }

export function createProductQueue(redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue<ProductJobPayload, void, ProductJobName>("product-tasks", { connection });
  const add = (name: ProductJobName, payload: ProductJobPayload, options: JobsOptions = {}) =>
    queue.add(name, payload, { jobId: `${name}:${payload.taskId}:${payload.inputVersion}`, attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: 1000, ...options });
  return { connection, queue, add };
}

export function startProductWorker(redisUrl: string, process: (name: ProductJobName, payload: ProductJobPayload) => Promise<void>) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return new Worker<ProductJobPayload, void, ProductJobName>("product-tasks", (job) => process(job.name, job.data), { connection, concurrency: 3 });
}
```

Add `bullmq` and `ioredis` to the worker package. Concurrency 3 is the initial safe value for 10–30 daily tasks; provider-specific throttles remain inside adapters.

- [ ] **Step 4: Test recovery behavior**

```powershell
pnpm --filter @ecommerce/core test
pnpm --filter @ecommerce/worker test
```

Expected: repeated keys do not re-execute and retryable failures can resume.

- [ ] **Step 5: Commit core domain**

```powershell
git add packages/core apps/worker
git commit -m "feat: add durable jobs and audit trail"
```

### Task 5: Implement immutable object storage for source and generated assets

**Files:**
- Create: `packages/core/src/assets/asset-store.ts`
- Create: `packages/connectors/src/storage/s3-asset-store.ts`
- Test: `packages/core/src/assets/asset-store.test.ts`
- Create: `apps/api/src/modules/assets/**`

**Interfaces:**
- Consumes: task ID, asset kind, bytes, MIME type, source reference, and actor.
- Produces: immutable `ImageAsset` records and signed read URLs; supplier uploads remain distinguishable from Amazon sources.

- [ ] **Step 1: Write the failing deterministic-key test**

```ts
import { expect, test } from "vitest";
import { assetObjectKey } from "./asset-store.js";

test("uses task, kind, hash, and safe extension", () => {
  expect(assetObjectKey("task-1", "supplier_source", "abc123", "image/png")).toBe("tasks/task-1/supplier_source/abc123.png");
});
```

- [ ] **Step 2: Implement deterministic asset keys**

```ts
const extensionByMime = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

export function assetObjectKey(taskId: string, kind: string, sha256: string, mimeType: keyof typeof extensionByMime): string {
  if (!/^[a-z0-9_-]+$/i.test(taskId) || !/^[a-z0-9_-]+$/i.test(kind)) throw new Error("INVALID_ASSET_IDENTITY");
  return `tasks/${taskId}/${kind}/${sha256}.${extensionByMime[mimeType]}`;
}
```

- [ ] **Step 3: Implement the S3 adapter**

Create `S3AssetStore.put`, `getSignedReadUrl`, and `deleteUnreferenced`. `put` calculates SHA-256, checks for an existing matching ImageAsset, uploads only when absent, and then inserts the database row. Accepted MIME types are PNG, JPEG, and WebP; the first version rejects files over 20 MB.

- [ ] **Step 4: Add supplier upload routes**

Implement multipart upload for operator/admin, require `sourceType: supplier` and an acknowledgement that the uploaded image represents the actual product, and write an audit event. Return asset metadata and a short-lived signed URL, never the S3 secret.

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm --filter @ecommerce/core test -- asset-store
pnpm --filter @ecommerce/connectors test -- s3-asset-store
pnpm --filter @ecommerce/api test:integration -- assets
git add packages/core/src/assets packages/connectors/src/storage apps/api/src/modules/assets
git commit -m "feat: store immutable product image assets"
```
