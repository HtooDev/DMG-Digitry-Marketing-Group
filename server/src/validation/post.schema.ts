import { z } from 'zod'
import { paginationQuery } from './common'

export const postListQuery = paginationQuery.extend({
  type: z.enum(['blog', 'vlog']).optional(),
  q: z.string().trim().max(100).optional(),
})

export const postImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().nullish(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
})

export const postCreateSchema = z.object({
  type: z.enum(['blog', 'vlog']).default('blog'),
  title: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().nullish(),
  content: z.string().nullish(),
  videoUrl: z.string().url().nullish(),
  youtubeId: z.string().nullish(),
  publishedAt: z.string().datetime().nullish(),
  isPublished: z.boolean().default(false),
  images: z.array(postImageSchema).default([]),
})

export const postUpdateSchema = postCreateSchema.partial()