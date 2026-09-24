import sharp from 'sharp'

export interface OptimizedImage {
  buffer: Buffer
  mimeType: string
  width: number
  height: number
  originalSize: number
  optimizedSize: number
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/tiff': 'tiff',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
}

export function extensionForMime(mimeType: string): string {
  return EXTENSIONS[mimeType] ?? 'bin'
}

/**
 * Re-encode an image to shrink its file size while preserving its exact
 * resolution (width × height is never changed).
 *
 * - JPEG  → JPEG, quality IMAGE_QUALITY, mozjpeg
 * - WebP  → WebP, quality IMAGE_QUALITY
 * - PNG   → WebP when it has transparency (same alpha, much smaller),
 *            optimized lossless PNG otherwise
 * - other → passed through unchanged
 */
export async function optimizeImage(input: Buffer): Promise<OptimizedImage> {
  const quality = Number(process.env.IMAGE_QUALITY) || 80
  const size = { originalSize: input.length }
  try {
    const meta = await sharp(input).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0

    switch (meta.format) {
      case 'jpeg': {
        const buffer = await sharp(input).jpeg({ quality, mozjpeg: true }).toBuffer()
        return { buffer, mimeType: 'image/jpeg', width, height, ...size, optimizedSize: buffer.length }
      }
      case 'webp': {
        const buffer = await sharp(input).webp({ quality }).toBuffer()
        return { buffer, mimeType: 'image/webp', width, height, ...size, optimizedSize: buffer.length }
      }
      case 'png': {
        if (meta.hasAlpha) {
          const buffer = await sharp(input).webp({ quality }).toBuffer()
          return { buffer, mimeType: 'image/webp', width, height, ...size, optimizedSize: buffer.length }
        }
        const buffer = await sharp(input).png({ compressionLevel: 9 }).toBuffer()
        return { buffer, mimeType: 'image/png', width, height, ...size, optimizedSize: buffer.length }
      }
      default: {
        const mimeType = meta.format ? `image/${meta.format}` : 'application/octet-stream'
        return { buffer: input, mimeType, width, height, ...size, optimizedSize: input.length }
      }
    }
  } catch {
    // Not a decodable image — store as-is.
    return {
      buffer: input,
      mimeType: 'application/octet-stream',
      width: 0,
      height: 0,
      ...size,
      optimizedSize: input.length,
    }
  }
}