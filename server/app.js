import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { getConfig } from './config.js'
import { AppError } from './utils/errors.js'
import { requestId } from './middleware/request-id.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { createHealthRouter } from './routes/health.js'
import { createAuthRouter } from './routes/auth.js'
import { createTelegramRouter } from './routes/telegram.js'
import { createPublicRouter } from './routes/public.js'
import { createBookingRouter } from './routes/bookings.js'

export function createApp({ pool, config = getConfig() }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy ? 1 : false)

  app.use(requestId)
  app.use(helmet())
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true)
        return callback(new AppError(403, 'CORS_FORBIDDEN', 'CORS origin ruxsat etilmagan'))
      },
    }),
  )
  app.use(express.json({ limit: '32kb' }))

  app.use(createHealthRouter(pool))
  app.use('/api/v1/auth', createAuthRouter(pool, config))
  app.use('/api/v1/telegram', createTelegramRouter(pool, config))
  app.use('/api/v1', createPublicRouter(pool))
  app.use('/api/v1', createBookingRouter(pool, config))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
