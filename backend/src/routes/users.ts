import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../errors.js";
import { auditLog, requireAuth, requireRole, validate } from "../middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  adminResetPassword,
  createStaffUser,
  listStaffUsers,
  setUserActive,
} from "../repos/userRepo.js";
import { paginatedMeta, parsePagination } from "../paginate.js";

const router = Router();
router.use(requireAuth);
router.use(requireRole("Admin"));
router.use(auditLog);

const ROLES = ["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"] as const;

const createSchema = z.object({
  email: z.string().email().max(120),
  name: z.string().min(2).max(80),
  role: z.enum(ROLES),
  securityQuestion: z.string().min(4).max(200),
  securityAnswer: z.string().min(2).max(200),
});

const activeSchema = z.object({
  isActive: z.boolean(),
});

// GET /api/v1/users — paginated staff list (hashes never leave the server)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req.query as Record<string, string>);
    const { data, total } = await listStaffUsers(pagination);
    res.json({ data, meta: paginatedMeta(total, pagination) });
  }),
);

// POST /api/v1/users — provision account; returns one-time temp password
router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof createSchema>;
      const { user, tempPassword } = await createStaffUser(body);
      res.status(201).json({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
          securityQuestion: user.securityQuestion,
          tempPassword,
        },
      });
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        next(ApiError.conflict("An account with this email already exists"));
        return;
      }
      throw err;
    }
  }),
);

// PATCH /api/v1/users/:email — activate / deactivate
router.patch(
  "/:email",
  validate(activeSchema),
  asyncHandler(async (req, res, next) => {
    const { isActive } = req.body as { isActive: boolean };
    const ok = await setUserActive(req.params.email, isActive);
    if (!ok) {
      next(ApiError.notFound("User"));
      return;
    }
    res.json({ data: { ok: true } });
  }),
);

// POST /api/v1/users/:email/reset-password — admin-issued temp password
router.post(
  "/:email/reset-password",
  asyncHandler(async (req, res, next) => {
    const result = await adminResetPassword(req.params.email);
    if (!result) {
      next(ApiError.notFound("User"));
      return;
    }
    res.json({ data: result });
  }),
);

export default router;
