import mongoose from "mongoose";
import { MedicineModel } from "../models/Medicine.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listMedicines(
  filter: { search?: string; lowStock?: string },
  pagination?: Pagination,
): Promise<{ data: (typeof db.medicines)[number][]; total: number }> {
  if (!isDbReady()) {
    const q = (filter.search ?? "").toLowerCase();
    const filtered = db.medicines
      .filter(
        (m) => !q || [m.brandName, m.genericName, m.batchNo].join(" ").toLowerCase().includes(q),
      )
      .filter(
        (m) =>
          filter.lowStock !== "true" || m.stockCount < m.minThreshold || m.status === "Expired",
      )
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const andClauses: Record<string, unknown>[] = [];
  if (filter.search) {
    const s = filter.search;
    andClauses.push({
      $or: [
        { brandName: { $regex: s, $options: "i" } },
        { genericName: { $regex: s, $options: "i" } },
        { batchNo: { $regex: s, $options: "i" } },
      ],
    });
  }
  if (filter.lowStock === "true") {
    andClauses.push({
      $or: [{ $expr: { $lt: ["$stockCount", "$minThreshold"] } }, { status: "Expired" }],
    });
  }
  const query = andClauses.length > 0 ? { $and: andClauses } : {};
  const total = await MedicineModel.countDocuments(query);
  let docsQuery = MedicineModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort) ?? "expiryDate";
  const dir = pagination?.order === "desc" ? -1 : 1;
  docsQuery = docsQuery.sort({ [sortField]: dir });
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.medicines)[number][], total };
}

export async function getMedicineById(id: string): Promise<(typeof db.medicines)[number] | null> {
  if (!isDbReady()) return db.medicines.find((m) => m.id === id) ?? null;
  const doc = await MedicineModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.medicines)[number]) ?? null;
}

export async function createMedicine(data: {
  brandName: string;
  genericName: string;
  category: string;
  batchNo: string;
  expiryDate: string;
  unitPrice: number;
  stockCount: number;
  minThreshold: number;
}): Promise<(typeof db.medicines)[number]> {
  if (!isDbReady()) {
    const med = {
      ...data,
      id: `MED-${String(db.medicines.length + 1).padStart(3, "0")}`,
      status: (data.stockCount < data.minThreshold ? "Low Stock" : "Healthy") as
        "Healthy" | "Low Stock",
    };
    db.medicines.unshift(med);
    return med;
  }
  const payload = {
    ...data,
    id: await nextId(ID_SPECS.medicine),
    status: (data.stockCount < data.minThreshold ? "Low Stock" : "Healthy") as
      "Healthy" | "Low Stock",
  };
  const created = await MedicineModel.create(payload as Record<string, unknown>);
  return created.toObject() as unknown as (typeof db.medicines)[number];
}

export async function dispenseMedicine(
  id: string,
  qty: number,
): Promise<(typeof db.medicines)[number] | null> {
  if (!isDbReady()) {
    const med = db.medicines.find((m) => m.id === id) ?? null;
    if (!med) return null;
    med.stockCount -= qty;
    if (med.stockCount < med.minThreshold) med.status = "Low Stock";
    return med;
  }
  // Atomic conditional decrement — concurrent dispenses can never oversell
  const med = await MedicineModel.findOneAndUpdate(
    { id, stockCount: { $gte: qty } },
    { $inc: { stockCount: -qty } },
    { new: true },
  );
  if (!med) return null;
  if (med.stockCount < (med.minThreshold as unknown as number)) {
    med.status = "Low Stock" as unknown as typeof med.status;
    await med.save();
  }
  return med.toObject() as unknown as (typeof db.medicines)[number];
}
