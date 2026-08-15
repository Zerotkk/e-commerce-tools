import { expect, test } from "@playwright/test";

test("shows the internal product task app", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "E-commerce Tools" })).toBeVisible();
});
