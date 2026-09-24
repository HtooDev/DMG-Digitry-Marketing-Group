import { z } from 'zod'

export const uploadQuerySchema = z.object({
  folder: z.string().regex(/^[a-z0-9-_/]*$/).optional(),
})