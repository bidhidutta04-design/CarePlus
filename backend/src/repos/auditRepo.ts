import mongoose from "mongoose";
import { AuditModel } from "../models/Audit.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listAudits(): Promise<(typeof db.auditLogs)[number][]> {
  if (!isDbReady()) return [...db.auditLogs];
  const docs = await AuditModel.find().sort({ timestamp: -1 }).lean();
  return docs as unknown as (typeof db.auditLogs)[number][];
}

export async function createAudit(entry: (typeof db.auditLogs)[number]): Promise<void> {
  if (!isDbReady()) {
    db.auditLogs.unshift(entry);
    return;
  }
  await AuditModel.create(entry);
}
