import { z } from 'zod'
import { paginationQuery } from './common'

export const projectListQuery = paginationQuery.extend({
  serviceId: z.coerce.number().int().positive().optional(),
  clientId: z.coerce.number().int().positive().optional(),
})

export const projectImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().nullish(),
  caption: z.string().nullish(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  isCaseStudy: z.boolean().default(false),
})

export const projectCreateSchema = z.object({
  clientId: z.number().int().positive(),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  summary: z.string().nullish(),
  description: z.string().nullish(),
  year: z.number().int().nullish(),
  isPublished: z.boolean().default(false),
  serviceIds: z.array(z.number().int().positive()).default([]),
  images: z.array(projectImageSchema).default([]),
})

export const projectUpdateSchema = projectCreateSchema.partial()