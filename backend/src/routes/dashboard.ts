import { Router } from "express";
import { requireAuth } from "../middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardStats } from "../repos/dashboardRepo.js";

const router = Router();
router.use(requireAuth);

// GET /api/dashboard/stats — one call for the overview screen
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const data = await getDashboardStats();
    res.json({ data });
  }),
);

export default router;
