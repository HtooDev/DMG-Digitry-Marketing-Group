import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { hashPassword } from '../utils/password'
import { parseId } from '../utils/id'

const safeUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

export const listUsers = asyncHandler(async (_req, res) => {
  const data = await prisma.user.findMany({ select: safeUser, orderBy: { id: 'asc' } })
  res.json({ data })
})


export const getUser = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const user = await prisma.user.findUnique({ where: { id }, select: safeUser })
  if (!user) throw new ApiError(404, 'User not found')
  res.json({ data: user })
})

export const createUser = asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string
    email: string
    password: string
    isActive?: boolean
  }
  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) throw new ApiError(409, 'Email already in use')

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      isActive: body.isActive ?? true,
    },
    select: safeUser,
  })
  res.status(201).json({ data: user })
})

export const updateUser = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'User not found')

  const { password, ...rest } = req.body as Record<string, unknown> & { password?: string }
  const data: Record<string, unknown> = { ...rest }
  if (password) {
    data.passwordHash = await hashPassword(password)
    delete data.password
  }
  if (rest.email) {
    const clash = await prisma.user.findFirst({ where: { email: rest.email as string, id: { not: id } } })
    if (clash) throw new ApiError(409, 'Email already in use')
  }

  const user = await prisma.user.update({ where: { id }, data: data as Prisma.UserUpdateInput })
  res.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } })
})

export const deleteUser = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  if (id === req.user?.id) throw new ApiError(400, 'Cannot delete your own account')
  await prisma.user.delete({ where: { id } })
  res.status(204).end()
})