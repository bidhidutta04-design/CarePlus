import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { createLab, getLabById, listLabs, updateLab } from "../repos/labRepo.js";
import { getPatientById } from "../repos/patientRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

const resultsSchema = z
  .object({
    status: z.enum(STAGES),
    results: z.array(resultSchema).default([]),
    pathologistSign: z.string().max(80).default(""),
  })
  .refine((v) => v.status !== "Report Approved" || v.results.length > 0, {
    message: "results required for Report Approved",
    path: ["results"],
  });

// GET /api/lab?status=&patientId=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status = "", patientId = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listLabs({ status, patientId }, pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

// POST /api/lab/orders
router.post(
  "/orders",
  requireRole("Admin", "Doctor", "Nurse"),
  validate(orderSchema),
  asyncHandler(async (req, res, next) => {
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
  }),
);

// PATCH /api/lab/:id — advance stage + save results (forward-only)
router.patch(
  "/:id",
  requireRole("Admin", "LabTech"),
  validate(resultsSchema),
  asyncHandler(async (req, res, next) => {
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
  }),
);

export default router;
