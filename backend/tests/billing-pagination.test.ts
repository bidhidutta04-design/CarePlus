import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

async function adminToken(): Promise<string> {
  const res = await request(createApp())
    .post("/api/auth/login")
    .send({ role: "Admin", name: "Tester" });
  return res.body.data.token as string;
}

describe("billing and pagination", () => {
  it("creates an invoice and rejects over-payment", async () => {
    const token = await adminToken();
    const create = await request(createApp())
      .post("/api/billing/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patientId: "CP-1001",
        items: [{ desc: "Consult", dept: "OPD", amount: 1000 }],
        discount: 0,
        paymentMethod: "Cash",
      });
    expect(create.status).toBe(201);
    const id = create.body.data.id as string;
    const total = create.body.data.totalAmount as number;

    const over = await request(createApp())
      .post(`/api/billing/${id}/collect`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: total + 100 });
    expect(over.status).toBe(400);

    const ok = await request(createApp())
      .post(`/api/billing/${id}/collect`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });
    expect(ok.status).toBe(200);
    expect(ok.body.data.balanceDue).toBe(total - 100);
  });

  it("paginates patient lists and supports sorting", async () => {
    const token = await adminToken();
    const p1 = await request(createApp())
      .get("/api/patients?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);
    expect(p1.status).toBe(200);
    expect(p1.body.meta.page).toBe(1);
    expect(p1.body.meta.limit).toBe(2);
    expect(p1.body.data.length).toBe(2);
    expect(p1.body.meta.total).toBeGreaterThanOrEqual(6);

    const sorted = await request(createApp())
      .get("/api/patients?sort=fullName&order=desc&page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);
    expect(sorted.status).toBe(200);
    expect(
      sorted.body.data[0].fullName.localeCompare(sorted.body.data[1].fullName),
    ).toBeGreaterThan(0);
  });

  it("beds endpoint returns occupancy meta alongside pagination", async () => {
    const token = await adminToken();
    const res = await request(createApp())
      .get("/api/beds?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBeGreaterThan(0);
    expect(res.body.meta.occupancyPct).toBeDefined();
  });

  it("audit log grows after a mutating request", async () => {
    const token = await adminToken();
    const before = await request(createApp())
      .get("/api/audit")
      .set("Authorization", `Bearer ${token}`);
    const totalBefore = before.body.meta.total as number;

    await request(createApp())
      .post("/api/patients")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Audit Test",
        age: 40,
        gender: "Male",
        phone: "+91 99999 99997",
        email: "",
        address: "Audit Addr",
        bloodGroup: "O+",
        allergies: [],
        chronicConditions: [],
        emergencyContact: { name: "EC", phone: "+91 99999 88888", relation: "Friend" },
      });

    // give audit middleware a tick (fire-and-forget)
    await new Promise((r) => setTimeout(r, 50));

    const after = await request(createApp())
      .get("/api/audit")
      .set("Authorization", `Bearer ${token}`);
    expect(after.body.meta.total).toBeGreaterThan(totalBefore);
  });
});
