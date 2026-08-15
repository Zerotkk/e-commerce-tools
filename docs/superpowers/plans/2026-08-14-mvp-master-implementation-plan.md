# Amazon-to-Ozon MVP Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinate the independent implementation plans that deliver the approved single-product Amazon US to Ozon internal MVP.

**Architecture:** Build a TypeScript modular monolith with a React web client, PostgreSQL, Redis-backed jobs, S3-compatible object storage, and provider adapters. Run external capability spikes before product integration, then assemble the validated paths behind stable contracts.

**Tech Stack:** pnpm workspace, TypeScript, React/Next.js, NestJS, PostgreSQL/Prisma, Redis/BullMQ, S3-compatible storage, Vitest, Playwright, Docker Compose.

## Global Constraints

- Source platform is Amazon US (`amazon.com`); first supported category is storage ottomans.
- One submitted link produces one task for the link's current variant; the user must confirm color, size, images, and facts.
- One Ozon store and independent internal accounts with administrator, operator, and reviewer roles.
- Default release action is Ozon draft; formal submission requires explicit reviewer choice.
- Daily baseline is 10–30 product tasks.
- AI suggestions never overwrite sourced or manually confirmed facts.
- Any missing or conflicting required fact blocks Ozon submission.
- Approved images must preserve product structure, proportion, color, texture, accessories, brand, and model.
- All external calls use adapters and idempotency controls; secrets never enter ordinary logs.
- Use the latest stable dependencies only when foundation work begins, commit `pnpm-lock.yaml`, and do not upgrade dependencies during the MVP without a separate reviewed change.

---

## Plan Set and Ownership

| Order | Plan | Independent output | Execution relationship |
|---|---|---|---|
| 0 | `2026-08-14-foundation-platform.md` | Runnable repository, local infrastructure, shared contracts, CI checks | Must run first |
| 1A | `2026-08-14-amazon-collection-spike.md` | Amazon collection feasibility report and normalized snapshots | May run in parallel with 1B and 1C after Plan 0 |
| 1B | `2026-08-14-ozon-api-spike.md` | Verified Ozon category, import, status, and retry behavior | May run in parallel with 1A and 1C after Plan 0 |
| 1C | `2026-08-14-image-pipeline-spike.md` | Validated image path, costs, timings, and fidelity review results | May run in parallel with 1A and 1B after Plan 0 |
| 2 | `2026-08-14-core-domain-and-accounts.md` | Database, roles, task state machine, facts, versions, audit | Starts after all three spike reports are reviewed |
| 3A | `2026-08-14-russian-content-pipeline.md` | Fact-constrained Russian content generation and versioning | Starts after Plan 2; can run alongside 3B |
| 3B | `2026-08-14-review-workbench.md` | Task center, variant confirmation, review, blocking checks | Starts after Plan 2; can run alongside 3A |
| 4 | `2026-08-14-end-to-end-integration.md` | Ozon integration, security checks, regression, blind acceptance | Starts after Plans 3A and 3B |

Separate Codex tasks must use the exact plan file assigned to them. A task may not silently change an interface owned by another plan; it must stop and return a proposed contract change to the master task.

## Cross-Plan Contracts

The foundation plan owns these contracts in `packages/contracts/src`:

```ts
export type FactStatus =
  | "confirmed_source"
  | "confirmed_manual"
  | "suggested"
  | "missing"
  | "conflict";

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
```

The external spike plans may extend their own adapter result objects but must map into these DTOs before integration.

The same package also owns `ContentContextDto`, `GeneratedContentDto`, `OzonAttributeDefinitionDto`, `OzonImportRequestDto`, `OzonImportStatusDto`, and `OzonFieldErrorDto` as defined in the foundation plan. Content and Ozon plans must import these types rather than creating connector-local copies.

## Phase 0: Foundation Gate

- [ ] **Step 1: Execute the foundation plan in its own Codex task**

Input: approved design document and `2026-08-14-foundation-platform.md`.

Expected output: repository initialized, lockfile committed, local services healthy, unit and integration test commands passing.

