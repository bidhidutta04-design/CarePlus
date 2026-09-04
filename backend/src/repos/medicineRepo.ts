import mongoose from "mongoose";
import { MedicineModel } from "../models/Medicine.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listMedicines(filter: {
  search?: string;
  lowStock?: string;
}): Promise<(typeof db.medicines)[number][]> {
  if (!isDbReady()) {
    const q = (filter.search ?? "").toLowerCase();
    return db.medicines
      .filter(
        (m) => !q || [m.brandName, m.genericName, m.batchNo].join(" ").toLowerCase().includes(q),
      )
      .filter(
        (m) =>
          filter.lowStock !== "true" || m.stockCount < m.minThreshold || m.status === "Expired",
      )
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }
  const query: Record<string, unknown> = {};
  if (filter.search) {
    const s = filter.search;
    query.$or = [
      { brandName: { $regex: s, $options: "i" } },
      { genericName: { $regex: s, $options: "i" } },
      { batchNo: { $regex: s, $options: "i" } },
    ];
  }
  if (filter.lowStock === "true") {
    query.$or = query.$or
      ? [{ $and: [query, { $expr: { $lt: ["$stockCount", "$minThreshold"] } }] }]
      : undefined;
    // Simpler: fetch and filter; keep FEFO sort in DB
  }
  let docs = (await MedicineModel.find(query).lean()) as unknown as (typeof db.medicines)[number][];
  if (filter.lowStock === "true") {
    docs = docs.filter((m) => m.stockCount < m.minThreshold || m.status === "Expired");
  }
  docs.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  return docs;
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
  const count = await MedicineModel.countDocuments();
  const payload = {
    ...data,
    id: `MED-${String(count + 1).padStart(3, "0")}`,
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
  const med = await MedicineModel.findOne({ id });
  if (!med) return null;
  med.stockCount -= qty;
  if (med.stockCount < (med.minThreshold as unknown as number))
    med.status = "Low Stock" as unknown as typeof med.status;
  await med.save();
  return med.toObject() as unknown as (typeof db.medicines)[number];
}
