import { InvoiceModel } from "../models/Invoice.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { billTotals } from "../utils/money.js";
import { isDbReady } from "../db.js";

export async function listInvoices(
  filter: { status?: string; patientId?: string },
  pagination?: Pagination,
): Promise<{
  data: (typeof db.invoices)[number][];
  total: number;
  billed: number;
  collected: number;
}> {
  if (!isDbReady()) {
    const filtered = db.invoices.filter(
      (i) =>
        (!filter.status || i.status === filter.status) &&
        (!filter.patientId || i.patientId === filter.patientId),
    );
    const billed = filtered.reduce((s, i) => s + i.totalAmount, 0);
    const collected = filtered.reduce((s, i) => s + i.paidAmount, 0);
    if (!pagination) return { data: filtered, total: filtered.length, billed, collected };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length, billed, collected };
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.patientId) query.patientId = filter.patientId;
  const [total, sums] = await Promise.all([
    InvoiceModel.countDocuments(query),
    InvoiceModel.aggregate([
      { $match: query },
      {
        $group: { _id: null, billed: { $sum: "$totalAmount" }, collected: { $sum: "$paidAmount" } },
      },
    ]),
  ]);
  const billed = (sums[0] as { billed: number } | undefined)?.billed ?? 0;
  const collected = (sums[0] as { collected: number } | undefined)?.collected ?? 0;
  let docsQuery = InvoiceModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.invoices)[number][], total, billed, collected };
}

export async function getInvoiceById(id: string): Promise<(typeof db.invoices)[number] | null> {
  if (!isDbReady()) return db.invoices.find((i) => i.id === id) ?? null;
  const doc = await InvoiceModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.invoices)[number]) ?? null;
}

export async function createInvoice(data: {
  patientId: string;
  patientName: string;
  items: (typeof db.invoices)[number]["items"];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: (typeof db.invoices)[number]["paymentMethod"];
  tpaProvider?: string;
}): Promise<(typeof db.invoices)[number]> {
  if (!isDbReady()) {
    const inv = {
      ...data,
      id: `INV-2025-${String(db.invoices.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().slice(0, 10),
      paidAmount: 0,
      balanceDue: data.totalAmount,
      status: "Unpaid" as const,
    };
    db.invoices.unshift(inv);
    return inv;
  }
  const payload = {
    ...data,
    id: await nextId(ID_SPECS.invoice),
    date: new Date().toISOString().slice(0, 10),
    paidAmount: 0,
    balanceDue: data.totalAmount,
    status: "Unpaid" as const,
  };
  const created = await InvoiceModel.create(payload);
  return created.toObject() as unknown as (typeof db.invoices)[number];
}

export async function findOpenInvoice(
  patientId: string,
): Promise<(typeof db.invoices)[number] | null> {
  if (!isDbReady()) {
    return db.invoices.find((i) => i.patientId === patientId && i.status === "Unpaid") ?? null;
  }
  const doc = await InvoiceModel.findOne({ patientId, status: "Unpaid" }).sort({ date: -1 }).lean();
  return (doc as unknown as (typeof db.invoices)[number]) ?? null;
}

export async function appendInvoiceItem(
  id: string,
  item: (typeof db.invoices)[number]["items"][number],
): Promise<(typeof db.invoices)[number] | null> {
  const inv = await getInvoiceById(id);
  if (!inv || inv.status === "Paid") return null;
  if (!isDbReady()) {
    const items = [...inv.items, item];
    const totals = billTotals(items, inv.discount);
    Object.assign(inv, { items, ...totals, balanceDue: totals.totalAmount - inv.paidAmount });
    return inv;
  }
  // Optimistic locking on __v: concurrent appends retry instead of dropping items.
  // Totals stay exact (JS paise math) — no float drift from pipeline rounding modes.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const fresh = await getInvoiceById(id);
    if (!fresh || fresh.status === "Paid") return null;
    const items = [...fresh.items, item];
    const totals = billTotals(items, fresh.discount);
    const balanceDue = totals.totalAmount - fresh.paidAmount;
    const version = (fresh as unknown as { __v?: number }).__v;
    const doc = await InvoiceModel.findOneAndUpdate(
      { id, __v: version },
      { items, ...totals, balanceDue, $inc: { __v: 1 } },
      { new: true },
    ).lean();
    if (doc) return doc as unknown as (typeof db.invoices)[number];
  }
  const { ApiError } = await import("../errors.js");
  throw ApiError.conflict("Concurrent update, please retry");
}

export async function collectInvoice(
  id: string,
  amount: number,
): Promise<(typeof db.invoices)[number] | null> {
  if (!isDbReady()) {
    const inv = db.invoices.find((i) => i.id === id) ?? null;
    if (!inv) return null;
    inv.paidAmount += amount;
    inv.balanceDue = inv.totalAmount - inv.paidAmount;
    inv.status = inv.balanceDue === 0 ? "Paid" : "Partial";
    return inv;
  }
  // Single atomic pipeline — money movement and status flip in one write.
  // balanceDue rounded to paise so the Paid check is exact (no float drift).
  // NOTE: native collection call — this Mongoose version gates pipeline updates
  // on queries, and the driver supports them directly.
  const doc = await InvoiceModel.collection.findOneAndUpdate(
    { id, balanceDue: { $gte: amount } },
    [
      {
        $set: {
          paidAmount: { $add: ["$paidAmount", amount] },
          balanceDue: { $round: [{ $subtract: ["$balanceDue", amount] }, 2] },
        },
      },
      {
        $set: {
          status: { $cond: [{ $eq: ["$balanceDue", 0] }, "Paid", "Partial"] },
        },
      },
    ],
    { returnDocument: "after" },
  );
  return (doc as unknown as (typeof db.invoices)[number]) ?? null;
}
