import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDoctors } from "../repos/doctorRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";

const router = Router();
router.use(requireAuth);

// GET /api/doctors?department=&availability=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { department = "", availability = "" } = req.query as Record<string, string>;
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listDoctors({ department, availability });
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
});

export default router;
