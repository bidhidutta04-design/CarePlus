import { CounterModel } from "../models/Counter.js";
import { isDbReady } from "../db.js";

export interface IdSpec {
  key: string;
  prefix: string;
  pad: number;
  start: number;
}

export const ID_SPECS: Record<string, IdSpec> = {
  patient: { key: "patient", prefix: "CP-", pad: 4, start: 1001 },
  appointment: { key: "appointment", prefix: "APT-", pad: 4, start: 1255 },
  invoice: { key: "invoice", prefix: "INV-2025-", pad: 3, start: 0 },
  medicine: { key: "medicine", prefix: "MED-", pad: 3, start: 0 },
  lab: { key: "lab", prefix: "LAB-", pad: 4, start: 2001 },
};

const initialized = new Set<string>();

async function ensureCounter(spec: IdSpec): Promise<void> {
  if (initialized.has(spec.key)) return;
  // Idempotent: $setOnInsert only applies when the doc is created
  await CounterModel.updateOne(
    { _id: spec.key },
    { $setOnInsert: { seq: spec.start } },
    { upsert: true },
  );
  initialized.add(spec.key);
}

// Raw atomic sequence for custom keys (e.g. daily token counters).
export async function nextSequence(key: string, start = 0): Promise<number> {
  if (!isDbReady()) throw new Error("Counter requires database connection");
  await CounterModel.updateOne({ _id: key }, { $setOnInsert: { seq: start } }, { upsert: true });
  const doc = await CounterModel.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  return (doc as unknown as { seq: number }).seq;
}

// Atomic auto-increment — safe under concurrency (single findOneAndUpdate).
export async function nextId(spec: IdSpec): Promise<string> {
  if (!isDbReady()) throw new Error("Counter requires database connection");
  await ensureCounter(spec);
  const doc = await CounterModel.findOneAndUpdate(
    { _id: spec.key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  const seq = (doc as unknown as { seq: number }).seq;
  return `${spec.prefix}${String(seq).padStart(spec.pad, "0")}`;
}

// Align counter with existing data (seed / test setup). Next id will be max+1.
export async function syncCounter(spec: IdSpec, existingIds: string[]): Promise<void> {
  let max = spec.start;
  for (const id of existingIds) {
    const m = id.match(/(\d+)$/);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  if (!isDbReady()) return;
  await CounterModel.updateOne({ _id: spec.key }, { seq: max }, { upsert: true });
  initialized.add(spec.key);
}
