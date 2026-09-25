import { describe, expect, it } from 'vitest'
import {
  BOOKING_STATUS,
  HOUR_MS,
  MINUTE_MS,
  PC_STATUS,
  SESSION_STATUS,
  approveBookingInState,
  cancelBookingInState,
  confirmArrivalInState,
  createBookingInState,
  expireClubState,
  findBookingConflict,
  generateAccessCode,
  getPcStatus,
  intervalsOverlap,
  rejectBookingInState,
  startSessionInState,
  updateSettingsInState,
} from './bookingRules.js'

const NOW = Date.parse('2026-09-25T08:00:00.000Z')

function makeState(overrides = {}) {
  return {
    settings: {
      clubName: 'Prime Game Club',
      pricePerHour: 30000,
      maxDuration: 5,
      pcCount: 2,
      timezone: 'Asia/Tashkent',
    },
    pcs: [
      { id: 'pc-1', number: 1, active: true, pricePerHour: 30000 },
      { id: 'pc-2', number: 2, active: true, pricePerHour: 30000 },
    ],
    bookings: [],
    sessions: [],
    ...overrides,
  }
}

function makeBooking(overrides = {}) {
  return {
    id: 'booking-1',
    userId: 'user-1',
    pcId: 'pc-1',
    startAt: NOW,
    endAt: NOW + HOUR_MS,
    durationHours: 1,
    pricePerHour: 30000,
    totalPrice: 30000,
    status: BOOKING_STATUS.PENDING,
    accessCode: null,
    arrivalChoice: null,
    arrivalConfirmedAt: null,
    arrivalDueAt: null,
    reminderSentAt: null,
    approvedAt: null,
    accessCodeUsedAt: null,
    createdAt: NOW - HOUR_MS,
    ...overrides,
  }
}

describe('intervalsOverlap', () => {
  it('accepts overlapping intervals and rejects touching boundaries', () => {
    expect(intervalsOverlap(0, 60, 30, 90)).toBe(true)
    expect(intervalsOverlap(0, 60, 60, 120)).toBe(false)
  })
})

describe('findBookingConflict', () => {
  it('blocks overlapping bookings for the same PC or user', () => {
    const bookings = [makeBooking()]
    expect(findBookingConflict(bookings, { pcId: 'pc-1', userId: 'user-2', startAt: NOW, endAt: NOW + HOUR_MS })).toBeTruthy()
    expect(findBookingConflict(bookings, { pcId: 'pc-2', userId: 'user-1', startAt: NOW, endAt: NOW + HOUR_MS })).toBeTruthy()
  })

  it('ignores cancelled bookings and the booking being edited', () => {
    const bookings = [makeBooking({ status: BOOKING_STATUS.CANCELLED })]
    expect(findBookingConflict(bookings, { pcId: 'pc-1', userId: 'user-1', startAt: NOW, endAt: NOW + HOUR_MS })).toBeUndefined()
  })
})

describe('generateAccessCode', () => {
  it('creates a six-digit code and avoids existing values', () => {
    const values = [1, 2]
    expect(generateAccessCode([], () => values.shift())).toBe('000001')
    expect(generateAccessCode(['000001'], () => values.shift())).toBe('000002')
  })
})

describe('createBookingInState', () => {
  it('creates a pending booking with fixed pricing', () => {
    const result = createBookingInState(
      makeState(),
      { userId: 'user-1', pcId: 'pc-1', startAt: NOW + HOUR_MS, durationHours: 2 },
      { now: NOW, id: 'booking-new' },
    )

    expect(result.ok).toBe(true)
    expect(result.booking).toMatchObject({
      id: 'booking-new',
      status: BOOKING_STATUS.PENDING,
      startAt: NOW + HOUR_MS,
      endAt: NOW + 3 * HOUR_MS,
      totalPrice: 60000,
    })
    expect(result.state.bookings).toHaveLength(1)
  })

  it('rejects invalid PC, past time, duration and conflicts', () => {
    expect(createBookingInState(makeState(), { userId: 'user-1', pcId: 'pc-x', startAt: NOW, durationHours: 1 }, { now: NOW }).ok).toBe(false)
    expect(createBookingInState(makeState(), { userId: 'user-1', pcId: 'pc-1', startAt: NOW - 1, durationHours: 1 }, { now: NOW }).ok).toBe(false)
    expect(createBookingInState(makeState(), { userId: 'user-1', pcId: 'pc-1', startAt: NOW, durationHours: 0 }, { now: NOW }).ok).toBe(false)
    expect(createBookingInState(makeState({ bookings: [makeBooking()] }), { userId: 'user-2', pcId: 'pc-1', startAt: NOW, durationHours: 1 }, { now: NOW }).ok).toBe(false)
  })
})

describe('booking decisions', () => {
  it('approves a pending booking with a unique access code', () => {
    const result = approveBookingInState(makeState({ bookings: [makeBooking()] }), 'booking-1', { now: NOW, randomInt: () => 123 })
    expect(result.ok).toBe(true)
    expect(result.booking.status).toBe(BOOKING_STATUS.APPROVED)
    expect(result.booking.accessCode).toBe('000123')
  })

  it('rejects and cancels only eligible bookings', () => {
    const rejected = rejectBookingInState(makeState({ bookings: [makeBooking()] }), 'booking-1')
    expect(rejected.state.bookings[0].status).toBe(BOOKING_STATUS.REJECTED)
    expect(rejectBookingInState(rejected.state, 'booking-1').ok).toBe(false)

    const cancelled = cancelBookingInState(makeState({ bookings: [makeBooking()] }), 'booking-1', 'user-1')
    expect(cancelled.state.bookings[0].status).toBe(BOOKING_STATUS.CANCELLED)
    expect(cancelBookingInState(makeState({ bookings: [makeBooking()] }), 'booking-1', 'user-2').ok).toBe(false)
  })
})

