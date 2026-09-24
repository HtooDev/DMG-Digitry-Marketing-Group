import type { StorageDriver } from './types'
import { diskDriver } from './disk'
import { spacesDriver } from './spaces'

export type { StorageDriver } from './types'

/**
 * Pick a storage driver from env.
 * STORAGE_DRIVER=spaces → DigitalOcean Spaces (production)
 * STORAGE_DRIVER=disk   → local disk (development, default)
 */
export function getStorageDriver(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? 'disk'
  if (driver === 'spaces') return spacesDriver
  return diskDriver
}

export function saveBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
  return getStorageDriver().save(buffer, key, contentType)
}

export function publicUrl(key: string): string {
  return getStorageDriver().publicUrl(key)
}

/**
 * Generate a unique object key under a folder, e.g. "brandings/abc-123.png".
 */
export function buildKey(folder: string, filename: string): string {
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(filename)
  const ext = extMatch ? extMatch[1] : 'bin'
  const base = crypto.randomUUID()
  return `${folder}/${base}.${ext}`
}