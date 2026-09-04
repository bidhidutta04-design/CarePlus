import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { listAudits } from "../repos/auditRepo.js";
import { paginateArray, parsePagination } from "../paginate.js";

const router = Router();
router.use(requireAuth);

// GET /api/audit?page=&limit= — append-only, read only
router.get("/", async (req, res, next) => {
  try {
    const pagination = parsePagination(req.query as Record<string, string>);
    const list = await listAudits();
    const { data, meta } = paginateArray(list, pagination);
    res.json({ data, meta });
  } catch (err) {
    next(err);
  }
});

export default router;
