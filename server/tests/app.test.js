import { describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'

const config = {
  nodeEnv: 'test',
  port: 4000,
  database: { url: 'postgres://test', max: 1 },
  jwt: { secret: 'a'.repeat(32), accessTtl: '15m', refreshTtlDays: 30 },
  accessCodePepper: 'p'.repeat(32),
  corsOrigins: ['http://localhost:5173'],
  trustProxy: false,
  autoExpireIntervalMs: 30_000,
  demoAdminPassword: 'demo12345',
}

function createPool() {
  return {
    query: vi.fn().mockResolvedValue({ rows: [] }),
  }
}

describe('HTTP application', () => {
  it('exposes liveness without touching the database', async () => {
    const pool = createPool()
    const response = await request(createApp({ pool, config })).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
    expect(pool.query).not.toHaveBeenCalled()
  })

  it('checks database readiness', async () => {
    const pool = createPool()
    pool.query.mockResolvedValueOnce({
      rows: [{
        users: 'users',
        club_settings: 'club_settings',
        pcs: 'pcs',
        bookings: 'bookings',
        sessions: 'sessions',
        access_code_history: 'access_code_history',
        refresh_tokens: 'refresh_tokens',
      }],
    })
    const response = await request(createApp({ pool, config })).get('/ready')
    expect(response.status).toBe(200)
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('to_regclass'))
  })

  it('rejects protected requests without an access token', async () => {
    const response = await request(createApp({ pool: createPool(), config })).get('/api/v1/bookings')
    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('AUTH_REQUIRED')
  })

  it('maps malformed JSON and disallowed origins to client errors', async () => {
    const app = createApp({ pool: createPool(), config })
    const malformed = await request(app)
      .post('/api/v1/auth/login')
      .set('content-type', 'application/json')
      .send('{"phone":')
    expect(malformed.status).toBe(400)

    const corsResponse = await request(app)
      .get('/api/v1/public/settings')
      .set('origin', 'https://untrusted.example')
    expect(corsResponse.status).toBe(403)
  })

  it('returns public settings', async () => {
    const pool = createPool()
    pool.query.mockResolvedValueOnce({
      rows: [{
        club_name: 'Prime Game Club',
        price_per_hour: 18000,
        max_duration: 4,
        pc_count: 20,
        timezone: 'Asia/Tashkent',
        updated_at: new Date().toISOString(),
      }],
    })
    const response = await request(createApp({ pool, config })).get('/api/v1/public/settings')
    expect(response.status).toBe(200)
    expect(response.body.settings.pricePerHour).toBe(18000)
  })
})
