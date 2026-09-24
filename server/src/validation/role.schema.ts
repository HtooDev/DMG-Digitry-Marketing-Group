import { z } from 'zod'

const base = z.object({
  name: z.string().min(1),
  description: z.string().nullish(),
})

export const roleCreateSchema = base
export const roleUpdateSchema = base.partial()