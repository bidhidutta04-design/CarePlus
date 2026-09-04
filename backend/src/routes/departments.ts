import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDepartments } from "../repos/departmentRepo.js";

const router = Router();
router.use(requireAuth);

// GET /api/departments
router.get("/", async (_req, res, next) => {
  try {
    const list = await listDepartments();
    res.json({ data: list, meta: { total: list.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
