import mongoose from "mongoose";
import { DoctorModel } from "../models/Doctor.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listDoctors(filter: {
  department?: string;
  availability?: string;
}): Promise<(typeof db.doctors)[number][]> {
  if (!isDbReady()) {
    return db.doctors.filter(
      (d) =>
        (!filter.department || d.department === filter.department) &&
        (!filter.availability || d.availability === filter.availability),
    );
  }
  const query: Record<string, unknown> = {};
  if (filter.department) query.department = filter.department;
  if (filter.availability) query.availability = filter.availability;
  const docs = await DoctorModel.find(query).lean();
  return docs as unknown as (typeof db.doctors)[number][];
}
