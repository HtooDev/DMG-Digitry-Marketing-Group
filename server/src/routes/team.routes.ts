import { Router } from 'express'
import * as team from '../controllers/team.controller'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam } from '../validation/common'
import { teamCreateSchema, teamUpdateSchema } from '../validation/team.schema'

export const teamRouter = Router()

teamRouter.get('/', team.listTeamMembers)
teamRouter.get('/:id', validate({ params: idParam }), team.getTeamMember)
teamRouter.post('/', requireAdmin, validate({ body: teamCreateSchema }), team.createTeamMember)
teamRouter.patch('/:id', requireAdmin, validate({ params: idParam, body: teamUpdateSchema }), team.updateTeamMember)
teamRouter.delete('/:id', requireAdmin, validate({ params: idParam }), team.deleteTeamMember)