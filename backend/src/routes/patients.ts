import { Router } from "express";
import { z } from "zod";
import { db, type Patient } from "../store.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";

const router = Router();
router.use(requireAuth);

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
  emergencyContact: z.object({ name: z.string().min(2), phone: z.string().min(8), relation: z.string().min(2) }),
  admissionStatus: z.enum(["OPD", "Admitted", "Discharged"]).default("OPD"),
});

// GET /api/patients?search=&status=&bloodGroup=
router.get("/", (req, res) => {
  const { search = "", status = "", bloodGroup = "" } = req.query as Record<string, string>;
  const q = search.toLowerCase();
  const list = db.patients.filter(
    (p) =>
      (!status || p.admissionStatus === status) &&
      (!bloodGroup || p.bloodGroup === bloodGroup) &&
      (!q || [p.id, p.fullName, p.phone].join(" ").toLowerCase().includes(q))
  );
  res.json({ data: list, meta: { total: list.length } });
});

// GET /api/patients/:id
router.get("/:id", (req, res, next) => {
  const p = db.patients.find((x) => x.id === req.params.id);
  if (!p) {
    next(ApiError.notFound("Patient"));
    return;
  }
  const visits = db.appointments.filter((a) => a.patientId === p.id);
  const labOrders = db.labs.filter((l) => l.patientId === p.id);
  const bills = db.invoices.filter((i) => i.patientId === p.id);
  res.json({ data: { ...p, visits, labOrders, bills } });
});

// POST /api/patients
router.post("/", requireRole("Admin", "Nurse"), validate(patientSchema), (req, res) => {
  const body = req.body as z.infer<typeof patientSchema>;
  const id = `CP-${1001 + db.patients.length + 1}`;
  const patient: Patient = { ...body, id, registeredDate: new Date().toISOString().slice(0, 10) };
  db.patients.unshift(patient);
  res.status(201).json({ data: patient });
});

export default router;
