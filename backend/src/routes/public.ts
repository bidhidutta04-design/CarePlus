import { Router } from "express";
import rateLimit, { type RateLimitExceededEventHandler } from "express-rate-limit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listDepartments } from "../repos/departmentRepo.js";
import { listDoctors } from "../repos/doctorRepo.js";

const router = Router();

const tooMany: RateLimitExceededEventHandler = (req, res) => {
  res.status(429).json({
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts, try again later",
      details: null,
      requestId: req.requestId,
    },
  });
};

// Stricter than the auth limiter — this surface is fully public
const publicLimiter =
  process.env.NODE_ENV === "test"
    ? (_req: unknown, _res: unknown, next: () => void): void => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 60,
        standardHeaders: true,
        legacyHeaders: false,
        handler: tooMany,
      });

router.use(publicLimiter as unknown as import("express").RequestHandler);

// GET /api/v1/public/departments — safe marketing fields only
router.get(
  "/departments",
  asyncHandler(async (_req, res) => {
    const { data } = await listDepartments({ page: 1, limit: 100, order: "asc" as const });
    res.json({
      data: data.map((d) => ({
        id: d.id,
        name: d.name,
        hod: d.hod,
        opdRooms: d.opdRooms,
        icon: d.icon,
      })),
      meta: { total: data.length },
    });
  }),
);

// GET /api/v1/public/doctors — safe marketing fields only (no schedules/fees internals beyond fee display)
router.get(
  "/doctors",
  asyncHandler(async (_req, res) => {
    const { data } = await listDoctors({}, { page: 1, limit: 100, order: "asc" as const });
    res.json({
      data: data.map((d) => ({
        id: d.id,
        name: d.name,
        qualification: d.qualification,
        department: d.department,
        roomNo: d.roomNo,
      })),
      meta: { total: data.length },
    });
  }),
);

// GET /api/v1/public/stats — headline counts only, no patient/financial detail
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [departments, doctors] = await Promise.all([
      listDepartments({ page: 1, limit: 1, order: "asc" as const }),
      listDoctors({}, { page: 1, limit: 1, order: "asc" as const }),
    ]);
    res.json({
      data: {
        departments: departments.total,
        doctors: doctors.total,
        support24x7: true,
      },
    });
  }),
);

export default router;
