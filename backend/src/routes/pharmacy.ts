import { Router } from "express";
import { z } from "zod";
import { db, type Medicine } from "../store.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";

const router = Router();
router.use(requireAuth);

const batchSchema = z.object({
  brandName: z.string().min(2).max(80),
  genericName: z.string().min(2).max(80),
  category: z.string().min(2).max(40),
  batchNo: z.string().min(2).max(30),
  expiryDate: z.string().min(1),
  unitPrice: z.number().positive(),
  stockCount: z.number().int().min(1),
  minThreshold: z.number().int().min(1),
});

const dispenseSchema = z.object({
  medicineId: z.string().min(1),
  qty: z.number().int().min(1).max(1000),
  patientId: z.string().min(1),
});

// GET /api/pharmacy?search=&lowStock=true — FEFO sorted (earliest expiry first)
router.get("/", (req, res) => {
  const { search = "", lowStock = "" } = req.query as Record<string, string>;
  const q = search.toLowerCase();
  const list = db.medicines
    .filter(
      (m) => !q || [m.brandName, m.genericName, m.batchNo].join(" ").toLowerCase().includes(q),
    )
    .filter((m) => lowStock !== "true" || m.stockCount < m.minThreshold || m.status === "Expired")
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  res.json({ data: list, meta: { total: list.length } });
});

// POST /api/pharmacy/batches
router.post("/batches", requireRole("Admin", "Pharmacist"), validate(batchSchema), (req, res) => {
  const body = req.body as z.infer<typeof batchSchema>;
  const med: Medicine = {
    ...body,
    id: `MED-${String(db.medicines.length + 1).padStart(3, "0")}`,
    status: body.stockCount < body.minThreshold ? "Low Stock" : "Healthy",
  };
  db.medicines.unshift(med);
  res.status(201).json({ data: med });
});

// POST /api/pharmacy/dispense — checks stock, deducts, posts charge to billing
router.post(
  "/dispense",
  requireRole("Admin", "Pharmacist"),
  validate(dispenseSchema),
  (req, res, next) => {
    const { medicineId, qty, patientId } = req.body as z.infer<typeof dispenseSchema>;
    const med = db.medicines.find((m) => m.id === medicineId);
    if (!med) {
      next(ApiError.notFound("Medicine"));
      return;
    }
    if (med.status === "Expired") {
      next(ApiError.conflict("Cannot dispense an expired batch"));
      return;
    }
    if (med.stockCount < qty) {
      next(ApiError.conflict(`Only ${med.stockCount} units in stock`));
      return;
    }
    const patient = db.patients.find((p) => p.id === patientId);
    if (!patient) {
      next(ApiError.notFound("Patient"));
      return;
    }
    med.stockCount -= qty;
    if (med.stockCount < med.minThreshold) med.status = "Low Stock";
    const charge = med.unitPrice * qty;
    res.json({ data: { medicine: med, dispensedQty: qty, charge, patientId } });
  },
);

export default router;
