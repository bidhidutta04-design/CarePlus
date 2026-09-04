import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import {
  createAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointmentStatus,
} from "../repos/appointmentRepo.js";
import { getPatientById } from "../repos/patientRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";

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

// GET /api/appointments?status=&department=&priority=&search=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const {
      status = "",
      department = "",
      priority = "",
      search = "",
    } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listAppointments({ status, department, priority, search });
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
});

// POST /api/appointments
router.post("/", requireRole("Admin", "Nurse"), validate(createSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof createSchema>;
    const patient = await getPatientById(body.patientId);
    if (!patient) {
      next(ApiError.notFound("Patient"));
      return;
    }
    const appt = await createAppointment({
      ...body,
      patientName: patient.fullName,
    });
    res.status(201).json({ data: appt });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/appointments/:id/status — guarded state machine
router.patch(
  "/:id/status",
  requireRole("Admin", "Doctor", "Nurse"),
  validate(statusSchema),
  async (req, res, next) => {
    try {
      const appt = await getAppointmentById(req.params.id);
      if (!appt) {
        next(ApiError.notFound("Appointment"));
        return;
      }
      const { status, vitals } = req.body as z.infer<typeof statusSchema>;
      if (!TRANSITIONS[appt.status].includes(status)) {
        next(ApiError.conflict(`Cannot move ${appt.status} → ${status}`));
        return;
      }
      const updated = await updateAppointmentStatus(req.params.id, status, vitals);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
