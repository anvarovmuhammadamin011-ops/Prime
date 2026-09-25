import crypto from 'node:crypto'

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  NO_SHOW: 'no_show',
})

export const SESSION_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
})

export const USER_ROLE = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
})

export const BLOCKING_BOOKING_STATUSES = new Set([
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.APPROVED,
  BOOKING_STATUS.ACTIVE,
])

export function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA
}

export function getBookingNoShowAt(booking) {
  return booking.arrival_due_at
    ? new Date(booking.arrival_due_at).getTime() + 5 * 60 * 1000
    : new Date(booking.start_at).getTime() + 10 * 60 * 1000
}

export function isPcAvailableForInterval(bookings, pcId, startAt, endAt) {
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return false
  return !bookings.some(
    (booking) =>
      booking.pc_id === pcId &&
      BLOCKING_BOOKING_STATUSES.has(booking.status) &&
      intervalsOverlap(start, end, new Date(booking.start_at).getTime(), new Date(booking.end_at).getTime()),
  )
}

export function generateAccessCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

export function calculateEndAt(startAt, durationHours) {
  return new Date(new Date(startAt).getTime() + Number(durationHours) * 60 * 60 * 1000)
}

export function isValidArrivalChoice(minutes) {
  return [5, 10].includes(Number(minutes))
}

export function canConfirmArrival(booking, now = Date.now()) {
  const current = new Date(now).getTime()
  return (
    booking.status === BOOKING_STATUS.APPROVED &&
    current >= new Date(booking.start_at).getTime() &&
    current < getBookingNoShowAt(booking)
  )
}

export function canStartSession(booking, now = Date.now()) {
  const current = new Date(now).getTime()
  const arrivalDueAt = booking.arrival_due_at ? new Date(booking.arrival_due_at).getTime() : null
  return (
    booking.status === BOOKING_STATUS.APPROVED &&
    current >= new Date(booking.start_at).getTime() &&
    (arrivalDueAt === null || current >= arrivalDueAt) &&
    current < new Date(booking.end_at).getTime() &&
    current < getBookingNoShowAt(booking)
  )
}

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    telegramId: user.telegram_id || null,
    createdAt: user.created_at,
  }
}
