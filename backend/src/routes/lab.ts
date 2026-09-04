import { Router } from "express";
import { z } from "zod";
import { db, type LabReport } from "../store.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";

const router = Router();
router.use(requireAuth);

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

// GET /api/lab?status=&patientId=
router.get("/", (req, res) => {
  const { status = "", patientId = "" } = req.query as Record<string, string>;
  const list = db.labs.filter(
    (l) => (!status || l.status === status) && (!patientId || l.patientId === patientId),
  );
  res.json({ data: list, meta: { total: list.length } });
});

// POST /api/lab/orders
router.post(
  "/orders",
  requireRole("Admin", "Doctor", "Nurse"),
  validate(orderSchema),
  (req, res, next) => {
    const body = req.body as z.infer<typeof orderSchema>;
    const patient = db.patients.find((p) => p.id === body.patientId);
    if (!patient) {
      next(ApiError.notFound("Patient"));
      return;
    }
    const report: LabReport = {
      id: `LAB-${2001 + db.labs.length}`,
      testCode: body.testName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 5)
        .toUpperCase(),
      ...body,
      patientName: patient.fullName,
      orderDate: new Date().toISOString().slice(0, 10),
      status: "Ordered",
      results: [],
      pathologistSign: "",
    };
    db.labs.unshift(report);
    res.status(201).json({ data: report });
  },
);

// PATCH /api/lab/:id — advance stage + save results (forward-only)
router.patch("/:id", requireRole("Admin", "LabTech"), validate(resultsSchema), (req, res, next) => {
  const lab = db.labs.find((l) => l.id === req.params.id);
  if (!lab) {
    next(ApiError.notFound("Lab report"));
    return;
  }
  const { status, results, pathologistSign } = req.body as z.infer<typeof resultsSchema>;
  if (STAGES.indexOf(status) < STAGES.indexOf(lab.status)) {
    next(ApiError.conflict(`Cannot regress ${lab.status} → ${status}`));
    return;
  }
  lab.status = status;
  lab.results = results;
  if (status === "Report Approved")
    lab.pathologistSign = pathologistSign || req.user?.name || "Pathologist";
  res.json({ data: lab });
});

export default router;
