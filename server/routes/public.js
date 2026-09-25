import { Router } from 'express'
import { asyncHandler } from '../utils/errors.js'
import { getSettings, listPcs } from '../services/club-service.js'

export function createPublicRouter(pool) {
  const router = Router()

  router.get(
    ['/settings', '/settings/public', '/public/settings'],
    asyncHandler(async (_request, response) => {
      response.json({ settings: await getSettings(pool) })
    }),
  )

  router.get(
    ['/pcs', '/public/pcs'],
    asyncHandler(async (_request, response) => {
      response.json({ pcs: await listPcs(pool) })
    }),
  )

  return router
}
