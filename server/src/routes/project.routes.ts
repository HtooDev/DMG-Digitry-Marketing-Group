import { Router } from 'express'
import * as project from '../controllers/project.controller'
import { optionalAuth, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam, imageIdParam } from '../validation/common'
import {
  projectCreateSchema,
  projectImageSchema,
  projectListQuery,
  projectUpdateSchema,
} from '../validation/project.schema'

export const projectRouter = Router()

projectRouter.get('/', optionalAuth, validate({ query: projectListQuery }), project.listProjects)
projectRouter.get('/:slug', optionalAuth, project.getProject)
projectRouter.post('/', requireAdmin, validate({ body: projectCreateSchema }), project.createProject)
projectRouter.patch('/:id', requireAdmin, validate({ body: projectUpdateSchema }), project.updateProject)
projectRouter.delete('/:id', requireAdmin, project.deleteProject)

projectRouter.post('/:id/images', requireAdmin, validate({ params: idParam, body: projectImageSchema }), project.addProjectImage)
projectRouter.patch(
  '/:id/images/:imageId/primary',
  requireAdmin,
  validate({ params: imageIdParam }),
  project.setProjectPrimaryImage,
)
projectRouter.delete('/:id/images/:imageId', requireAdmin, validate({ params: imageIdParam }), project.deleteProjectImage)