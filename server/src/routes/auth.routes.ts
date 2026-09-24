import { Router } from 'express'
import { login, me, register } from '../controllers/auth.controller'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { loginSchema, registerSchema } from '../validation/auth.schema'

export const authRouter = Router()

// Admin (invite-only) — registering requires an already-authenticated admin
authRouter.post('/register', requireAdmin, validate({ body: registerSchema }), register)
authRouter.post('/login', validate({ body: loginSchema }), login)
authRouter.get('/me', requireAuth, me)