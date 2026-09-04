import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

async function login(role = "Admin", name = "Tester"): Promise<string> {
  const res = await request(createApp()).post("/api/auth/login").send({ role, name });
  expect(res.status).toBe(201 === res.status ? 201 : 200);
  // login returns 200 with { data: { token } } — our route uses 200
  const token = res.body.data.token as string;
  expect(token).toBeTruthy();
  return token;
}

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
    const token = await login("Admin", "Admin User");
    const res = await request(createApp())
      .get("/api/patients")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("forbids wrong role on protected POST", async () => {
    const token = await login("LabTech", "Lab User");
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

  it("login validation rejects bad role", async () => {
    const res = await request(createApp())
      .post("/api/auth/login")
      .send({ role: "Hacker", name: "X" });
    expect(res.status).toBe(400);
  });

  it("refresh flow works and logout revokes", async () => {
    const loginRes = await request(createApp())
      .post("/api/auth/login")
      .send({ role: "Admin", name: "Refresh Tester" });
    const { token: _token, refreshToken } = loginRes.body.data as {
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
