import mongoose from "mongoose";
import { InventoryModel } from "../models/Inventory.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listInventory(filter: {
  lowStock?: string;
  category?: string;
}): Promise<(typeof db.inventory)[number][]> {
  if (!isDbReady()) {
    return db.inventory.filter(
      (i) =>
        (!filter.category || i.category === filter.category) &&
        (filter.lowStock !== "true" || i.stock <= i.minThreshold),
    );
  }
  const query: Record<string, unknown> = {};
  if (filter.category) query.category = filter.category;
  if (filter.lowStock === "true") {
    // fetch then filter to keep logic simple and FEFO-like
  }
  let docs = (await InventoryModel.find(
    query,
  ).lean()) as unknown as (typeof db.inventory)[number][];
  if (filter.lowStock === "true") docs = docs.filter((i) => i.stock <= i.minThreshold);
  return docs;
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
