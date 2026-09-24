import { z } from 'zod'

const base = z.object({
  author: z.string().min(1),
  role: z.string().nullish(),
  company: z.string().nullish(),
  content: z.string().min(1),
  rating: z.number().int().min(1).max(5).nullish(),
  isActive: z.boolean().default(true),
})

export const testimonialCreateSchema = base
export const testimonialUpdateSchema = base.partial()