import { z } from 'zod'
import { paginationQuery } from './common'

const base = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullish(),
  logoUrl: z.string().url().nullish(),
  industryId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
})

export const clientListQuery = paginationQuery
export const clientCreateSchema = base
export const clientUpdateSchema = base.partial()