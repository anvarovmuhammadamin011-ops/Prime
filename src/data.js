import { BOOKING_STATUS, CLUB_TIMEZONE, HOUR_MS, PC_STATUS, SESSION_STATUS } from './club/bookingRules.js'

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Kutilmoqda',
  [BOOKING_STATUS.APPROVED]: 'Tasdiqlangan',
  [BOOKING_STATUS.REJECTED]: 'Rad etilgan',
  [BOOKING_STATUS.ACTIVE]: 'Sessiya boshlandi',
  [BOOKING_STATUS.COMPLETED]: 'Tugagan',
  [BOOKING_STATUS.CANCELLED]: 'Bekor qilingan',
  [BOOKING_STATUS.EXPIRED]: 'Muddati tugagan',
  [BOOKING_STATUS.NO_SHOW]: 'Kelmadi',
}

export const BOOKING_STATUS_CLASSES = {
  [BOOKING_STATUS.PENDING]: 'pending',
  [BOOKING_STATUS.APPROVED]: 'approved',
  [BOOKING_STATUS.REJECTED]: 'rejected',
  [BOOKING_STATUS.ACTIVE]: 'active',
  [BOOKING_STATUS.COMPLETED]: 'completed',
  [BOOKING_STATUS.CANCELLED]: 'cancelled',
  [BOOKING_STATUS.EXPIRED]: 'expired',
  [BOOKING_STATUS.NO_SHOW]: 'no-show',
}

export const PC_STATUS_LABELS = {
  [PC_STATUS.FREE]: 'Bo‘sh',
  [PC_STATUS.BOOKED]: 'Bron qilingan',
  [PC_STATUS.ACTIVE]: 'Ishlayapti',
}

export const PC_STATUS_CLASSES = {
  [PC_STATUS.FREE]: 'free',
  [PC_STATUS.BOOKED]: 'booked',
  [PC_STATUS.ACTIVE]: 'active',
}

export const SESSION_STATUS_LABELS = {
  [SESSION_STATUS.ACTIVE]: 'Faol',
  [SESSION_STATUS.COMPLETED]: 'Tugagan',
}

const dateFormatter = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: CLUB_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: CLUB_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const dateTimeFormatter = new Intl.DateTimeFormat('uz-UZ', {
  timeZone: CLUB_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLUB_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const moneyFormatter = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 0,
})

function timestamp(value) {
  if (typeof value === 'number') return value
  if (!value) return Date.now()
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : Date.now()
}

export function formatMoney(value) {
  return moneyFormatter.format(Number(value) || 0)
}

export function formatDate(value) {
  return dateFormatter.format(new Date(timestamp(value)))
}

export function formatTime(value) {
  return timeFormatter.format(new Date(timestamp(value)))
}

export function formatDateTime(value) {
  return dateTimeFormatter.format(new Date(timestamp(value)))
}

export function formatHms(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function getDateTimeParts(value = Date.now()) {
  const parts = Object.fromEntries(
    partsFormatter
      .formatToParts(new Date(timestamp(value)))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

export function toDateInputValue(value = Date.now()) {
  return getDateTimeParts(value).date
}

export function toTimeInputValue(value = Date.now()) {
  return getDateTimeParts(value).time
}

export function fromDateTimeInput(date, time) {
  const parsed = Date.parse(`${date}T${time}:00+05:00`)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function getDefaultBookingStart(now = Date.now()) {
  const minimum = now + 5 * 60 * 1000
  const interval = 15 * 60 * 1000
  return Math.ceil(minimum / interval) * interval
}

export function isToday(value, now = Date.now()) {
  return toDateInputValue(value) === toDateInputValue(now)
}

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function createInitialClubState(now = Date.now()) {
  const activeStart = now - 30 * 60 * 1000
  const activeEnd = now + 90 * 60 * 1000
  const nextStart = Math.ceil((now + 20 * 60 * 1000) / (30 * 60 * 1000)) * 30 * 60 * 1000
  const pendingStart = now + 3 * HOUR_MS

  return {
    version: 1,
    settings: {
      clubName: 'Prime Game Club',
      pricePerHour: 18000,
      maxDuration: 4,
      pcCount: 20,
      timezone: CLUB_TIMEZONE,
    },
    pcs: Array.from({ length: 20 }, (_, index) => ({
      id: `pc-${index + 1}`,
      number: index + 1,
      active: true,
      pricePerHour: 18000,
    })),
    bookings: [
      {
        id: 'booking-approved-demo',
        userId: 'user-demo',
        pcId: 'pc-7',
        startAt: nextStart,
        endAt: nextStart + 2 * HOUR_MS,
        durationHours: 2,
        pricePerHour: 18000,
        totalPrice: 36000,
        status: BOOKING_STATUS.APPROVED,
        accessCode: '482731',
        arrivalChoice: null,
        arrivalConfirmedAt: null,
        arrivalDueAt: null,
        reminderSentAt: null,
        approvedAt: now,
        accessCodeUsedAt: null,
        createdAt: now - 30 * 60 * 1000,
      },
      {
        id: 'booking-active-demo',
        userId: 'user-secondary',
        pcId: 'pc-2',
        startAt: activeStart,
        endAt: activeEnd,
        durationHours: 2,
        pricePerHour: 18000,
        totalPrice: 36000,
        status: BOOKING_STATUS.ACTIVE,
        accessCode: '194528',
        arrivalChoice: 5,
        arrivalConfirmedAt: activeStart,
        arrivalDueAt: activeStart + 5 * 60 * 1000,
        reminderSentAt: activeStart,
        approvedAt: activeStart - HOUR_MS,
        accessCodeUsedAt: activeStart,
        createdAt: activeStart - 2 * HOUR_MS,
      },
      {
        id: 'booking-pending-demo',
        userId: 'user-secondary',
        pcId: 'pc-3',
        startAt: pendingStart,
        endAt: pendingStart + HOUR_MS,
        durationHours: 1,
        pricePerHour: 18000,
        totalPrice: 18000,
        status: BOOKING_STATUS.PENDING,
        accessCode: null,
        arrivalChoice: null,
        arrivalConfirmedAt: null,
        arrivalDueAt: null,
        reminderSentAt: null,
        approvedAt: null,
        accessCodeUsedAt: null,
        createdAt: now - 10 * 60 * 1000,
      },
    ],
    sessions: [
      {
        id: 'session-active-demo',
        bookingId: 'booking-active-demo',
        pcId: 'pc-2',
        userId: 'user-secondary',
        startedAt: activeStart,
        endsAt: activeEnd,
        endedAt: null,
        status: SESSION_STATUS.ACTIVE,
      },
    ],
    usedAccessCodes: [],
  }
}
