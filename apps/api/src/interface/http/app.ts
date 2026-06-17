import express, { type Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { requestId }    from './middleware/request-id.middleware.js'
import { errorHandler } from './middleware/error-handler.middleware.js'
import { authRouter }   from './routes/auth.routes.js'
import { productRouter } from './routes/product.routes.js'
import { rentalRouter }  from './routes/rental.routes.js'
import { vendorRouter }  from './routes/vendor.routes.js'
import { userRouter }    from './routes/user.routes.js'
import { adminRouter }   from './routes/admin.routes.js'
import { paymentRouter } from './routes/payment.routes.js'
import { categoryRouter } from './routes/category.routes.js'
import { statsRouter }    from './routes/stats.routes.js'
import { reviewRouter }        from './routes/review.routes.js'
import { notificationRouter }  from './routes/notification.routes.js'
import { API_VERSION }   from '@lendora/shared'

const __filename  = fileURLToPath(import.meta.url)
const __dirnameApp = path.dirname(__filename)
const _uploadRaw  = process.env['UPLOAD_DIR'] ?? 'uploads'
const uploadsDir  = path.isAbsolute(_uploadRaw)
  ? _uploadRaw
  : path.join(__dirnameApp, '..', '..', '..', _uploadRaw)

export function createApp(): Application {
  const app = express()

  // ── Static uploads (product images, evidence photos) ─────────────────────
  app.use('/uploads', express.static(uploadsDir))

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }))

  app.use(cors({
    origin:      process.env['APP_URL'] ?? 'http://localhost:3000',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  }))

  // ── Core middleware ───────────────────────────────────────────────────────
  app.use(compression())
  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true, limit: '2mb' }))
  app.use(cookieParser(process.env['COOKIE_SECRET']))
  app.use(requestId)

  // ── Rate limiting ─────────────────────────────────────────────────────────
  app.use(`/api/${API_VERSION}`, rateLimit({
    windowMs:  parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '60000'),
    max:       parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100'),
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  }))

  // ── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() })
  })

  // ── API Routes ────────────────────────────────────────────────────────────
  const base = `/api/${API_VERSION}`
  app.use(`${base}/auth`,       authRouter)
  app.use(`${base}/products`,   productRouter)
  app.use(`${base}/categories`, categoryRouter)
  app.use(`${base}/stats`,      statsRouter)
  app.use(`${base}/reviews`,    reviewRouter)
  app.use(`${base}/rentals`,    rentalRouter)
  app.use(`${base}/vendors`,    vendorRouter)
  app.use(`${base}/users`,      userRouter)
  app.use(`${base}/admin`,      adminRouter)
  app.use(`${base}/payments`,      paymentRouter)
  app.use(`${base}/notifications`, notificationRouter)

  // ── 404 handler ───────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })

  // ── Error handler (must be last) ──────────────────────────────────────────
  app.use(errorHandler)

  return app
}
