import { Router } from 'express'
import * as client from '../controllers/client.controller'
import { optionalAuth, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { clientCreateSchema, clientUpdateSchema, clientListQuery } from '../validation/client.schema'

export const clientRouter = Router()

clientRouter.get('/', optionalAuth, validate({ query: clientListQuery }), client.listClients)
clientRouter.get('/:slug', optionalAuth, client.getClient)
clientRouter.post('/', requireAdmin, validate({ body: clientCreateSchema }), client.createClient)
clientRouter.patch('/:id', requireAdmin, validate({ body: clientUpdateSchema }), client.updateClient)
clientRouter.delete('/:id', requireAdmin, client.deleteClient)