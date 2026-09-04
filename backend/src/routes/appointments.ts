import { Router } from "express";
import { z } from "zod";
import { db, type Appointment } from "../store.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";

const router = Router();
router.use(requireAuth);

const vitalsSchema = z.object({
  bp: z.string().min(3).max(12),
  pulse: z.number().int().min(30).max(220),
  spo2: z.number().min(50).max(100),
  temp: z.number().min(90).max(110),
});

const createSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  doctorName: z.string().min(2),
  department: z.string().min(2),
  date: z.string().min(1),
  timeSlot: z.string().min(1),
  priority: z.enum(["Routine", "Urgent", "Emergency"]).default("Routine"),
  reason: z.string().min(3).max(300),
});

const statusSchema = z.object({
  status: z.enum(["Waiting", "In Triage", "With Doctor", "Completed", "Cancelled"]),
  vitals: vitalsSchema.optional(),
});

const TRANSITIONS: Record<string, string[]> = {
  Waiting: ["In Triage", "Cancelled"],
  "In Triage": ["With Doctor", "Cancelled"],
  "With Doctor": ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

// GET /api/appointments?status=&department=&priority=&search=
router.get("/", (req, res) => {
  const {
    status = "",
    department = "",
    priority = "",
    search = "",
  } = req.query as Record<string, string>;
  const q = search.toLowerCase();
  const list = db.appointments.filter(
    (a) =>
      (!status || a.status === status) &&
      (!department || a.department === department) &&
      (!priority || a.priority === priority) &&
      (!q || [a.id, a.patientName, a.doctorName, a.tokenNo].join(" ").toLowerCase().includes(q)),
  );
  res.json({ data: list, meta: { total: list.length } });
});

// POST /api/appointments
router.post("/", requireRole("Admin", "Nurse"), validate(createSchema), (req, res, next) => {
  const body = req.body as z.infer<typeof createSchema>;
  const patient = db.patients.find((p) => p.id === body.patientId);
  if (!patient) {
    next(ApiError.notFound("Patient"));
    return;
  }
  const n = 1255 + db.appointments.length + 1;
  const appt: Appointment = {
    id: `APT-${n}`,
    tokenNo: `OPD-${String(db.appointments.length + 1).padStart(2, "0")}`,
    patientName: patient.fullName,
    status: "Waiting",
    ...body,
  };
  db.appointments.unshift(appt);
  res.status(201).json({ data: appt });
});

// PATCH /api/appointments/:id/status — guarded state machine
router.patch(
  "/:id/status",
  requireRole("Admin", "Doctor", "Nurse"),
  validate(statusSchema),
  (req, res, next) => {
    const appt = db.appointments.find((a) => a.id === req.params.id);
    if (!appt) {
      next(ApiError.notFound("Appointment"));
      return;
    }
    const { status, vitals } = req.body as z.infer<typeof statusSchema>;
    if (!TRANSITIONS[appt.status].includes(status)) {
      next(ApiError.conflict(`Cannot move ${appt.status} → ${status}`));
      return;
    }
    appt.status = status;
    if (vitals) appt.vitals = vitals;
    res.json({ data: appt });
  },
);

export default router;
