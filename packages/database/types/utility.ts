/**
 * Paginated response wrapper for offset-based pagination.
 */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Cursor-paginated response wrapper for infinite scroll.
 */
export interface CursorPaginated<T> {
  data: T[];
  nextCursor: string | null;
}

/**
 * Make selected keys of T required while keeping the rest unchanged.
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make selected keys of T optional while keeping the rest unchanged.
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
