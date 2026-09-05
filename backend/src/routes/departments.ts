import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDepartments } from "../repos/departmentRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /api/departments?page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listDepartments();
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  }),
);

export default router;
