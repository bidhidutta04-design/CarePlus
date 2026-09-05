import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { createPatient, getPatientById, listPatients } from "../repos/patientRepo.js";
import { listAppointments } from "../repos/appointmentRepo.js";
import { listLabs } from "../repos/labRepo.js";
import { listInvoices } from "../repos/invoiceRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.use(auditLog);

const patientSchema = z.object({
  fullName: z.string().min(2).max(100),
  age: z.number().int().min(0).max(120),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z.string().min(8).max(20),
  email: z.string().email().or(z.literal("")),
  address: z.string().min(3).max(200),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  emergencyContact: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    relation: z.string().min(2),
  }),
  admissionStatus: z.enum(["OPD", "Admitted", "Discharged"]).default("OPD"),
});

// GET /api/patients?search=&status=&bloodGroup=&page=&limit=&sort=&order=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search = "", status = "", bloodGroup = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listPatients({ search, status, bloodGroup }, pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

// GET /api/patients/:id
router.get(
  "/:id",
  asyncHandler(async (req, res, next) => {
    const p = await getPatientById(req.params.id);
    if (!p) {
      next(ApiError.notFound("Patient"));
      return;
    }
    const [visits, labOrders, bills] = await Promise.all([
      listAppointments({ patientId: p.id }).then((r) => r.data),
      listLabs({ patientId: p.id }).then((r) => r.data),
      listInvoices({ patientId: p.id }).then((r) => r.data),
    ]);
    res.json({ data: { ...p, visits, labOrders, bills } });
  }),
);

// POST /api/patients
router.post(
  "/",
  requireRole("Admin", "Nurse"),
  validate(patientSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof patientSchema>;
    const patient = await createPatient(body);
    res.status(201).json({ data: patient });
  }),
);

export default router;
