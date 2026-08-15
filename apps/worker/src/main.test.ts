import { describe, expect, it } from "vitest";
import { bootstrapWorker } from "./main.js";

describe("bootstrapWorker", () => {
  it("starts an application context without an HTTP listener", async () => {
    const app = await bootstrapWorker();

    expect(app).toBeDefined();
    await app.close();
  });
});
