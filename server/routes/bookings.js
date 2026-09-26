import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { asyncHandler, AppError } from '../utils/errors.js'
import { createAuthenticate, requireRoles } from '../middleware/auth.js'
import {
  approveBooking,
  cancelBooking,
  confirmArrival,
  createBooking,
  getBooking,
  getDashboard,
  listActiveSessions,
  listBookings,
  rejectBooking,
  reissueAccessCode,
  startSession,
} from '../services/booking-service.js'
import { getSettings, updateSettings, listPcs, setPcActive, startPcNow, stopPcSession } from '../services/club-service.js'
import { listUsers, updateProfile } from '../services/user-service.js'
import { BOOKING_STATUS } from '../domain/booking-rules.js'

const idSchema = z.string().uuid()
const statusSchema = z.enum(Object.values(BOOKING_STATUS))
const bookingInputSchema = z.object({
  pcId: z.string().uuid(),
  startAt: z.string().min(1),
  durationHours: z.coerce.number().int().min(1),
})
const listQuerySchema = z.object({
  status: statusSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export function createBookingRouter(pool, config) {
  const router = Router()
  const authenticate = createAuthenticate(pool, config)
  const bookingLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
  const sessionLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
  const staffOnly = [authenticate, requireRoles('admin', 'superadmin')]

  router.get(
    '/bookings',
    authenticate,
    asyncHandler(async (request, response) => {
      const query = listQuerySchema.parse(request.query)
      const result = await listBookings(pool, { ...query, userId: request.user.id, config })
      response.json(result)
    }),
  )

  router.post(
    '/bookings',
    bookingLimiter,
    authenticate,
    asyncHandler(async (request, response) => {
      const input = bookingInputSchema.parse(request.body)
      const booking = await createBooking(pool, request.user.id, input)
      response.status(201).json({ booking })
    }),
  )

  router.get(
    '/bookings/:id',
    authenticate,
    asyncHandler(async (request, response) => {
      const bookingId = idSchema.parse(request.params.id)
      const isStaff = ['admin', 'superadmin'].includes(request.user.role)
      const booking = await getBooking(pool, bookingId, isStaff ? null : request.user.id, config)
      response.json({ booking })
    }),
  )

  router.post(
    '/bookings/:id/cancel',
    authenticate,
    asyncHandler(async (request, response) => {
      const bookingId = idSchema.parse(request.params.id)
      const booking = await cancelBooking(pool, request.user.id, bookingId, config)
      response.json({ booking })
    }),
  )

  router.post(
    '/bookings/:id/arrival',
    authenticate,
    asyncHandler(async (request, response) => {
      const bookingId = idSchema.parse(request.params.id)
      const input = z.object({ minutes: z.coerce.number().int() }).parse(request.body)
      const booking = await confirmArrival(pool, request.user.id, bookingId, input.minutes, config)
      response.json({ booking })
    }),
  )

  router.patch(
    '/profile',
    authenticate,
    asyncHandler(async (request, response) => {
      const input = z.object({ name: z.string().min(2).max(80).optional(), phone: z.string().optional() }).parse(request.body)
      const user = await updateProfile(pool, request.user.id, input)
      response.json({ user })
    }),
  )

  router.get(
    '/admin/dashboard',
    ...staffOnly,
    asyncHandler(async (_request, response) => {
      response.json(await getDashboard(pool))
    }),
  )

  router.get(
    '/admin/bookings',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const query = listQuerySchema.parse(request.query)
      response.json(await listBookings(pool, { ...query, config }))
    }),
  )

  router.post(
    '/admin/bookings/:id/approve',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const bookingId = idSchema.parse(request.params.id)
      response.json(await approveBooking(pool, request.user.id, bookingId, config))
    }),
  )

  router.post(
    '/admin/bookings/:id/reject',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const bookingId = idSchema.parse(request.params.id)
      response.json({ booking: await rejectBooking(pool, request.user.id, bookingId, config) })
    }),
  )

  router.post(
    '/admin/bookings/:id/reissue-code',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const bookingId = idSchema.parse(request.params.id)
      response.json(await reissueAccessCode(pool, request.user.id, bookingId, config))
    }),
  )

  router.post(
    '/admin/sessions/start',
    sessionLimiter,
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const input = z.object({ code: z.string().min(1).max(20) }).parse(request.body)
      response.json(await startSession(pool, request.user.id, input.code, config))
    }),
  )

  // Admin PC boshqaruvi: yoqish/o'chirish
  router.patch(
    '/admin/pcs/:id',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const pcId = idSchema.parse(request.params.id)
      const input = z.object({ active: z.coerce.boolean() }).parse(request.body)
      response.json({ pc: await setPcActive(pool, request.user.id, pcId, input.active) })
    }),
  )

  // Admin PC'ni darhol ishga tushirish (hozir / belgilangan vaqt)
  router.post(
    '/admin/pcs/:id/start-now',
    sessionLimiter,
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const pcId = idSchema.parse(request.params.id)
      const input = z
        .object({ minutes: z.coerce.number().int().min(15).max(720).optional(), hours: z.coerce.number().int().min(1).max(12).optional() })
        .parse(request.body || {})
      response.json(await startPcNow(pool, request.user.id, pcId, input))
    }),
  )

  // Admin PC'dagi faol sessiyani to'xtatish
  router.post(
    '/admin/pcs/:id/stop',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const pcId = idSchema.parse(request.params.id)
      response.json(await stopPcSession(pool, request.user.id, pcId))
    }),
  )

  // Admin PC ro'yxati (o'chirilganlari bilan)
  router.get(
    '/admin/pcs',
    ...staffOnly,
    asyncHandler(async (_request, response) => {
      response.json({ pcs: await listPcs(pool, new Date(), { includeInactive: true }) })
    }),
  )

  // Admin PC boshqaruvi: yoqish/o'chirish
  router.patch(
    '/admin/pcs/:id',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const pcId = idSchema.parse(request.params.id)
      const input = z.object({ active: z.coerce.boolean() }).parse(request.body)
      response.json({ pc: await setPcActive(pool, request.user.id, pcId, input.active) })
    }),
  )

  // Admin PC'ni darhol ishga tushirish (hozir / belgilangan vaqt)
  router.post(
    '/admin/pcs/:id/start-now',
    sessionLimiter,
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const pcId = idSchema.parse(request.params.id)
      const input = z
        .object({ minutes: z.coerce.number().int().min(15).max(720).optional(), hours: z.coerce.number().int().min(1).max(12).optional() })
        .parse(request.body || {})
      response.json(await startPcNow(pool, request.user.id, pcId, input))
    }),
  )

  // Admin PC'dagi faol sessiyani to'xtatish
  router.post(
    '/admin/pcs/:id/stop',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const pcId = idSchema.parse(request.params.id)
      response.json(await stopPcSession(pool, request.user.id, pcId))
    }),
  )

  router.get(
    '/admin/sessions',
    ...staffOnly,
    asyncHandler(async (_request, response) => {
      response.json({ sessions: await listActiveSessions(pool) })
    }),
  )

  router.get(
    '/admin/users',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const query = z
        .object({
          search: z.string().trim().max(80).optional(),
          page: z.coerce.number().int().min(1).optional(),
          pageSize: z.coerce.number().int().min(1).max(100).optional(),
        })
        .parse(request.query)
      response.json(await listUsers(pool, query))
    }),
  )

  router.patch(
    '/admin/settings',
    ...staffOnly,
    asyncHandler(async (request, response) => {
      const input = z
        .object({
          clubName: z.string().min(2).max(40),
          pricePerHour: z.coerce.number().int().min(1000).max(1_000_000),
          maxDuration: z.coerce.number().int().min(1).max(12),
          pcCount: z.coerce.number().int().min(1).max(20),
        })
        .parse(request.body)
      response.json({ settings: await updateSettings(pool, request.user.id, input) })
    }),
  )

  router.get(
    '/admin/settings',
    ...staffOnly,
    asyncHandler(async (_request, response) => {
      response.json({ settings: await getSettings(pool) })
    }),
  )

  router.use((request, _response, next) => {
    next(new AppError(404, 'NOT_FOUND', `${request.method} ${request.originalUrl} topilmadi`))
  })

  return router
}
