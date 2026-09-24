import { z } from 'zod'
import { paginationQuery } from './common'

export const brandingListQuery = paginationQuery

export const brandingImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().nullish(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

const base = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullish(),
  clientId: z.number().int().positive().nullable().optional(),
  primaryColor: z.string().nullish(),
  secondaryColor: z.string().nullish(),
  accentColor: z.string().nullish(),
  isPublished: z.boolean().default(false),
  images: z.array(brandingImageSchema).default([]),
})

export const brandingCreateSchema = base
export const brandingUpdateSchema = base.partial()