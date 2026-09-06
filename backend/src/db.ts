import dns from "node:dns";
import mongoose from "mongoose";
import { config } from "./config.js";
import { logger } from "./logger.js";

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDB(uri: string = config.mongoUri): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

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
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      minPoolSize: 2,
      retryWrites: true,
    })
    .then((m) => {
      logger.info(`mongo connected: ${m.connection.host}/${m.connection.name}`);
      connecting = null;
      return m;
    })
    .catch((err: unknown) => {
      connecting = null;
      logger.error({ err }, "mongo connection failed");
      throw err;
    });

  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "mongo error");
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("mongo disconnected");
  });

  return connecting;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}
