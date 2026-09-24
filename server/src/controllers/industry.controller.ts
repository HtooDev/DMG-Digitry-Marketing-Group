import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { ensureUniqueSlug } from '../utils/slug'
import { parseId } from '../utils/id'

const include = { _count: { select: { clients: true } } }

export const listIndustries = asyncHandler(async (req, res) => {
  const data = await prisma.industry.findMany({ include, orderBy: { name: 'asc' } })
  res.json({ data })
})

export const getIndustry = asyncHandler(async (req, res) => {
  const industry = await prisma.industry.findUnique({
    where: { slug: req.params.slug },
    include: {
      clients: { where: { isActive: true }, orderBy: { name: 'asc' } },
    },
  })
  if (!industry) throw new ApiError(404, 'Industry not found')
  res.json({ data: industry })
})

export const createIndustry = asyncHandler(async (req, res) => {
  const body = req.body as { name: string; slug?: string; description?: string | null }
  const slug = body.slug?.trim() || (await ensureUniqueSlug(prisma.industry, body.name))
  const industry = await prisma.industry.create({
    data: { name: body.name, slug, description: body.description ?? null },
    include,
  })
  res.status(201).json({ data: industry })
})

export const updateIndustry = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const data = req.body as Prisma.IndustryUpdateInput
  const existing = await prisma.industry.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Industry not found')
  if (req.body.slug === '') data.slug = await ensureUniqueSlug(prisma.industry, req.body.name ?? existing.name)
  const industry = await prisma.industry.update({ where: { id }, data })
  res.json({ data: industry })
})

export const deleteIndustry = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.industry.delete({ where: { id } })
  res.status(204).end()
})