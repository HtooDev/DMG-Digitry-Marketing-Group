import { ApiError } from './apiError'

export function parseId(raw: string | undefined): number {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(400, 'Invalid id')
  return id
}