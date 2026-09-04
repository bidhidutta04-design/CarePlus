import mongoose from "mongoose";
import { config } from "./config.js";

let connecting: Promise<typeof mongoose> | null = null;

export async function connectDB(uri: string = config.mongoUri): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  mongoose.set("strictQuery", true);

  connecting = mongoose
    .connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    })
    .then((m) => {
      console.log(`mongo connected: ${m.connection.host}/${m.connection.name}`);
      connecting = null;
      return m;
    })
    .catch((err: unknown) => {
      connecting = null;
      console.error("mongo connection failed:", err);
      throw err;
    });

  mongoose.connection.on("error", (err) => {
    console.error("mongo error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("mongo disconnected");
  });

  return connecting;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
