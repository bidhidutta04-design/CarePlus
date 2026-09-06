import { MedicineModel } from "../models/Medicine.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { safeRegexInput } from "../utils/search.js";
import { isDbReady } from "../db.js";

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
  const s = safeRegexInput(filter.search);
  if (s) {
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
  // Single atomic write — decrement + status sync together, no second save
  // that could fail and leave stock and status permanently out of sync.
  // NOTE: native collection call — this Mongoose version gates pipeline updates
  // on queries, and the driver supports them directly.
  const doc = await MedicineModel.collection.findOneAndUpdate(
    { id, stockCount: { $gte: qty } },
    [
      { $set: { stockCount: { $subtract: ["$stockCount", qty] } } },
      {
        $set: {
          status: {
            $cond: [{ $lt: ["$stockCount", "$minThreshold"] }, "Low Stock", "$status"],
          },
        },
      },
    ],
    { returnDocument: "after" },
  );
  return (doc as unknown as (typeof db.medicines)[number]) ?? null;
}
