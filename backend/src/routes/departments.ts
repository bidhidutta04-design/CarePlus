import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDepartments } from "../repos/departmentRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";

const router = Router();
router.use(requireAuth);

// GET /api/departments?page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listDepartments();
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
});

export default router;
