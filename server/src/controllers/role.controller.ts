import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { parseId } from '../utils/id'

const include = {
  _count: { select: { teamMembers: true } },
} as const

export const listRoles = asyncHandler(async (_req, res) => {
  const data = await prisma.role.findMany({ include, orderBy: { name: 'asc' } })
  res.json({ data })
})

export const getRole = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const role = await prisma.role.findUnique({ where: { id }, include })
  if (!role) throw new ApiError(404, 'Role not found')
  res.json({ data: role })
})

export const createRole = asyncHandler(async (req, res) => {
  const body = req.body as { name: string; description?: string | null }
  const existing = await prisma.role.findUnique({ where: { name: body.name } })
  if (existing) throw new ApiError(409, 'Role already exists')

  const role = await prisma.role.create({
    data: { name: body.name, description: body.description ?? null },
    include,
  })
  res.status(201).json({ data: role })
})

export const updateRole = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.role.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Role not found')

  if (typeof req.body.name === 'string' && req.body.name !== existing.name) {
    const clash = await prisma.role.findUnique({ where: { name: req.body.name } })
    if (clash) throw new ApiError(409, 'Role already exists')
  }

  const role = await prisma.role.update({ where: { id }, data: req.body, include })
  res.json({ data: role })
})

export const deleteRole = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { teamMembers: true } } } })
  if (!existing) throw new ApiError(404, 'Role not found')
  if (existing._count.teamMembers > 0) throw new ApiError(400, 'Role is assigned to team members and cannot be deleted')

  await prisma.role.delete({ where: { id } })
  res.status(204).end()
})