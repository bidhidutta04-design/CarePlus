import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDoctors } from "../repos/doctorRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();
router.use(requireAuth);

// GET /api/doctors?department=&availability=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { department = "", availability = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listDoctors({ department, availability });
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  }),
);

export default router;
