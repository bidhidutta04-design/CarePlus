import dns from "node:dns";
import mongoose from "mongoose";
import { config } from "./config.js";
import { formatError, logger } from "./logger.js";

let connecting: Promise<typeof mongoose> | null = null;
let listenersAttached = false;
// True while the process is intentionally stopping (SIGINT/SIGTERM, fatal
// error, seed finished). Suppresses the scary "disconnected" warning and
// stops the reconnect timer — this close is expected, not an outage.
let shuttingDown = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
let lastUri: string | null = null;

// 1s, 2s, 4s … capped at 30s. Retried forever: a hospital server must
// self-heal after a night-time network/Atlas blip, not wait for a restart.
function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** Math.min(attempts, 5), 30_000);
}

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("error", (err) => {
    logger.error({ err: formatError(err) }, "mongo error");
  });

  // Transient drops (Atlas idle, wifi hiccup): the driver reconnects on its
  // own — this only marks the moment. While down, repos serve the local
  // fallback store and /ready reports 503, so the API never hard-crashes.
  mongoose.connection.on("disconnected", () => {
    if (shuttingDown) {
      logger.info("mongo connection closed (server stopping)");
      return;
    }
    logger.warn("mongo connection lost — retrying automatically in the background");
    scheduleReconnect();
  });

  mongoose.connection.on("reconnected", () => {
    reconnectAttempts = 0;
    logger.info(`mongo reconnected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });
}

function scheduleReconnect(): void {
  if (shuttingDown || reconnectTimer) return;
  if (mongoose.connection.readyState === 1 || connecting) return;
  const delay = backoffMs(reconnectAttempts);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shuttingDown || mongoose.connection.readyState === 1 || connecting) return;
    // Retry the same URI that failed (defaults to the configured one).
    void connectDB(lastUri ?? config.mongoUri).catch(() => {
      // Logged + rescheduled inside connectDB — nothing more to do here.
    });
  }, delay);
  // Never keep tests / seed / CI alive on this timer alone.
  reconnectTimer.unref?.();
}

export async function connectDB(uri: string = config.mongoUri): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;
  attachListeners();
  lastUri = uri;

  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch {
      // Custom DNS unavailable — fall back to system resolver
    }
  }

  mongoose.set("strictQuery", true);

  connecting = mongoose
    .connect(uri, {
      autoIndex: !config.isProd,
      // Atlas free tiers can be slow to wake — fail fast helps nobody here.
      serverSelectionTimeoutMS: 10_000,
      heartbeatFrequencyMS: 10_000,
      maxPoolSize: 20,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
    })
    .then((m) => {
      logger.info(`mongo connected: ${m.connection.host}/${m.connection.name}`);
      connecting = null;
      shuttingDown = false;
      reconnectAttempts = 0;
      return m;
    })
    .catch((err: unknown) => {
      connecting = null;
      reconnectAttempts += 1;
      // Full error detail on the first failure and every 10th — a short line
      // otherwise, so a long outage doesn't flood the logs.
      if (reconnectAttempts === 1 || reconnectAttempts % 10 === 0) {
        logger.error(
          { err: formatError(err) },
          `mongo connection failed (attempt ${reconnectAttempts}) — retrying automatically`,
        );
      } else {
        logger.warn(
          `mongo connection failed (attempt ${reconnectAttempts}) — retrying automatically`,
        );
      }
      scheduleReconnect();
      throw err;
    });

  return connecting;
}

export async function disconnectDB(): Promise<void> {
  shuttingDown = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  connecting = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}
