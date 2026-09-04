import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { validate } from "../middleware.js";
import { ApiError } from "../errors.js";
import {
  createSession,
  deleteSession,
  findSessionByToken,
  hashToken,
  revokeFamily,
  rotateSession,
} from "../repos/sessionRepo.js";

const router = Router();

const ROLES = ["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"] as const;

const loginSchema = z.object({
  role: z.enum(ROLES),
  name: z.string().min(2).max(80),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional(),
});

function signAccessToken(payload: {
  sub: string;
  name: string;
  role: string;
  jti: string;
}): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtExpiresIn,
    issuer: "careplus-api",
    audience: "careplus-web",
  } as jwt.SignOptions);
}

function refreshCookieOptions(maxAgeMs: number): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: maxAgeMs,
  };
}

// POST /api/auth/login — role-based workstation sign-in (mock IdP; replace with LDAP/SSO).
router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { role, name } = req.body as { role: string; name: string };
    const sub = `${role}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const jti = crypto.randomUUID();
    const token = signAccessToken({ sub, name, role, jti });
    const refreshToken = crypto.randomBytes(48).toString("base64url");
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + config.jwtRefreshExpiresMs);
    await createSession({ refreshToken, sub, name, role, familyId, expiresAt });
    res.cookie("refreshToken", refreshToken, refreshCookieOptions(config.jwtRefreshExpiresMs));
    res.json({
      data: { token, refreshToken, role, name, expiresIn: config.jwtExpiresIn },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — exchange valid refresh token for new pair (rotation + reuse detection)
router.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const raw =
      (req.body as { refreshToken?: string }).refreshToken ??
      (req.cookies as Record<string, string>)?.refreshToken;
    if (!raw) {
      next(ApiError.unauthorized("Missing refresh token"));
      return;
    }
    const session = await findSessionByToken(raw);
    if (!session) {
      next(ApiError.unauthorized("Invalid refresh token"));
      return;
    }
    if (session.isRevoked) {
      // Reuse of an already-rotated token → possible theft → revoke entire family
      await revokeFamily(session.familyId);
      next(ApiError.unauthorized("Refresh token reused — family revoked"));
      return;
    }
    if (session.expiresAt.getTime() < Date.now()) {
      await deleteSession(raw);
      next(ApiError.unauthorized("Refresh token expired"));
      return;
    }
    const newRefreshToken = crypto.randomBytes(48).toString("base64url");
    const newExpiresAt = new Date(Date.now() + config.jwtRefreshExpiresMs);
    const oldHash = hashToken(raw);
    await rotateSession(oldHash, { refreshToken: newRefreshToken, expiresAt: newExpiresAt });
    const jti = crypto.randomUUID();
    const token = signAccessToken({
      sub: session.sub,
      name: session.name,
      role: session.role,
      jti,
    });
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions(config.jwtRefreshExpiresMs));
    res.json({ data: { token, refreshToken: newRefreshToken, expiresIn: config.jwtExpiresIn } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout — revoke refresh token (body or httpOnly cookie)
router.post("/logout", validate(refreshSchema), async (req, res, next) => {
  try {
    const raw =
      (req.body as { refreshToken?: string }).refreshToken ??
      (req.cookies as Record<string, string>)?.refreshToken;
    if (raw) await deleteSession(raw);
    res.clearCookie("refreshToken", { path: "/api/auth" });
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
