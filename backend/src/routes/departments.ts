import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDepartments } from "../repos/departmentRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /api/departments?page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listDepartments(pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

export default router;
