import { expect, test, vi } from "vitest";
import { importSafely } from "./import-safely.js";

test("queries the offer after an unknown import outcome", async () => {
  const api = {
    importProduct: vi.fn().mockRejectedValue(new DOMException("timeout", "AbortError")),
    getByOfferId: vi
      .fn()
      .mockResolvedValueOnce({ result: { items: [] } })
      .mockResolvedValueOnce({ result: { items: [{ offer_id: "E2E-01" }] } }),
  };

  await expect(importSafely(api, "E2E-01", {})).resolves.toEqual({ state: "confirmed_after_timeout" });
  expect(api.getByOfferId).toHaveBeenCalledWith("E2E-01");
});

test("does not submit an offer that already exists", async () => {
  const api = {
    importProduct: vi.fn(),
    getByOfferId: vi.fn().mockResolvedValue({ result: { items: [{ offer_id: "E2E-01" }] } }),
  };

  await expect(importSafely(api, "E2E-01", {})).resolves.toEqual({ state: "already_exists" });
  expect(api.importProduct).not.toHaveBeenCalled();
});

test("returns the task id needed to poll a newly submitted import", async () => {
  const api = {
    importProduct: vi.fn().mockResolvedValue({ taskId: 12345 }),
    getByOfferId: vi.fn().mockResolvedValue({ result: { items: [] } }),
  };

  await expect(importSafely(api, "E2E-01", {})).resolves.toEqual({ state: "submitted", taskId: 12345 });
});
