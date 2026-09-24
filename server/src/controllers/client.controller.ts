import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { ensureUniqueSlug } from '../utils/slug'
import { parseId } from '../utils/id'
import { parsePagination } from '../utils/pagination'

const listInclude = {
  industry: { select: { id: true, name: true, slug: true } },
  _count: { select: { projects: true, brandings: true } },
} as const

export const listClients = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const { page, limit, skip } = parsePagination(req.query)
  const where = isAdmin ? {} : { isActive: true }
  const [total, data] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      include: listInclude,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
  ])
  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

export const getClient = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const client = await prisma.client.findFirst({
    where: { slug: req.params.slug, ...(isAdmin ? {} : { isActive: true }) },
    include: {
      industry: { select: { id: true, name: true, slug: true } },
      projects: {
        where: isAdmin ? {} : { isPublished: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, slug: true, year: true, isPublished: true },
      },
      brandings: {
        where: isAdmin ? {} : { isPublished: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, slug: true, isPublished: true },
      },
    },
  })
  if (!client) throw new ApiError(404, 'Client not found')
  res.json({ data: client })
})

export const createClient = asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string
    slug?: string
    description?: string | null
    logoUrl?: string | null
    industryId?: number | null
    isActive?: boolean
  }
  if (body.industryId) {
    const industry = await prisma.industry.findUnique({ where: { id: body.industryId } })
    if (!industry) throw new ApiError(400, 'Invalid industryId')
  }
  const slug = body.slug?.trim() || (await ensureUniqueSlug(prisma.client, body.name))
  const client = await prisma.client.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? null,
      logoUrl: body.logoUrl ?? null,
      industryId: body.industryId ?? null,
      isActive: body.isActive ?? true,
    },
    include: listInclude,
  })
  res.status(201).json({ data: client })
})

export const updateClient = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.client.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Client not found')

  const data = req.body as Prisma.ClientUpdateInput
  if (req.body.industryId !== undefined) {
    const industry = await prisma.industry.findUnique({ where: { id: req.body.industryId } })
    if (!industry) throw new ApiError(400, 'Invalid industryId')
    data.industry = { connect: { id: industry.id } }
  } else if (req.body.industryId === null) {
    data.industry = { disconnect: true }
  }
  if (req.body.slug === '') data.slug = await ensureUniqueSlug(prisma.client, req.body.name ?? existing.name)

  const client = await prisma.client.update({ where: { id }, data, include: listInclude })
  res.json({ data: client })
})

export const deleteClient = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.client.delete({ where: { id } })
  res.status(204).end()
})