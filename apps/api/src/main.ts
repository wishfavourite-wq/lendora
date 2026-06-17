/**
 * Entry point. Handles graceful shutdown and unhandled rejections.
 * Process-level concerns only — no business logic here.
 */
import 'dotenv/config'
import { createApp }      from './interface/http/app.js'
import { prisma }         from './infrastructure/database/prisma.client.js'
import { logger }         from './infrastructure/logger/logger.js'
import { startDemoCron }  from './services/demo-cron.service.js'

const PORT = parseInt(process.env['API_PORT'] ?? '4000', 10)

async function main() {
  const app    = createApp()
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Lendora API running on http://localhost:${PORT}`)
    logger.info(`   Environment: ${process.env['NODE_ENV'] ?? 'development'}`)
    startDemoCron()
  })

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(async () => {
      await prisma.$disconnect()
      logger.info('Database disconnected. Process exiting.')
      process.exit(0)
    })
    setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1) }, 10_000)
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT',  () => void shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise rejection', { reason })
  })

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err })
    process.exit(1)
  })
}

void main()
