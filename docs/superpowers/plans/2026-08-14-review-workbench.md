# Review Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the internal task center, task creation, current-variant confirmation, content/image/attribute review, blocking checks, and reviewer-controlled draft or submit actions.

**Architecture:** Use Next.js App Router pages with a typed API client and feature-local components. The browser displays server-calculated blocking issues; it never independently decides that a task is publishable.

**Tech Stack:** Next.js, React, TypeScript, TanStack Query, Zod, Testing Library, Vitest, Playwright.

## Global Constraints

- Separate administrator, operator, and reviewer sessions.
- One link per task and one current variant confirmation.
- Every field displays value, provenance status, and source reference where available.
- Default publish action is save draft; formal submit requires reviewer choice and rights confirmation.
- Blocking issues cannot be bypassed by client-side requests.
- UI copy is Chinese for internal users; generated product copy is Russian.

---

### Task 1: Build the typed API client and task center

**Files:**
- Create: `apps/web/src/lib/api-client.ts`
- Create: `apps/web/src/features/tasks/task-list.tsx`
- Create: `apps/web/src/features/tasks/task-status-label.tsx`
- Create: `apps/web/src/app/tasks/page.tsx`
- Test: `apps/web/src/features/tasks/task-list.test.tsx`

**Interfaces:**
- Consumes: `GET /api/tasks?status=&assignee=&cursor=`.
- Produces: task table with ASIN, variant, assignee, status, blocker count, failure summary, and updated time.

- [ ] **Step 1: Write the failing task-list test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { TaskList } from "./task-list";

test("shows blockers and current variant", () => {
  render(<TaskList tasks={[{ id: "t1", asin: "B092LVTSD4", color: "Grey", size: "17 x 13 x 13 in", assignee: "运营A", status: "pending_review", blockerCount: 2, failureSummary: null, updatedAt: "2026-08-14T00:00:00Z" }]} />);
  expect(screen.getByText("Grey / 17 x 13 x 13 in")).toBeVisible();
  expect(screen.getByText("2 个阻断项")).toBeVisible();
});
```

- [ ] **Step 2: Run the test and confirm failure**

```powershell
pnpm --filter @ecommerce/web test -- task-list
```

Expected: FAIL because `TaskList` does not exist.

- [ ] **Step 3: Implement the API client**

```ts
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.code ?? "API_ERROR", body.message ?? "请求失败");
  return body as T;
}
```

- [ ] **Step 4: Implement the task center**

Render a semantic table, status filter, assignee filter, and cursor pagination. Use exact Chinese status labels matching the approved state machine. Blocker count links to the task review section; failure summary is truncated visually but available as accessible text.

- [ ] **Step 5: Run tests and commit**

```powershell
pnpm --filter @ecommerce/web test -- task-list
pnpm --filter @ecommerce/web typecheck
git add apps/web/src/lib apps/web/src/features/tasks apps/web/src/app/tasks
git commit -m "feat: add internal product task center"
```

### Task 2: Implement task creation and current-variant confirmation

**Files:**
- Create: `apps/web/src/features/tasks/create-task-form.tsx`
- Create: `apps/web/src/app/tasks/new/page.tsx`
- Create: `apps/web/src/features/variants/variant-confirmation.tsx`
- Create: `apps/web/src/app/tasks/[taskId]/variant/page.tsx`
- Test: `apps/web/src/features/variants/variant-confirmation.test.tsx`

**Interfaces:**
- Consumes: `POST /api/tasks`, `GET /api/tasks/:id/variant`, and `POST /api/tasks/:id/variant/confirm`.
- Produces: a task and explicit confirmation of ASIN, color, size, price, images, and key facts.

- [ ] **Step 1: Write the failing confirmation test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { VariantConfirmation } from "./variant-confirmation";

test("requires the operator to acknowledge the current variant", async () => {
  const onConfirm = vi.fn();
  render(<VariantConfirmation variant={{ asin: "B092LVTSD4", color: "Grey", size: "17 in", imageUrls: ["/main.jpg"], facts: [] }} onConfirm={onConfirm} />);
  expect(screen.getByRole("button", { name: "确认当前变体" })).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox", { name: "颜色、尺寸、图片和参数属于同一变体" }));
  expect(screen.getByRole("button", { name: "确认当前变体" })).toBeEnabled();
});
```

- [ ] **Step 2: Implement task creation**

