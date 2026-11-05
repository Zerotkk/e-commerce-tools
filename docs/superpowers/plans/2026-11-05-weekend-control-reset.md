# Weekend Control Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a single, auditable control path and complete the Amazon-to-Ozon MVP within weekend-only five-hour usage windows.

**Architecture:** The total-control task owns sequencing, the canonical checkpoint on `main`, and acceptance decisions. Exactly one business task may run at a time on its existing branch; the next task starts only after evidence, verification, commit, push, PR-head check, and total-control checkpoint are complete.

**Tech Stack:** Git/GitHub Draft PRs, pnpm workspace, TypeScript, Vitest, Playwright, Chrome extension read-only browser access, Ozon Seller API.

## Global Constraints

- Work only in weekend sessions of at most five hours; reserve the last 45 minutes for verification, checkpointing, commit, push, and report.
- Keep exactly one business task active. Do not start the next task while the current gate is incomplete or blocked.
- Every task must read the canonical checkpoint by absolute path: `C:\Users\zjz1\Desktop\e-commerce-tools\docs\status\current-project-state.md`.
- Amazon evidence must describe the current selected variant and must never mix sibling variants or bypass CAPTCHA.
- Never fabricate product facts. Missing dimensions, weight, model, price, VAT, or image provenance remain explicit blockers.
- No Ozon product creation without the already-scoped controlled-test authorization and complete real test-product data. No formal sale or publication.
- Preserve authorized images privately; do not publish them externally.
- Use existing dependencies and branch implementations. Do not add speculative abstractions or unrelated cleanup.
- Before any usage limit or stop, record the last commit, verified and unverified items, exact blocker, and next command.

---

## Baseline: 2026-11-05

- `main`: `252244a`, synchronized with `origin/main`.
- Amazon: `agent/amazon-collection-spike` / `12c8ca8` / Draft PR #2.
- Ozon: `agent/ozon-api-spike` / `bcafe0a` / Draft PR #1.
- Images: `agent/image-pipeline-spike` / `8f70592` / Draft PR #3.
- Phase 0 is complete. Phase 1 is not accepted. Phases 2–4 have not started.
- No business task is currently active.
- The Ozon worktree contains an uncommitted package-build placeholder and two local redacted-response artifacts. Preserve them; do not commit or delete them during unrelated work.
- The detached `e8c5` worktree has no changes. Remove it only after explicit cleanup approval.

## Weekend Schedule

| Weekend | Planned gate | Expected result |
| --- | --- | --- |
| Nov 7–8 | Amazon blind samples | Rows 2–4 collected through connected logged-in Chrome, or one precise external blocker recorded |
| Nov 14–15 | Real image validation | Variant-linked Black main image downloaded privately; immutable-subject flow and human review evidence completed |
| Nov 21–22 | Controlled Ozon validation | Import, status, error, idempotency, recovery, and draft-capability decision verified with real test data |
| Nov 28–29 | Phase 2 core domain | Persistent domain, roles, task transitions, jobs, audit, and immutable assets pass their gates |
| Dec 5–6 | Phase 3 product capability | Russian content pipeline and review workbench pass type, unit, integration, and UI gates |
| Dec 12–13 | Phase 4 end-to-end | Full workflow, security, regression, and capacity gates pass; integration decision prepared |
| Dec 19–20 | Contingency only | External-blocker recovery or final stabilization; no new scope |

**Expected completion:** target December 13, 2026; contingency December 20, 2026. This assumes ten hours per weekend and timely Chrome access, product facts, image rights, and Ozon availability.

## Responsibility Split

### User

- Connect the logged-in Amazon Chrome tab to Codex when the Amazon task requests it.
- Provide real Ozon model, measured dimensions, measured weight, RUB test price, and VAT before Nov 21.
- Review the real image candidates and confirm product fidelity.
- Approve any action beyond a controlled Ozon test card; formal listing remains prohibited by default.

### Total-control task

- Keep this schedule and `docs/status/current-project-state.md` authoritative.
- Start only one business task, give it a bounded instruction, and wait for its final evidence.
- Independently verify Git status, commit, remote branch, and Draft PR head before accepting a result.
- Stop on external blockers; do not silently create replacement tasks or repeat failed calls.
- Update and push the canonical checkpoint after every accepted or blocked weekend gate.

### Business task

- Work only inside its assigned branch and approved plan scope.
- Produce evidence and run the plan's verification commands.
- Commit only verified tracked changes; keep secrets and private responses out of Git.
- Push once, report the exact result, and stop. It does not start sibling work.

## Task 1: Close the Amazon capability gate

**Owner:** Amazon business task, controlled by total control.

**Files:**
- Modify: `docs/validation/amazon-collection-report.md`
- Modify only if needed: `spikes/amazon/src/**`
- Read: `C:\Users\zjz1\Desktop\e-commerce-tools\测试链接.xlsx`

- [ ] **Step 1: Prepare the connected browser**

  User opens workbook row 2 in logged-in Chrome and connects that tab through the Codex extension. The task verifies the connection before accessing Amazon.

