import mongoose from "mongoose";
import { StaffModel } from "../models/Staff.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listStaff(filter: {
  shift?: string;
  department?: string;
}): Promise<(typeof db.staff)[number][]> {
  if (!isDbReady()) {
    return db.staff.filter(
      (s) =>
        (!filter.shift || s.shift === filter.shift) &&
        (!filter.department || s.department === filter.department),
    );
  }
  const query: Record<string, unknown> = {};
  if (filter.shift) query.shift = filter.shift;
  if (filter.department) query.department = filter.department;
  const docs = await StaffModel.find(query).lean();
  return docs as unknown as (typeof db.staff)[number][];
}
