import { z } from 'zod'
import { paginationQuery } from './common'

export const inquiryCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullish(),
  service: z.string().nullish(),
  message: z.string().min(1),
})

export const inquiryListQuery = paginationQuery.extend({
  status: z.enum(['new', 'contacted', 'closed']).optional(),
})

export const inquiryUpdateSchema = z.object({ status: z.enum(['new', 'contacted', 'closed']) })