import { z } from 'zod'

export const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  isActive: z.boolean().default(true),
})

export const userUpdateSchema = userCreateSchema
  .omit({ password: true })
  .partial()
  .extend({ password: z.string().min(8).optional() })