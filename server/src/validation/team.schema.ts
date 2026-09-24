import { z } from 'zod'

const base = z.object({
  name: z.string().min(1),
  roleId: z.number().int().positive().optional(),
  bio: z.string().nullish(),
  photoUrl: z.string().url().nullish(),
  email: z.string().email().nullish(),
  linkedinUrl: z.string().url().nullish(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const teamCreateSchema = base
export const teamUpdateSchema = base.partial()