import type { NextFunction, Request, Response } from "express";

// Wraps async route handlers so thrown/rejected promises go to errorHandler
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next): void => {
    void fn(req, res, next).catch(next);
  };
}
