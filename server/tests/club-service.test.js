import { describe, expect, it, vi } from 'vitest'
import { updateSettings } from '../services/club-service.js'

describe('club settings service', () => {
  it('deactivates every PC outside the new active range', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({
          rows: [{
            club_name: 'Prime Game Club',
            price_per_hour: 25000,
            max_duration: 4,
            pc_count: 10,
            timezone: 'Asia/Tashkent',
            updated_at: new Date().toISOString(),
          }],
          rowCount: 1,
        })
        .mockResolvedValue({ rows: [], rowCount: 0 }),
      release: vi.fn(),
    }
    const pool = { connect: vi.fn().mockResolvedValue(client) }

    const result = await updateSettings(pool, 'admin-1', {
      clubName: 'Prime Game Club',
      pricePerHour: 25000,
      maxDuration: 4,
      pcCount: 10,
    })

    expect(result.pcCount).toBe(10)
    const pcUpdate = client.query.mock.calls.find(([sql]) => sql.includes('UPDATE pcs'))
    expect(pcUpdate?.[0]).toContain('SET active = pc_number <= $1')
    expect(pcUpdate?.[0]).not.toContain('WHERE pc_number <= $1')
  })
})
