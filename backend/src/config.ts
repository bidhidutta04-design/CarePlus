import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/careplus",
  jwtSecret: required("JWT_SECRET", "dev-only-secret-change-me-32-chars-min"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  // derived: refresh token lives 7d by default — parsed to ms for session expiry
  jwtRefreshExpiresMs: (() => {
    const raw = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
    const m = raw.match(/^(\d+)([smhd])$/);
    if (!m) return 7 * 24 * 60 * 60 * 1000;
    const n = Number(m[1]);
    const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
    return n * unit[m[2] as keyof typeof unit];
  })(),
  isProd: process.env.NODE_ENV === "production",
} as const;
