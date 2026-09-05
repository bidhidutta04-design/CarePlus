import { Router } from "express";
import { z } from "zod";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { listInventory, restockInventory } from "../repos/inventoryRepo.js";
import { ApiError } from "../errors.js";
import { paginateArray, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.use(auditLog);

// GET /api/inventory?lowStock=true&category=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { lowStock = "", category = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listInventory({ lowStock, category });
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  }),
);

const restockSchema = z.object({ qty: z.number().int().min(1).max(10000) });

// POST /api/inventory/:id/restock
router.post(
  "/:id/restock",
  requireRole("Admin"),
  validate(restockSchema),
  asyncHandler(async (req, res, next) => {
    const { qty } = req.body as z.infer<typeof restockSchema>;
    const updated = await restockInventory(req.params.id, qty);
    if (!updated) {
      next(ApiError.notFound("Inventory item"));
      return;
    }
    res.json({ data: updated });
  }),
);

export default router;
