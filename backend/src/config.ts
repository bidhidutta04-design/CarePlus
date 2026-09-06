import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

function parseDuration(raw: string, fallbackMs: number): number {
  const m = raw.match(/^(\d+)([smhd])$/);
  if (!m) return fallbackMs;
  const n = Number(m[1]);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return n * unit[m[2] as keyof typeof unit];
}

// Dev defaults keep local work frictionless, but production must fail closed:
// without real secrets the process crashes at boot instead of signing tokens
// with a publicly known key.
const devSecrets = process.env.NODE_ENV === "production" ? undefined : "dev-only";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/careplus",
  // Separate secrets — refresh falls back to access secret for backward compat.
  // Comma-separated list supported for rotation: sign with the last, verify any.
  jwtAccessSecret: required(
    "JWT_ACCESS_SECRET",
    process.env.JWT_SECRET ??
      (devSecrets ? `${devSecrets}-access-secret-change-me-32-chars-min` : undefined),
  ),
  jwtAccessSecrets: (
    process.env.JWT_ACCESS_SECRET ??
    process.env.JWT_SECRET ??
    (devSecrets ? `${devSecrets}-access-secret-change-me-32-chars-min` : "")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // Keep JWT_SECRET as alias for backward compat + single-secret deployments
  jwtSecret: required(
    "JWT_SECRET",
    devSecrets ? `${devSecrets}-secret-change-me-32-chars-min` : undefined,
  ),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  jwtRefreshExpiresMs: parseDuration(
    process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    7 * 24 * 60 * 60 * 1000,
  ),
  isProd: process.env.NODE_ENV === "production",
} as const;
