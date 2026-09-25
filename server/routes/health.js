import { Router } from 'express'
import { asyncHandler } from '../utils/errors.js'
import { assertSchema } from '../db/client.js'

export function createHealthRouter(pool) {
  const router = Router()

  router.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'prime-club-api' })
  })

  router.get('/ready', asyncHandler(async (_request, response) => {
    try {
      await assertSchema(pool)
      response.json({ status: 'ready' })
    } catch {
      response.status(503).json({ status: 'not_ready' })
    }
  }))

  return router
}
