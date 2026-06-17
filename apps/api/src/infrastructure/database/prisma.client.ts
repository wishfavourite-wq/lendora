import { PrismaClient } from '@prisma/client'
import { logger } from '@/infrastructure/logger/logger.js'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env['NODE_ENV'] === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  })

  if (process.env['NODE_ENV'] === 'development') {
    client.$on('query', (e) => {
      logger.debug(`[Prisma] ${e.query}`, { duration: e.duration, params: e.params })
    })
  }

  client.$on('warn',  (e) => logger.warn('[Prisma]',  { message: e.message }))
  client.$on('error', (e) => logger.error('[Prisma]', { message: e.message }))

  return client
}

/**
 * Singleton PrismaClient. In development, reuse the global instance across
 * HMR reloads to avoid connection pool exhaustion.
 */
export const prisma: PrismaClient =
  process.env['NODE_ENV'] === 'production'
    ? createPrismaClient()
    : (global.__prisma ??= createPrismaClient())
