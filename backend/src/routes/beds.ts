import { Router } from "express";
import { z } from "zod";
import { db } from "../store.js";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  status: z.enum(["Vacant", "Occupied", "Sanitizing", "Reserved"]),
  patientId: z.string().optional(),
  patientName: z.string().max(100).optional(),
});

// GET /api/beds?ward=&status=
router.get("/", (req, res) => {
  const { ward = "", status = "" } = req.query as Record<string, string>;
  const list = db.beds.filter(
    (b) => (!ward || b.ward === ward) && (!status || b.status === status),
  );
  const occupied = list.filter((b) => b.status === "Occupied").length;
  res.json({
    data: list,
    meta: {
      total: list.length,
      occupied,
      occupancyPct: list.length ? Math.round((occupied / list.length) * 100) : 0,
    },
  });
});

// PATCH /api/beds/:id — admit / transfer / release
router.patch(
  "/:id",
  requireRole("Admin", "Nurse", "Doctor"),
  validate(updateSchema),
  (req, res, next) => {
    const bed = db.beds.find((b) => b.id === req.params.id);
    if (!bed) {
      next(ApiError.notFound("Bed"));
      return;
    }
    const { status, patientId, patientName } = req.body as z.infer<typeof updateSchema>;
    if (status === "Occupied" && !patientName && !bed.patientName) {
      next(ApiError.badRequest("patientName required to occupy a bed"));
      return;
    }
    bed.status = status;
    if (status === "Occupied") {
      bed.patientName = patientName ?? bed.patientName;
      bed.patientId = patientId ?? bed.patientId;
      bed.admittedDate = new Date().toISOString().slice(0, 10);
    } else {
      bed.patientId = undefined;
      bed.patientName = undefined;
      bed.admittedDate = undefined;
    }
    res.json({ data: bed });
  },
);

export default router;
