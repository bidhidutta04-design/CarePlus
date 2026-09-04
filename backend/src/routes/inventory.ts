import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole, validate } from "../middleware.js";
import { listInventory, restockInventory } from "../repos/inventoryRepo.js";
import { ApiError } from "../errors.js";

const router = Router();
router.use(requireAuth);

// GET /api/inventory?lowStock=true&category=
router.get("/", async (req, res, next) => {
  try {
    const { lowStock = "", category = "" } = req.query as Record<string, string>;
    const list = await listInventory({ lowStock, category });
    res.json({ data: list, meta: { total: list.length } });
  } catch (err) {
    next(err);
  }
});

const restockSchema = z.object({ qty: z.number().int().min(1).max(10000) });

// POST /api/inventory/:id/restock
router.post(
  "/:id/restock",
  requireRole("Admin"),
  validate(restockSchema),
  async (req, res, next) => {
    try {
      const { qty } = req.body as z.infer<typeof restockSchema>;
      const updated = await restockInventory(req.params.id, qty);
      if (!updated) {
        next(ApiError.notFound("Inventory item"));
        return;
      }
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
