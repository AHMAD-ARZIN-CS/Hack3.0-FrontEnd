/**
 * Shared query helpers.
 * - applyPaging(): used by mock sources after filtering.
 * - matchesText(): simple case-insensitive search for mock mode.
 * - toSearchParams(): turns the same query object into URL params for API mode.
 */
import type { ListQuery, Paged } from "@/types/models";

export const DEFAULT_PAGE_SIZE = 20;

export function applyPaging<T>(items: T[], query: Pick<ListQuery, "page" | "pageSize">): Paged<T> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(50, query.pageSize ?? DEFAULT_PAGE_SIZE);
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

export function matchesText(q: string | undefined, ...fields: (string | undefined)[]): boolean {
  if (!q || !q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

export function toSearchParams(query: object): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}
