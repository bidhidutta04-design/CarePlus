import mongoose from "mongoose";
import { PatientModel } from "../models/Patient.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listPatients(filter: {
  search?: string;
  status?: string;
  bloodGroup?: string;
}): Promise<(typeof db.patients)[number][]> {
  if (!isDbReady()) {
    const q = (filter.search ?? "").toLowerCase();
    return db.patients.filter(
      (p) =>
        (!filter.status || p.admissionStatus === filter.status) &&
        (!filter.bloodGroup || p.bloodGroup === filter.bloodGroup) &&
        (!q || [p.id, p.fullName, p.phone].join(" ").toLowerCase().includes(q)),
    );
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.admissionStatus = filter.status;
  if (filter.bloodGroup) query.bloodGroup = filter.bloodGroup;
  if (filter.search) {
    const s = filter.search;
    query.$or = [
      { id: { $regex: s, $options: "i" } },
      { fullName: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }
  const docs = await PatientModel.find(query).lean();
  return docs as unknown as (typeof db.patients)[number][];
}

export async function getPatientById(id: string): Promise<(typeof db.patients)[number] | null> {
  if (!isDbReady()) return db.patients.find((p) => p.id === id) ?? null;
  const doc = await PatientModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.patients)[number]) ?? null;
}

export async function createPatient(
  data: Omit<(typeof db.patients)[number], "id" | "registeredDate"> & {
    id?: string;
    registeredDate?: string;
  },
): Promise<(typeof db.patients)[number]> {
  if (!isDbReady()) {
    const id = data.id ?? `CP-${1001 + db.patients.length + 1}`;
    const registeredDate = data.registeredDate ?? new Date().toISOString().slice(0, 10);
    const payload = { ...data, id, registeredDate };
    const patient = { ...payload } as (typeof db.patients)[number];
    db.patients.unshift(patient);
    return patient;
  }
  const id = data.id ?? (await nextId(ID_SPECS.patient));
  const registeredDate = data.registeredDate ?? new Date().toISOString().slice(0, 10);
  const payload = { ...data, id, registeredDate };
  const created = await PatientModel.create(payload as Record<string, unknown>);
  return created.toObject() as unknown as (typeof db.patients)[number];
}
