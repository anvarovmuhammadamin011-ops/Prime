import crypto from 'node:crypto'
import { AppError } from '../utils/errors.js'
import { safeEqual, verifyPassword } from '../utils/crypto.js'
import { normalizePhone } from '../domain/auth-rules.js'
import { toPublicUser } from '../domain/booking-rules.js'
import { mapDatabaseError, withTransaction } from '../db/client.js'
import { issueSession } from './auth-service.js'

const DEFAULT_AUTH_MAX_AGE_SECONDS = 86_400
const DEFAULT_CLOCK_SKEW_SECONDS = 60
const MAX_INIT_DATA_LENGTH = 32_768

function telegramOptions(config) {
  return config?.telegram || {}
}

function assertTelegramEnabled(config) {
  const telegram = telegramOptions(config)
  if (!telegram.enabled || !telegram.botToken) {
    throw new AppError(404, 'TELEGRAM_DISABLED', 'Telegram integratsiyasi yoqilgan')
  }
}

function invalidInitData() {
  return new AppError(401, 'INVALID_TELEGRAM_INIT_DATA', 'Telegram init data yaroqsiz')
}

function parseInitData(rawInitData) {
  if (typeof rawInitData !== 'string' || rawInitData.length === 0 || rawInitData.length > MAX_INIT_DATA_LENGTH) {
    throw invalidInitData()
  }

  let params
  try {
    params = new URLSearchParams(rawInitData)
  } catch {
    throw invalidInitData()
  }

  const entries = []
  const seen = new Set()
  for (const [key, value] of params) {
    if (!key || seen.has(key)) throw invalidInitData()
    seen.add(key)
    entries.push([key, value])
  }

  const values = Object.fromEntries(entries)
  if (!values.hash || !values.auth_date || !values.user) throw invalidInitData()
  if (!/^[a-f0-9]{64}$/i.test(values.hash)) throw invalidInitData()
  if (!/^\d+$/.test(values.auth_date)) throw invalidInitData()
  return { entries, values }
}

function parseTelegramUser(value) {
  let user
  try {
    user = JSON.parse(value)
  } catch {
    throw invalidInitData()
  }
  if (!user || typeof user !== 'object' || user.is_bot === true) throw invalidInitData()

  const telegramId = String(user.id ?? '')
  if (!/^[1-9]\d{0,19}$/.test(telegramId)) throw invalidInitData()

  const firstName = typeof user.first_name === 'string' ? user.first_name.slice(0, 64) : ''
  const lastName = typeof user.last_name === 'string' ? user.last_name.slice(0, 64) : ''
  const username = typeof user.username === 'string' && /^[a-zA-Z0-9_]{1,32}$/.test(user.username)
    ? user.username
    : null
  const languageCode = typeof user.language_code === 'string' && /^[a-zA-Z-]{2,10}$/.test(user.language_code)
    ? user.language_code
    : null

  return {
    telegramId,
    firstName,
    lastName,
    username,
    languageCode,
    isPremium: user.is_premium === true,
  }
}

export function verifyTelegramInitData(rawInitData, options = {}, now = new Date()) {
  const botToken = options.botToken
  if (!botToken) throw new AppError(503, 'TELEGRAM_NOT_CONFIGURED', 'Telegram bot token sozlanmagan')

  const { entries, values } = parseInitData(rawInitData)
  const authDate = Number(values.auth_date)
  const nowMs = now instanceof Date ? now.getTime() : Number(now)
  const nowSeconds = Math.floor(nowMs / 1000)
  const maxAgeSeconds = Number(options.authMaxAgeSeconds ?? DEFAULT_AUTH_MAX_AGE_SECONDS)
  const clockSkewSeconds = Number(options.authClockSkewSeconds ?? DEFAULT_CLOCK_SKEW_SECONDS)
  if (!Number.isSafeInteger(nowSeconds) || !Number.isSafeInteger(authDate)) throw invalidInitData()

  const ageSeconds = nowSeconds - authDate
  if (ageSeconds > maxAgeSeconds || ageSeconds < -clockSkewSeconds) throw invalidInitData()

  const dataCheckString = entries
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')
  if (!safeEqual(expectedHash, values.hash.toLowerCase())) throw invalidInitData()

  return {
    ...parseTelegramUser(values.user),
    authDate,
  }
}

function publicTelegramUser(identity) {
  return {
    id: identity.telegramId,
    firstName: identity.firstName,
    lastName: identity.lastName,
    username: identity.username,
    languageCode: identity.languageCode,
    isPremium: identity.isPremium,
  }
}

