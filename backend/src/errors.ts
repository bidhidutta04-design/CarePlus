export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Missing or invalid credentials"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Insufficient permissions for this role"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(resource: string): ApiError {
    return new ApiError(404, "NOT_FOUND", `${resource} not found`);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, "CONFLICT", message);
  }
}
