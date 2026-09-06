import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { getBedById, listBeds, updateBed } from "../repos/bedRepo.js";
import { setAdmissionStatus } from "../repos/patientRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
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
    const { data, total, occupied, occupancyPct } = await listBeds({ ward, status }, pagination);
    res.json({
      data,
      meta: { ...paginatedMeta(total, pagination), occupied, occupancyPct },
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
    if (status === "Occupied" && !patientId && !bed.patientId) {
      next(ApiError.badRequest("patientId required to occupy a bed"));
      return;
    }
    // Pass through only what the caller sent — the repo clears patient fields
    // itself on release, so stale values must never be re-merged here.
    const updated = await updateBed(
      req.params.id,
      status === "Occupied"
        ? {
            status,
            patientId,
            patientName,
            admittedDate: new Date().toISOString().slice(0, 10),
          }
        : { status },
    );
    // Keep the patient directory consistent with the bed board.
    const previousId = bed.patientId;
    if (status === "Occupied" && patientId) {
      if (previousId && previousId !== patientId) {
        await setAdmissionStatus(previousId, "Discharged");
      }
      await setAdmissionStatus(patientId, "Admitted");
    } else if (status === "Vacant" && previousId) {
      await setAdmissionStatus(previousId, "Discharged");
    }
    res.json({ data: updated });
  }),
);

export default router;
