import mongoose from "mongoose";
import { SessionModel } from "../models/Session.js";

// In-memory fallback for when Mongo is not connected (dev without DB)
const memorySessions: Array<{
  refreshToken: string;
  sub: string;
  name: string;
  role: string;
  expiresAt: Date;
}> = [];

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function createSession(data: {
  refreshToken: string;
  sub: string;
  name: string;
  role: string;
  expiresAt: Date;
}): Promise<void> {
  if (!isDbReady()) {
    memorySessions.push(data);
    return;
  }
  await SessionModel.create(data);
}

export async function findSession(refreshToken: string): Promise<{
  refreshToken: string;
  sub: string;
  name: string;
  role: string;
  expiresAt: Date;
} | null> {
  if (!isDbReady()) {
    return memorySessions.find((s) => s.refreshToken === refreshToken) ?? null;
  }
  const doc = await SessionModel.findOne({ refreshToken }).lean();
  return (doc as unknown as (typeof memorySessions)[number]) ?? null;
}

export async function deleteSession(refreshToken: string): Promise<void> {
  if (!isDbReady()) {
    const idx = memorySessions.findIndex((s) => s.refreshToken === refreshToken);
    if (idx >= 0) memorySessions.splice(idx, 1);
    return;
  }
  await SessionModel.deleteOne({ refreshToken });
}

export async function deleteSessionsBySub(sub: string): Promise<void> {
  if (!isDbReady()) {
    for (let i = memorySessions.length - 1; i >= 0; i -= 1) {
      if (memorySessions[i].sub === sub) memorySessions.splice(i, 1);
    }
    return;
  }
  await SessionModel.deleteMany({ sub });
}
