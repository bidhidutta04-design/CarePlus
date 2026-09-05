import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

describe("enterprise guarantees", () => {
  it("reports ready when the database is connected", async () => {
    const res = await request(createApp()).get("/ready");
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.db).toBe("connected");
  });

  it("patient detail shows records created in the database", async () => {
    const token = await loginAs("Admin");
    // create an appointment for CP-1002 in the DB (not the seed file)
    const create = await request(createApp())
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId: "CP-1002",
        doctorId: "DOC-102",
        doctorName: "Dr. Neha Kapoor",
        department: "Gynecology",
        date: "2026-09-06",
        timeSlot: "09:00 AM",
        priority: "Routine",
        reason: "DB visibility check",
      });
    expect(create.status).toBe(201);
    const newId = create.body.data.id as string;

    const detail = await request(createApp())
      .get("/api/v1/patients/CP-1002")
      .set("Authorization", `Bearer ${token}`);
    expect(detail.status).toBe(200);
    const visits = detail.body.data.visits as { id: string }[];
    expect(visits.some((v) => v.id === newId)).toBe(true);
  });

  it("concurrent dispenses never oversell stock", async () => {
    const admin = await loginAs("Admin");
    // find a medicine with small stock in the seeded DB
    const list = await request(createApp())
      .get("/api/v1/pharmacy?search=Telma")
      .set("Authorization", `Bearer ${admin}`);
    const med = list.body.data[0] as { id: string; stockCount: number };
    const qty = med.stockCount; // each request alone would succeed, together they exceed

    const pharm = await loginAs("Pharmacist");
    const [r1, r2] = await Promise.all([
      request(createApp())
        .post("/api/v1/pharmacy/dispense")
        .set("Authorization", `Bearer ${pharm}`)
        .send({ medicineId: med.id, qty, patientId: "CP-1001" }),
      request(createApp())
        .post("/api/v1/pharmacy/dispense")
        .set("Authorization", `Bearer ${pharm}`)
        .send({ medicineId: med.id, qty, patientId: "CP-1001" }),
    ]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const after = await request(createApp())
      .get("/api/v1/pharmacy?search=Telma")
      .set("Authorization", `Bearer ${admin}`);
    expect((after.body.data[0] as { stockCount: number }).stockCount).toBe(0);
  });

  it("concurrent creates get unique ids", async () => {
    const token = await loginAs("Admin");
    const payload = (slot: string) => ({
      patientId: "CP-1001",
      doctorId: "DOC-101",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: "2026-09-06",
      timeSlot: slot,
      priority: "Routine",
      reason: "Race check",
    });
    const results = await Promise.all(
      ["02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM", "03:00 PM"].map((slot) =>
        request(createApp())
          .post("/api/v1/appointments")
          .set("Authorization", `Bearer ${token}`)
          .send(payload(slot)),
      ),
    );
    for (const r of results) expect(r.status).toBe(201);
    const ids = results.map((r) => r.body.data.id as string);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refresh token reuse revokes the whole family", async () => {
    const loginRes = await request(createApp())
      .post("/api/v1/auth/login")
      .send({ email: "admin@careplus.local", password: "Test@1234" });
    const firstRt = loginRes.body.data.refreshToken as string;

    const refresh1 = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: firstRt });
    expect(refresh1.status).toBe(200);
    const secondRt = refresh1.body.data.refreshToken as string;
    expect(secondRt).not.toBe(firstRt);

    // replay the old (rotated) token → theft detected, family revoked
    const replay = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: firstRt });
    expect(replay.status).toBe(401);

    // the current token is dead too — whole family revoked
    const afterRevoke = await request(createApp())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: secondRt });
    expect(afterRevoke.status).toBe(401);
  });
});
