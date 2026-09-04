import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listAudits } from "../repos/auditRepo.js";

const router = Router();
router.use(requireAuth);

// GET /api/audit — append-only, read only
router.get("/", async (_req, res, next) => {
  try {
    const list = await listAudits();
    res.json({ data: list, meta: { total: list.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
