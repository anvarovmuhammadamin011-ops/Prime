import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { asyncHandler } from '../utils/errors.js'
import { getRequestMetadata, createAuthenticate } from '../middleware/auth.js'
import { getUser, login, logout, refreshAccessToken, register } from '../services/auth-service.js'

const credentialsSchema = z.object({
  phone: z.string().trim().min(1),
  password: z.string().min(1),
})

const registrationSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80),
})

export function createAuthRouter(pool, config) {
  const router = Router()
  const authenticate = createAuthenticate(pool, config)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Juda ko‘p urinish. Keyinroq qayta yuboring' } },
  })

  router.post(
    '/register',
    authLimiter,
    asyncHandler(async (request, response) => {
      const input = registrationSchema.parse(request.body)
      const result = await register(pool, config, input, getRequestMetadata(request))
      response.status(201).json(result)
    }),
  )

  router.post(
    '/login',
    authLimiter,
    asyncHandler(async (request, response) => {
      const input = credentialsSchema.parse(request.body)
      const result = await login(pool, config, input, getRequestMetadata(request))
      response.json(result)
    }),
  )

  router.post(
    '/refresh',
    authLimiter,
    asyncHandler(async (request, response) => {
      const input = z.object({ refreshToken: z.string().min(20) }).parse(request.body)
      const result = await refreshAccessToken(pool, config, input.refreshToken, getRequestMetadata(request))
      response.json(result)
    }),
  )

  router.post(
    '/logout',
    authenticate,
    asyncHandler(async (request, response) => {
      const input = z.object({ refreshToken: z.string().min(20).optional() }).parse(request.body || {})
      await logout(pool, request.user.id, input.refreshToken)
      response.status(204).end()
    }),
  )

  router.get(
    '/me',
    authenticate,
    asyncHandler(async (request, response) => {
      response.json({ user: await getUser(pool, request.user.id) })
    }),
  )

  return router
}
