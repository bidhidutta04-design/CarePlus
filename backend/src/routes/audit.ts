import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listAudits } from "../repos/auditRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /api/audit?page=&limit= — append-only, read only
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listAudits();
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  }),
);

export default router;
