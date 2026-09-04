import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listStaff } from "../repos/staffRepo.js";

const router = Router();
router.use(requireAuth);

// GET /api/staff?shift=Morning&department=
router.get("/", async (req, res, next) => {
  try {
    const { shift = "", department = "" } = req.query as Record<string, string>;
    const list = await listStaff({ shift, department });
    res.json({ data: list, meta: { total: list.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
