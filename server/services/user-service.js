import { AppError } from '../utils/errors.js'
import { toPublicUser } from '../domain/booking-rules.js'
import { normalizePhone } from '../domain/auth-rules.js'
import { mapDatabaseError } from '../db/client.js'

export async function updateProfile(pool, userId, input) {
  const hasName = input.name !== undefined
  const hasPhone = input.phone !== undefined && input.phone !== null
  const name = hasName ? String(input.name).trim() : null
  const phone = hasPhone ? normalizePhone(input.phone) : null
  if (hasName && (name.length < 2 || name.length > 80)) {
    throw new AppError(400, 'INVALID_NAME', 'Ism 2–80 belgidan iborat bo‘lsin')
  }
  if (hasPhone && !phone) {
    throw new AppError(400, 'INVALID_PHONE', 'Telefon +998 formatida bo‘lsin')
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($2, name), phone = COALESCE($3, phone)
       WHERE id = $1
       RETURNING id, name, phone, role, telegram_id, created_at`,
      [userId, name, phone],
    )
    if (!result.rows[0]) throw new AppError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi')
    return toPublicUser(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'PHONE_EXISTS', 'Bunday telefon allaqachon ro‘yxatdan o‘tgan')
    }
    throw mapDatabaseError(error)
  }
}

export async function listUsers(pool, { search = '', page = 1, pageSize = 50 } = {}) {
  const normalizedPage = Math.max(1, Number(page) || 1)
  const normalizedSize = Math.min(100, Math.max(1, Number(pageSize) || 50))
  const offset = (normalizedPage - 1) * normalizedSize
  const term = `%${String(search).trim()}%`
  const result = await pool.query(
    `SELECT u.id, u.name, u.phone, u.role, u.telegram_id, u.created_at,
            COUNT(b.id) FILTER (WHERE b.status = 'active')::int AS active_sessions,
            COUNT(b.id) FILTER (WHERE b.status = 'completed')::int AS completed_sessions
     FROM users u
     LEFT JOIN bookings b ON b.user_id = u.id
     WHERE $1 = '%%' OR u.name ILIKE $1 OR u.phone ILIKE $1
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    [term, normalizedSize, offset],
  )
  const countResult = await pool.query(
    `SELECT count(*)::int AS total
     FROM users u
     WHERE $1 = '%%' OR u.name ILIKE $1 OR u.phone ILIKE $1`,
    [term],
  )
  return {
    items: result.rows.map((user) => ({
      ...toPublicUser(user),
      activeSessions: user.active_sessions,
      completedSessions: user.completed_sessions,
    })),
    page: normalizedPage,
    pageSize: normalizedSize,
    total: countResult.rows[0].total,
  }
}
