import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { parseId } from '../utils/id'

const safeMember = {
  id: true,
  name: true,
  role: { select: { id: true, name: true } },
  bio: true,
  photoUrl: true,
  email: true,
  linkedinUrl: true,
  sortOrder: true,
  isActive: true,
} as const

export const listTeamMembers = asyncHandler(async (_req, res) => {
  const data = await prisma.teamMember.findMany({
    where: { isActive: true },
    select: safeMember,
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ data })
})

export const getTeamMember = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const member = await prisma.teamMember.findUnique({ where: { id }, select: safeMember })
  if (!member || !member.isActive) throw new ApiError(404, 'Team member not found')
  res.json({ data: member })
})

export const createTeamMember = asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string
    roleId?: number
    bio?: string | null
    photoUrl?: string | null
    email?: string | null
    linkedinUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  }
  const roleId = body.roleId ?? (await defaultRoleId())

  const member = await prisma.teamMember.create({
    data: {
      name: body.name,
      role: { connect: { id: roleId } },
      bio: body.bio ?? null,
      photoUrl: body.photoUrl ?? null,
      email: body.email ?? null,
      linkedinUrl: body.linkedinUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
    select: safeMember,
  })
  res.status(201).json({ data: member })
})

export const updateTeamMember = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.teamMember.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Team member not found')

  const { roleId, ...rest } = req.body as Record<string, unknown> & { roleId?: number }
  const data: Record<string, unknown> = { ...(rest as Prisma.TeamMemberUpdateInput) }
  if (roleId !== undefined) {
    const role = await prisma.role.findUnique({ where: { id: roleId } })
    if (!role) throw new ApiError(400, 'Invalid roleId')
    data.role = { connect: { id: roleId } }
  }

  const member = await prisma.teamMember.update({
    where: { id },
    data: data as Prisma.TeamMemberUpdateInput,
    select: safeMember,
  })
  res.json({ data: member })
})

export const deleteTeamMember = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.teamMember.delete({ where: { id } })
  res.status(204).end()
})

async function defaultRoleId(): Promise<number> {
  const anyRole = await prisma.role.findFirst({ orderBy: { id: 'asc' } })
  if (!anyRole) throw new ApiError(400, 'No roles exist. Create a role first.')
  return anyRole.id
}