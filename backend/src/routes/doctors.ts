import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDoctors } from "../repos/doctorRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /api/doctors?department=&availability=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { department = "", availability = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listDoctors({ department, availability }, pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

export default router;
