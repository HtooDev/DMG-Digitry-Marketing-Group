import multer from 'multer'
import { ApiError } from '../utils/apiError'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ApiError(400, 'Only image files are allowed'))
    }
    cb(null, true)
  },
})

// Separate instance for PDF uploads (documents, e.g. service packages).
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new ApiError(400, 'Only PDF files are allowed'))
    }
    cb(null, true)
  },
})