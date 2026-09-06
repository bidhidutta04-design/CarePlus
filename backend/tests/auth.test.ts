import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loginAs, loginRaw } from "./helpers.js";

describe("auth guards", () => {
  it("rejects unauthenticated access", async () => {
    const res = await request(createApp()).get("/api/v1/patients");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects invalid token", async () => {
    const res = await request(createApp())
      .get("/api/v1/patients")
      .set("Authorization", "Bearer bad-token");
    expect(res.status).toBe(401);
  });

  it("allows authenticated access", async () => {
    const token = await loginAs("Admin");
    const res = await request(createApp())
      .get("/api/v1/patients")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids wrong role on protected POST", async () => {
    const token = await loginAs("LabTech");
    const res = await request(createApp())
      .post("/api/v1/patients")
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

  it("blocks login until forced password change is done", async () => {
    const admin = await loginAs("Admin");
    // provision a fresh staff account (mustChangePassword defaults true)
    const created = await request(createApp())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${admin}`)
      .send({
        email: "new.nurse@careplus.local",
        name: "New Nurse",
        role: "Nurse",
        securityQuestion: "What city were you born in?",
        securityAnswer: "Pune",
      });
    expect(created.status).toBe(201);
    expect(created.body.data.tempPassword).toBeTruthy();

    const blocked = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "new.nurse@careplus.local", password: created.body.data.tempPassword });
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe("PASSWORD_CHANGE_REQUIRED");
  });

  it("resets password via security question", async () => {
    const q = await request(createApp())
      .post("/api/v1/auth/forgot-password")
      .send({ email: "admin@careplus.local" });
    expect(q.status).toBe(200);
    expect(q.body.data.securityQuestion).toBeTruthy();

    // unknown email still returns 200 (no enumeration)
    const ghost = await request(createApp())
      .post("/api/v1/auth/forgot-password")
      .send({ email: "ghost@careplus.local" });
    expect(ghost.status).toBe(200);
    expect(ghost.body.data.securityQuestion).toBeTruthy();

    // wrong answer rejected
    const bad = await request(createApp())
      .post("/api/v1/auth/reset-password")
      .send({ email: "cashier@careplus.local", answer: "WrongCity", newPassword: "NewPass@123" });
    expect(bad.status).toBe(401);

    // test users share TEST_PASSWORD as their answer (see setup)
    const ok = await request(createApp())
      .post("/api/v1/auth/reset-password")
      .send({ email: "cashier@careplus.local", answer: "Test@1234", newPassword: "NewPass@123" });
    expect(ok.status).toBe(200);

    const login = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "cashier@careplus.local", password: "NewPass@123" });
    expect(login.status).toBe(200);
  });

  it("lets an authed user change their own password", async () => {
    const token = await loginAs("Doctor");
    const bad = await request(createApp())
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "WrongPass123", newPassword: "NewDoc@123" });
    expect(bad.status).toBe(401);

    const ok = await request(createApp())
      .post("/api/v1/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "Test@1234", newPassword: "NewDoc@123" });
    expect(ok.status).toBe(200);

    const login = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "doctor@careplus.local", password: "NewDoc@123" });
    expect(login.status).toBe(200);
  });

  it("restricts staff management to Admin", async () => {
    const nurse = await loginAs("Nurse");
    const denied = await request(createApp())
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${nurse}`);
    expect(denied.status).toBe(403);

    const admin = await loginAs("Admin");
    const list = await request(createApp())
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${admin}`);
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(6);
    expect(list.body.data[0]).not.toHaveProperty("passwordHash");
    expect(list.body.data[0]).not.toHaveProperty("securityAnswerHash");

    const dup = await request(createApp())
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${admin}`)
      .send({
        email: "admin@careplus.local",
        name: "Dupe",
        role: "Nurse",
        securityQuestion: "Which city?",
        securityAnswer: "Agra",
      });
    expect(dup.status).toBe(409);

    const off = await request(createApp())
      .patch("/api/v1/users/nurse@careplus.local")
      .set("Authorization", `Bearer ${admin}`)
      .send({ isActive: false });
    expect(off.status).toBe(200);

    const locked = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "nurse@careplus.local", password: "Test@1234" });
    expect(locked.status).toBe(401);

    // restore for other suites (isolated DB per file, but be tidy)
    await request(createApp())
      .patch("/api/v1/users/nurse@careplus.local")
      .set("Authorization", `Bearer ${admin}`)
      .send({ isActive: true });
  });

  it("serves public content without auth", async () => {
    const deps = await request(createApp()).get("/api/v1/public/departments");
    expect(deps.status).toBe(200);
    expect(deps.body.data.length).toBeGreaterThan(0);
    expect(deps.body.data[0]).not.toHaveProperty("occupiedBeds");

    const docs = await request(createApp()).get("/api/v1/public/doctors");
    expect(docs.status).toBe(200);

    const stats = await request(createApp()).get("/api/v1/public/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.data.departments).toBeGreaterThan(0);
  });

  it("refresh flow works and logout revokes", async () => {
    const loginRes = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "admin@careplus.local", password: "Test@1234" });
    const { refreshToken } = loginRes.body.data as {
      token: string;
      refreshToken: string;
    };
    expect(refreshToken).toBeTruthy();

    const refreshRes = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.token).toBeTruthy();

    const logoutRes = await request(createApp()).post("/api/v1/auth/logout").send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const again = await request(createApp()).post("/api/v1/auth/refresh").send({ refreshToken });
    expect(again.status).toBe(401);
  });
});
