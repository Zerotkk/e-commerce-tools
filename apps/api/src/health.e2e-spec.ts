import { describe, expect, it } from "vitest";
import request from "supertest";
import { buildApp } from "./main.js";

describe("GET /health", () => {
  it("returns ok", async () => {
    const app = await buildApp();
    await app.init();

    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(response.body).toEqual({ status: "ok" });
    await app.close();
  });
});
