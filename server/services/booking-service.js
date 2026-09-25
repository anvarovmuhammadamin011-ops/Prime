import { AppError } from '../utils/errors.js'
import { withTransaction, mapDatabaseError } from '../db/client.js'
import {
  BOOKING_STATUS,
  calculateEndAt,
  canConfirmArrival,
  canStartSession,
  generateAccessCode,
  getBookingNoShowAt,
  isValidArrivalChoice,
} from '../domain/booking-rules.js'
import {
  decryptAccessCode,
  encryptAccessCode,
  hashAccessCode,
  normalizeAccessCode,
} from '../utils/crypto.js'

function asIso(value) {
  return value ? new Date(value).toISOString() : null
}

function mapBooking(row, config = null) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userPhone: row.user_phone,
    pcId: row.pc_id,
    pcNumber: row.pc_number,
    startAt: asIso(row.start_at),
    endAt: asIso(row.end_at),
    status: row.status,
    durationHours: Number(row.duration_hours),
    pricePerHour: Number(row.price_per_hour),
    totalPrice: Number(row.total_price),
    hasAccessCode: Boolean(row.access_code_hash),
    accessCode: decryptAccessCode(row.access_code_ciphertext, config?.accessCodePepper),
    arrivalChoice: row.arrival_choice,
    arrivalConfirmedAt: asIso(row.arrival_confirmed_at),
    arrivalDueAt: asIso(row.arrival_due_at),
    reminderSentAt: asIso(row.reminder_sent_at),
    approvedAt: asIso(row.approved_at),
    accessCodeUsedAt: asIso(row.access_code_used_at),
    session: row.session_id
      ? {
          id: row.session_id,
          bookingId: row.id,
          pcId: row.pc_id,
          userId: row.user_id,
          startedAt: asIso(row.session_started_at),
          endsAt: asIso(row.session_ends_at),
          status: row.session_status,
        }
      : null,
    createdAt: asIso(row.created_at),
  }
}

function parseDate(value, message) {
  const hasTimezone = typeof value === 'string' && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  const dateOnly = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  const normalized = typeof value === 'string' && !hasTimezone
    ? `${dateOnly ? `${value}T00:00:00` : value}+05:00`
    : value
  const date = new Date(normalized)
  if (!value || !Number.isFinite(date.getTime())) {
    throw new AppError(400, 'INVALID_DATE', message)
  }
  return date
}

function validateDuration(value, maxDuration) {
  const durationHours = Number(value)
  if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > maxDuration) {
    throw new AppError(400, 'INVALID_DURATION', `Davomiylik 1–${maxDuration} soat bo‘lsin`)
  }
  return durationHours
}

async function audit(client, actorId, action, entityType, entityId, metadata = {}) {
  await client.query(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata)],
  )
}

async function fetchBooking(client, bookingId, config = null) {
  const result = await client.query(
    `SELECT b.*, p.pc_number, u.name AS user_name, u.phone AS user_phone,
            s.id AS session_id, s.started_at AS session_started_at,
            s.ends_at AS session_ends_at, s.status AS session_status
     FROM bookings b
     JOIN pcs p ON p.id = b.pc_id
     JOIN users u ON u.id = b.user_id
     LEFT JOIN sessions s ON s.booking_id = b.id AND s.status = 'active'
     WHERE b.id = $1`,
    [bookingId],
  )
  return result.rows[0] ? mapBooking(result.rows[0], config) : null
}

async function fetchBookingForUpdate(client, bookingId) {
  const result = await client.query(
    `SELECT b.*, p.pc_number, u.name AS user_name, u.phone AS user_phone,
            s.id AS session_id, s.started_at AS session_started_at,
            s.ends_at AS session_ends_at, s.status AS session_status
     FROM bookings b
     JOIN pcs p ON p.id = b.pc_id
     JOIN users u ON u.id = b.user_id
     LEFT JOIN sessions s ON s.booking_id = b.id AND s.status = 'active'
     WHERE b.id = $1
     FOR UPDATE OF b`,
    [bookingId],
  )
  if (!result.rows[0]) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Bron topilmadi')
  return result.rows[0]
}