The form accepts one `amazon.com` URL and optional assignee. Display server errors `AMAZON_US_URL_REQUIRED`, `AMAZON_ASIN_NOT_FOUND`, and duplicate active task with actionable Chinese copy.

- [ ] **Step 3: Implement side-by-side variant confirmation**

Show ASIN, Amazon source link, selected color, selected size, price, product images, and key facts. Images use selectable thumbnails but the first version confirms the entire current-variant set; it does not build a multi-variant product.

- [ ] **Step 4: Run tests and commit**

```powershell
pnpm --filter @ecommerce/web test -- variant-confirmation
pnpm --filter @ecommerce/web typecheck
git add apps/web/src/features/tasks/create-task-form.tsx apps/web/src/features/variants apps/web/src/app/tasks
git commit -m "feat: add task creation and variant confirmation"
```

### Task 3: Build the product processing workbench

**Files:**
- Create: `apps/web/src/app/tasks/[taskId]/page.tsx`
- Create: `apps/web/src/features/workbench/workbench-tabs.tsx`
- Create: `apps/web/src/features/facts/fact-table.tsx`
- Create: `apps/web/src/features/content/content-editor.tsx`
- Create: `apps/web/src/features/images/image-proposal-grid.tsx`
- Create: `apps/web/src/features/ozon/attribute-editor.tsx`
- Test: `apps/web/src/features/facts/fact-table.test.tsx`
- Test: `apps/web/src/features/images/image-proposal-grid.test.tsx`

**Interfaces:**
- Consumes: task detail, facts, content versions, image proposals, Ozon category/attributes, and mutation endpoints.
- Produces: one four-section workbench for source, Russian content, images, and Ozon fields.

- [ ] **Step 1: Write the failing provenance test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { FactTable } from "./fact-table";

test("distinguishes source, suggestion, missing, and conflict", () => {
  render(<FactTable facts={[
    { key: "color", value: "Grey", status: "confirmed_source", sourceRef: "amazon:color" },
    { key: "weight", value: null, status: "missing", sourceRef: null },
    { key: "material", value: null, status: "conflict", sourceRef: "amazon:details" },
  ]} />);
  expect(screen.getByText("来源明确")).toBeVisible();
  expect(screen.getByText("缺失")).toBeVisible();
  expect(screen.getByText("冲突")).toBeVisible();
});
```

- [ ] **Step 2: Implement fact editing**

Use one row per normalized fact with source value, effective value, unit, status badge, source reference, and edit action. Saving a value requires an explicit unit where applicable and sends a manual-confirmation mutation; it never changes the original source value.

- [ ] **Step 3: Implement content version selection and editing**

Display version, generator/manual origin, author, time, title, bullets, description, keywords, and image copy. Saving creates a new version and refreshes the version list; no overwrite action exists.

- [ ] **Step 4: Implement image proposal review**

Group images by `clean`, `scene`, and `feature`. Show source image, subject hash check, generated image, Russian copy, automated status, and manual decision. Allow the operator to select individual images across different sets, regenerate one selected image, edit its Russian copy, change its approved template/background, and upload a supplier original through the asset route. Images with failed automated checks have no approve button. Every regeneration creates a new proposal and preserves the prior proposal.

- [ ] **Step 5: Implement Ozon attribute editing**

Required attributes appear first. Dictionary attributes use server-provided values; numeric values use explicit units; missing/conflicting values display the corresponding blocking issue. Price, inventory, product dimensions, package dimensions, weight, and SKU are separate fields.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/web test -- fact-table image-proposal-grid
pnpm --filter @ecommerce/web typecheck
git add apps/web/src/app/tasks/[taskId] apps/web/src/features
git commit -m "feat: add product processing workbench"
```

### Task 4: Implement review, rights confirmation, and release choice

**Files:**
- Create: `apps/web/src/features/review/blocking-issues.tsx`
- Create: `apps/web/src/features/review/review-checklist.tsx`
- Create: `apps/web/src/features/publish/publish-dialog.tsx`
- Create: `apps/web/src/features/publish/publication-history.tsx`
- Test: `apps/web/src/features/publish/publish-dialog.test.tsx`
- Create: `tests/e2e/tests/review-and-draft.spec.ts`

**Interfaces:**
- Consumes: server-calculated blocker list, reviewer role, rights confirmations, and publication history.
- Produces: approved internal draft or explicit formal submission request.

- [ ] **Step 1: Write the failing default-action test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PublishDialog } from "./publish-dialog";

