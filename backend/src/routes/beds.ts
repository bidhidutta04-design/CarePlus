import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { getBedById, listBeds, updateBed } from "../repos/bedRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.use(auditLog);

const updateSchema = z.object({
  status: z.enum(["Vacant", "Occupied", "Sanitizing", "Reserved"]),
  patientId: z.string().optional(),
  patientName: z.string().max(100).optional(),
});

// GET /api/beds?ward=&status=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { ward = "", status = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listBeds({ ward, status });
    const occupied = list.filter((b) => b.status === "Occupied").length;
    const occupancyPct = list.length ? Math.round((occupied / list.length) * 100) : 0;
    const { data, meta } = paginateArray(list, pagination);
    res.json({
      data,
      meta: { ...meta, occupied, occupancyPct },
    });
  }),
);

// PATCH /api/beds/:id — admit / transfer / release
router.patch(
  "/:id",
  requireRole("Admin", "Nurse", "Doctor"),
  validate(updateSchema),
  asyncHandler(async (req, res, next) => {
    const bed = await getBedById(req.params.id);
    if (!bed) {
      next(ApiError.notFound("Bed"));
      return;
    }
    const { status, patientId, patientName } = req.body as z.infer<typeof updateSchema>;
    if (status === "Occupied" && !patientName && !bed.patientName) {
      next(ApiError.badRequest("patientName required to occupy a bed"));
      return;
    }
    const updated = await updateBed(req.params.id, {
      status,
      patientId: patientId ?? bed.patientId,
      patientName: patientName ?? bed.patientName,
      admittedDate: new Date().toISOString().slice(0, 10),
    });
    res.json({ data: updated });
  }),
);

export default router;
