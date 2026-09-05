import mongoose from "mongoose";
import { BedModel } from "../models/Bed.js";
import { db } from "../store.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listBeds(
  filter: { ward?: string; status?: string },
  pagination?: Pagination,
): Promise<{
  data: (typeof db.beds)[number][];
  total: number;
  occupied: number;
  occupancyPct: number;
}> {
  if (!isDbReady()) {
    const filtered = db.beds.filter(
      (b) =>
        (!filter.ward || b.ward === filter.ward) && (!filter.status || b.status === filter.status),
    );
    const occupied = filtered.filter((b) => b.status === "Occupied").length;
    const occupancyPct = filtered.length ? Math.round((occupied / filtered.length) * 100) : 0;
    if (!pagination) return { data: filtered, total: filtered.length, occupied, occupancyPct };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length, occupied, occupancyPct };
  }
  const query: Record<string, unknown> = {};
  if (filter.ward) query.ward = filter.ward;
  if (filter.status) query.status = filter.status;
  const [total, occupied] = await Promise.all([
    BedModel.countDocuments(query),
    BedModel.countDocuments({ ...query, status: "Occupied" }),
  ]);
  const occupancyPct = total ? Math.round((occupied / total) * 100) : 0;
  let docsQuery = BedModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.beds)[number][], total, occupied, occupancyPct };
}

export async function getBedById(id: string): Promise<(typeof db.beds)[number] | null> {
  if (!isDbReady()) return db.beds.find((b) => b.id === id) ?? null;
  const doc = await BedModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.beds)[number]) ?? null;
}

export async function updateBed(
  id: string,
  patch: { status: string; patientId?: string; patientName?: string; admittedDate?: string },
): Promise<(typeof db.beds)[number] | null> {
  if (!isDbReady()) {
    const bed = db.beds.find((b) => b.id === id) ?? null;
    if (!bed) return null;
    Object.assign(bed, patch);
    if (patch.status !== "Occupied") {
      bed.patientId = undefined;
      bed.patientName = undefined;
      bed.admittedDate = undefined;
    }
    return bed;
  }
  const update: Record<string, unknown> = { status: patch.status };
  if (patch.status === "Occupied") {
    if (patch.patientId !== undefined) update.patientId = patch.patientId;
    if (patch.patientName !== undefined) update.patientName = patch.patientName;
    update.admittedDate = patch.admittedDate ?? new Date().toISOString().slice(0, 10);
  } else {
    update.$unset = { patientId: "", patientName: "", admittedDate: "" };
  }
  // For $unset case we need separate handling
  let doc;
  if (patch.status === "Occupied") {
    doc = await BedModel.findOneAndUpdate({ id }, update, { new: true }).lean();
  } else {
    doc = await BedModel.findOneAndUpdate(
      { id },
      { status: patch.status, $unset: { patientId: "", patientName: "", admittedDate: "" } },
      { new: true },
    ).lean();
  }
  return (doc as unknown as (typeof db.beds)[number]) ?? null;
}
