import { AuditModel } from "../models/Audit.js";
import { db } from "../store.js";
import { paginateArray, type Pagination } from "../paginate.js";
import { isDbReady } from "../db.js";

export async function listAudits(
  pagination?: Pagination,
): Promise<{ data: (typeof db.auditLogs)[number][]; total: number }> {
  if (!isDbReady()) {
    if (!pagination) return { data: [...db.auditLogs], total: db.auditLogs.length };
    const { data } = paginateArray([...db.auditLogs], pagination);
    return { data, total: db.auditLogs.length };
  }
  const total = await AuditModel.countDocuments({});
  let docsQuery = AuditModel.find().sort({ timestamp: -1 }).lean();
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.auditLogs)[number][], total };
}

export async function createAudit(
  entry: Omit<(typeof db.auditLogs)[number], "timestamp"> & { timestamp: Date },
): Promise<void> {
  if (!isDbReady()) {
    db.auditLogs.unshift({ ...entry, timestamp: entry.timestamp.toISOString() });
    return;
  }
  await AuditModel.create(entry);
}