function validateCredentials(phoneInput, password) {
  const phone = normalizePhone(phoneInput)
  const cleanPassword = String(password || '')
  if (!phone) throw new AppError(400, 'INVALID_PHONE', 'Telefon +998 formatida bo‘lsin')
  if (!cleanPassword) throw new AppError(400, 'INVALID_PASSWORD', 'Parol talab qilinadi')
  return { phone, password: cleanPassword }
}

export async function loginWithTelegram(pool, config, initData, metadata = {}, now = new Date()) {
  assertTelegramEnabled(config)
  const identity = verifyTelegramInitData(initData, telegramOptions(config), now)
  const result = await pool.query(
    `SELECT id, name, phone, role, telegram_id, created_at
     FROM users
     WHERE telegram_id = $1`,
    [identity.telegramId],
  )
  const user = result.rows[0]
  if (!user) {
    throw new AppError(409, 'TELEGRAM_LINK_REQUIRED', 'Telegram akkauntingiz Prime Club akkauntiga ulanmagan')
  }
  const tokens = await issueSession(pool, user, config, metadata)
  return {
    user: toPublicUser(user),
    telegram: publicTelegramUser(identity),
    ...tokens,
  }
}

export async function linkTelegramAccount(pool, config, input, metadata = {}, now = new Date()) {
  assertTelegramEnabled(config)
  const identity = verifyTelegramInitData(input.initData, telegramOptions(config), now)
  const credentials = validateCredentials(input.phone, input.password)
  const userResult = await pool.query(
    `SELECT id, name, phone, role, telegram_id, created_at, password_hash
     FROM users
     WHERE phone = $1`,
    [credentials.phone],
  )
  const user = userResult.rows[0]
  const valid = user ? await verifyPassword(credentials.password, user.password_hash) : false
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Telefon yoki parol noto‘g‘ri')

  try {
    return await withTransaction(pool, async (client) => {
      const lockedResult = await client.query(
        `SELECT id, name, phone, role, telegram_id, created_at
         FROM users
         WHERE id = $1
         FOR UPDATE`,
        [user.id],
      )
      const lockedUser = lockedResult.rows[0]
      if (!lockedUser) throw new AppError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi')
      if (lockedUser.telegram_id && lockedUser.telegram_id !== identity.telegramId) {
        throw new AppError(409, 'TELEGRAM_ALREADY_LINKED', 'Bu Telegram akkaunti boshqa hisobga ulangan')
      }

      let linkedUser = lockedUser
      if (!lockedUser.telegram_id) {
        const update = await client.query(
          `UPDATE users
           SET telegram_id = $2
           WHERE id = $1
           RETURNING id, name, phone, role, telegram_id, created_at`,
          [lockedUser.id, identity.telegramId],
        )
        linkedUser = update.rows[0]
      }

      const tokens = await issueSession(client, linkedUser, config, metadata)
      return {
        user: toPublicUser(linkedUser),
        telegram: publicTelegramUser(identity),
        ...tokens,
      }
    })
  } catch (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'TELEGRAM_ALREADY_LINKED', 'Bu Telegram akkaunti boshqa hisobga ulangan')
    }
    throw mapDatabaseError(error)
  }
}

export async function unlinkTelegramAccount(pool, config, userId, password) {
  assertTelegramEnabled(config)
  const userResult = await pool.query(
    `SELECT id, name, phone, role, telegram_id, created_at, password_hash
     FROM users
     WHERE id = $1`,
    [userId],
  )
  const user = userResult.rows[0]
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi')
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Parol noto‘g‘ri')
  if (!user.telegram_id) return { user: toPublicUser(user), unlinked: false }

  const result = await withTransaction(pool, async (client) => {
    const lockedResult = await client.query(
      `SELECT id, name, phone, role, telegram_id, created_at
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId],
    )
    const lockedUser = lockedResult.rows[0]
    if (!lockedUser) throw new AppError(404, 'USER_NOT_FOUND', 'Foydalanuvchi topilmadi')
    if (!lockedUser.telegram_id) return { user: toPublicUser(lockedUser), unlinked: false }

    const update = await client.query(
      `UPDATE users
       SET telegram_id = NULL
       WHERE id = $1
       RETURNING id, name, phone, role, telegram_id, created_at`,
      [userId],
    )
    return { user: toPublicUser(update.rows[0]), unlinked: true }
  })
  return result
}

export async function sendTelegramMessage(config, chatId, text, options = {}) {
  const telegram = telegramOptions(config)
  if (!telegram.enabled || !telegram.botToken || !chatId) return false
  const response = await fetch(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...options,
    }),
  })
  if (!response.ok) throw new Error(`Telegram API returned ${response.status}`)
  return true
}

export function isValidTelegramWebhookSecret(provided, expected) {
  if (!provided || !expected) return false
  return safeEqual(String(provided), String(expected))
}
