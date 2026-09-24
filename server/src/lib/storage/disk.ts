import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { StorageDriver } from './types'

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? 'uploads')

function getBaseUrl(): string {
  const base = process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`
  return base.replace(/\/$/, '')
}

/**
 * Local disk storage — used during development.
 * Files are written under UPLOAD_DIR and served statically at /uploads.
 */
export const diskDriver: StorageDriver = {
  async save(buffer, key, _contentType) {
    const filePath = path.join(UPLOAD_ROOT, key)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, buffer)
    return diskDriver.publicUrl(key)
  },
  publicUrl(key) {
    return `${getBaseUrl()}/uploads/${key}`
  },
}