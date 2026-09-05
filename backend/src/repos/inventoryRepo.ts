import { InventoryModel } from "../models/Inventory.js";
import { db } from "../store.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { isDbReady } from "../db.js";

export async function listInventory(
  filter: { lowStock?: string; category?: string },
  pagination?: Pagination,
): Promise<{ data: (typeof db.inventory)[number][]; total: number }> {
  if (!isDbReady()) {
    const filtered = db.inventory.filter(
      (i) =>
        (!filter.category || i.category === filter.category) &&
        (filter.lowStock !== "true" || i.stock <= i.minThreshold),
    );
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const query: Record<string, unknown> = {};
  if (filter.category) query.category = filter.category;
  if (filter.lowStock === "true") query.$expr = { $lte: ["$stock", "$minThreshold"] };
  const total = await InventoryModel.countDocuments(query);
  let docsQuery = InventoryModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.inventory)[number][], total };
}

export async function restockInventory(
  id: string,
  qty: number,
): Promise<(typeof db.inventory)[number] | null> {
  if (!isDbReady()) {
    const item = db.inventory.find((i) => i.id === id) ?? null;
    if (!item) return null;
    item.stock += qty;
    item.lastRestocked = new Date().toISOString().slice(0, 10);
    return item;
  }
  const doc = await InventoryModel.findOneAndUpdate(
    { id },
    { $inc: { stock: qty }, lastRestocked: new Date().toISOString().slice(0, 10) },
    { new: true },
  ).lean();
  return (doc as unknown as (typeof db.inventory)[number]) ?? null;
}
