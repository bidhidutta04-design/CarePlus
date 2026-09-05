import mongoose from "mongoose";
import { DepartmentModel } from "../models/Department.js";
import { db } from "../store.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";

function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function listDepartments(
  pagination?: Pagination,
): Promise<{ data: (typeof db.departments)[number][]; total: number }> {
  if (!isDbReady()) {
    if (!pagination) return { data: [...db.departments], total: db.departments.length };
    const { data } = paginateArray([...db.departments], pagination);
    return { data, total: db.departments.length };
  }
  const total = await DepartmentModel.countDocuments({});
  let docsQuery = DepartmentModel.find().lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.departments)[number][], total };
}
