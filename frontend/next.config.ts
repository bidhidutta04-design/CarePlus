import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname, "../"),
  // Minimal production image (see frontend/Dockerfile).
  output: "standalone",
};

export default nextConfig;