describe('arrival reminder', () => {
  it('stores only five or ten minute choices', () => {
    const state = makeState({ bookings: [makeBooking({ status: BOOKING_STATUS.APPROVED })] })
    const result = confirmArrivalInState(state, 'booking-1', '10', NOW)
    expect(result.ok).toBe(true)
    expect(result.booking.arrivalDueAt).toBe(NOW + 10 * MINUTE_MS)
    expect(confirmArrivalInState(state, 'booking-1', 7, NOW).ok).toBe(false)
  })
})

describe('startSessionInState', () => {
  it('validates the code and arrival due time', () => {
    const booking = makeBooking({ status: BOOKING_STATUS.APPROVED, accessCode: '123456' })
    const state = makeState({ bookings: [booking] })
    expect(startSessionInState(state, '12', { now: NOW }).ok).toBe(false)
    expect(startSessionInState(state, '123456', { now: NOW - 1 }).ok).toBe(false)

    const early = confirmArrivalInState(state, 'booking-1', 5, NOW).state
    expect(startSessionInState(early, '123456', { now: NOW + 5 * MINUTE_MS - 1 }).ok).toBe(false)
  })

  it('starts one session and consumes the access code', () => {
    const booking = makeBooking({ status: BOOKING_STATUS.APPROVED, accessCode: '123456', reminderSentAt: NOW })
    const result = startSessionInState(makeState({ bookings: [booking] }), '123 456', { now: NOW + 1, id: 'session-1' })

    expect(result.ok).toBe(true)
    expect(result.session).toMatchObject({ id: 'session-1', status: SESSION_STATUS.ACTIVE, startedAt: NOW + 1 })
    expect(result.state.bookings[0]).toMatchObject({ status: BOOKING_STATUS.ACTIVE, accessCode: null })
    expect(result.state.sessions).toHaveLength(1)
  })
})

describe('expireClubState', () => {
  it('marks an unanswered approved booking as no-show after ten minutes', () => {
    const booking = makeBooking({ status: BOOKING_STATUS.APPROVED })
    const before = makeState({ bookings: [booking] })
    const atDeadline = makeState({ bookings: [booking] })
    expect(expireClubState(before, NOW + 10 * MINUTE_MS - 1).bookings[0].status).toBe(BOOKING_STATUS.APPROVED)
    expect(expireClubState(atDeadline, NOW + 10 * MINUTE_MS).bookings[0].status).toBe(BOOKING_STATUS.NO_SHOW)
  })

  it('uses arrival choice plus five minutes as the no-show deadline', () => {
    const booking = makeBooking({
      status: BOOKING_STATUS.APPROVED,
      arrivalChoice: 5,
      arrivalConfirmedAt: NOW,
      arrivalDueAt: NOW + 5 * MINUTE_MS,
    })
    const result = expireClubState(makeState({ bookings: [booking] }), NOW + 10 * MINUTE_MS)
    expect(result.bookings[0].status).toBe(BOOKING_STATUS.NO_SHOW)
  })

  it('completes active sessions at their end time', () => {
    const booking = makeBooking({ status: BOOKING_STATUS.ACTIVE })
    const session = {
      id: 'session-1',
      bookingId: booking.id,
      pcId: booking.pcId,
      userId: booking.userId,
      startedAt: NOW,
      endsAt: NOW + HOUR_MS,
      endedAt: null,
      status: SESSION_STATUS.ACTIVE,
    }
    const result = expireClubState(makeState({ bookings: [booking], sessions: [session] }), NOW + HOUR_MS)
    expect(result.bookings[0].status).toBe(BOOKING_STATUS.COMPLETED)
    expect(result.sessions[0].status).toBe(SESSION_STATUS.COMPLETED)
  })
})

describe('getPcStatus', () => {
  it('reports free, booked and active states', () => {
    const booking = makeBooking({ status: BOOKING_STATUS.APPROVED })
    expect(getPcStatus(makeState(), 'pc-1', NOW)).toBe(PC_STATUS.FREE)
    expect(getPcStatus(makeState({ bookings: [booking] }), 'pc-1', NOW)).toBe(PC_STATUS.BOOKED)

    const session = {
      id: 'session-1',
      bookingId: booking.id,
      pcId: booking.pcId,
      userId: booking.userId,
      startedAt: NOW,
      endsAt: NOW + HOUR_MS,
      endedAt: null,
      status: SESSION_STATUS.ACTIVE,
    }
    expect(getPcStatus(makeState({ bookings: [{ ...booking, status: BOOKING_STATUS.ACTIVE }], sessions: [session] }), 'pc-1', NOW)).toBe(PC_STATUS.ACTIVE)
  })
})

describe('updateSettingsInState', () => {
  it('validates values and archives removed PCs', () => {
    const result = updateSettingsInState(makeState(), {
      clubName: 'Prime Tashkent',
      pricePerHour: 35000,
      maxDuration: 6,
      pcCount: 1,
    })

    expect(result.ok).toBe(true)
    expect(result.state.pcs).toHaveLength(2)
    expect(result.state.pcs[0].pricePerHour).toBe(35000)
    expect(result.state.pcs[1].active).toBe(false)
  })

  it('does not remove a PC with an active booking', () => {
    const result = updateSettingsInState(
      makeState({ bookings: [makeBooking({ pcId: 'pc-2', status: BOOKING_STATUS.APPROVED })] }),
      { clubName: 'Prime Club', pricePerHour: 30000, maxDuration: 5, pcCount: 1 },
    )
    expect(result.ok).toBe(false)
  })
})
