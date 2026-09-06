import { AppointmentModel } from "../models/Appointment.js";
import { db } from "../store.js";
import { ID_SPECS, nextId, nextSequence } from "./counterRepo.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { safeRegexInput } from "../utils/search.js";
import { isDbReady } from "../db.js";

export async function listAppointments(
  filter: {
    status?: string;
    department?: string;
    priority?: string;
    search?: string;
    patientId?: string;
  },
  pagination?: Pagination,
): Promise<{ data: (typeof db.appointments)[number][]; total: number }> {
  if (!isDbReady()) {
    const q = (filter.search ?? "").toLowerCase();
    const filtered = db.appointments.filter(
      (a) =>
        (!filter.status || a.status === filter.status) &&
        (!filter.department || a.department === filter.department) &&
        (!filter.priority || a.priority === filter.priority) &&
        (!filter.patientId || a.patientId === filter.patientId) &&
        (!q || [a.id, a.patientName, a.doctorName, a.tokenNo].join(" ").toLowerCase().includes(q)),
    );
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.department) query.department = filter.department;
  if (filter.priority) query.priority = filter.priority;
  if (filter.patientId) query.patientId = filter.patientId;
  const s = safeRegexInput(filter.search);
  if (s) {
    query.$or = [
      { id: { $regex: s, $options: "i" } },
      { patientName: { $regex: s, $options: "i" } },
      { doctorName: { $regex: s, $options: "i" } },
      { tokenNo: { $regex: s, $options: "i" } },
    ];
  }
  const total = await AppointmentModel.countDocuments(query);
  let docsQuery = AppointmentModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.appointments)[number][], total };
}

export async function getAppointmentById(
  id: string,
): Promise<(typeof db.appointments)[number] | null> {
  if (!isDbReady()) return db.appointments.find((a) => a.id === id) ?? null;
  const doc = await AppointmentModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.appointments)[number]) ?? null;
}

export async function createAppointment(data: {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  timeSlot: string;
  priority: "Routine" | "Urgent" | "Emergency";
  reason: string;
}): Promise<(typeof db.appointments)[number]> {
  if (!isDbReady()) {
    const n = 1255 + db.appointments.length + 1;
    const appt = {
      id: `APT-${n}`,
      tokenNo: `OPD-${String(db.appointments.length + 1).padStart(2, "0")}`,
      status: "Waiting" as const,
      ...data,
    };
    db.appointments.unshift(appt);
    return appt;
  }
  const id = await nextId(ID_SPECS.appointment);
  // Daily token counter — resets each day, no magic offset, no gaps from reseeds
  const today = new Date().toISOString().slice(0, 10);
  const tokenSeq = await nextSequence(`token:${today}`);
  const payload = {
    id,
    tokenNo: `OPD-${String(tokenSeq).padStart(2, "0")}`,
    status: "Waiting" as const,
    ...data,
  };
  const created = await AppointmentModel.create(payload);
  return created.toObject() as unknown as (typeof db.appointments)[number];
}

export async function updateAppointmentStatus(
  id: string,
  status: (typeof db.appointments)[number]["status"],
  vitals?: (typeof db.appointments)[number]["vitals"],
): Promise<(typeof db.appointments)[number] | null> {
  if (!isDbReady()) {
    const appt = db.appointments.find((a) => a.id === id) ?? null;
    if (!appt) return null;
    appt.status = status;
    if (vitals) appt.vitals = vitals;
    return appt;
  }
  const update: Record<string, unknown> = { status };
  if (vitals) update.vitals = vitals;
  const doc = await AppointmentModel.findOneAndUpdate({ id }, update, { new: true }).lean();
  return (doc as unknown as (typeof db.appointments)[number]) ?? null;
}
