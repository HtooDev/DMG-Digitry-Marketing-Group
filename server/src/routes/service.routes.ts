import { Router } from 'express'
import * as service from '../controllers/service.controller'
import { optionalAuth, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { serviceCreateSchema, serviceUpdateSchema } from '../validation/service.schema'

export const serviceRouter = Router()

serviceRouter.get('/', optionalAuth, service.listServices)
serviceRouter.get('/:slug', optionalAuth, service.getService)
serviceRouter.post('/', requireAdmin, validate({ body: serviceCreateSchema }), service.createService)
serviceRouter.patch('/:id', requireAdmin, validate({ body: serviceUpdateSchema }), service.updateService)
serviceRouter.delete('/:id', requireAdmin, service.deleteService)