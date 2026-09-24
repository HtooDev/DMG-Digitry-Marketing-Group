import { InquiryStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { ApiError } from '../utils/apiError'
import { asyncHandler } from '../utils/asyncHandler'
import { parseId } from '../utils/id'
import { parsePagination } from '../utils/pagination'

export const submitInquiry = asyncHandler(async (req, res) => {
  const body = req.body as {
    name: string
    email: string
    phone?: string | null
    service?: string | null
    message: string
  }
  const inquiry = await prisma.inquiry.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      service: body.service ?? null,
      message: body.message,
    },
  })
  res.status(201).json({ data: inquiry })
})

export const listInquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const status = (req.query.status as string | undefined) as InquiryStatus | undefined
  const where = status ? { status } : {}
  const [total, data] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { handledBy: { select: { id: true, name: true, email: true } } },
    }),
  ])
  res.json({ data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

export const getInquiry = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: { handledBy: { select: { id: true, name: true, email: true } } },
  })
  if (!inquiry) throw new ApiError(404, 'Inquiry not found')
  res.json({ data: inquiry })
})

export const updateInquiryStatus = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  const body = req.body as { status?: InquiryStatus }
  const existing = await prisma.inquiry.findUnique({ where: { id } })
  if (!existing) throw new ApiError(404, 'Inquiry not found')

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { status: body.status, handledById: req.user?.id },
  })
  res.json({ data: inquiry })
})

export const deleteInquiry = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id)
  await prisma.inquiry.delete({ where: { id } })
  res.status(204).end()
})