import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loginAs, loginRaw } from "./helpers.js";

describe("auth guards", () => {
  it("rejects unauthenticated access", async () => {
    const res = await request(createApp()).get("/api/patients");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects invalid token", async () => {
    const res = await request(createApp())
      .get("/api/patients")
      .set("Authorization", "Bearer bad-token");
    expect(res.status).toBe(401);
  });

  it("allows authenticated access", async () => {
    const token = await loginAs("Admin");
    const res = await request(createApp())
      .get("/api/patients")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids wrong role on protected POST", async () => {
    const token = await loginAs("LabTech");
    const res = await request(createApp())
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Should Fail",
        age: 30,
        gender: "Male",
        phone: "+91 99999 99999",
        email: "",
        address: "Addr",
        bloodGroup: "O+",
        allergies: [],
        chronicConditions: [],
        emergencyContact: { name: "EC", phone: "+91 99999 88888", relation: "Friend" },
      });
    expect(res.status).toBe(403);
  });

  it("rejects wrong password", async () => {
    const { status } = await loginRaw({ email: "admin@careplus.local", password: "WrongPass123" });
    expect(status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const { status } = await loginRaw({ email: "nobody@careplus.local", password: "Test@1234" });
    expect(status).toBe(401);
  });

  it("rejects malformed login body", async () => {
    const { status } = await loginRaw({ email: "not-an-email", password: "short" });
    expect(status).toBe(400);
  });

  it("refresh flow works and logout revokes", async () => {
    const loginRes = await request(createApp())
      .post("/api/auth/login")
      .send({ email: "admin@careplus.local", password: "Test@1234" });
    const { refreshToken } = loginRes.body.data as {
      token: string;
      refreshToken: string;
    };
    expect(refreshToken).toBeTruthy();

    const refreshRes = await request(createApp()).post("/api/auth/refresh").send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.token).toBeTruthy();

    const logoutRes = await request(createApp()).post("/api/auth/logout").send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const again = await request(createApp()).post("/api/auth/refresh").send({ refreshToken });
    expect(again.status).toBe(401);
  });
});
