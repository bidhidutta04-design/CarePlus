import mongoose from "mongoose";
import { AppointmentModel } from "../models/Appointment.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listAppointments(filter: {
  status?: string;
  department?: string;
  priority?: string;
  search?: string;
}): Promise<(typeof db.appointments)[number][]> {
  if (!isDbReady()) {
    const q = (filter.search ?? "").toLowerCase();
    return db.appointments.filter(
      (a) =>
        (!filter.status || a.status === filter.status) &&
        (!filter.department || a.department === filter.department) &&
        (!filter.priority || a.priority === filter.priority) &&
        (!q || [a.id, a.patientName, a.doctorName, a.tokenNo].join(" ").toLowerCase().includes(q)),
    );
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.department) query.department = filter.department;
  if (filter.priority) query.priority = filter.priority;
  if (filter.search) {
    const s = filter.search;
    query.$or = [
      { id: { $regex: s, $options: "i" } },
      { patientName: { $regex: s, $options: "i" } },
      { doctorName: { $regex: s, $options: "i" } },
      { tokenNo: { $regex: s, $options: "i" } },
    ];
  }
  const docs = await AppointmentModel.find(query).lean();
  return docs as unknown as (typeof db.appointments)[number][];
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
  const count = await AppointmentModel.countDocuments();
  const n = 1255 + count + 1;
  const payload = {
    id: `APT-${n}`,
    tokenNo: `OPD-${String(count + 1).padStart(2, "0")}`,
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
