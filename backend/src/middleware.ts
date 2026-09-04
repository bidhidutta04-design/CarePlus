import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { ApiError } from "./errors.js";
import rateLimit from "express-rate-limit";

export interface AuthUser {
  sub: string;
  name: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized());
    return;
  }
  try {
    // Access tokens are always signed with the access secret
    req.user = jwt.verify(header.slice(7), config.jwtAccessSecret) as AuthUser;
    next();
  } catch {
    next(ApiError.unauthorized("Token expired or invalid"));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (req.user.role !== "Admin" && !roles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}

export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(ApiError.badRequest("Validation failed", parsed.error.flatten()));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details ?? null } });
    return;
  }
  console.error(err);
  res
    .status(500)
    .json({ error: { code: "INTERNAL", message: "Unexpected server error", details: null } });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found", details: null } });
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  (req as unknown as Record<string, unknown>).requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many attempts, try again later",
      details: null,
    },
  },
});

export function auditLog(req: Request, _res: Response, next: NextFunction): void {
  // Only log mutating, authenticated requests
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method) && req.user) {
    // Fire and forget — never block the request on audit write
    void import("./repos/auditRepo.js").then(({ createAudit }) => {
      const action = `${req.method} ${req.path}`;
      void createAudit({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        user: req.user?.name ?? "unknown",
        role: req.user?.role ?? "unknown",
        action,
        ipAddress: req.ip ?? req.socket.remoteAddress ?? "unknown",
      }).catch(() => {
        // audit must never crash the request
      });
    });
  }
  next();
}
