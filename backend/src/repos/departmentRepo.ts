import mongoose from "mongoose";
import { DepartmentModel } from "../models/Department.js";
import { db } from "../store.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listDepartments(): Promise<(typeof db.departments)[number][]> {
  if (!isDbReady()) return [...db.departments];
  const docs = await DepartmentModel.find().lean();
  return docs as unknown as (typeof db.departments)[number][];
}
