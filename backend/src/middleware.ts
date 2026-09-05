import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { ApiError } from "./errors.js";
import { logger } from "./logger.js";
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
      requestId?: string;
    }
  }
}

export function verifyAccessToken(token: string): AuthUser {
  // Try every known secret — supports rotation (sign with newest, verify any)
  let lastError: unknown = null;
  for (const secret of config.jwtAccessSecrets) {
    try {
      return jwt.verify(token, secret) as AuthUser;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Token expired or invalid");
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized());
    return;
  }
  try {
    req.user = verifyAccessToken(header.slice(7));
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

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId;

  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: config.isProd ? undefined : (err.details ?? null),
        requestId,
      },
    });
    return;
  }

  // Mongoose validation / cast / duplicate key
  const anyErr = err as { name?: string; code?: number; message?: string; errors?: unknown };
  if (anyErr?.name === "ValidationError") {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Validation failed",
        details: anyErr.errors ?? null,
        requestId,
      },
    });
    return;
  }
  if (anyErr?.name === "CastError") {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: anyErr.message ?? "Invalid id",
        details: null,
        requestId,
      },
    });
    return;
  }
  if (anyErr?.code === 11000) {
    res
      .status(409)
      .json({ error: { code: "CONFLICT", message: "Duplicate key", details: null, requestId } });
    return;
  }
  // Express json parse / payload too large
  if (
    anyErr?.message?.includes("request entity too large") ||
    (anyErr as { type?: string })?.type === "entity.too.large"
  ) {
    res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Payload too large",
        details: null,
        requestId,
      },
    });
    return;
  }
  if (
    anyErr?.message?.includes("Unexpected token") ||
    (anyErr as { type?: string })?.type === "entity.parse.failed"
  ) {
    res
      .status(400)
      .json({ error: { code: "BAD_REQUEST", message: "Invalid JSON", details: null, requestId } });
    return;
  }

  // Unknown — structured log with requestId, hide details in prod
  logger.error(
    { requestId, err: anyErr?.message ?? String(err), stack: (err as Error)?.stack },
    "unhandled error",
  );

  res.status(500).json({
    error: {
      code: "INTERNAL",
      message: "Unexpected server error",
      details: config.isProd ? undefined : ((err as Error)?.message ?? null),
      requestId,
    },
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found", details: null } });
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.requestId = id;
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
        id: `AUD-${crypto.randomUUID()}`,
        timestamp: new Date(),
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
