import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import {
  createMedicine,
  dispenseMedicine,
  getMedicineById,
  listMedicines,
} from "../repos/medicineRepo.js";
import { getPatientById } from "../repos/patientRepo.js";
import { appendInvoiceItem, createInvoice, findOpenInvoice } from "../repos/invoiceRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { billTotals } from "../utils/money.js";

const router = Router();
router.use(requireAuth);
router.use(auditLog);

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

// GET /api/pharmacy?search=&lowStock=true&page=&limit= — FEFO sorted
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search = "", lowStock = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listMedicines({ search, lowStock }, pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

// POST /api/pharmacy/batches
router.post(
  "/batches",
  requireRole("Admin", "Pharmacist"),
  validate(batchSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof batchSchema>;
    const med = await createMedicine(body);
    res.status(201).json({ data: med });
  }),
);

// POST /api/pharmacy/dispense — checks stock, deducts, posts charge to billing
router.post(
  "/dispense",
  requireRole("Admin", "Pharmacist"),
  validate(dispenseSchema),
  asyncHandler(async (req, res, next) => {
    const { medicineId, qty, patientId } = req.body as z.infer<typeof dispenseSchema>;
    const med = await getMedicineById(medicineId);
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
    const patient = await getPatientById(patientId);
    if (!patient) {
      next(ApiError.notFound("Patient"));
      return;
    }
    const updated = await dispenseMedicine(medicineId, qty);
    if (!updated) {
      // Lost a concurrent race after the pre-check — atomic guard refused
      next(ApiError.conflict("Insufficient stock"));
      return;
    }
    const charge = med.unitPrice * qty;
    // Post charge to billing: append to patient's open bill, else open a new one
    const lineItem = {
      desc: `${med.brandName} x${qty}`,
      dept: "Pharmacy" as const,
      amount: charge,
    };
    const openBill = await findOpenInvoice(patientId);
    const bill = openBill
      ? await appendInvoiceItem(openBill.id, lineItem)
      : await createInvoice({
          patientId,
          patientName: patient.fullName,
          items: [lineItem],
          ...billTotals([lineItem], 0),
          paymentMethod: "Cash",
        });
    res.json({
      data: { medicine: updated, dispensedQty: qty, charge, patientId, billId: bill?.id ?? null },
    });
  }),
);

export default router;
