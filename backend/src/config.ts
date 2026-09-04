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
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  isProd: process.env.NODE_ENV === "production",
} as const;
