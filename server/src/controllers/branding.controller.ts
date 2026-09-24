import { Prisma, UserRole } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { ensureUniqueSlug } from '../utils/slug'
import { parseId } from '../utils/id'
import { parsePagination } from '../utils/pagination'

const brandingInclude = {
  client: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' } },
} as const

interface ImageInput {
  url: string
  alt?: string | null
  isPrimary?: boolean
  sortOrder?: number
}

function toBrandingImage(image: ImageInput) {
  return {
    url: image.url,
    alt: image.alt ?? null,
    isPrimary: image.isPrimary ?? false,
    sortOrder: image.sortOrder ?? 0,
  }
}

export const listBrandings = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const { page, limit, skip } = parsePagination(req.query)
  const where = isAdmin
    ? {}
    : { isPublished: true }
  const [total, data] = await Promise.all([
    prisma.branding.count({ where }),
    prisma.branding.findMany({
      where,
      include: brandingInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
  ])
  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

export const getBranding = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === UserRole.admin
  const branding = await prisma.branding.findFirst({
    where: { slug: req.params.slug, ...(isAdmin ? {} : { isPublished: true }) },
    include: brandingInclude,
  })
  if (!branding) throw new ApiError(404, 'Branding not found')
  res.json({ data: branding })
})

export const createBranding = asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string
    slug?: string
    description?: string | null
    clientId?: number | null
    primaryColor?: string | null
    secondaryColor?: string | null
    accentColor?: string | null
    isPublished?: boolean
    images?: ImageInput[]
  }
  if (body.clientId) {
    const client = await prisma.client.findUnique({ where: { id: body.clientId } })
    if (!client) throw new ApiError(400, 'Invalid clientId')
  }
  const slug = body.slug?.trim() || (await ensureUniqueSlug(prisma.branding, body.name))
  const branding = await prisma.branding.create({
    data: {
      name: body.name,
      slug,
      description: body.description ?? null,
      clientId: body.clientId ?? null,
      primaryColor: body.primaryColor ?? null,
      secondaryColor: body.secondaryColor ?? null,
      accentColor: body.accentColor ?? null,
      isPublished: body.isPublished ?? false,
      images: { create: (body.images ?? []).map(toBrandingImage) },
    },
    include: brandingInclude,
  })
  res.status(201).json({ data: branding })
})

export const updateBranding = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.branding.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Branding not found')

  const { images, ...rest } = req.body as Record<string, unknown> & { images?: ImageInput[] }
  const data: Prisma.BrandingUpdateInput = { ...(rest as Prisma.BrandingUpdateInput) }
  if (rest.slug === '') data.slug = await ensureUniqueSlug(prisma.branding, (rest.name as string) ?? existing.name)
  if (Array.isArray(images)) {
    data.images = { deleteMany: {}, create: images.map(toBrandingImage) }
  }
  const branding = await prisma.branding.update({ where: { id }, data, include: brandingInclude })
  res.json({ data: branding })
})

export const deleteBranding = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.branding.delete({ where: { id } })
  res.status(204).end()
})

// ---- Branding images ------------------------------------------------------

export const addBrandingImage = asyncHandler(async (req, res) => {
  const brandingId = parseId(req.params.id)
  const branding = await prisma.branding.findUnique({ where: { id: brandingId } })
  if (!branding) throw new ApiError(404, 'Branding not found')

  const body = req.body as ImageInput
  let image: Awaited<ReturnType<typeof prisma.brandingImage.create>> | null = null
  await prisma.$transaction(async (tx) => {
    if (body.isPrimary) {
      await tx.brandingImage.updateMany({ where: { brandingId, isPrimary: true }, data: { isPrimary: false } })
    }
    image = await tx.brandingImage.create({ data: { brandingId, ...toBrandingImage(body) } })
  })
  res.status(201).json({ data: image })
})

export const setBrandingPrimaryImage = asyncHandler(async (req, res) => {
  const brandingId = parseId(req.params.id)
  const imageId = parseId(req.params.imageId)
  await prisma.$transaction([
    prisma.brandingImage.updateMany({ where: { brandingId, isPrimary: true }, data: { isPrimary: false } }),
    prisma.brandingImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ])
  res.json({ data: { ok: true } })
})

export const deleteBrandingImage = asyncHandler(async (req, res) => {
  const imageId = parseId(req.params.imageId)
  await prisma.brandingImage.delete({ where: { id: imageId } })
  res.status(204).end()
})