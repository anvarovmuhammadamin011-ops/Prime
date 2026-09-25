import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { getConfig } from '../config.js'
import { createPool, withTransaction } from './client.js'
import { normalizePhone } from '../domain/auth-rules.js'
import { AppError } from '../utils/errors.js'

export async function bootstrapAdmin(pool, input) {
  const name = String(input.name || '').trim()
  const phone = normalizePhone(input.phone)
  const password = String(input.password || '')
  if (name.length < 2 || name.length > 80) {
    throw new AppError(400, 'INVALID_NAME', 'Ism 2–80 belgidan iborat bo‘lsin')
  }
  if (!phone) throw new AppError(400, 'INVALID_PHONE', 'Telefon +998 formatida bo‘lsin')
  if (password.length < 8 || password.length > 128 || password.toLowerCase().includes('replace-with')) {
    throw new AppError(400, 'INVALID_PASSWORD', 'Parol 8–128 belgidan iborat bo‘lsin')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  return withTransaction(pool, async (client) => {
    const existing = await client.query(
      `SELECT id FROM users WHERE role IN ('admin', 'superadmin') LIMIT 1`,
    )
    if (existing.rowCount > 0) return { created: false }

    const result = await client.query(
      `INSERT INTO users (name, phone, password_hash, role)
       VALUES ($1, $2, $3, 'superadmin')
       RETURNING id, name, phone, role`,
      [name, phone, passwordHash],
    )
    return { created: true, user: result.rows[0] }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = getConfig()
  const input = {
    name: process.env.ADMIN_BOOTSTRAP_NAME,
    phone: process.env.ADMIN_BOOTSTRAP_PHONE,
    password: process.env.ADMIN_BOOTSTRAP_PASSWORD,
  }
  const pool = createPool(config)
  try {
    const result = await bootstrapAdmin(pool, input)
    console.log(result.created ? 'Superadmin yaratildi' : 'Admin allaqachon mavjud')
  } finally {
    await pool.end()
  }
}
