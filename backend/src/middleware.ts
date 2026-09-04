import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { ApiError } from "./errors.js";

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
    req.user = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser;
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
