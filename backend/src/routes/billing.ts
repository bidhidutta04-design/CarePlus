import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import {
  collectInvoice,
  createInvoice,
  getInvoiceById,
  listInvoices,
} from "../repos/invoiceRepo.js";
import { getPatientById } from "../repos/patientRepo.js";

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
router.get("/", async (req, res, next) => {
  try {
    const { status = "", patientId = "" } = req.query as Record<string, string>;
    const list = await listInvoices({ status, patientId });
    const billed = list.reduce((s, i) => s + i.totalAmount, 0);
    const collected = list.reduce((s, i) => s + i.paidAmount, 0);
    res.json({
      data: list,
      meta: { total: list.length, billed, collected, pending: billed - collected },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/billing/invoices
router.post(
  "/invoices",
  requireRole("Admin", "Cashier"),
  validate(createSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      const patient = await getPatientById(body.patientId);
      if (!patient) {
        next(ApiError.notFound("Patient"));
        return;
      }
      const subtotal = body.items.reduce((s, i) => s + i.amount, 0);
      const tax = Math.round((subtotal - body.discount) * 0.05);
      const totalAmount = subtotal - body.discount + tax;
      const inv = await createInvoice({
        patientId: body.patientId,
        patientName: patient.fullName,
        items: body.items,
        subtotal,
        discount: body.discount,
        tax,
        totalAmount,
        paymentMethod: body.paymentMethod,
        tpaProvider: body.tpaProvider,
      });
      res.status(201).json({ data: inv });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/billing/:id/collect
router.post(
  "/:id/collect",
  requireRole("Admin", "Cashier"),
  validate(collectSchema),
  async (req, res, next) => {
    try {
      const inv = await getInvoiceById(req.params.id);
      if (!inv) {
        next(ApiError.notFound("Invoice"));
        return;
      }
      const { amount } = req.body as z.infer<typeof collectSchema>;
      if (amount > inv.balanceDue) {
        next(ApiError.badRequest(`Amount exceeds balance due (${inv.balanceDue})`));
        return;
      }
      const updated = await collectInvoice(req.params.id, amount);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
