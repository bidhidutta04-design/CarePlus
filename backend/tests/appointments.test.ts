import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

async function adminToken(): Promise<string> {
  const res = await request(createApp())
    .post("/api/auth/login")
    .send({ role: "Admin", name: "Tester" });
  return res.body.data.token as string;
}

describe("appointment status machine", () => {
  it("creates an appointment and moves it through the legal path", async () => {
    const token = await adminToken();
    const create = await request(createApp())
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId: "CP-1001",
        doctorId: "DOC-101",
        doctorName: "Dr. Amit Verma",
        department: "Cardiology",
        date: "2026-09-05",
        timeSlot: "10:00 AM",
        priority: "Routine",
        reason: "Follow-up",
      });
    expect(create.status).toBe(201);
    const id = create.body.data.id as string;

    const toTriage = await request(createApp())
      .patch(`/api/appointments/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "In Triage" });
    expect(toTriage.status).toBe(200);
    expect(toTriage.body.data.status).toBe("In Triage");

    const toDoctor = await request(createApp())
      .patch(`/api/appointments/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "With Doctor" });
    expect(toDoctor.status).toBe(200);

    const toDone = await request(createApp())
      .patch(`/api/appointments/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Completed" });
    expect(toDone.status).toBe(200);
    expect(toDone.body.data.status).toBe("Completed");
  });

  it("rejects illegal transition", async () => {
    const token = await adminToken();
    const create = await request(createApp())
      .post("/api/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId: "CP-1001",
        doctorId: "DOC-101",
        doctorName: "Dr. Amit Verma",
        department: "Cardiology",
        date: "2026-09-05",
        timeSlot: "11:00 AM",
        priority: "Routine",
        reason: "Check",
      });
    const id = create.body.data.id as string;

    const bad = await request(createApp())
      .patch(`/api/appointments/${id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Completed" });
    expect(bad.status).toBe(409);
  });

  it("rejects transition on unknown appointment", async () => {
    const token = await adminToken();
    const res = await request(createApp())
      .patch("/api/appointments/APT-9999/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "In Triage" });
    expect(res.status).toBe(404);
  });
});
