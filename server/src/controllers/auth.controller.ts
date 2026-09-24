import jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import type { User } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { hashPassword, verifyPassword } from '../utils/password'

function signToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new ApiError(500, 'JWT_SECRET is not configured')
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d'
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, {
    expiresIn,
  } as jwt.SignOptions)
}

const safeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const

function toAuthResponse(user: User) {
  return {
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

async function findActiveUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } })
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  const user = await findActiveUserByEmail(email)
  if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials')
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw new ApiError(401, 'Invalid credentials')

  res.json({ data: toAuthResponse(user) })
})

export const me = asyncHandler(async (req, res) => {
  const authUser = req.user
  if (!authUser) throw new ApiError(401, 'Authentication required')
  const user = await prisma.user.findUnique({ where: { id: authUser.id }, select: safeUser })
  if (!user) throw new ApiError(404, 'User not found')
  res.json({ data: user })
})

// ---- Register (admin-only) ----

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw new ApiError(409, 'Email already in use')

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: UserRole.admin,
      isActive: true,
    },
  })

  res.status(201).json({ data: toAuthResponse(user) })
})