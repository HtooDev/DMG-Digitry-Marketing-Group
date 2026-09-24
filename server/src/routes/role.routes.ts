import { Router } from 'express'
import * as role from '../controllers/role.controller'
import { optionalAuth, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam } from '../validation/common'
import { roleCreateSchema, roleUpdateSchema } from '../validation/role.schema'

export const roleRouter = Router()

roleRouter.get('/', optionalAuth, role.listRoles)
roleRouter.get('/:id', optionalAuth, validate({ params: idParam }), role.getRole)
roleRouter.post('/', requireAdmin, validate({ body: roleCreateSchema }), role.createRole)
roleRouter.patch('/:id', requireAdmin, validate({ params: idParam, body: roleUpdateSchema }), role.updateRole)
roleRouter.delete('/:id', requireAdmin, validate({ params: idParam }), role.deleteRole)