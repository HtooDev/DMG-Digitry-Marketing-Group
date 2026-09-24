import type { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { ApiError } from '../utils/apiError'

export interface AuthUser {
  id: number
  email: string
  role: UserRole
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

type JwtPayload = jwt.JwtPayload & AuthUser

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured')
  return secret
}

function readToken(req: Request): string | undefined {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return undefined
  return header.slice('Bearer '.length)
}

export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readToken(req)
  if (!token) return next(new ApiError(401, 'Authentication required'))
  try {
    const payload = jwt.verify(token, getSecret()) as JwtPayload
    req.user = { id: payload.id, email: payload.email, role: payload.role }
    return next()
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'))
  }
}

export const requireAdmin: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readToken(req)
  if (!token) return next(new ApiError(401, 'Authentication required'))
  try {
    const payload = jwt.verify(token, getSecret()) as JwtPayload
    req.user = { id: payload.id, email: payload.email, role: payload.role }
    if (req.user.role !== UserRole.admin) return next(new ApiError(403, 'Admin access required'))
    return next()
  } catch {
    return next(new ApiError(401, 'Invalid or expired token'))
  }
}

export const optionalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readToken(req)
  if (token) {
    try {
      const payload = jwt.verify(token, getSecret()) as JwtPayload
      req.user = { id: payload.id, email: payload.email, role: payload.role }
    } catch {
      // invalid token on a public route is ignored
    }
  }
  return next()
}