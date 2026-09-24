import { z } from 'zod'

const base = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullish(),
})

export const industryCreateSchema = base
export const industryUpdateSchema = base.partial()