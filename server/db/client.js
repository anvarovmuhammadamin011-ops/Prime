import pg from 'pg'
import { AppError } from '../utils/errors.js'
import { createSqlitePool } from './sqlite/driver.js'

const { Pool } = pg

export function createPool(config) {
  if (config.database.driver === 'sqlite') {
    return createSqlitePool(config)
  }
  const pool = new Pool({
    connectionString: config.database.url,
    max: config.database.max,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: config.database.ssl,
  })
  pool.on('error', (error) => {
    console.error('PostgreSQL pool error', error)
  })
  return pool
}

export async function query(pool, text, params = []) {
  return pool.query(text, params)
}

export async function assertSchema(pool) {
  const required = [
    'users',
    'club_settings',
    'pcs',
    'bookings',
    'sessions',
    'access_code_history',
    'refresh_tokens',
  ]
  const result = pool.driver === 'sqlite'
    ? await pool.query(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${required.map(() => '?').join(', ')})`,
      required,
    )
    : await pool.query(
      `SELECT to_regclass('public.users') AS users,
              to_regclass('public.club_settings') AS club_settings,
              to_regclass('public.pcs') AS pcs,
              to_regclass('public.bookings') AS bookings,
              to_regclass('public.sessions') AS sessions,
              to_regclass('public.access_code_history') AS access_code_history,
              to_regclass('public.refresh_tokens') AS refresh_tokens`,
    )
  const present = new Set()
  for (const row of result.rows) {
    if (row.name) present.add(row.name)
    for (const table of required) {
      if (row[table]) present.add(row[table])
    }
  }
  const missing = required.filter((table) => !present.has(table))
  if (missing.length > 0) {
    throw new Error(`Database schema tayyor emas. Avval db:migrate bajarilishi kerak (topilmadi: ${missing.join(', ')})`)
  }
}

export async function withTransaction(pool, callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      void 0
    }
    throw error
  } finally {
    client.release()
  }
}

export function mapDatabaseError(error) {
  if (error?.code === '23P01') {
    return new AppError(409, 'BOOKING_CONFLICT', 'Bu vaqt oralig‘ida PC yoki foydalanuvchi band')
  }
  if (error?.code === '23505') {
    return new AppError(409, 'DUPLICATE', 'Bunday ma’lumot allaqachon mavjud')
  }
  if (error?.code === '23503') {
    return new AppError(400, 'REFERENCE_ERROR', 'Bog‘langan ma’lumot topilmadi')
  }
  return error
}
