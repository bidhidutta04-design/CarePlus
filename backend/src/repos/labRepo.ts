import { LabModel } from "../models/LabReport.js";
import { db } from "../store.js";
import { ID_SPECS, nextId } from "./counterRepo.js";
import { paginateArray, sanitizeSort, type Pagination } from "../paginate.js";
import { isDbReady } from "../db.js";

export async function listLabs(
  filter: { status?: string; patientId?: string },
  pagination?: Pagination,
): Promise<{ data: (typeof db.labs)[number][]; total: number }> {
  if (!isDbReady()) {
    const filtered = db.labs.filter(
      (l) =>
        (!filter.status || l.status === filter.status) &&
        (!filter.patientId || l.patientId === filter.patientId),
    );
    if (!pagination) return { data: filtered, total: filtered.length };
    const { data } = paginateArray(filtered, pagination);
    return { data, total: filtered.length };
  }
  const query: Record<string, unknown> = {};
  if (filter.status) query.status = filter.status;
  if (filter.patientId) query.patientId = filter.patientId;
  const total = await LabModel.countDocuments(query);
  let docsQuery = LabModel.find(query).lean();
  const sortField = sanitizeSort(pagination?.sort);
  if (sortField) {
    const dir = pagination?.order === "desc" ? -1 : 1;
    docsQuery = docsQuery.sort({ [sortField]: dir });
  }
  if (pagination) {
    docsQuery = docsQuery.skip((pagination.page - 1) * pagination.limit).limit(pagination.limit);
  }
  const docs = await docsQuery;
  return { data: docs as unknown as (typeof db.labs)[number][], total };
}

export async function getLabById(id: string): Promise<(typeof db.labs)[number] | null> {
  if (!isDbReady()) return db.labs.find((l) => l.id === id) ?? null;
  const doc = await LabModel.findOne({ id }).lean();
  return (doc as unknown as (typeof db.labs)[number]) ?? null;
}

export async function createLab(data: {
  testCode: string;
  testName: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  orderDate: string;
}): Promise<(typeof db.labs)[number]> {
  if (!isDbReady()) {
    const report = {
      ...data,
      id: `LAB-${2001 + db.labs.length}`,
      status: "Ordered" as const,
      results: [] as (typeof db.labs)[number]["results"],
      pathologistSign: "",
    };
    db.labs.unshift(report);
    return report;
  }
  const payload = {
    ...data,
    id: await nextId(ID_SPECS.lab),
    status: "Ordered" as const,
    results: [],
    pathologistSign: "",
  };
  const created = await LabModel.create(payload);
  return created.toObject() as unknown as (typeof db.labs)[number];
}

export async function updateLab(
  id: string,
  patch: {
    status: (typeof db.labs)[number]["status"];
    results: (typeof db.labs)[number]["results"];
    pathologistSign?: string;
  },
): Promise<(typeof db.labs)[number] | null> {
  if (!isDbReady()) {
    const lab = db.labs.find((l) => l.id === id) ?? null;
    if (!lab) return null;
    lab.status = patch.status;
    lab.results = patch.results;
    if (patch.status === "Report Approved")
      lab.pathologistSign = patch.pathologistSign ?? "Pathologist";
    return lab;
  }
  const doc = await LabModel.findOneAndUpdate({ id }, patch, { new: true }).lean();
  return (doc as unknown as (typeof db.labs)[number]) ?? null;
}
