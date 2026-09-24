import { Router } from 'express'
import * as industry from '../controllers/industry.controller'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { industryCreateSchema, industryUpdateSchema } from '../validation/industry.schema'

export const industryRouter = Router()

industryRouter.get('/', industry.listIndustries)
industryRouter.get('/:slug', industry.getIndustry)
industryRouter.post('/', requireAdmin, validate({ body: industryCreateSchema }), industry.createIndustry)
industryRouter.patch('/:id', requireAdmin, validate({ body: industryUpdateSchema }), industry.updateIndustry)
industryRouter.delete('/:id', requireAdmin, industry.deleteIndustry)