- [ ] **Step 2: Verify foundation evidence**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
docker compose config --quiet
```

Expected: all commands exit 0.

- [ ] **Step 3: Record the foundation commit in the master task**

```powershell
git log -1 --oneline
```

Expected: a commit titled `chore: establish MVP platform foundation`.

## Phase 1: External Capability Gates

- [ ] **Step 1: Dispatch Amazon, Ozon, and image plans to separate Codex tasks**

Each task receives only the approved design, its plan file, and the foundation commit. Credentials remain user-provided secrets and must not be pasted into task messages or committed files.

- [ ] **Step 2: Accept the Amazon spike only with sample evidence**

Required artifacts:

```text
artifacts/spikes/amazon/results.json
artifacts/spikes/amazon/field-coverage.csv
docs/validation/amazon-collection-report.md
```

Reject the spike if a blind sample mixes current and sibling variant data or if uncertain fields are emitted as confirmed.

- [ ] **Step 3: Accept the Ozon spike only with live response evidence**

Required artifacts:

```text
artifacts/spikes/ozon/redacted-responses/
docs/validation/ozon-api-report.md
packages/connectors/src/ozon/ozon.contract.ts
```

Reject the spike if a repeated idempotency key can create a second offer or if timeout recovery is undefined.

- [ ] **Step 4: Accept the image spike only with human review evidence**

Required artifacts:

```text
artifacts/spikes/images/manifest.json
artifacts/spikes/images/review.csv
docs/validation/image-pipeline-report.md
```

Reject the spike if an automatically approved image changes product structure, proportion, color, texture, accessories, brand, or model.

- [ ] **Step 5: Commit the selected external paths**

```powershell
git add artifacts/spikes docs/validation packages/connectors
git commit -m "docs: record external capability decisions"
```

Expected: a single reviewed decision commit; raw credentials and full sensitive responses are absent.

## Phase 2: Core Domain Gate

- [ ] **Step 1: Execute the core domain and accounts plan in its own Codex task**

Expected output: Prisma schema, role enforcement, encrypted store credentials, task state machine, field provenance, versions, background job records, and audit events.

- [ ] **Step 2: Verify migration and contract tests**

```powershell
pnpm db:migrate:test
pnpm --filter @ecommerce/core test
pnpm --filter @ecommerce/api test:integration
```

Expected: migrations apply from an empty database and all tests pass.

## Phase 3: Product Capability Gate

- [ ] **Step 1: Execute Russian content and review workbench plans in separate Codex tasks**

The two tasks may run concurrently because Russian content owns `packages/core/src/content` and the review workbench owns `apps/web` plus review-specific API routes.

- [ ] **Step 2: Verify contract compatibility before merge**

```powershell
pnpm typecheck
pnpm --filter @ecommerce/core test
pnpm --filter @ecommerce/web test
```

Expected: no cross-plan contract mismatch and all tests pass.

## Phase 4: End-to-End Gate

- [ ] **Step 1: Execute the end-to-end integration plan in its own Codex task**

Use development samples first, regression samples second, and at least three previously unused valid storage-ottoman samples for final blind acceptance.

- [ ] **Step 2: Run the complete release gate**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm security:check
```

Expected: all commands exit 0; the acceptance report contains three explicit Ozon outcomes and no blocking violation.

- [ ] **Step 3: Review release artifacts**

Required artifacts:

```text
docs/validation/mvp-acceptance-report.md
artifacts/acceptance/task-results.json
artifacts/acceptance/cost-and-duration.csv
```

- [ ] **Step 4: Commit the release candidate**

```powershell
git add .
git commit -m "feat: complete Amazon to Ozon MVP"
```

Expected: clean worktree after commit and all release-gate commands remain green.

## Master Stop Conditions

Stop implementation and return to the master task when any of these occurs:

- Amazon current-variant accuracy cannot be demonstrated on blind samples.
- No tested image path can preserve the product subject reliably.
- Ozon credentials lack the permissions required for category lookup, import, or status queries.
- Ozon API behavior makes duplicate prevention impossible with the proposed identity strategy.
- A plan needs to change a cross-plan contract already consumed by another plan.
- A blocking acceptance violation appears in an end-to-end sample.

## Approved Design Coverage Matrix

| Design requirement | Owning plan and task |
|---|---|
| Internal users, three roles, one encrypted Ozon connection | Core Task 2; Review Task 5 |
| Single Amazon US link and current-variant confirmation | Amazon Tasks 1–4; Review Task 2 |
| Source snapshots, fact status, provenance, conflict handling | Core Tasks 1 and 3 |
| Russian title, bullets, description, keywords, image copy, versions | Russian Content Tasks 1–3 |
| Amazon and supplier image sources | Core Task 5; Review Task 3 |
| Two to three clean, scene, and feature image sets | Image Tasks 3–4 |
| Immutable subject and manual image approval | Image Tasks 2–4; End-to-End Task 1 |
| Ozon category, attributes, dictionaries, units, and field errors | Ozon Tasks 2–5; End-to-End Task 3 |
| Internal draft, explicit submit, async status, safe retry | Ozon Tasks 3–5; End-to-End Tasks 1–2 |
| Task states, background jobs, recovery, idempotency | Core Tasks 3–4; End-to-End Task 2 |
| Review blockers, rights confirmation, audit trail | Core Tasks 2–4; Review Task 4; End-to-End Task 1 |
| Results, error history, Ozon identifiers | Review Task 4; End-to-End Task 2 |
| Daily 10–30 task baseline and measured cost/duration | Foundation Task 3; End-to-End Task 4 |
| Development, regression, and three-sample blind acceptance | Amazon Task 4; End-to-End Task 4 |
