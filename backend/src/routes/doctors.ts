import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { listDoctors, createDoctor } from "../repos/doctorRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

const createDoctorSchema = z.object({
  name: z.string().min(2).max(100),
  qualification: z.string().min(2).max(100),
  specialization: z.string().max(100).optional(),
  department: z.string().min(1),
  roomNo: z.string().min(1).max(20),
  fee: z.number().int().min(0),
  availability: z.enum(["Available", "In OPD", "In Surgery", "On Leave"]).default("Available"),
  schedule: z.object({
    days: z.array(z.string()).min(1),
    hours: z.string().min(3),
    maxSlots: z.number().int().min(1),
  }),
});

// GET /api/doctors?department=&availability=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { department = "", availability = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listDoctors({ department, availability }, pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

// POST /api/doctors
router.post(
  "/",
  requireRole("Admin"),
  validate(createDoctorSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createDoctorSchema>;
    const doctor = await createDoctor(body);
    res.status(201).json({ data: doctor });
  }),
);

export default router;
