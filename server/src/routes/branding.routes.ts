import { Router } from 'express'
import * as branding from '../controllers/branding.controller'
import { optionalAuth, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam, imageIdParam } from '../validation/common'
import {
  brandingCreateSchema,
  brandingImageSchema,
  brandingListQuery,
  brandingUpdateSchema,
} from '../validation/branding.schema'

export const brandingRouter = Router()

brandingRouter.get('/', optionalAuth, validate({ query: brandingListQuery }), branding.listBrandings)
brandingRouter.get('/:slug', optionalAuth, branding.getBranding)
brandingRouter.post('/', requireAdmin, validate({ body: brandingCreateSchema }), branding.createBranding)
brandingRouter.patch('/:id', requireAdmin, validate({ body: brandingUpdateSchema }), branding.updateBranding)
brandingRouter.delete('/:id', requireAdmin, branding.deleteBranding)

brandingRouter.post('/:id/images', requireAdmin, validate({ params: idParam, body: brandingImageSchema }), branding.addBrandingImage)
brandingRouter.patch(
  '/:id/images/:imageId/primary',
  requireAdmin,
  validate({ params: imageIdParam }),
  branding.setBrandingPrimaryImage,
)
brandingRouter.delete('/:id/images/:imageId', requireAdmin, validate({ params: imageIdParam }), branding.deleteBrandingImage)