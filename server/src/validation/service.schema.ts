import { z } from 'zod'

const base = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().nullish(),
  packageUrl: z.string().url().nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const serviceCreateSchema = base
export const serviceUpdateSchema = base.partial()