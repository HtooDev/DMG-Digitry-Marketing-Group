import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { ensureUniqueSlug } from '../utils/slug'
import { parseId } from '../utils/id'

const include = { _count: { select: { projects: true } } }

export const listServices = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const data = await prisma.service.findMany({
    where: isAdmin ? {} : { isActive: true },
    include,
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ data })
})

export const getService = asyncHandler(async (req, res) => {
  const service = await prisma.service.findUnique({
    where: { slug: req.params.slug },
    include,
  })
  if (!service || (!service.isActive && req.user?.role !== UserRole.admin)) {
    throw new ApiError(404, 'Service not found')
  }
  res.json({ data: service })
})

export const createService = asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string
    slug?: string
    title: string
    description: string
    icon?: string | null
    packageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  }
  const slug = body.slug?.trim() || (await ensureUniqueSlug(prisma.service, body.name))
  const service = await prisma.service.create({
    data: {
      name: body.name,
      slug,
      title: body.title,
      description: body.description,
      icon: body.icon ?? null,
      packageUrl: body.packageUrl ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: body.isActive ?? true,
    },
  })
  res.status(201).json({ data: service })
})

export const updateService = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const body = req.body as Record<string, unknown>
  const existing = await prisma.service.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Service not found')

  const data: Record<string, unknown> = { ...body }
  if (body.slug === undefined) {
    delete data.slug
  } else if (typeof body.slug === 'string' && body.slug.trim() === '') {
    data.slug = await ensureUniqueSlug(prisma.service, (body.title as string) ?? existing.title)
  }

  const service = await prisma.service.update({ where: { id }, data: data as Prisma.ServiceUpdateInput })
  res.json({ data: service })
})

export const deleteService = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.service.delete({ where: { id } })
  res.status(204).end()
})