import { AppError } from '../utils/errors.js'
import { withTransaction, mapDatabaseError } from '../db/client.js'

function asIso(value) {
  return value ? new Date(value).toISOString() : null
}

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

export async function listPcs(pool, now = new Date(), { includeInactive = false } = {}) {
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
     WHERE ($2::boolean OR p.active = true)
     ORDER BY p.pc_number`,
    [now, includeInactive],
  )
  return result.rows.map((row) => ({
    id: row.id,
    number: row.pc_number,
    active: row.active,
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

const MINUTE_MS = 60 * 1000

async function fetchPcForUpdate(client, pcId) {
  const result = await client.query('SELECT * FROM pcs WHERE id = $1 FOR UPDATE', [pcId])
  if (!result.rows[0]) throw new AppError(404, 'PC_NOT_FOUND', 'PC topilmadi')
  return result.rows[0]
}

/** Admin PC'ni yoqadi/o'chiradi. Faol sessiyasi yoki joriy broni bor PC'ni o'chirish mumkin emas. */
export async function setPcActive(pool, actorId, pcId, active) {
  try {
    return await withTransaction(pool, async (client) => {
      const pc = await fetchPcForUpdate(client, pcId)
      if (pc.active === active) {
        return { id: pc.id, number: pc.pc_number, active, status: 'free' }
        }
      if (!active) {
        const busy = await client.query(
          `SELECT 1 FROM sessions s WHERE s.pc_id = $1 AND s.status = 'active'
           UNION ALL
           SELECT 1 FROM bookings b WHERE b.pc_id = $1
             AND b.status IN ('pending', 'approved', 'active') AND b.end_at > now()`,
          [pcId],
        )
        if (busy.rowCount > 0) {
          throw new AppError(409, 'PC_IN_USE', 'Faol sessiyasi yoki broni bor PC‘ni o‘chirib bo‘lmaydi')
        }
      }
      const updated = await client.query(
        'UPDATE pcs SET active = $2, updated_at = now() WHERE id = $1 RETURNING id, pc_number, active',
        [pcId, active],
      )
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, $2, 'pc', $3, $4::jsonb)`,
        [actorId, active ? 'pc.enabled' : 'pc.disabled', pcId, JSON.stringify({ pcNumber: pc.pc_number })],
      )
      const row = updated.rows[0]
      return { id: row.id, number: row.pc_number, active: row.active, status: 'free' }
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

/** Admin PC'ni darhol (hozir) ishga tushiradi — "walk-in" mijoz uchun. */
export async function startPcNow(pool, actorId, pcId, { minutes = null, hours = null } = {}) {
  try {
    return await withTransaction(pool, async (client) => {
      const pc = await fetchPcForUpdate(client, pcId)
      if (!pc.active) throw new AppError(409, 'PC_INACTIVE', 'PC o‘chirilgan — avval yoqing')

      const now = new Date()
      let durationMs
      if (minutes !== null && minutes !== undefined) {
        const mins = Number(minutes)
        if (!Number.isInteger(mins) || mins < 15 || mins > 720) {
          throw new AppError(400, 'INVALID_DURATION', 'Daqiqa 15–720 oralig‘ida bo‘lsin')
        }
        durationMs = mins * MINUTE_MS
      } else {
        const hrs = Number(hours ?? 1)
        if (!Number.isInteger(hrs) || hrs < 1 || hrs > 12) {
          throw new AppError(400, 'INVALID_DURATION', 'Soat 1–12 oralig‘ida bo‘lsin')
        }
        durationMs = hrs * 60 * MINUTE_MS
      }

      const busy = await client.query(
        `SELECT 1 FROM sessions s WHERE s.pc_id = $1 AND s.status = 'active' AND s.ends_at > $2
         UNION ALL
         SELECT 1 FROM bookings b WHERE b.pc_id = $1
           AND b.status IN ('pending', 'approved', 'active')
           AND b.start_at < $3 AND b.end_at > $2
         LIMIT 1`,
        [pcId, now, new Date(now.getTime() + durationMs)],
      )
      if (busy.rowCount > 0) {
        throw new AppError(409, 'PC_IN_USE', 'Bu PC hozir band — boshqa PC tanlang')
      }

      const endsAt = new Date(now.getTime() + durationMs)
      const hours2 = durationMs / (60 * MINUTE_MS)
      const pricePerHour = Number(pc.price_per_hour)

      // "Walk-in" bron: sessions.booking_id NOT NULL bo'lgani uchun sessiya doim bron bilan bog'lanadi
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, pc_id, start_at, end_at, status, duration_hours, price_per_hour, total_price, approved_at)
         VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $3)
         RETURNING id`,
        [actorId, pcId, now, endsAt, hours2, pricePerHour, Math.round(pricePerHour * hours2)],
      )
      const bookingId = bookingResult.rows[0].id

      const sessionResult = await client.query(
        `INSERT INTO sessions (booking_id, pc_id, user_id, started_by, started_at, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, started_at, ends_at, status`,
        [bookingId, pcId, actorId, actorId, now, endsAt],
      )
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'pc.session_started_now', 'pc', $2, $3::jsonb)`,
        [actorId, pcId, JSON.stringify({ pcNumber: pc.pc_number, minutes: durationMs / MINUTE_MS })],
      )
      const row = sessionResult.rows[0]
      return {
        pc: { id: pcId, number: pc.pc_number, active: true, status: 'active' },
        bookingId,
        session: {
          id: row.id,
          bookingId,
          pcId,
          pcNumber: pc.pc_number,
          userId: actorId,
          startedAt: asIso(row.started_at),
          endsAt: asIso(row.ends_at),
          status: row.status,
        },
      }
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}

/** Admin faol sessiyani (hozir ishga tushirilgan yoki bron sessiyasini) to'xtatadi. */
export async function stopPcSession(pool, actorId, pcId) {
  try {
    return await withTransaction(pool, async (client) => {
      const pc = await fetchPcForUpdate(client, pcId)
      const sessionResult = await client.query(
        `SELECT * FROM sessions
         WHERE pc_id = $1 AND status = 'active'
         ORDER BY started_at DESC
         LIMIT 1
         FOR UPDATE`,
        [pcId],
      )
      const session = sessionResult.rows[0]
      if (!session) throw new AppError(409, 'SESSION_NOT_ACTIVE', 'Bu PC da faol sessiya yo‘q')
      const now = new Date()
      await client.query(
        `UPDATE sessions SET status = 'completed', ended_at = $2 WHERE id = $1`,
        [session.id, now],
      )
      if (session.booking_id) {
        await client.query(
          `UPDATE bookings SET status = 'completed' WHERE id = $1 AND status = 'active'`,
          [session.booking_id],
        )
      }
      await client.query(
        `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
         VALUES ($1, 'pc.session_stopped', 'pc', $2, $3::jsonb)`,
        [actorId, pcId, JSON.stringify({ pcNumber: pc.pc_number, sessionId: session.id })],
      )
      return {
        pc: { id: pcId, number: pc.pc_number, active: true, status: 'free' },
        session: {
          id: session.id,
          bookingId: session.booking_id,
          pcId,
          pcNumber: pc.pc_number,
          userId: session.user_id,
          startedAt: asIso(session.started_at),
          endsAt: asIso(session.ends_at),
          status: 'completed',
        },
      }
    })
  } catch (error) {
    throw mapDatabaseError(error)
  }
}
