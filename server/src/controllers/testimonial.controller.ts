import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { parseId } from '../utils/id'

export const listTestimonials = asyncHandler(async (_req, res) => {
  const data = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data })
})

export const getTestimonial = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const testimonial = await prisma.testimonial.findUnique({ where: { id } })
  if (!testimonial || !testimonial.isActive) throw new ApiError(404, 'Testimonial not found')
  res.json({ data: testimonial })
})

export const createTestimonial = asyncHandler(async (req, res) => {
  const body = req.body as {
    author: string
    role?: string | null
    company?: string | null
    content: string
    rating?: number | null
    isActive?: boolean
  }
  const testimonial = await prisma.testimonial.create({
    data: {
      author: body.author,
      role: body.role ?? null,
      company: body.company ?? null,
      content: body.content,
      rating: body.rating ?? null,
      isActive: body.isActive ?? true,
    },
  })
  res.status(201).json({ data: testimonial })
})

export const updateTestimonial = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Testimonial not found')
  const data = req.body as Prisma.TestimonialUpdateInput
  const testimonial = await prisma.testimonial.update({ where: { id }, data })
  res.json({ data: testimonial })
})

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.testimonial.delete({ where: { id } })
  res.status(204).end()
})