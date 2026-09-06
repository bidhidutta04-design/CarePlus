import { Router } from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { requireAuth, validate } from "../middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../errors.js";
import {
  createSession,
  deleteSession,
  findSessionByToken,
  hashToken,
  revokeFamily,
  rotateSession,
} from "../repos/sessionRepo.js";
import { findUserByEmail, verifyPassword } from "../repos/userRepo.js";

const router = Router();

const ROLES = ["Admin", "Doctor", "Nurse", "Pharmacist", "LabTech", "Cashier"] as const;

const loginSchema = z.object({
  email: z.string().email().max(120),
  password: z.string().min(8).max(128),
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
  // Always sign with the newest secret (last in rotation list)
  const secrets = config.jwtAccessSecrets;
  const active = secrets[secrets.length - 1];
  return jwt.sign(payload, active, {
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
    path: "/api/v1/auth",
    maxAge: maxAgeMs,
  };
}

// POST /api/auth/login — credential sign-in against User collection (bcrypt).
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      next(ApiError.badRequest("Auth service unavailable — database not connected"));
      return;
    }
    const { email, password } = req.body as { email: string; password: string };
    const user = await findUserByEmail(email);
    if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) {
      next(ApiError.unauthorized("Invalid credentials"));
      return;
    }
    if (user.mustChangePassword) {
      res.status(403).json({
        error: {
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "You must change your password before continuing.",
          details: null,
          requestId: req.requestId,
        },
      });
      return;
    }
    const sub = `user-${user.email}`;
    const jti = crypto.randomUUID();
    const token = signAccessToken({ sub, name: user.name, role: user.role, jti });
    const refreshToken = crypto.randomBytes(48).toString("base64url");
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + config.jwtRefreshExpiresMs);
    await createSession({
      refreshToken,
      sub,
      name: user.name,
      role: user.role,
      familyId,
      expiresAt,
    });
    res.cookie("refreshToken", refreshToken, refreshCookieOptions(config.jwtRefreshExpiresMs));
    res.json({
      data: {
        token,
        refreshToken,
        role: user.role,
        name: user.name,
        expiresIn: config.jwtExpiresIn,
      },
    });
  }),
);

// POST /api/auth/refresh — exchange valid refresh token for new pair (rotation + reuse detection)
router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res, next) => {
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
  }),
);

// POST /api/auth/logout — revoke refresh token (body or httpOnly cookie)
router.post(
  "/logout",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const raw =
      (req.body as { refreshToken?: string }).refreshToken ??
      (req.cookies as Record<string, string>)?.refreshToken;
    if (raw) await deleteSession(raw);
    res.clearCookie("refreshToken", { path: "/api/v1/auth" });
    res.json({ data: { ok: true } });
  }),
);

// GET /api/auth/roles
router.get("/roles", (_req, res) => {
  res.json({ data: ROLES });
});

const forgotSchema = z.object({
  email: z.string().email().max(120),
});

const resetSchema = z.object({
  email: z.string().email().max(120),
  answer: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(128),
});

const changeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
});

// POST /api/auth/forgot-password — returns the security question.
// Always 200 (even for unknown emails) so attackers cannot enumerate accounts.
router.post(
  "/forgot-password",
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const user = await findUserByEmail(email);
    res.json({
      data: {
        securityQuestion:
          user && user.isActive ? user.securityQuestion : "What was the name of your first school?",
      },
    });
  }),
);

// POST /api/auth/reset-password — verify answer, set new password
router.post(
  "/reset-password",
  validate(resetSchema),
  asyncHandler(async (req, res, next) => {
    const { email, answer, newPassword } = req.body as {
      email: string;
      answer: string;
      newPassword: string;
    };
    const { resetViaSecurityAnswer } = await import("../repos/userRepo.js");
    const result = await resetViaSecurityAnswer(email, answer, newPassword);
    if (result !== "ok") {
      next(ApiError.unauthorized("Invalid credentials"));
      return;
    }
    res.json({ data: { ok: true } });
  }),
);

// POST /api/auth/change-password — authed user changes their own password
router.post(
  "/change-password",
  requireAuth,
  validate(changeSchema),
  asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const email = (req.user?.sub ?? "").replace(/^user-/, "");
    const { changeUserPassword } = await import("../repos/userRepo.js");
    const result = await changeUserPassword(email, currentPassword, newPassword);
    if (result === "not-found") {
      next(ApiError.notFound("User"));
      return;
    }
    if (result === "bad-current") {
      next(ApiError.unauthorized("Current password is incorrect"));
      return;
    }
    res.json({ data: { ok: true } });
  }),
);

export default router;
