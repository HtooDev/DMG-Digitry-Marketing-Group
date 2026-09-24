import { Router } from 'express'
import * as inquiry from '../controllers/inquiry.controller'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam } from '../validation/common'
import { inquiryCreateSchema, inquiryListQuery, inquiryUpdateSchema } from '../validation/inquiry.schema'

export const inquiryRouter = Router()

// Public: submit the contact form
inquiryRouter.post('/', validate({ body: inquiryCreateSchema }), inquiry.submitInquiry)

// Admin: manage inquiries
inquiryRouter.get('/', requireAdmin, validate({ query: inquiryListQuery }), inquiry.listInquiries)
inquiryRouter.get('/:id', requireAdmin, validate({ params: idParam }), inquiry.getInquiry)
inquiryRouter.patch('/:id', requireAdmin, validate({ params: idParam, body: inquiryUpdateSchema }), inquiry.updateInquiryStatus)
inquiryRouter.delete('/:id', requireAdmin, validate({ params: idParam }), inquiry.deleteInquiry)