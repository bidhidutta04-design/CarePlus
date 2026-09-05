import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

// Placeholder gate: proves the test runner, server factory and envelope work.
// Real specs (auth matrix, status machine, stock/payment guards) land later.
describe("api boot gate", () => {
  it("answers /health with the service envelope", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.data.service).toBe("careplus-api");
    expect(res.body.data.status).toBe("ok");
  });

  it("rejects unauthenticated api access with the error envelope", async () => {
    const res = await request(createApp()).get("/api/v1/patients");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
