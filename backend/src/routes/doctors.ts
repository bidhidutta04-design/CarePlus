import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listDoctors } from "../repos/doctorRepo.js";

const router = Router();
router.use(requireAuth);

// GET /api/doctors?department=&availability=
router.get("/", async (req, res, next) => {
  try {
    const { department = "", availability = "" } = req.query as Record<string, string>;
    const list = await listDoctors({ department, availability });
    res.json({ data: list, meta: { total: list.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
