import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listStaff } from "../repos/staffRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";

const router = Router();
router.use(requireAuth);

// GET /api/staff?shift=Morning&department=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { shift = "", department = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listStaff({ shift, department });
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
});

export default router;
