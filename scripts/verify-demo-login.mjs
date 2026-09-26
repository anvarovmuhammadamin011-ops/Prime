import { rm } from 'node:fs/promises'
import path from 'node:path'
import { getConfig } from '../server/config.js'
import { createPool } from '../server/db/client.js'
import { runMigrations } from '../server/db/migrate.js'
import { seedDatabase } from '../server/db/seed.js'
import { startServer } from '../server/index.js'

const databaseFile = path.resolve('data/verify-demo.db')
await rm(databaseFile, { force: true })
await rm(`${databaseFile}-wal`, { force: true })
await rm(`${databaseFile}-shm`, { force: true })

const config = getConfig({
  ...process.env,
  DB_DRIVER: 'sqlite',
  SQLITE_FILE: databaseFile,
  PORT: process.env.VERIFY_PORT || '4599',
  TELEGRAM_ENABLED: 'false',
  RUN_EXPIRATION_WORKER: 'false',
})

const pool = createPool(config)
await runMigrations(pool)
await seedDatabase(pool, config)
await pool.end()

const instance = await startServer({ config, pool: createPool(config) })
const base = `http://127.0.0.1:${instance.config.port}`

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` -> ${detail}` : ''}`)
}

async function call(method, url, body, token) {
  const response = await fetch(`${base}${url}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  return { status: response.status, payload }
}

try {
  const health = await call('GET', '/health')
  check('GET /health', health.status === 200, `status ${health.status}`)

  const settings = await call('GET', '/api/v1/public/settings')
  check(
    'GET /api/v1/public/settings',
    settings.status === 200 && settings.payload?.settings?.clubName === 'Prime Game Club',
    `club ${settings.payload?.settings?.clubName}, ${settings.payload?.settings?.pcCount} PC`,
  )

  const accounts = [
    ['user', '+998901234567'],
    ['admin', '+998901111111'],
    ['superadmin', '+998900000000'],
  ]
  const tokens = {}
  for (const [role, phone] of accounts) {
    const login = await call('POST', '/api/v1/auth/login', { phone, password: 'demo12345' })
    const ok = login.status === 200 && Boolean(login.payload?.accessToken)
    tokens[role] = login.payload?.accessToken
    check(`login ${role} (${phone})`, ok, ok ? `role ${login.payload.user.role}` : `status ${login.status} ${JSON.stringify(login.payload)}`)
  }

  const bad = await call('POST', '/api/v1/auth/login', { phone: '+998901234567', password: 'wrong-password' })
  check('login rejects wrong password', bad.status === 401, `status ${bad.status}`)

  const me = await call('GET', '/api/v1/auth/me', null, tokens.user)
  check('GET /api/v1/auth/me with token', me.status === 200 && me.payload?.user?.phone === '+998901234567', `phone ${me.payload?.user?.phone}`)

  const pcs = await call('GET', '/api/v1/public/pcs')
  const freePc = (pcs.payload?.pcs || []).find((pc) => pc.status === 'free')
  check('GET /api/v1/public/pcs', pcs.status === 200 && Boolean(freePc), `pcs ${pcs.payload?.pcs?.length}, free ${pcs.payload?.pcs?.filter((pc) => pc.status === 'free').length}`)

  const startAt = new Date('2026-12-01T18:00:00+05:00')
  const booking = await call('POST', '/api/v1/bookings', {
    pcId: freePc?.id,
    startAt: startAt.toISOString(),
    durationHours: 2,
  }, tokens.user)
  check('POST /api/v1/bookings', booking.status === 201, `status ${booking.status} ${booking.payload?.error?.code || ''}`)
  const bookingId = booking.payload?.booking?.id

  const overlap = await call('POST', '/api/v1/bookings', {
    pcId: freePc?.id,
    startAt: startAt.toISOString(),
    durationHours: 1,
  }, tokens.admin)
  check('overlapping booking rejected', overlap.status === 409, `status ${overlap.status} ${overlap.payload?.error?.code || ''}`)

  if (bookingId) {
    const approved = await call('POST', `/api/v1/admin/bookings/${bookingId}/approve`, {}, tokens.admin)
    check('admin approves booking', approved.status === 200, `status ${approved.status} ${approved.payload?.error?.code || ''}`)

    const mine = await call('GET', '/api/v1/bookings', null, tokens.user)
    check('GET /api/v1/bookings (my list)', mine.status === 200 && mine.payload?.items?.length > 0, `total ${mine.payload?.total}`)

    const dashboard = await call('GET', '/api/v1/admin/dashboard', null, tokens.admin)
    check(
      'GET /api/v1/admin/dashboard',
      dashboard.status === 200 && dashboard.payload?.bookings?.approved > 0,
      `approved ${dashboard.payload?.bookings?.approved}, activeSessions ${dashboard.payload?.activeSessions}`,
    )
  }
} finally {
  await instance.stop()
}

const failed = results.filter((item) => !item.ok)
console.log(`\n${results.length - failed.length}/${results.length} tekshiruv o'tdi`)
if (failed.length > 0) {
  process.exitCode = 1
}
