import { StaffModel } from "../models/Staff.js";
import { db } from "../store.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { isDbReady } from "../db.js";

export async function listStaff(
  filter: { shift?: string; department?: string },
  pagination?: Pagination,
): Promise<{ data: (typeof db.staff)[number][]; total: number }> {
  if (!isDbReady()) {
    const filtered = db.staff.filter(
      (s) =>
        (!filter.shift || s.shift === filter.shift) &&
        (!filter.department || s.department === filter.department),
    );
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const query: Record<string, unknown> = {};
  if (filter.shift) query.shift = filter.shift;
  if (filter.department) query.department = filter.department;
  const total = await StaffModel.countDocuments(query);
  let docsQuery = StaffModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.staff)[number][], total };
}
