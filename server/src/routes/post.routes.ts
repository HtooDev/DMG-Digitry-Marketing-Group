import { Router } from 'express'
import * as post from '../controllers/post.controller'
import { optionalAuth, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam, imageIdParam } from '../validation/common'
import { postCreateSchema, postImageSchema, postListQuery, postUpdateSchema } from '../validation/post.schema'

export const postRouter = Router()

postRouter.get('/', optionalAuth, validate({ query: postListQuery }), post.listPosts)
postRouter.get('/:slug', optionalAuth, post.getPost)
postRouter.post('/', requireAdmin, validate({ body: postCreateSchema }), post.createPost)
postRouter.patch('/:id', requireAdmin, validate({ body: postUpdateSchema }), post.updatePost)
postRouter.delete('/:id', requireAdmin, post.deletePost)

postRouter.post('/:id/images', requireAdmin, validate({ params: idParam, body: postImageSchema }), post.addPostImage)
postRouter.patch('/:id/images/:imageId/primary', requireAdmin, validate({ params: imageIdParam }), post.setPostPrimaryImage)
postRouter.delete('/:id/images/:imageId', requireAdmin, validate({ params: imageIdParam }), post.deletePostImage)