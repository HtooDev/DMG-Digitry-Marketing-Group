import { asyncHandler } from '../utils/asyncHandler'
import { ApiError } from '../utils/apiError'
import { buildKey, saveBuffer } from '../lib/storage'
import { extensionForMime, optimizeImage } from '../lib/image'

export const uploadImage = asyncHandler(async (req, res) => {
  const file = req.file
  if (!file) throw new ApiError(400, 'No file uploaded')

  const optimized = await optimizeImage(file.buffer)
  const folder = String(req.query.folder ?? 'uploads').replace(/[^a-z0-9-_/]/gi, '')
  const key = buildKey(folder, `image.${extensionForMime(optimized.mimeType)}`)
  const url = await saveBuffer(optimized.buffer, key, optimized.mimeType)

  res.status(201).json({
    data: {
      url,
      key,
      name: file.originalname,
      mimeType: optimized.mimeType,
      width: optimized.width,
      height: optimized.height,
      originalSize: optimized.originalSize,
      size: optimized.optimizedSize,
    },
  })
})

// Upload a raw PDF (no image optimization). Used for service package sheets.
export const uploadPdfFile = asyncHandler(async (req, res) => {
  const file = req.file
  if (!file) throw new ApiError(400, 'No file uploaded')

  const folder = String(req.query.folder ?? 'packages').replace(/[^a-z0-9-_/]/gi, '')
  const key = buildKey(folder, `package.pdf`)
  const url = await saveBuffer(file.buffer, key, file.mimetype)

  res.status(201).json({
    data: {
      url,
      key,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    },
  })
})