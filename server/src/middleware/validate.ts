import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'

interface Validation {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

/**
 * Validate (and coerce) request parts against zod schemas.
 * Transformed output is written back onto req.body / req.query / req.params.
 * Violations are forwarded to the error handler (400).
 */
export function validate({ body, query, params }: Validation): RequestHandler {
  return (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body) as any
      // Express 5 makes req.query / req.params read-only, so copy parsed values
      // back onto the existing objects instead of reassigning them.
      if (query) Object.assign(req.query, query.parse(req.query) as object)
      if (params) Object.assign(req.params, params.parse(req.params) as object)
      next()
    } catch (err) {
      next(err)
    }
  }
}