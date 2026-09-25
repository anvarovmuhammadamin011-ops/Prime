import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export function createAccessToken(user, secret, expiresIn) {
  return jwt.sign(
    { role: user.role, type: 'access' },
    secret,
    {
      subject: user.id,
      issuer: 'prime-club-api',
      audience: 'prime-club-client',
      expiresIn,
    },
  )
}

export function verifyAccessToken(token, secret) {
  const payload = jwt.verify(token, secret, {
    issuer: 'prime-club-api',
    audience: 'prime-club-client',
  })
  if (payload.type !== 'access' || !payload.sub) throw new Error('Invalid access token')
  return payload
}

export function createRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function hashAccessCode(code, pepper) {
  return crypto.createHmac('sha256', pepper).update(code).digest('hex')
}

function accessCodeEncryptionKey(pepper) {
  return Buffer.from(
    crypto.hkdfSync(
      'sha256',
      Buffer.from(pepper),
      Buffer.from('prime-club-access-code-history'),
      Buffer.from('access-code-v1'),
      32,
    ),
  )
}

export function encryptAccessCode(code, pepper) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', accessCodeEncryptionKey(pepper), iv)
  const encrypted = Buffer.concat([cipher.update(String(code), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((value) => value.toString('base64url')).join('.')
}

export function decryptAccessCode(value, pepper) {
  if (!value || !pepper) return null
  try {
    const [ivValue, tagValue, encryptedValue] = String(value).split('.')
    if (!ivValue || !tagValue || !encryptedValue) return null
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      accessCodeEncryptionKey(pepper),
      Buffer.from(ivValue, 'base64url'),
    )
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return null
  }
}

export function normalizeAccessCode(value) {
  const code = String(value || '').replace(/\D/g, '')
  return /^\d{6}$/.test(code) ? code : null
}

export function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function createId() {
  return crypto.randomUUID()
}
