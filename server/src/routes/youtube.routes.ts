import { Router } from 'express'
import * as youtube from '../controllers/youtube.controller'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { youtubeImportSchema, youtubeLatestQuery, youtubeVideoQuery } from '../validation/youtube.schema'

export const youtubeRouter = Router()

youtubeRouter.get('/latest', validate({ query: youtubeLatestQuery }), youtube.latestVideos)
youtubeRouter.get('/video', validate({ query: youtubeVideoQuery }), youtube.videoById)
youtubeRouter.post('/import', requireAdmin, validate({ body: youtubeImportSchema }), youtube.importVideos)