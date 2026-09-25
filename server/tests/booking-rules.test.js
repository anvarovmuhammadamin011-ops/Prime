import { describe, expect, it } from 'vitest'
import {
  BOOKING_STATUS,
  canConfirmArrival,
  canStartSession,
  getBookingNoShowAt,
  intervalsOverlap,
  isPcAvailableForInterval,
} from '../domain/booking-rules.js'

const startAt = Date.parse('2026-09-25T08:00:00.000Z')

function booking(overrides = {}) {
  return {
    status: BOOKING_STATUS.APPROVED,
    start_at: new Date(startAt).toISOString(),
    end_at: new Date(startAt + 60 * 60 * 1000).toISOString(),
    pc_id: 'pc-1',
    arrival_due_at: null,
    ...overrides,
  }
}

describe('server booking rules', () => {
  it('detects overlapping intervals and treats boundaries as free', () => {
    expect(intervalsOverlap(0, 60, 30, 90)).toBe(true)
    expect(intervalsOverlap(0, 60, 60, 120)).toBe(false)
  })

  it('uses the ten-minute fallback and arrival deadline', () => {
    expect(getBookingNoShowAt(booking())).toBe(startAt + 10 * 60 * 1000)
    const dueAt = new Date(startAt + 5 * 60 * 1000).toISOString()
    expect(getBookingNoShowAt(booking({ arrival_due_at: dueAt }))).toBe(startAt + 10 * 60 * 1000)
  })

  it('enforces arrival and session time windows', () => {
    const item = booking()
    expect(canConfirmArrival(item, startAt)).toBe(true)
    expect(canConfirmArrival(item, startAt - 1)).toBe(false)
    expect(canConfirmArrival(item, startAt + 10 * 60 * 1000)).toBe(false)
    expect(canStartSession(item, startAt + 1)).toBe(true)
    expect(canStartSession(item, startAt + 10 * 60 * 1000)).toBe(false)

    const withArrival = booking({ arrival_due_at: new Date(startAt + 5 * 60 * 1000).toISOString() })
    expect(canStartSession(withArrival, startAt + 5 * 60 * 1000 - 1)).toBe(false)
    expect(canStartSession(withArrival, startAt + 5 * 60 * 1000)).toBe(true)
  })

  it('blocks PC intervals only for blocking booking statuses', () => {
    const active = booking()
    expect(isPcAvailableForInterval([active], 'pc-1', startAt, startAt + 30 * 60 * 1000)).toBe(false)
    expect(isPcAvailableForInterval([{ ...active, status: BOOKING_STATUS.CANCELLED }], 'pc-1', startAt, startAt + 30 * 60 * 1000)).toBe(true)
  })
})
