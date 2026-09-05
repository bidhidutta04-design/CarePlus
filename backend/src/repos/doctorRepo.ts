import { DoctorModel } from "../models/Doctor.js";
import { db } from "../store.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { isDbReady } from "../db.js";

export async function listDoctors(
  filter: { department?: string; availability?: string },
  pagination?: Pagination,
): Promise<{ data: (typeof db.doctors)[number][]; total: number }> {
  if (!isDbReady()) {
    const filtered = db.doctors.filter(
      (d) =>
        (!filter.department || d.department === filter.department) &&
        (!filter.availability || d.availability === filter.availability),
    );
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const query: Record<string, unknown> = {};
  if (filter.department) query.department = filter.department;
  if (filter.availability) query.availability = filter.availability;
  const total = await DoctorModel.countDocuments(query);
  let docsQuery = DoctorModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.doctors)[number][], total };
}
