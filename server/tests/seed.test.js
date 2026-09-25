import { describe, expect, it, vi } from 'vitest'
import { seedDatabase } from '../db/seed.js'

function createPool() {
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  }
  return {
    client,
    connect: vi.fn().mockResolvedValue(client),
  }
}

describe('demo seed guard', () => {
  it('refuses to seed in production without explicit opt-in', async () => {
    const pool = createPool()
    await expect(
      seedDatabase(pool, { nodeEnv: 'production', demoSeedEnabled: false, demoAdminPassword: 'demo12345' }),
    ).rejects.toThrow('DEMO_SEED_ENABLED=true')
    expect(pool.connect).not.toHaveBeenCalled()
  })

  it('seeds in development without opt-in', async () => {
    const pool = createPool()
    await expect(
      seedDatabase(pool, { nodeEnv: 'development', demoAdminPassword: 'demo12345' }),
    ).resolves.toBeUndefined()
    expect(pool.client.query).toHaveBeenCalled()
    expect(pool.client.release).toHaveBeenCalled()
  })

  it('seeds in production when demo seeding is explicitly enabled', async () => {
    const pool = createPool()
    await expect(
      seedDatabase(pool, {
        nodeEnv: 'production',
        demoSeedEnabled: true,
        demoAdminPassword: 'demo12345',
      }),
    ).resolves.toBeUndefined()
    const inserted = pool.client.query.mock.calls.filter(([text]) => String(text).includes('INSERT INTO users'))
    expect(inserted).toHaveLength(5)
    const phones = inserted.map(([, params]) => params[1])
    expect(phones).toEqual(
      expect.arrayContaining(['+998901234567', '+998901111111', '+998900000000']),
    )
  })
})
