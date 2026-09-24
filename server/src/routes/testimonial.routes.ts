import { Router } from 'express'
import * as testimonial from '../controllers/testimonial.controller'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam } from '../validation/common'
import { testimonialCreateSchema, testimonialUpdateSchema } from '../validation/testimonial.schema'

export const testimonialRouter = Router()

testimonialRouter.get('/', testimonial.listTestimonials)
testimonialRouter.get('/:id', validate({ params: idParam }), testimonial.getTestimonial)
testimonialRouter.post('/', requireAdmin, validate({ body: testimonialCreateSchema }), testimonial.createTestimonial)
testimonialRouter.patch('/:id', requireAdmin, validate({ params: idParam, body: testimonialUpdateSchema }), testimonial.updateTestimonial)
testimonialRouter.delete('/:id', requireAdmin, validate({ params: idParam }), testimonial.deleteTestimonial)