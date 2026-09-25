import { AppError } from '../utils/errors.js'
import {
  createAccessToken,
  createRefreshToken,
  hashPassword,
  hashRefreshToken,
  verifyPassword,
} from '../utils/crypto.js'
import { toPublicUser } from '../domain/booking-rules.js'
import { normalizePhone } from '../domain/auth-rules.js'
import { mapDatabaseError, withTransaction } from '../db/client.js'

function refreshExpiry(config) {
  return new Date(Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000)
}

export async function issueSession(client, user, config, metadata = {}) {
  const refreshToken = createRefreshToken()
  await client.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, hashRefreshToken(refreshToken), refreshExpiry(config), metadata.userAgent || null, metadata.ipAddress || null],
  )

  return {
    accessToken: createAccessToken(user, config.jwt.secret, config.jwt.accessTtl),
    refreshToken,
    accessTokenTtl: config.jwt.accessTtl,
  }
}

function publicUser(user) {
  return toPublicUser(user)
}

export async function register(pool, config, input, metadata = {}) {
  const name = String(input.name || '').trim()
  const phone = normalizePhone(input.phone)
  const password = String(input.password || '')

  if (name.length < 2 || name.length > 80) {
    throw new AppError(400, 'INVALID_NAME', 'Ism 2–80 belgidan iborat bo‘lsin')
  }
  if (!phone) throw new AppError(400, 'INVALID_PHONE', 'Telefon +998 formatida bo‘lsin')
  if (password.length < 8 || password.length > 128) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Parol 8–128 belgidan iborat bo‘lsin')
  }

  const passwordHash = await hashPassword(password)
  try {
    return await withTransaction(pool, async (client) => {
      const result = await client.query(
        `INSERT INTO users (name, phone, password_hash, role)
         VALUES ($1, $2, $3, 'user')
         RETURNING id, name, phone, role, telegram_id, created_at`,
        [name, phone, passwordHash],
      )
      const user = result.rows[0]
      const tokens = await issueSession(client, user, config, metadata)
      return { user: publicUser(user), ...tokens }
    })
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'PHONE_EXISTS', 'Bunday telefon allaqachon ro‘yxatdan o‘tgan')
    }
    throw mapDatabaseError(error)
  }
}

export async function login(pool, config, input, metadata = {}) {
  const phone = normalizePhone(input.phone)
  const password = String(input.password || '')
  if (!phone || !password) throw new AppError(401, 'INVALID_CREDENTIALS', 'Telefon yoki parol noto‘g‘ri')

  const result = await pool.query(
    `SELECT id, name, phone, role, telegram_id, created_at, password_hash
     FROM users
     WHERE phone = $1`,
    [phone],
  )
  const user = result.rows[0]
  const valid = user ? await verifyPassword(password, user.password_hash) : false
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Telefon yoki parol noto‘g‘ri')

  const tokens = await issueSession(pool, user, config, metadata)
  return { user: publicUser(user), ...tokens }
}

export async function refreshAccessToken(pool, config, rawToken, metadata = {}) {
  if (!rawToken) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token topilmadi')
  const tokenHash = hashRefreshToken(rawToken)

  return withTransaction(pool, async (client) => {
    const result = await client.query(
      `SELECT refresh_tokens.id AS refresh_token_id, refresh_tokens.expires_at,
              refresh_tokens.revoked_at, users.id AS user_id, users.name, users.phone, users.role,
              users.telegram_id, users.created_at
       FROM refresh_tokens
       JOIN users ON users.id = refresh_tokens.user_id
       WHERE refresh_tokens.token_hash = $1
       FOR UPDATE`,
      [tokenHash],
    )
    const record = result.rows[0]
    if (!record || record.revoked_at || new Date(record.expires_at).getTime() <= Date.now()) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token yaroqsiz')
    }

    await client.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [record.refresh_token_id])
    const user = {
      id: record.user_id,
      name: record.name,
      phone: record.phone,
      role: record.role,
      telegram_id: record.telegram_id,
      created_at: record.created_at,
    }
    const tokens = await issueSession(client, user, config, metadata)
    return { user: publicUser(user), ...tokens }
  })
}

export async function logout(pool, userId, rawToken) {
  if (!rawToken) return
  await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = COALESCE(revoked_at, now())
     WHERE user_id = $1 AND token_hash = $2`,
    [userId, hashRefreshToken(rawToken)],
  )
}

export async function getUser(pool, userId) {
  const result = await pool.query(
    `SELECT id, name, phone, role, telegram_id, created_at
     FROM users
     WHERE id = $1`,
    [userId],
  )
  return result.rows[0] ? publicUser(result.rows[0]) : null
}
