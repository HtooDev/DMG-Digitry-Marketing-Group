import { z } from 'zod'

export const idParam = z.object({ id: z.coerce.number().int().positive() })

export const imageIdParam = z.object({
  id: z.coerce.number().int().positive(),
  imageId: z.coerce.number().int().positive(),
})

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
})