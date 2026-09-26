import { AppError } from '../utils/errors.js'
import { withTransaction, mapDatabaseError } from '../db/client.js'

function mapSettings(row) {
  return {
    clubName: row.club_name,
    pricePerHour: Number(row.price_per_hour),
    maxDuration: row.max_duration,
    pcCount: row.pc_count,
    timezone: row.timezone,
    updatedAt: row.updated_at,
  }
}

export async function getSettings(pool, client = pool) {
  const result = await client.query('SELECT * FROM club_settings WHERE id = 1')
  if (!result.rows[0]) throw new AppError(404, 'SETTINGS_NOT_FOUND', 'Club sozlamalari topilmadi')
  return mapSettings(result.rows[0])
}

export async function updateSettings(pool, actorId, input) {
  const clubName = String(input.clubName || '').trim()
  const pricePerHour = Number(input.pricePerHour)
  const maxDuration = Number(input.maxDuration)
  const pcCount = Number(input.pcCount)

  if (clubName.length < 2 || clubName.length > 40) {
    throw new AppError(400, 'INVALID_CLUB_NAME', 'Club nomi 2–40 belgidan iborat bo‘lsin')
  }
  if (!Number.isInteger(pricePerHour) || pricePerHour < 1000 || pricePerHour > 1_000_000) {
    throw new AppError(400, 'INVALID_PRICE', 'Soatlik narx 1000–1 000 000 bo‘lsin')
  }
  if (!Number.isInteger(maxDuration) || maxDuration < 1 || maxDuration > 12) {
    throw new AppError(400, 'INVALID_DURATION', 'Maksimal davomiylik 1–12 soat bo‘lsin')
  }
  if (!Number.isInteger(pcCount) || pcCount < 1 || pcCount > 20) {
    throw new AppError(400, 'INVALID_PC_COUNT', 'PC soni 1–20 oralig‘ida bo‘lsin')
  }

  try {
    return await withTransaction(pool, async (client) => {
      await client.query('SELECT id FROM club_settings WHERE id = 1 FOR UPDATE')
      const protectedResult = await client.query(
        `SELECT 1
         FROM bookings b
         JOIN pcs p ON p.id = b.pc_id
         WHERE p.pc_number > $1
           AND b.status IN ('pending', 'approved', 'active')
         LIMIT 1`,
        [pcCount],
      )
      if (protectedResult.rowCount > 0) {
        throw new AppError(409, 'PC_IN_USE', 'Broni bor PC’ni olib tashlab bo‘lmaydi')
      }

      const settingsResult = await client.query(
        `UPDATE club_settings
         SET club_name = $1, price_per_hour = $2, max_duration = $3, pc_count = $4, updated_by = $5
         WHERE id = 1
         RETURNING *`,
        [clubName, pricePerHour, maxDuration, pcCount, actorId],
      )

      await client.query(
        `UPDATE pcs
         SET active = pc_number <= $1, price_per_hour = $2`,
        [pcCount, pricePerHour],
      )
      await client.query(
      `INSERT INTO pcs (pc_number, active, price_per_hour)
       SELECT numbers.pc_number, true, $2
       FROM generate_series(1, $1::int) AS numbers(pc_number)
         ON CONFLICT (pc_number) DO UPDATE SET active = true, price_per_hour = EXCLUDED.price_per_hour`,
        [pcCount, pricePerHour],
      )
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, metadata)
         VALUES ($1, 'settings.updated', 'club_settings', $2::jsonb)`,
        [actorId, JSON.stringify({ clubName, pricePerHour, maxDuration, pcCount })],
      )

      return mapSettings(settingsResult.rows[0])
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

export async function listPcs(pool, now = new Date()) {
  const result = await pool.query(
    `SELECT p.id, p.pc_number, p.active, p.price_per_hour,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM sessions s
                WHERE s.pc_id = p.id AND s.status = 'active'
                  AND s.started_at <= $1 AND s.ends_at > $1
              ) THEN 'active'
              WHEN EXISTS (
                SELECT 1 FROM bookings b
                WHERE b.pc_id = p.id
                  AND b.status IN ('pending', 'approved', 'active')
                  AND b.start_at <= $1 AND b.end_at > $1
              ) THEN 'booked'
              ELSE 'free'
            END AS status,
             (SELECT s.id FROM sessions s
               WHERE s.pc_id = p.id AND s.status = 'active'
                 AND s.started_at <= $1 AND s.ends_at > $1
               ORDER BY s.started_at DESC LIMIT 1) AS session_id,
             (SELECT s.started_at FROM sessions s
               WHERE s.pc_id = p.id AND s.status = 'active'
                 AND s.started_at <= $1 AND s.ends_at > $1
               ORDER BY s.started_at DESC LIMIT 1) AS session_started_at,
             (SELECT s.ends_at FROM sessions s
               WHERE s.pc_id = p.id AND s.status = 'active'
                 AND s.started_at <= $1 AND s.ends_at > $1
               ORDER BY s.started_at DESC LIMIT 1) AS session_ends_at,
             (SELECT b.id FROM bookings b
               WHERE b.pc_id = p.id AND b.status IN ('pending', 'approved', 'active')
                 AND b.start_at <= $1 AND b.end_at > $1
               ORDER BY b.start_at LIMIT 1) AS booking_id,
             (SELECT b.start_at FROM bookings b
               WHERE b.pc_id = p.id AND b.status IN ('pending', 'approved', 'active')
                 AND b.start_at <= $1 AND b.end_at > $1
               ORDER BY b.start_at LIMIT 1) AS booking_start_at,
             (SELECT b.end_at FROM bookings b
               WHERE b.pc_id = p.id AND b.status IN ('pending', 'approved', 'active')
                 AND b.start_at <= $1 AND b.end_at > $1
               ORDER BY b.start_at LIMIT 1) AS booking_end_at
     FROM pcs p
     WHERE p.active = true
     ORDER BY p.pc_number`,
    [now],
  )
  return result.rows.map((row) => ({
    id: row.id,
    number: row.pc_number,
    status: row.status,
    pricePerHour: Number(row.price_per_hour),
     session: row.session_id
       ? { id: row.session_id, startedAt: row.session_started_at, endsAt: row.session_ends_at }
       : null,
    booking: row.booking_id
      ? { id: row.booking_id, startAt: row.booking_start_at, endAt: row.booking_end_at }
      : null,
  }))
}