export async function createBooking(pool, userId, input, now = new Date()) {
  const startAt = parseDate(input.startAt, 'Boshlanish vaqtini to‘g‘ri tanlang')
  const current = new Date(now)
  if (startAt.getTime() < current.getTime()) {
    throw new AppError(400, 'PAST_BOOKING', 'Bron vaqti o‘tib ketgan')
  }

  try {
    return await withTransaction(pool, async (client) => {
      const settingsResult = await client.query('SELECT * FROM club_settings WHERE id = 1 FOR SHARE')
      const settings = settingsResult.rows[0]
      if (!settings) throw new AppError(404, 'SETTINGS_NOT_FOUND', 'Club sozlamalari topilmadi')
      const durationHours = validateDuration(input.durationHours, settings.max_duration)
      const pcResult = await client.query(
        `SELECT id, pc_number, price_per_hour
         FROM pcs
         WHERE id = $1 AND active = true
         FOR SHARE`,
        [input.pcId],
      )
      const pc = pcResult.rows[0]
      if (!pc) throw new AppError(404, 'PC_NOT_FOUND', 'Tanlangan PC topilmadi')

      const endAt = calculateEndAt(startAt, durationHours)
      const result = await client.query(
        `INSERT INTO bookings (
           user_id, pc_id, start_at, end_at, duration_hours, price_per_hour, total_price
         ) VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          userId,
          input.pcId,
          startAt,
          endAt,
          durationHours,
          pc.price_per_hour,
          Number(pc.price_per_hour) * durationHours,
        ],
      )
      const bookingId = result.rows[0].id
      await audit(client, userId, 'booking.created', 'booking', bookingId, {
        pcId: input.pcId,
        startAt: startAt.toISOString(),
        durationHours,
      })
      return fetchBooking(client, bookingId)
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function listBookings(pool, options = {}) {
  const conditions = []
  const values = []
  const add = (value) => {
    values.push(value)
    return `$${values.length}`
  }

  if (options.userId) conditions.push(`b.user_id = ${add(options.userId)}`)
  if (options.status) conditions.push(`b.status = ${add(options.status)}`)
  if (options.from) conditions.push(`b.end_at >= ${add(parseDate(options.from, 'Boshlanish sanasi noto‘g‘ri'))}`)
  if (options.to) conditions.push(`b.start_at <= ${add(parseDate(options.to, 'Tugash sanasi noto‘g‘ri'))}`)

  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 50))
  const offset = (page - 1) * pageSize
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countResult = await pool.query(
    `SELECT count(*)::int AS total FROM bookings b ${where}`,
    values,
  )
  values.push(pageSize, offset)
  const result = await pool.query(
    `SELECT b.*, p.pc_number, u.name AS user_name, u.phone AS user_phone,
            s.id AS session_id, s.started_at AS session_started_at,
            s.ends_at AS session_ends_at, s.status AS session_status
     FROM bookings b
     JOIN pcs p ON p.id = b.pc_id
     JOIN users u ON u.id = b.user_id
     LEFT JOIN sessions s ON s.booking_id = b.id AND s.status = 'active'
     ${where}
     ORDER BY b.start_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  )

  return {
    items: result.rows.map((row) => mapBooking(row, options.config)),
    page,
    pageSize,
    total: countResult.rows[0].total,
  }
}

export async function getBooking(pool, bookingId, userId = null, config = null) {
  const values = [bookingId]
  const userFilter = userId ? 'AND b.user_id = $2' : ''
  if (userId) values.push(userId)
  const result = await pool.query(
    `SELECT b.*, p.pc_number, u.name AS user_name, u.phone AS user_phone,
            s.id AS session_id, s.started_at AS session_started_at,
            s.ends_at AS session_ends_at, s.status AS session_status
     FROM bookings b
     JOIN pcs p ON p.id = b.pc_id
     JOIN users u ON u.id = b.user_id
     LEFT JOIN sessions s ON s.booking_id = b.id AND s.status = 'active'
     WHERE b.id = $1 ${userFilter}`,
    values,
  )
  if (!result.rows[0]) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Bron topilmadi')
  return mapBooking(result.rows[0], config)
}

export async function approveBooking(pool, actorId, bookingId, config, now = new Date()) {
  try {
    return await withTransaction(pool, async (client) => {
      const row = await fetchBookingForUpdate(client, bookingId)
      if (row.status !== BOOKING_STATUS.PENDING) {
        throw new AppError(409, 'INVALID_STATUS', 'Faqat kutilayotgan bron tasdiqlanadi')
      }
      if (new Date(getBookingNoShowAt(row)).getTime() <= now.getTime()) {
        throw new AppError(409, 'BOOKING_EXPIRED', 'Bron tasdiqlash muddati tugagan')
      }

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = generateAccessCode()
        const codeHash = hashAccessCode(code, config.accessCodePepper)
        const history = await client.query(
          `INSERT INTO access_code_history (code_hash, booking_id)
           VALUES ($1, $2)
           ON CONFLICT (code_hash) DO NOTHING
           RETURNING code_hash`,
          [codeHash, bookingId],
        )
        if (!history.rowCount) continue

        await client.query(
          `          UPDATE bookings
           SET status = 'approved', access_code_hash = $2, access_code_ciphertext = $3,
               access_code_issued_at = $4, access_code_used_at = NULL, approved_at = $4
           WHERE id = $1`,
          [bookingId, codeHash, encryptAccessCode(code, config.accessCodePepper), now],
        )
        await audit(client, actorId, 'booking.approved', 'booking', bookingId)
        return { booking: await fetchBooking(client, bookingId, config), accessCode: code }
      }

      throw new AppError(503, 'CODE_GENERATION_FAILED', 'Kirish kodi yaratib bo‘lmadi')
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function rejectBooking(pool, actorId, bookingId, config = null, now = new Date()) {
  try {
    return await withTransaction(pool, async (client) => {
      const row = await fetchBookingForUpdate(client, bookingId)
      if (row.status !== BOOKING_STATUS.PENDING) {
        throw new AppError(409, 'INVALID_STATUS', 'Faqat kutilayotgan bron rad etiladi')
      }
      await client.query(
        `UPDATE bookings SET status = 'rejected' WHERE id = $1`,
        [bookingId],
      )
      await audit(client, actorId, 'booking.rejected', 'booking', bookingId, { at: now.toISOString() })
      return fetchBooking(client, bookingId, config)
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function cancelBooking(pool, userId, bookingId, config = null, now = new Date()) {
  try {
    return await withTransaction(pool, async (client) => {
      const row = await fetchBookingForUpdate(client, bookingId)
      if (row.user_id !== userId) throw new AppError(403, 'FORBIDDEN', 'Bu bron sizniki emas')
      if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(row.status)) {
        throw new AppError(409, 'INVALID_STATUS', 'Bu bron endi bekor qilinmaydi')
      }
      if (new Date(row.end_at).getTime() <= now.getTime()) {
        throw new AppError(409, 'BOOKING_EXPIRED', 'Bron muddati tugagan')
      }
      if (row.access_code_hash) {
        await client.query(
          `UPDATE access_code_history
           SET retired_at = $2, retired_reason = 'cancelled'
           WHERE code_hash = $1 AND retired_at IS NULL`,
          [row.access_code_hash, now],
        )
      }
      await client.query(
        `UPDATE bookings
         SET status = 'cancelled', access_code_hash = NULL, access_code_ciphertext = NULL
         WHERE id = $1`,
        [bookingId],
      )
      await audit(client, userId, 'booking.cancelled', 'booking', bookingId)
      return fetchBooking(client, bookingId, config)
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function confirmArrival(pool, userId, bookingId, minutes, config = null, now = new Date()) {
  if (!isValidArrivalChoice(minutes)) {
    throw new AppError(400, 'INVALID_ARRIVAL_CHOICE', 'Faqat 5 yoki 10 daqiqani tanlang')
  }
  try {
    return await withTransaction(pool, async (client) => {
      const row = await fetchBookingForUpdate(client, bookingId)
      if (row.user_id !== userId) throw new AppError(403, 'FORBIDDEN', 'Bu bron sizniki emas')
      if (row.status !== BOOKING_STATUS.APPROVED) {
        throw new AppError(409, 'ARRIVAL_UNAVAILABLE', 'Kelish vaqti endi tanlanmaydi')
      }
      if (row.arrival_choice) return mapBooking(row, config)
      if (!canConfirmArrival(row, now)) {
        throw new AppError(409, 'ARRIVAL_UNAVAILABLE', 'Kelish vaqti endi tanlanmaydi')
      }

      const choice = Number(minutes)
      await client.query(
        `UPDATE bookings
         SET arrival_choice = $2, arrival_confirmed_at = $3,
             arrival_due_at = $3 + ($2 * interval '1 minute'), reminder_sent_at = COALESCE(reminder_sent_at, $3)
         WHERE id = $1`,
        [bookingId, choice, now],
      )
      return fetchBooking(client, bookingId, config)
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function startSession(pool, actorId, rawCode, config, now = new Date()) {
  const code = normalizeAccessCode(rawCode)
  if (!code) throw new AppError(400, 'INVALID_CODE', '6 raqamli kod kiriting')
  const codeHash = hashAccessCode(code, config.accessCodePepper)

  try {
    return await withTransaction(pool, async (client) => {
      const result = await client.query(
        `SELECT b.*, p.pc_number, u.name AS user_name, u.phone AS user_phone
         FROM bookings b
         JOIN pcs p ON p.id = b.pc_id
         JOIN users u ON u.id = b.user_id
         WHERE b.access_code_hash = $1
         FOR UPDATE OF b`,
        [codeHash],
      )
      const row = result.rows[0]
      if (!row) throw new AppError(401, 'INVALID_CODE', 'Kod topilmadi')
      if (!canStartSession(row, now)) {
        throw new AppError(409, 'SESSION_UNAVAILABLE', 'Sessiya vaqti kelmagan yoki tugagan')
      }

      const activeSession = await client.query(
        `SELECT id FROM sessions
         WHERE (booking_id = $1 OR pc_id = $2) AND status = 'active'
         FOR UPDATE`,
        [row.id, row.pc_id],
      )
      if (activeSession.rowCount > 0) {
        throw new AppError(409, 'SESSION_ACTIVE', 'Bu PC yoki bron bilan sessiya allaqachon faol')
      }

      const sessionResult = await client.query(
        `INSERT INTO sessions (booking_id, pc_id, user_id, started_by, started_at, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, started_at, ends_at, status`,
        [row.id, row.pc_id, row.user_id, actorId, now, row.end_at],
      )
      await client.query(
        `UPDATE bookings
         SET status = 'active', access_code_hash = NULL, access_code_ciphertext = NULL,
             access_code_used_at = $2
         WHERE id = $1`,
        [row.id, now],
      )
      await client.query(
        `UPDATE access_code_history
         SET retired_at = $2, retired_reason = 'used'
         WHERE code_hash = $1`,
        [codeHash, now],
      )
      await audit(client, actorId, 'session.started', 'session', sessionResult.rows[0].id, {
        bookingId: row.id,
      })
      return {
         booking: await fetchBooking(client, row.id, config),
        session: {
          id: sessionResult.rows[0].id,
          bookingId: row.id,
          pcId: row.pc_id,
          userId: row.user_id,
          startedAt: asIso(sessionResult.rows[0].started_at),
          endsAt: asIso(sessionResult.rows[0].ends_at),
          status: sessionResult.rows[0].status,
        },
      }
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function reissueAccessCode(pool, actorId, bookingId, config, now = new Date()) {
  const result = await withTransaction(pool, async (client) => {
    const row = await fetchBookingForUpdate(client, bookingId)
    if (row.status !== BOOKING_STATUS.APPROVED) {
      throw new AppError(409, 'INVALID_STATUS', 'Faqat tasdiqlangan bron uchun kod beriladi')
    }
    if (row.access_code_hash) {
      await client.query(
        `UPDATE access_code_history
         SET retired_at = $2, retired_reason = 'superseded'
         WHERE code_hash = $1 AND retired_at IS NULL`,
        [row.access_code_hash, now],
      )
    }
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = generateAccessCode()
      const codeHash = hashAccessCode(code, config.accessCodePepper)
      const history = await client.query(
        `INSERT INTO access_code_history (code_hash, booking_id)
         VALUES ($1, $2)
         ON CONFLICT (code_hash) DO NOTHING
         RETURNING code_hash`,
        [codeHash, bookingId],
      )
      if (!history.rowCount) continue
        await client.query(
          `UPDATE bookings
           SET access_code_hash = $2, access_code_ciphertext = $3,
               access_code_issued_at = $4, access_code_used_at = NULL
           WHERE id = $1`,
          [bookingId, codeHash, encryptAccessCode(code, config.accessCodePepper), now],
        )
      await audit(client, actorId, 'booking.code_reissued', 'booking', bookingId)
      return { booking: await fetchBooking(client, bookingId, config), accessCode: code }
    }
    throw new AppError(503, 'CODE_GENERATION_FAILED', 'Kirish kodi yaratib bo‘lmadi')
  })
  return result
}

export async function expireState(pool, now = new Date()) {
  return withTransaction(pool, async (client) => {
    const endedSessions = await client.query(
      `UPDATE sessions
       SET status = 'completed', ended_at = ends_at
       WHERE status = 'active' AND ends_at <= $1
       RETURNING id, booking_id`,
      [now],
    )
    const endedBookingIds = endedSessions.rows.map((row) => row.booking_id)
    let completedBookings = 0
    if (endedBookingIds.length > 0) {
      const result = await client.query(
        `UPDATE bookings
         SET status = 'completed', access_code_hash = NULL, access_code_ciphertext = NULL
         WHERE id = ANY($1::uuid[]) AND status = 'active'`,
        [endedBookingIds],
      )
      completedBookings = result.rowCount
    }

    const expiredPending = await client.query(
      `UPDATE bookings
       SET status = 'expired'
       WHERE status = 'pending' AND start_at + interval '10 minutes' <= $1`,
      [now],
    )
    const noShows = await client.query(
      `WITH expired AS (
         SELECT id, access_code_hash
         FROM bookings
         WHERE status = 'approved'
           AND (
             end_at <= $1
             OR $1 >= COALESCE(
               arrival_due_at + interval '5 minutes',
               start_at + interval '10 minutes'
             )
           )
         FOR UPDATE
       ), updated AS (
         UPDATE bookings b
         SET status = 'no_show', access_code_hash = NULL, access_code_ciphertext = NULL
         FROM expired e
         WHERE b.id = e.id
         RETURNING e.access_code_hash
       )
       SELECT access_code_hash FROM updated`,
      [now],
    )
    for (const row of noShows.rows) {
      if (row.access_code_hash) {
        await client.query(
          `UPDATE access_code_history
           SET retired_at = $2, retired_reason = 'no_show'
           WHERE code_hash = $1 AND retired_at IS NULL`,
          [row.access_code_hash, now],
        )
      }
    }
    return {
      completedSessions: endedSessions.rowCount,
      completedBookings,
      expiredPending: expiredPending.rowCount,
      noShows: noShows.rowCount,
    }
  })
}

export async function listActiveSessions(pool, now = new Date()) {
  const result = await pool.query(
    `SELECT s.*, p.pc_number, u.name AS user_name, u.phone AS user_phone
     FROM sessions s
     JOIN pcs p ON p.id = s.pc_id
     JOIN users u ON u.id = s.user_id
     WHERE s.status = 'active' AND s.started_at <= $1 AND s.ends_at > $1
     ORDER BY s.started_at`,
    [now],
  )
  return result.rows.map((row) => ({
    id: row.id,
    bookingId: row.booking_id,
    pcId: row.pc_id,
    pcNumber: row.pc_number,
    userId: row.user_id,
    userName: row.user_name,
    userPhone: row.user_phone,
    startedAt: asIso(row.started_at),
    endsAt: asIso(row.ends_at),
    status: row.status,
  }))
}

export async function getDashboard(pool, now = new Date()) {
  const [bookingStats, sessionStats, userStats, pending, activeSessions] = await Promise.all([
    pool.query(
      `SELECT
         count(*) FILTER (WHERE status = 'pending')::int AS pending,
         count(*) FILTER (WHERE status = 'approved')::int AS approved,
         count(*) FILTER (WHERE status = 'active')::int AS active,
         count(*) FILTER (WHERE status = 'completed')::int AS completed,
         count(*) FILTER (WHERE status = 'no_show')::int AS no_show
       FROM bookings
       WHERE start_at >= $1`,
      [new Date(now.getTime() - 24 * 60 * 60 * 1000)],
    ),
    pool.query(
      `SELECT count(*)::int AS active FROM sessions
       WHERE status = 'active' AND started_at <= $1 AND ends_at > $1`,
      [now],
    ),
    pool.query(
      `SELECT count(DISTINCT user_id)::int AS today_users
       FROM bookings
       WHERE start_at >= $1`,
      [new Date(now.getTime() - 24 * 60 * 60 * 1000)],
    ),
    pool.query(
      `SELECT b.id, p.pc_number, u.name AS user_name
       FROM bookings b
       JOIN pcs p ON p.id = b.pc_id
       JOIN users u ON u.id = b.user_id
       WHERE b.status = 'pending' AND b.end_at > $1
       ORDER BY b.start_at
       LIMIT 5`,
      [now],
    ),
    listActiveSessions(pool, now),
  ])
  const stats = bookingStats.rows[0]
  return {
    bookings: {
      pending: stats.pending,
      approved: stats.approved,
      active: stats.active,
      completed: stats.completed,
      noShow: stats.no_show,
    },
    activeSessions: sessionStats.rows[0].active,
    todayUsers: userStats.rows[0].today_users,
    pending: pending.rows.map((row) => ({
      id: row.id,
      pcNumber: row.pc_number,
      userName: row.user_name,
    })),
    sessions: activeSessions,
  }
}
