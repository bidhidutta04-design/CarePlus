export interface Pagination {
  page: number;
  limit: number;
  sort?: string;
  order: "asc" | "desc";
}

export function parsePagination(query: Record<string, string>): Pagination {
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const rawLimit = Number.parseInt(query.limit ?? "20", 10) || 20;
  const limit = Math.min(100, Math.max(1, rawLimit));
  const sort = query.sort || undefined;
  const order = query.order === "desc" ? "desc" : "asc";
  return { page, limit, sort, order };
}

export function paginateArray<T>(
  items: T[],
  pagination: Pagination,
): { data: T[]; meta: { total: number; page: number; pages: number; limit: number } } {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pagination.limit));
  const page = Math.min(pagination.page, pages);
  const start = (page - 1) * pagination.limit;
  let sorted = items;
  if (pagination.sort) {
    const field = pagination.sort;
    const dir = pagination.order === "desc" ? -1 : 1;
    sorted = [...items].sort((a, b) => {
      const av = (a as Record<string, unknown>)[field];
      const bv = (b as Record<string, unknown>)[field];
      if (av === bv) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }
  const data = sorted.slice(start, start + pagination.limit);
  return { data, meta: { total, page, pages, limit: pagination.limit } };
}

export function paginatedMeta(
  total: number,
  pagination: Pagination,
): { total: number; page: number; pages: number; limit: number } {
  return {
    total,
    page: pagination.page,
    pages: Math.max(1, Math.ceil(total / pagination.limit)),
    limit: pagination.limit,
  };
}
