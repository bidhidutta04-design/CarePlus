import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { createLab, getLabById, listLabs, updateLab } from "../repos/labRepo.js";
import { getPatientById } from "../repos/patientRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";

const router = Router();
router.use(requireAuth);
router.use(auditLog);

const STAGES = ["Ordered", "Sample Collected", "Under Analysis", "Report Approved"] as const;

const orderSchema = z.object({
  patientId: z.string().min(1),
  testName: z.string().min(2).max(80),
  doctorName: z.string().min(2).max(80),
});

const resultSchema = z.object({
  parameter: z.string().min(1).max(60),
  value: z.string().min(1).max(60),
  unit: z.string().max(20).default(""),
  normalRange: z.string().max(60).default(""),
  isAbnormal: z.boolean().default(false),
});

const resultsSchema = z.object({
  status: z.enum(STAGES),
  results: z.array(resultSchema).min(1),
  pathologistSign: z.string().max(80).default(""),
});

// GET /api/lab?status=&patientId=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { status = "", patientId = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listLabs({ status, patientId });
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
});

// POST /api/lab/orders
router.post(
  "/orders",
  requireRole("Admin", "Doctor", "Nurse"),
  validate(orderSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof orderSchema>;
      const patient = await getPatientById(body.patientId);
      if (!patient) {
        next(ApiError.notFound("Patient"));
        return;
      }
      const testCode = body.testName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 5)
        .toUpperCase();
      const report = await createLab({
        testCode,
        testName: body.testName,
        patientId: body.patientId,
        patientName: patient.fullName,
        doctorName: body.doctorName,
        orderDate: new Date().toISOString().slice(0, 10),
      });
      res.status(201).json({ data: report });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/lab/:id — advance stage + save results (forward-only)
router.patch(
  "/:id",
  requireRole("Admin", "LabTech"),
  validate(resultsSchema),
  async (req, res, next) => {
    try {
      const lab = await getLabById(req.params.id);
      if (!lab) {
        next(ApiError.notFound("Lab report"));
        return;
      }
      const { status, results, pathologistSign } = req.body as z.infer<typeof resultsSchema>;
      if (STAGES.indexOf(status) < STAGES.indexOf(lab.status)) {
        next(ApiError.conflict(`Cannot regress ${lab.status} → ${status}`));
        return;
      }
      const updated = await updateLab(req.params.id, {
        status,
        results,
        pathologistSign:
          status === "Report Approved"
            ? pathologistSign || req.user?.name || "Pathologist"
            : pathologistSign,
      });
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
