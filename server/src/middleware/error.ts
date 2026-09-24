import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import multer from 'multer'
import { ApiError } from '../utils/apiError'

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten() })
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message })
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Unique constraint violation', target: err.meta?.target })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' })
    }
    return res.status(400).json({ error: 'Database error', code: err.code })
  }

  console.error('[error]', err)
  return res.status(500).json({ error: (err as Error)?.message ?? 'Internal server error' })
}