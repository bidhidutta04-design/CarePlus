import { Router } from "express";
import { requireAuth, requireRole } from "../middleware.js";
import { listAudits } from "../repos/auditRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("Admin"));

// GET /api/audit?page=&limit= — append-only, read only
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listAudits(pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

export default router;
