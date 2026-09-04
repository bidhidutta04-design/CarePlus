import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { validate } from "../middleware.js";
import { ApiError } from "../errors.js";
import { createSession, deleteSession, findSession } from "../repos/sessionRepo.js";

const router = Router();

const ROLES = ["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"] as const;

const loginSchema = z.object({
  role: z.enum(ROLES),
  name: z.string().min(2).max(80),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

function signAccessToken(payload: { sub: string; name: string; role: string }): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

// POST /api/auth/login — role-based workstation sign-in (mock IdP; replace with LDAP/SSO).
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { role, name } = req.body as { role: string; name: string };
    const sub = `${role}-${Date.now()}`;
    const token = signAccessToken({ sub, name, role });
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createSession({ refreshToken, sub, name, role, expiresAt });
    res.json({
      data: { token, refreshToken, role, name, expiresIn: config.jwtExpiresIn },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — exchange valid refresh token for new access token
router.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const session = await findSession(refreshToken);
    if (!session) {
      next(ApiError.unauthorized("Invalid refresh token"));
      return;
    }
    if (session.expiresAt.getTime() < Date.now()) {
      await deleteSession(refreshToken);
      next(ApiError.unauthorized("Refresh token expired"));
      return;
    }
    const token = signAccessToken({ sub: session.sub, name: session.name, role: session.role });
    res.json({ data: { token, expiresIn: config.jwtExpiresIn } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — revoke refresh token
router.post("/logout", validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    await deleteSession(refreshToken);
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/roles
router.get("/roles", (_req, res) => {
  res.json({ data: ROLES });
});

export default router;
