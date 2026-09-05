import pino, { type Logger } from "pino";
import { config } from "./config.js";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL ?? (config.isProd ? "info" : "debug"),
  base: { service: "careplus-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function childLogger(requestId?: string): Logger {
  return requestId ? logger.child({ requestId }) : logger;
}
