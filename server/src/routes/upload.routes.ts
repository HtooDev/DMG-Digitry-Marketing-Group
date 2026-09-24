import { Router, type RequestHandler } from 'express'
import { uploadImage, uploadPdfFile } from '../controllers/upload.controller'
import { requireAdmin } from '../middleware/auth'
import { upload, uploadPdf } from '../middleware/upload'
import { validate } from '../middleware/validate'
import { uploadQuerySchema } from '../validation/upload.schema'

export const uploadRouter = Router()

/**
 * POST /api/upload/image?folder=brandings
 * multipart form field "image"
 */
uploadRouter.post(
  '/image',
  requireAdmin,
  upload.single('image') as unknown as RequestHandler,
  validate({ query: uploadQuerySchema }),
  uploadImage,
)

/**
 * POST /api/upload/pdf?folder=packages
 * multipart form field "pdf"
 */
uploadRouter.post(
  '/pdf',
  requireAdmin,
  uploadPdf.single('pdf') as unknown as RequestHandler,
  validate({ query: uploadQuerySchema }),
  uploadPdfFile,
)