import { PatientModel } from "../models/Patient.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { safeRegexInput } from "../utils/search.js";
import { isDbReady } from "../db.js";

export async function listPatients(
  filter: { search?: string; status?: string; bloodGroup?: string },
  pagination?: Pagination,
): Promise<{ data: (typeof db.patients)[number][]; total: number }> {
  if (!isDbReady()) {
    const q = (filter.search ?? "").toLowerCase();
    const filtered = db.patients.filter(
      (p) =>
        (!filter.status || p.admissionStatus === filter.status) &&
        (!filter.bloodGroup || p.bloodGroup === filter.bloodGroup) &&
        (!q || [p.id, p.fullName, p.phone].join(" ").toLowerCase().includes(q)),
    );
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.admissionStatus = filter.status;
  if (filter.bloodGroup) query.bloodGroup = filter.bloodGroup;
  const s = safeRegexInput(filter.search);
  if (s) {
    query.$or = [
      { id: { $regex: s, $options: "i" } },
      { fullName: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }
  const total = await PatientModel.countDocuments(query);
  let docsQuery = PatientModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.patients)[number][], total };
}

export async function getPatientById(id: string): Promise<(typeof db.patients)[number] | null> {
  if (!isDbReady()) return db.patients.find((p) => p.id === id) ?? null;
  const doc = await PatientModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.patients)[number]) ?? null;
}

// Keeps the patient directory in sync with bed movements (admit/discharge).
export async function setAdmissionStatus(
  id: string,
  status: "OPD" | "Admitted" | "Discharged",
): Promise<void> {
  if (!isDbReady()) {
    const patient = db.patients.find((p) => p.id === id);
    if (patient) patient.admissionStatus = status;
    return;
  }
  await PatientModel.updateOne({ id }, { $set: { admissionStatus: status } });
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
