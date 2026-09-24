import { Router } from 'express'
import * as user from '../controllers/user.controller'
import { requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { idParam } from '../validation/common'
import { userCreateSchema, userUpdateSchema } from '../validation/user.schema'

export const userRouter = Router()

userRouter.get('/', requireAdmin, user.listUsers)
userRouter.get('/:id', requireAdmin, validate({ params: idParam }), user.getUser)
userRouter.post('/', requireAdmin, validate({ body: userCreateSchema }), user.createUser)
userRouter.patch('/:id', requireAdmin, validate({ params: idParam, body: userUpdateSchema }), user.updateUser)
userRouter.delete('/:id', requireAdmin, validate({ params: idParam }), user.deleteUser)