test("defaults to saving an internal draft", () => {
  render(<PublishDialog blockers={[]} canSubmit={true} onConfirm={async () => {}} />);
  expect(screen.getByRole("radio", { name: "保存草稿" })).toBeChecked();
  expect(screen.getByRole("radio", { name: "正式提交 Ozon" })).not.toBeChecked();
});
```

- [ ] **Step 2: Implement blocking issues and checklist**

Render blockers for variant confirmation, required facts, image fidelity, Russian approval, Ozon attributes, SKU/price/inventory, package data, and rights confirmation. Each blocker links to the exact workbench section and field.

- [ ] **Step 3: Implement rights confirmation and release choice**

Require reviewer checkboxes confirming image/content rights, sales rights, actual-product consistency, and target-market compliance. Keep “保存草稿” selected by default. Disable both actions while server blockers exist; formal submission also requires reviewer/admin role.

- [ ] **Step 4: Implement publication history**

Display action, actor, time, idempotency key suffix, status, Ozon task/product/SKU identifiers, and structured field errors. Never render raw request headers or credentials.

- [ ] **Step 5: Add the browser acceptance test**

```ts
import { expect, test } from "@playwright/test";

test("reviewer saves a completed task as a draft by default", async ({ page }) => {
  await page.goto("/tasks/fixture-ready/review");
  await page.getByLabel("我确认拥有图片和文案的使用权").check();
  await page.getByLabel("我确认商品与实际发货商品一致").check();
  await page.getByRole("button", { name: "发布确认" }).click();
  await expect(page.getByRole("radio", { name: "保存草稿" })).toBeChecked();
});
```

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/web test -- publish-dialog
pnpm test:e2e -- review-and-draft
git add apps/web tests/e2e
git commit -m "feat: add reviewer-controlled draft and submit flow"
```

### Task 5: Add login, account administration, and store connection status

**Files:**
- Create: `apps/web/src/app/login/page.tsx`
- Create: `apps/web/src/features/auth/login-form.tsx`
- Create: `apps/web/src/app/admin/users/page.tsx`
- Create: `apps/web/src/features/admin/user-table.tsx`
- Create: `apps/web/src/app/admin/store/page.tsx`
- Create: `apps/web/src/features/admin/store-connection-card.tsx`
- Test: `apps/web/src/features/auth/login-form.test.tsx`
- Test: `tests/e2e/tests/role-access.spec.ts`

**Interfaces:**
- Consumes: login/logout/current-user, user administration, and redacted store-connection endpoints from the core plan.
- Produces: authenticated navigation, role-based page access, and redacted store health display.

- [ ] **Step 1: Write the failing login test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { LoginForm } from "./login-form";

test("submits email and password without persisting the password", async () => {
  const login = vi.fn().mockResolvedValue(undefined);
  render(<LoginForm login={login} />);
  fireEvent.change(screen.getByLabelText("邮箱"), { target: { value: "reviewer@example.test" } });
  fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret" } });
  fireEvent.click(screen.getByRole("button", { name: "登录" }));
  expect(login).toHaveBeenCalledWith({ email: "reviewer@example.test", password: "secret" });
  expect(localStorage.getItem("password")).toBeNull();
});
```

- [ ] **Step 2: Implement authenticated navigation**

Use an HttpOnly same-site session cookie issued by the API. Redirect anonymous users to `/login`. Show navigation items according to role; role-based hiding is convenience only, while the API remains authoritative.

- [ ] **Step 3: Implement administrator user management**

Allow administrators to create users, choose `OPERATOR` or `REVIEWER`, activate/deactivate accounts, and reset passwords. Do not allow the final active administrator to deactivate their own account.

- [ ] **Step 4: Implement redacted store status**

Display store name, connection status, last successful check, and masked Client ID suffix. API key characters are never returned or rendered. Updating credentials requires re-entering both values.

- [ ] **Step 5: Add role-access browser tests**

Test that an operator cannot open user management or formal submission controls, a reviewer can approve/submit but not manage users, and an administrator can access all internal pages.

- [ ] **Step 6: Run tests and commit**

```powershell
pnpm --filter @ecommerce/web test -- login-form
pnpm test:e2e -- role-access
git add apps/web/src/app/login apps/web/src/app/admin apps/web/src/features/auth apps/web/src/features/admin tests/e2e/tests/role-access.spec.ts
git commit -m "feat: add internal login and role-aware administration"
```
