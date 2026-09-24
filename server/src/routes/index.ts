import { Router } from 'express'
import { authRouter } from './auth.routes'
import { serviceRouter } from './service.routes'
import { industryRouter } from './industry.routes'
import { clientRouter } from './client.routes'
import { projectRouter } from './project.routes'
import { brandingRouter } from './branding.routes'
import { postRouter } from './post.routes'
import { teamRouter } from './team.routes'
import { testimonialRouter } from './testimonial.routes'
import { userRouter } from './user.routes'
import { roleRouter } from './role.routes'
import { inquiryRouter } from './inquiry.routes'
import { uploadRouter } from './upload.routes'
import { youtubeRouter } from './youtube.routes'

export const apiRouter = Router()

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

apiRouter.use('/auth', authRouter)
apiRouter.use('/services', serviceRouter)
apiRouter.use('/industries', industryRouter)
apiRouter.use('/clients', clientRouter)
apiRouter.use('/projects', projectRouter)
apiRouter.use('/brandings', brandingRouter)
apiRouter.use('/posts', postRouter)
apiRouter.use('/team', teamRouter)
apiRouter.use('/testimonials', testimonialRouter)
apiRouter.use('/users', userRouter)
apiRouter.use('/roles', roleRouter)
apiRouter.use('/inquiries', inquiryRouter)
apiRouter.use('/upload', uploadRouter)
apiRouter.use('/youtube', youtubeRouter)