import { describe, expect, it, vi } from "vitest";
import { OzonHttpClient } from "./ozon-http.js";

describe("OzonHttpClient", () => {
  it("never includes credentials in diagnostics", async () => {
    const diagnostics: unknown[] = [];
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: [] }), { status: 200 }));
    const client = new OzonHttpClient({
      clientId: "secret-client",
      apiKey: "secret-key",
      fetcher,
      onDiagnostic: (record) => diagnostics.push(record),
    });

    await client.post("/v1/description-category/tree", { language: "RU" });

    expect(JSON.stringify(diagnostics)).not.toContain("secret-client");
    expect(JSON.stringify(diagnostics)).not.toContain("secret-key");
  });
});
