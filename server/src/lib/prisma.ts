import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma 7 uses a driver adapter to connect. connection settings come from env:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 * (Bun auto-loads .env). A single DATABASE_URL is also honoured if provided.
 */
function isConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
}

function getAdapter() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL)
    return new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
    })
  }

  if (!isConfigured()) {
    throw new Error(
      'Database is not configured. Set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME (or a single DATABASE_URL) in .env',
    )
  }

  return new PrismaMariaDb({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
}

export const prisma = new PrismaClient({ adapter: getAdapter() })