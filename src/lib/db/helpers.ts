import { isNull, type AnyColumn } from 'drizzle-orm';

/**
 * WHERE condition to filter out soft-deleted records.
 * Usage: .where(notDeleted(table.deletedAt))
 */
export function notDeleted(column: AnyColumn) {
  return isNull(column);
}

/**
 * Pagination parameters from query string.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 25));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Pagination metadata for API responses.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Standard API response shape.
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}
