import type { ParsedQs } from 'qs'

export interface Pagination {
  page: number
  limit: number
  skip: number
}

export function parsePagination(query: ParsedQs, defaultLimit = 12): Pagination {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(String(query.limit ?? String(defaultLimit)), 10) || defaultLimit))
  return { page, limit, skip: (page - 1) * limit }
}