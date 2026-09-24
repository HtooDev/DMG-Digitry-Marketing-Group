import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import type { StorageDriver } from './types'

interface SpacesConfig {
  endpoint: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

function getConfig(): SpacesConfig {
  const endpoint = process.env.SPACES_ENDPOINT
  const region = process.env.SPACES_REGION ?? 'fra1'
  const accessKeyId = process.env.SPACES_ACCESS_KEY_ID
  const secretAccessKey = process.env.SPACES_SECRET_ACCESS_KEY
  const bucket = process.env.SPACES_BUCKET

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('DigitalOcean Spaces is not configured. Check .env (SPACES_*)')
  }

  return { endpoint, region, accessKeyId, secretAccessKey, bucket }
}

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  const config = getConfig()
  client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  })
  return client
}

/**
 * DigitalOcean Spaces (S3-compatible) — for production.
 */
export const spacesDriver: StorageDriver = {
  async save(buffer, key, contentType) {
    const config = getConfig()
    await getClient().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    )
    return spacesDriver.publicUrl(key)
  },
  publicUrl(key) {
    const cdn = process.env.SPACES_CDN_URL
    if (cdn) return `${cdn.replace(/\/$/, '')}/${key}`
    const config = getConfig()
    return `${config.endpoint}/${config.bucket}/${key}`
  },
}