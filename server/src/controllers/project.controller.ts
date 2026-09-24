import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { ensureUniqueSlug } from '../utils/slug'
import { parseId } from '../utils/id'
import { parsePagination } from '../utils/pagination'

const projectInclude = {
  client: { select: { id: true, name: true, slug: true, logoUrl: true } },
  services: { select: { service: { select: { id: true, name: true, slug: true } } } },
  images: { orderBy: { sortOrder: 'asc' } },
} as const

interface ImageInput {
  url: string
  alt?: string | null
  caption?: string | null
  isPrimary?: boolean
  sortOrder?: number
  isCaseStudy?: boolean
}

function toProjectImage(image: ImageInput) {
  return {
    url: image.url,
    alt: image.alt ?? null,
    caption: image.caption ?? null,
    isPrimary: image.isPrimary ?? false,
    sortOrder: image.sortOrder ?? 0,
    isCaseStudy: image.isCaseStudy ?? false,
  }
}

export const listProjects = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const { page, limit, skip } = parsePagination(req.query)
  const serviceId = Number(req.query.serviceId) || undefined
  const clientId = Number(req.query.clientId) || undefined

  const where: Prisma.ProjectWhereInput = {
    ...(isAdmin ? {} : { isPublished: true }),
    ...(serviceId ? { services: { some: { serviceId } } } : {}),
    ...(clientId ? { clientId } : {}),
  }
  const [total, data] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
  ])
  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

export const getProject = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const project = await prisma.project.findFirst({
    where: { slug: req.params.slug, ...(isAdmin ? {} : { isPublished: true }) },
    include: projectInclude,
  })
  if (!project) throw new ApiError(404, 'Project not found')
  res.json({ data: project })
})

export const createProject = asyncHandler(async (req, res) => {
  const body = req.body as {
    clientId: number
    title: string
    slug?: string
    summary?: string | null
    description?: string | null
    year?: number | null
    isPublished?: boolean
    serviceIds?: number[]
    images?: ImageInput[]
  }
  const client = await prisma.client.findUnique({ where: { id: body.clientId } })
  if (!client) throw new ApiError(400, 'Invalid clientId')

  const slug = body.slug?.trim() || (await ensureUniqueSlug(prisma.project, body.title))
  const project = await prisma.project.create({
    data: {
      clientId: body.clientId,
      title: body.title,
      slug,
      summary: body.summary ?? null,
      description: body.description ?? null,
      year: body.year ?? null,
      isPublished: body.isPublished ?? false,
      services: { create: (body.serviceIds ?? []).map((id) => ({ service: { connect: { id } } })) },
      images: { create: (body.images ?? []).map(toProjectImage) },
    },
    include: projectInclude,
  })
  res.status(201).json({ data: project })
})

export const updateProject = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Project not found')

  const { serviceIds, images, ...rest } = req.body as Record<string, unknown> & {
    serviceIds?: number[]
    images?: ImageInput[]
  }
  const data: Prisma.ProjectUpdateInput = { ...(rest as Prisma.ProjectUpdateInput) }
  if (rest.slug === '') data.slug = await ensureUniqueSlug(prisma.project, (rest.title as string) ?? existing.title)
  if (Array.isArray(serviceIds)) {
    data.services = {
      deleteMany: {},
      create: serviceIds.map((id) => ({ service: { connect: { id } } })),
    }
  }
  if (Array.isArray(images)) {
    data.images = {
      deleteMany: {},
      create: images.map(toProjectImage),
    }
  }

  const project = await prisma.project.update({ where: { id }, data, include: projectInclude })
  res.json({ data: project })
})

export const deleteProject = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.project.delete({ where: { id } })
  res.status(204).end()
})

// ---- Project images -------------------------------------------------------

export const addProjectImage = asyncHandler(async (req, res) => {
  const projectId = parseId(req.params.id)
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new ApiError(404, 'Project not found')

  const body = req.body as ImageInput
  let image: Awaited<ReturnType<typeof prisma.projectImage.create>> | null = null
  await prisma.$transaction(async (tx) => {
    if (body.isPrimary) {
      await tx.projectImage.updateMany({ where: { projectId, isPrimary: true }, data: { isPrimary: false } })
    }
    image = await tx.projectImage.create({ data: { projectId, ...toProjectImage(body) } })
  })
  res.status(201).json({ data: image })
})

export const setProjectPrimaryImage = asyncHandler(async (req, res) => {
  const projectId = parseId(req.params.id)
  const imageId = parseId(req.params.imageId)
  await prisma.$transaction([
    prisma.projectImage.updateMany({ where: { projectId, isPrimary: true }, data: { isPrimary: false } }),
    prisma.projectImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ])
  res.json({ data: { ok: true } })
})

export const deleteProjectImage = asyncHandler(async (req, res) => {
  const imageId = parseId(req.params.imageId)
  await prisma.projectImage.delete({ where: { id: imageId } })
  res.status(204).end()
})