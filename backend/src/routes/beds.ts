import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { getBedById, listBeds, updateBed } from "../repos/bedRepo.js";

const router = Router();
router.use(requireAuth);

const updateSchema = z.object({
  status: z.enum(["Vacant", "Occupied", "Sanitizing", "Reserved"]),
  patientId: z.string().optional(),
  patientName: z.string().max(100).optional(),
});

// GET /api/beds?ward=&status=
router.get("/", async (req, res, next) => {
  try {
    const { ward = "", status = "" } = req.query as Record<string, string>;
    const list = await listBeds({ ward, status });
    const occupied = list.filter((b) => b.status === "Occupied").length;
    res.json({
      data: list,
      meta: {
        total: list.length,
        occupied,
        occupancyPct: list.length ? Math.round((occupied / list.length) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/beds/:id — admit / transfer / release
router.patch(
  "/:id",
  requireRole("Admin", "Nurse", "Doctor"),
  validate(updateSchema),
  async (req, res, next) => {
    try {
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
    } catch (err) {
      next(err);
    }
  },
);

export default router;
