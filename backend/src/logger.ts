import pino, { type Logger } from "pino";
import { config } from "./config.js";

// Plain one-line logs on a developer machine, JSON in production/test where
// machines read them. Same logger, same levels — only the rendering differs.
const pretty = !config.isProd && process.env.NODE_ENV !== "test";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? (config.isProd ? "info" : "debug"),
  base: { service: "careplus-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(pretty
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname,service",
          },
        },
      }
    : {}),
});

// Trimmed error shape for logs — passing raw Mongoose/Axios errors to pino
// dumps kilobytes of topology/config internals into a single terminal line.
export function formatError(err: unknown): {
  name: string;
  message: string;
  code?: string | number;
} {
  if (err instanceof Error) {
    const withCode = err as Error & { code?: string | number };
    return {
      name: err.name,
      message: err.message.split("\n")[0].slice(0, 300),
      ...(withCode.code !== undefined ? { code: withCode.code } : {}),
    };
  }
  return { name: "UnknownError", message: String(err).slice(0, 300) };
}
