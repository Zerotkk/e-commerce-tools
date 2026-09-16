import { expect, test } from "vitest";
import { sanitizeEvidence } from "./evidence.js";

test("redacts credential-shaped keys recursively before evidence is persisted", () => {
  expect(
    sanitizeEvidence({
      "Client-Id": "client-secret",
      nested: { api_key: "api-secret", authorization: "Bearer secret" },
      result: [{ id: 10 }],
    }),
  ).toEqual({
    "Client-Id": "[REDACTED]",
    nested: { api_key: "[REDACTED]", authorization: "[REDACTED]" },
    result: [{ id: 10 }],
  });
});
