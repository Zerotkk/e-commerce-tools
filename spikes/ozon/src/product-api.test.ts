import { expect, test } from "vitest";
import { parseImportResponse, parseImportStatus } from "./product-api.js";

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
