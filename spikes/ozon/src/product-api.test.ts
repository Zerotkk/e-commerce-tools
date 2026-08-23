import { expect, test, vi } from "vitest";
import { omitAttribute, parseImportResponse, parseImportStatus, pollImportStatus } from "./product-api.js";

test("extracts the asynchronous import task id", () => {
  expect(parseImportResponse({ result: { task_id: 12345 } })).toEqual({ taskId: 12345 });
});

test("preserves Ozon validation errors as actionable fields", () => {
  expect(
    parseImportStatus({
      result: {
        items: [
          {
            status: "error",
            errors: [{ code: "REQUIRED", field: "attributes.10", message: "Материал обязателен" }],
          },
        ],
      },
    }),
  ).toEqual({
    state: "failed",
    errors: [{ code: "REQUIRED", field: "attributes.10", message: "Материал обязателен", retryable: false }],
  });
});

test("maps successful and in-progress imports", () => {
  expect(
    parseImportStatus({ result: { items: [{ status: "imported", product_id: 10, sku: 20 }] } }),
  ).toEqual({ state: "succeeded", productId: "10", sku: "20" });
  expect(parseImportStatus({ result: { items: [{ status: "processing" }] } })).toEqual({ state: "pending" });
});

test("polls a pending import until Ozon reports a terminal status", async () => {
  const getImportStatus = vi
    .fn()
    .mockResolvedValueOnce({ state: "pending" })
    .mockResolvedValueOnce({ state: "succeeded", productId: "10", sku: "20" });

  await expect(pollImportStatus(getImportStatus, 12345, { maxAttempts: 2, delayMs: 0 })).resolves.toEqual({
    state: "succeeded",
    productId: "10",
    sku: "20",
  });
  expect(getImportStatus).toHaveBeenCalledTimes(2);
});

test("removes exactly the requested attribute for a controlled invalid import", () => {
  expect(omitAttribute([{ id: 10 }, { id: 11 }], 10)).toEqual([{ id: 11 }]);
});