- [ ] **Step 2: Collect rows 2–4 sequentially**

  Record URL ASIN, page ASIN, selected color and size, title, brand, price, dimensions, weight, images, bullets, and field-level provenance. Mark missing or conflicting values; stop on CAPTCHA or connection loss.

- [ ] **Step 3: Verify the Amazon spike**

  Run:

  ```powershell
  pnpm --filter @ecommerce/amazon-spike test
  pnpm --filter @ecommerce/amazon-spike lint
  pnpm --filter @ecommerce/amazon-spike typecheck
  ```

  Expected: every command exits 0 and the report contains three unused connected-Chrome samples without sibling-variant mixing.

- [ ] **Step 4: Deliver the gate result**

  Commit the report and any required tested fix, push `agent/amazon-collection-spike` once, verify Draft PR #2 head, then update the canonical checkpoint. If the three-sample gate fails, record `not_accepted` and the exact blocker instead of continuing.

## Task 2: Close the real-image capability gate

**Owner:** Image business task, only after Task 1 records the verified Black main-image URL.

**Files:**
- Modify: `.superpowers/sdd/progress.md`
- Modify: `.superpowers/sdd/task-2-report.md`
- Modify only if needed: `spikes/images/**`
- Private input: `artifacts/private/images/authorized/amazon-us/<ASIN>/`

- [ ] **Step 1: Download the verified current-variant main image privately**

  Use only the URL recorded by Task 1. Hash the source and preserve the original; do not commit the private image.

- [ ] **Step 2: Run immutable-subject processing and human review**

  Produce clean, scene, and feature candidates without changing product structure, color, material, quantity, brand, or proportions. User reviews the candidates for fidelity.

- [ ] **Step 3: Verify and deliver**

  Run:

  ```powershell
  pnpm --filter @ecommerce/image-spike test
  pnpm lint
  pnpm typecheck
  ```

  Commit the evidence report, push `agent/image-pipeline-spike` once, verify Draft PR #3 head, and update the canonical checkpoint.

## Task 3: Close the controlled Ozon capability gate

**Owner:** Ozon business task, after the user supplies complete real product data.

**Required user data:** model or explicit `no model`, measured length/width/height, measured weight, RUB test price, VAT, approved fixed test SKU, and approved public image URL.

**Files:**
- Modify: `spikes/ozon/fixtures/minimal-product.json`
- Modify: `docs/validation/ozon-api-report.md`
- Modify only if needed: `spikes/ozon/src/**`

- [ ] **Step 1: Resolve local residue before implementation**

  Review the uncommitted `pnpm-workspace.yaml` placeholder and local redacted artifacts. Preserve evidence, remove or correct only the task-created placeholder after confirming it is not required, and do not expose credentials.

- [ ] **Step 2: Run the controlled lifecycle**

  Execute import, status lookup, field-error translation, duplicate/idempotency behavior, timeout recovery, and the Ozon-side-versus-internal-draft decision. Do not publish the product for sale.

- [ ] **Step 3: Verify and deliver**

  Run:

  ```powershell
  pnpm --filter @ecommerce/ozon-spike test
  pnpm typecheck
  ```

  Commit verified code and redacted report only, push `agent/ozon-api-spike` once, verify Draft PR #1 head, and update the canonical checkpoint.

## Task 4: Accept Phase 1 and execute Phases 2–4

**Owner:** Fresh phase-specific business tasks, created only after all three external gates are accepted.

- [ ] **Step 1: Record the Phase 1 decision on `main`**

  Update the checkpoint with accepted adapter contracts, remaining limits, and exact PR heads. If any external gate remains rejected, do not start Phase 2.

- [ ] **Step 2: Execute Phase 2**

  Follow `docs/superpowers/plans/2026-08-14-core-domain-and-accounts.md`. Required gate:

  ```powershell
  pnpm db:migrate:test
  pnpm --filter @ecommerce/core test
  pnpm --filter @ecommerce/api test:integration
  ```

- [ ] **Step 3: Execute Phase 3**

  Follow the Russian-content and review-workbench plans. Required gate:

  ```powershell
  pnpm typecheck
  pnpm --filter @ecommerce/core test
  pnpm --filter @ecommerce/web test
  ```

- [ ] **Step 4: Execute Phase 4**

  Follow `docs/superpowers/plans/2026-08-14-end-to-end-integration.md`. Required gate:

  ```powershell
  pnpm lint
  pnpm typecheck
  pnpm test
  pnpm test:integration
  pnpm test:e2e
  pnpm security:check
  ```

- [ ] **Step 5: Prepare integration decision**

  Verify every branch and PR independently, summarize accepted and unverified behavior, and present merge options. Do not merge or publish to Ozon without the user's explicit final choice.

## Session Stop Checklist

Every weekend session ends with all applicable items below:

- [ ] Stop new work at least 45 minutes before the usage window ends.
- [ ] Run the task-specific verification commands and record their actual output.
- [ ] Record tracked and untracked files; do not hide local residue.
- [ ] Commit verified tracked work and attempt one push.
- [ ] Verify the remote branch and Draft PR head.
- [ ] Update `docs/status/current-project-state.md` on `main`.
- [ ] Report completed, unverified, blocker, next command, and remaining schedule to the user.
