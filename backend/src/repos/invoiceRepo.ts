import mongoose from "mongoose";
import { InvoiceModel } from "../models/Invoice.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listInvoices(filter: {
  status?: string;
  patientId?: string;
}): Promise<(typeof db.invoices)[number][]> {
  if (!isDbReady()) {
    return db.invoices.filter(
      (i) =>
        (!filter.status || i.status === filter.status) &&
        (!filter.patientId || i.patientId === filter.patientId),
    );
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.patientId) query.patientId = filter.patientId;
  const docs = await InvoiceModel.find(query).lean();
  return docs as unknown as (typeof db.invoices)[number][];
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
  const inv = await InvoiceModel.findOne({ id });
  if (!inv) return null;
  inv.paidAmount += amount;
  inv.balanceDue = inv.totalAmount - inv.paidAmount;
  inv.status = inv.balanceDue === 0 ? "Paid" : "Partial";
  await inv.save();
  return inv.toObject() as unknown as (typeof db.invoices)[number];
}
