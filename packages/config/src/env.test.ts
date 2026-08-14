import { describe, expect, it } from "vitest";
import { loadAppEnv } from "./env.js";

describe("loadAppEnv", () => {
  it("rejects an encryption key that is not 32 bytes", () => {
    expect(() =>
      loadAppEnv({
        DATABASE_URL: "postgresql://x",
        REDIS_URL: "redis://x",
        APP_ENCRYPTION_KEY_BASE64: "bad",
      }),
    ).toThrow();
  });
});
