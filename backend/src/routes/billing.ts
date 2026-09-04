import { Router } from "express";
import { z } from "zod";
import { db, type Invoice } from "../store.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";

const router = Router();
router.use(requireAuth);

const itemSchema = z.object({
  desc: z.string().min(2).max(120),
  dept: z.enum(["OPD", "IPD", "Lab", "Pharmacy", "Radiology"]),
  amount: z.number().positive(),
});

const createSchema = z.object({
  patientId: z.string().min(1),
  items: z.array(itemSchema).min(1),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(["Cash", "Card", "UPI", "TPA Insurance"]),
  tpaProvider: z.string().max(80).optional(),
});

const collectSchema = z.object({
  amount: z.number().positive(),
});

// GET /api/billing?status=&patientId=
router.get("/", (req, res) => {
  const { status = "", patientId = "" } = req.query as Record<string, string>;
  const list = db.invoices.filter(
    (i) => (!status || i.status === status) && (!patientId || i.patientId === patientId),
  );
  const billed = list.reduce((s, i) => s + i.totalAmount, 0);
  const collected = list.reduce((s, i) => s + i.paidAmount, 0);
  res.json({
    data: list,
    meta: { total: list.length, billed, collected, pending: billed - collected },
  });
});

// POST /api/billing/invoices
router.post(
  "/invoices",
  requireRole("Admin", "Cashier"),
  validate(createSchema),
  (req, res, next) => {
    const body = req.body as z.infer<typeof createSchema>;
    const patient = db.patients.find((p) => p.id === body.patientId);
    if (!patient) {
      next(ApiError.notFound("Patient"));
      return;
    }
    const subtotal = body.items.reduce((s, i) => s + i.amount, 0);
    const tax = Math.round((subtotal - body.discount) * 0.05);
    const totalAmount = subtotal - body.discount + tax;
    const inv: Invoice = {
      id: `INV-2025-${String(db.invoices.length + 1).padStart(3, "0")}`,
      patientName: patient.fullName,
      patientId: patient.id,
      date: new Date().toISOString().slice(0, 10),
      items: body.items,
      subtotal,
      discount: body.discount,
      tax,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      paymentMethod: body.paymentMethod,
      tpaProvider: body.tpaProvider,
      status: "Unpaid",
    };
    db.invoices.unshift(inv);
    res.status(201).json({ data: inv });
  },
);

// POST /api/billing/:id/collect
router.post(
  "/:id/collect",
  requireRole("Admin", "Cashier"),
  validate(collectSchema),
  (req, res, next) => {
    const inv = db.invoices.find((i) => i.id === req.params.id);
    if (!inv) {
      next(ApiError.notFound("Invoice"));
      return;
    }
    const { amount } = req.body as z.infer<typeof collectSchema>;
    if (amount > inv.balanceDue) {
      next(ApiError.badRequest(`Amount exceeds balance due (${inv.balanceDue})`));
      return;
    }
    inv.paidAmount += amount;
    inv.balanceDue = inv.totalAmount - inv.paidAmount;
    inv.status = inv.balanceDue === 0 ? "Paid" : "Partial";
    res.json({ data: inv });
  },
);

export default router;
