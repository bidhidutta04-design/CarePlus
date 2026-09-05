import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loginAs } from "./helpers.js";

describe("pharmacy and lab guards", () => {
  it("rejects dispensing an expired batch", async () => {
    // Create an expired batch first (expiry in the past is allowed as intake)
    const admin = await loginAs("Admin");
    const batch = await request(createApp())
      .post("/api/v1/pharmacy/batches")
      .set("Authorization", `Bearer ${admin}`)
      .send({
        brandName: "Expired Test",
        genericName: "Test Expired",
        category: "Test",
        batchNo: `EXP-${Date.now()}`,
        expiryDate: "2020-01-01",
        unitPrice: 10,
        stockCount: 50,
        minThreshold: 10,
      });
    expect(batch.status).toBe(201);
    // Past-date batch must be blocked by the date guard even with plenty of stock
    const pharm = await loginAs("Pharmacist");
    const blocked = await request(createApp())
      .post("/api/v1/pharmacy/dispense")
      .set("Authorization", `Bearer ${pharm}`)
      .send({ medicineId: batch.body.data.id, qty: 1, patientId: "CP-1001" });
    expect(blocked.status).toBe(409);
    // And oversized qty is still rejected by the stock guard
    const dispense = await request(createApp())
      .post("/api/v1/pharmacy/dispense")
      .set("Authorization", `Bearer ${pharm}`)
      .send({ medicineId: batch.body.data.id, qty: 1000, patientId: "CP-1001" });
    expect(dispense.status).toBe(409);
  });

  it("rejects invalid expiry dates on batch intake", async () => {
    const admin = await loginAs("Admin");
    for (const bad of ["banana", "31-13-2025", "2025-13-40"]) {
      const res = await request(createApp())
        .post("/api/v1/pharmacy/batches")
        .set("Authorization", `Bearer ${admin}`)
        .send({
          brandName: "Bad Date",
          genericName: "Bad",
          category: "Test",
          batchNo: `BAD-${Date.now()}-${bad.length}`,
          expiryDate: bad,
          unitPrice: 10,
          stockCount: 50,
          minThreshold: 10,
        });
      expect(res.status).toBe(400);
    }
  });

  it("dispenses and reduces stock", async () => {
    const admin = await loginAs("Admin");
    const before = await request(createApp())
      .get("/api/v1/pharmacy?search=Crocin")
      .set("Authorization", `Bearer ${admin}`);
    const stockBefore = before.body.data[0].stockCount as number;
    const id = before.body.data[0].id as string;

    const pharm = await loginAs("Pharmacist");
    const dispense = await request(createApp())
      .post("/api/v1/pharmacy/dispense")
      .set("Authorization", `Bearer ${pharm}`)
      .send({ medicineId: id, qty: 1, patientId: "CP-1001" });
    expect(dispense.status).toBe(200);
    expect(dispense.body.data.charge).toBeGreaterThan(0);

    const after = await request(createApp())
      .get("/api/v1/pharmacy?search=Crocin")
      .set("Authorization", `Bearer ${admin}`);
    const stockAfter = after.body.data[0].stockCount as number;
    expect(stockAfter).toBe(stockBefore - 1);
    expect(dispense.body.data.billId).toBeTruthy();
  });

  it("lab stage cannot regress", async () => {
    const admin = await loginAs("Admin");
    const order = await request(createApp())
      .post("/api/v1/lab/orders")
      .set("Authorization", `Bearer ${admin}`)
      .send({ patientId: "CP-1001", testName: "Test Regress", doctorName: "Dr. Test" });
    expect(order.status).toBe(201);
    const id = order.body.data.id as string;

    // advance to Sample Collected
    const labTech = await loginAs("LabTech");
    const advance = await request(createApp())
      .patch(`/api/v1/lab/${id}`)
      .set("Authorization", `Bearer ${labTech}`)
      .send({
        status: "Sample Collected",
        results: [{ parameter: "P", value: "1", unit: "", normalRange: "", isAbnormal: false }],
      });
    expect(advance.status).toBe(200);

    const regress = await request(createApp())
      .patch(`/api/v1/lab/${id}`)
      .set("Authorization", `Bearer ${labTech}`)
      .send({
        status: "Ordered",
        results: [{ parameter: "P", value: "1", unit: "", normalRange: "", isAbnormal: false }],
      });
    expect(regress.status).toBe(409);
  });
});
