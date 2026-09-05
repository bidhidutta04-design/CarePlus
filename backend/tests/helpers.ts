import request from "supertest";
import { expect } from "vitest";
import { createApp } from "../src/app.js";
import { TEST_PASSWORD, TEST_USERS } from "./setup.js";

const emailFor = (role: string): string => {
  const found = TEST_USERS.find((u) => u.role === role);
  if (!found) throw new Error(`No test user for role ${role}`);
  return found.email;
};

export async function loginAs(role = "Admin"): Promise<string> {
  const res = await request(createApp())
    .post("/api/auth/login")
    .send({ email: emailFor(role), password: TEST_PASSWORD });
  expect(res.status).toBe(200);
  const token = res.body.data.token as string;
  expect(token).toBeTruthy();
  return token;
}

export async function loginRaw(body: unknown): Promise<{ status: number; body: unknown }> {
  const res = await request(createApp()).post("/api/auth/login").send(body);
  return { status: res.status, body: res.body };
}
