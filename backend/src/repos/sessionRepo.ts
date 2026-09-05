import crypto from "node:crypto";
import { SessionModel } from "../models/Session.js";
import { isDbReady } from "../db.js";

// In-memory fallback for when Mongo is not connected (dev without DB).
// Holds hashes only — never plaintext tokens.
const memorySessions: Array<{
  refreshTokenHash: string;
  sub: string;
  name: string;
  role: string;
  familyId: string;
  replacedByHash?: string;
  isRevoked: boolean;
  expiresAt: Date;
}> = [];

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(data: {
  refreshToken: string;
  sub: string;
  name: string;
  role: string;
  familyId: string;
  expiresAt: Date;
}): Promise<string> {
  const refreshTokenHash = hashToken(data.refreshToken);
  const doc = {
    refreshTokenHash,
    sub: data.sub,
    name: data.name,
    role: data.role,
    familyId: data.familyId,
    isRevoked: false,
    expiresAt: data.expiresAt,
  };
  if (!isDbReady()) {
    memorySessions.push(doc);
    return refreshTokenHash;
  }
  await SessionModel.create(doc);
  return refreshTokenHash;
}

export async function findSessionByToken(refreshToken: string): Promise<{
  refreshTokenHash: string;
  sub: string;
  name: string;
  role: string;
  familyId: string;
  replacedByHash?: string;
  isRevoked: boolean;
  expiresAt: Date;
} | null> {
  const hash = hashToken(refreshToken);
  if (!isDbReady()) {
    return memorySessions.find((s) => s.refreshTokenHash === hash) ?? null;
  }
  const doc = await SessionModel.findOne({ refreshTokenHash: hash }).lean();
  return (doc as unknown as (typeof memorySessions)[number]) ?? null;
}

// Legacy alias for backward compat
export const findSession = findSessionByToken;

export async function rotateSession(
  oldHash: string,
  newData: { refreshToken: string; expiresAt: Date },
): Promise<string> {
  const newHash = hashToken(newData.refreshToken);
  if (!isDbReady()) {
    const sess = memorySessions.find((s) => s.refreshTokenHash === oldHash);
    if (!sess) return newHash;
    sess.replacedByHash = newHash;
    sess.isRevoked = true;
    memorySessions.push({
      refreshTokenHash: newHash,
      sub: sess.sub,
      name: sess.name,
      role: sess.role,
      familyId: sess.familyId,
      isRevoked: false,
      expiresAt: newData.expiresAt,
    });
    return newHash;
  }
  await SessionModel.updateOne(
    { refreshTokenHash: oldHash },
    { isRevoked: true, replacedByHash: newHash },
  );
  const old = await SessionModel.findOne({ refreshTokenHash: oldHash }).lean();
  if (!old) return newHash;
  await SessionModel.create({
    refreshTokenHash: newHash,
    sub: (old as unknown as (typeof memorySessions)[number]).sub,
    name: (old as unknown as (typeof memorySessions)[number]).name,
    role: (old as unknown as (typeof memorySessions)[number]).role,
    familyId: (old as unknown as (typeof memorySessions)[number]).familyId,
    isRevoked: false,
    expiresAt: newData.expiresAt,
  });
  return newHash;
}

export async function deleteSession(refreshToken: string): Promise<void> {
  const hash = hashToken(refreshToken);
  if (!isDbReady()) {
    const idx = memorySessions.findIndex((s) => s.refreshTokenHash === hash);
    if (idx >= 0) memorySessions.splice(idx, 1);
    return;
  }
  await SessionModel.deleteOne({ refreshTokenHash: hash });
}

export async function revokeFamily(familyId: string): Promise<void> {
  if (!isDbReady()) {
    for (const s of memorySessions) if (s.familyId === familyId) s.isRevoked = true;
    return;
  }
  await SessionModel.updateMany({ familyId }, { isRevoked: true });
}
