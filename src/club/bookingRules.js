export const HOUR_MS = 60 * 60 * 1000
export const MINUTE_MS = 60 * 1000
export const CLUB_TIMEZONE = 'Asia/Tashkent'

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

export const PC_STATUS = Object.freeze({
  FREE: 'free',
  BOOKED: 'booked',
  ACTIVE: 'active',
})

const BLOCKING_STATUSES = new Set([
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.APPROVED,
  BOOKING_STATUS.ACTIVE,
])

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function defaultRandomInt(max) {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1)
    globalThis.crypto.getRandomValues(values)
    return values[0] % max
  }
  return Math.floor(Math.random() * max)
}

export function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA
}

export function getBookingNoShowAt(booking) {
  return booking.arrivalDueAt
    ? booking.arrivalDueAt + 5 * MINUTE_MS
    : booking.startAt + 10 * MINUTE_MS
}

export function findBookingConflict(bookings, input, ignoreId = null) {
  return bookings.find((booking) => {
    if (booking.id === ignoreId || !BLOCKING_STATUSES.has(booking.status)) return false
    const samePc = booking.pcId === input.pcId
    const sameUser = booking.userId === input.userId
    if (!samePc && !sameUser) return false
    return intervalsOverlap(input.startAt, input.endAt, booking.startAt, booking.endAt)
  })
}

export function isPcAvailableForInterval(bookings, pcId, startAt, endAt) {
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return false
  return !bookings.some(
    (booking) =>
      booking.pcId === pcId &&
      BLOCKING_STATUSES.has(booking.status) &&
      intervalsOverlap(startAt, endAt, booking.startAt, booking.endAt),
  )
}

export function getSessionForPc(state, pcId, now = Date.now()) {
  return state.sessions.find(
    (session) =>
      session.pcId === pcId &&
      session.status === SESSION_STATUS.ACTIVE &&
      session.startedAt <= now &&
      session.endsAt > now,
  )
}

export function getSessionForBooking(state, bookingId, now = Date.now()) {
  return state.sessions.find(
    (session) =>
      session.bookingId === bookingId &&
      session.status === SESSION_STATUS.ACTIVE &&
      session.startedAt <= now &&
      session.endsAt > now,
  )
}

export function getPcStatus(state, pcId, now = Date.now()) {
  if (getSessionForPc(state, pcId, now)) return PC_STATUS.ACTIVE

  const hasCurrentBooking = state.bookings.some(
    (booking) =>
      booking.pcId === pcId &&
      BLOCKING_STATUSES.has(booking.status) &&
      booking.startAt <= now &&
      booking.endAt > now,
  )

  return hasCurrentBooking ? PC_STATUS.BOOKED : PC_STATUS.FREE
}

export function generateAccessCode(existingCodes = [], randomInt = defaultRandomInt) {
  const used = new Set(existingCodes.filter(Boolean))

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(randomInt(1_000_000)).padStart(6, '0')
    if (!used.has(code)) return code
  }

  throw new Error('Unikal kirish kodi yaratib bo‘lmadi')
}

export function createBookingInState(state, input, options = {}) {
  const now = options.now ?? Date.now()
  const id = options.id ?? makeId('booking')
  const pc = state.pcs.find((item) => item.id === input.pcId && item.active)
  const durationHours = Number(input.durationHours)

  if (!pc) return { ok: false, error: 'Tanlangan PC topilmadi' }
  if (!input.userId) return { ok: false, error: 'Foydalanuvchi topilmadi' }
  if (!Number.isFinite(input.startAt)) return { ok: false, error: 'Boshlanish vaqtini tanlang' }
  if (input.startAt < now) return { ok: false, error: 'Bron vaqti o‘tib ketgan' }
  if (!Number.isInteger(durationHours) || durationHours < 1) {
    return { ok: false, error: 'Davomiylikni tanlang' }
  }
  if (durationHours > state.settings.maxDuration) {
    return { ok: false, error: `Maksimal davomiylik ${state.settings.maxDuration} soat` }
  }

  const endAt = input.startAt + durationHours * HOUR_MS
  const conflict = findBookingConflict(state.bookings, {
    userId: input.userId,
    pcId: input.pcId,
    startAt: input.startAt,
    endAt,
  })

  if (conflict) {
    const message =
      conflict.pcId === input.pcId
        ? 'Bu PC tanlangan vaqtda band'
        : 'Sizning boshqa broningiz bilan vaqt to‘qnashmoqda'
    return { ok: false, error: message }
  }

  const booking = {
    id,
    userId: input.userId,
    pcId: input.pcId,
    startAt: input.startAt,
    endAt,
    durationHours,
    pricePerHour: pc.pricePerHour,
    totalPrice: pc.pricePerHour * durationHours,
    status: BOOKING_STATUS.PENDING,
    accessCode: null,
    arrivalChoice: null,
    arrivalConfirmedAt: null,
    arrivalDueAt: null,
    reminderSentAt: null,
    approvedAt: null,
    accessCodeUsedAt: null,
    createdAt: now,
  }

  return {
    ok: true,
    booking,
    state: {
      ...state,
      bookings: [booking, ...state.bookings],
    },
  }
}

export function approveBookingInState(state, bookingId, options = {}) {
  const now = options.now ?? Date.now()
  const booking = state.bookings.find((item) => item.id === bookingId)

  if (!booking) return { ok: false, error: 'Bron topilmadi' }
  if (booking.status !== BOOKING_STATUS.PENDING) {
    return { ok: false, error: 'Faqat kutilayotgan bron tasdiqlanadi' }
  }
  if (booking.endAt <= now) return { ok: false, error: 'Bron vaqti o‘tib ketgan' }

  const conflict = state.bookings.find(
    (item) =>
      item.id !== booking.id &&
      item.pcId === booking.pcId &&
      BLOCKING_STATUSES.has(item.status) &&
      intervalsOverlap(booking.startAt, booking.endAt, item.startAt, item.endAt),
  )

  if (conflict) return { ok: false, error: 'Bu vaqt oralig‘ida PC boshqa bron bilan band' }

  const activeCodes = [
    ...(state.usedAccessCodes || []),
    ...state.bookings.filter((item) => item.accessCode).map((item) => item.accessCode),
  ]

  const approved = {
    ...booking,
    status: BOOKING_STATUS.APPROVED,
    accessCode: generateAccessCode(activeCodes, options.randomInt),
    approvedAt: now,
  }

  return {
    ok: true,
    booking: approved,
    state: {
      ...state,
      bookings: state.bookings.map((item) => (item.id === bookingId ? approved : item)),
    },
  }
}

export function rejectBookingInState(state, bookingId) {
  const booking = state.bookings.find((item) => item.id === bookingId)
  if (!booking) return { ok: false, error: 'Bron topilmadi' }
  if (booking.status !== BOOKING_STATUS.PENDING) {
    return { ok: false, error: 'Faqat kutilayotgan bron rad etiladi' }
  }

  const updated = { ...booking, status: BOOKING_STATUS.REJECTED, accessCode: null }

  return {
    ok: true,
    booking: updated,
    state: {
      ...state,
      usedAccessCodes: state.usedAccessCodes || [],
      bookings: state.bookings.map((item) => (item.id === bookingId ? updated : item)),
    },
  }
}

export function cancelBookingInState(state, bookingId, userId) {
  const booking = state.bookings.find((item) => item.id === bookingId)
  if (!booking) return { ok: false, error: 'Bron topilmadi' }
  if (booking.userId !== userId) return { ok: false, error: 'Bu bron sizniki emas' }
  if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(booking.status)) {
    return { ok: false, error: 'Bu bron endi bekor qilinmaydi' }
  }

  const updated = { ...booking, status: BOOKING_STATUS.CANCELLED, accessCode: null }
  const usedAccessCodes = [...(state.usedAccessCodes || [])]
  if (booking.accessCode && !usedAccessCodes.includes(booking.accessCode)) {
    usedAccessCodes.push(booking.accessCode)
  }

  return {
    ok: true,
    booking: updated,
    state: {
      ...state,
      usedAccessCodes,
      bookings: state.bookings.map((item) => (item.id === bookingId ? updated : item)),
    },
  }
}

export function confirmArrivalInState(state, bookingId, minutes, now = Date.now()) {
  const booking = state.bookings.find((item) => item.id === bookingId)
  if (!booking) return { ok: false, error: 'Bron topilmadi' }
  if (booking.status !== BOOKING_STATUS.APPROVED) {
    return { ok: false, error: 'Bron tasdiqlangan bo‘lishi kerak' }
  }
  if (now < booking.startAt) return { ok: false, error: 'Reminder vaqti hali boshlanmagan' }
  if (now >= getBookingNoShowAt(booking)) {
    return { ok: false, error: 'Kelish vaqti o‘tib ketgan' }
  }
  if (booking.arrivalChoice) {
    return { ok: true, booking, state }
  }
  if (![5, 10].includes(Number(minutes))) {
    return { ok: false, error: 'Faqat 5 yoki 10 daqiqani tanlang' }
  }

  const choice = Number(minutes)
  const updated = {
    ...booking,
    arrivalChoice: choice,
    arrivalConfirmedAt: now,
    arrivalDueAt: now + choice * MINUTE_MS,
    reminderSentAt: booking.reminderSentAt ?? now,
  }

  return {
    ok: true,
    booking: updated,
    state: {
      ...state,
      bookings: state.bookings.map((item) => (item.id === bookingId ? updated : item)),
    },
  }
}

export function startSessionInState(state, rawCode, options = {}) {
  const now = options.now ?? Date.now()
  const code = String(rawCode || '').replace(/\D/g, '')
  if (!/^\d{6}$/.test(code)) return { ok: false, error: '6 raqamli kod kiriting' }

  const booking = state.bookings.find((item) => item.accessCode === code)
  if (!booking) return { ok: false, error: 'Kod topilmadi' }
  if (booking.status !== BOOKING_STATUS.APPROVED) {
    return { ok: false, error: 'Bu kod bilan sessiya boshlanmaydi' }
  }
  if (now < booking.startAt) return { ok: false, error: 'Bron vaqti hali boshlanmagan' }
  if (now >= booking.endAt) return { ok: false, error: 'Bron vaqti tugagan' }
  if (now >= getBookingNoShowAt(booking)) {
    return { ok: false, error: 'Kelish vaqti o‘tib ketgan' }
  }
  if (booking.accessCodeUsedAt) return { ok: false, error: 'Kod allaqachon ishlatilgan' }
  if (booking.arrivalDueAt && now < booking.arrivalDueAt) {
    return { ok: false, error: 'Tanlangan kelish vaqtidan oldin sessiyani boshlab bo‘lmaydi' }
  }

  const activeSession = state.sessions.find(
    (session) =>
      session.bookingId === booking.id && session.status === SESSION_STATUS.ACTIVE,
  )
  if (activeSession) return { ok: false, error: 'Sessiya allaqachon boshlangan' }

  const session = {
    id: options.id ?? makeId('session'),
    bookingId: booking.id,
    pcId: booking.pcId,
    userId: booking.userId,
    startedAt: now,
    endsAt: booking.endAt,
    endedAt: null,
    status: SESSION_STATUS.ACTIVE,
  }

  const updatedBooking = {
    ...booking,
    status: BOOKING_STATUS.ACTIVE,
    accessCode: null,
    accessCodeUsedAt: now,
  }

  const usedAccessCodes = [...(state.usedAccessCodes || [])]
  if (code && !usedAccessCodes.includes(code)) usedAccessCodes.push(code)

  return {
    ok: true,
    booking: updatedBooking,
    session,
    state: {
      ...state,
      usedAccessCodes,
      bookings: state.bookings.map((item) => (item.id === booking.id ? updatedBooking : item)),
      sessions: [session, ...state.sessions],
    },
  }
}

export function expireClubState(state, now = Date.now()) {
  const completedBookingIds = new Set()
  const usedAccessCodes = new Set(state.usedAccessCodes || [])
  let changed = false

  const sessions = state.sessions.map((session) => {
    if (session.status !== SESSION_STATUS.ACTIVE || session.endsAt > now) return session
    changed = true
    completedBookingIds.add(session.bookingId)
    return {
      ...session,
      endedAt: session.endsAt,
      status: SESSION_STATUS.COMPLETED,
    }
  })

  const bookings = state.bookings.map((booking) => {
    if (completedBookingIds.has(booking.id)) {
      changed = true
      if (booking.accessCode) usedAccessCodes.add(booking.accessCode)
      return {
        ...booking,
        status: BOOKING_STATUS.COMPLETED,
        accessCode: null,
      }
    }

    if (booking.status === BOOKING_STATUS.PENDING && now >= booking.endAt) {
      changed = true
      return {
        ...booking,
        status: BOOKING_STATUS.EXPIRED,
        accessCode: null,
      }
    }

    if (booking.status !== BOOKING_STATUS.APPROVED) return booking

    if (now < getBookingNoShowAt(booking) && now < booking.endAt) return booking

    changed = true
    if (booking.accessCode) usedAccessCodes.add(booking.accessCode)
    return {
      ...booking,
      status: BOOKING_STATUS.NO_SHOW,
      accessCode: null,
    }
  })

  if (!changed) return state
  return { ...state, usedAccessCodes: [...usedAccessCodes], bookings, sessions }
}

export function updateSettingsInState(state, input) {
  const clubName = String(input.clubName || '').trim()
  const pricePerHour = Number(input.pricePerHour)
  const maxDuration = Number(input.maxDuration)
  const pcCount = Number(input.pcCount)

  if (clubName.length < 2 || clubName.length > 40) {
    return { ok: false, error: 'Club nomi 2–40 belgidan iborat bo‘lsin' }
  }
  if (!Number.isInteger(pricePerHour) || pricePerHour < 1000 || pricePerHour > 1_000_000) {
    return { ok: false, error: 'Soatlik narx 1 000–1 000 000 so‘m bo‘lsin' }
  }
  if (!Number.isInteger(maxDuration) || maxDuration < 1 || maxDuration > 12) {
    return { ok: false, error: 'Maksimal davomiylik 1–12 soat bo‘lsin' }
  }
  if (!Number.isInteger(pcCount) || pcCount < 1 || pcCount > 20) {
    return { ok: false, error: 'PC soni 1–20 oralig‘ida bo‘lsin' }
  }

  const protectedPcIds = new Set(
    state.bookings
      .filter((booking) => BLOCKING_STATUSES.has(booking.status))
      .map((booking) => booking.pcId),
  )

  const removingActivePc = state.pcs.some(
    (pc) => pc.active && pc.number > pcCount && protectedPcIds.has(pc.id),
  )

  if (removingActivePc) {
    return { ok: false, error: 'Broni bor PC’ni olib tashlab bo‘lmaydi' }
  }

  const pcs = Array.from({ length: pcCount }, (_, index) => {
    const number = index + 1
    const existing = state.pcs.find((pc) => pc.number === number)
    if (existing) {
      return {
        ...existing,
        active: true,
        pricePerHour,
      }
    }
    return {
      id: `pc-${number}`,
      number,
      active: true,
      pricePerHour,
    }
  })

  const historicalIds = new Set(pcs.map((pc) => pc.id))
  const archivedPcs = state.pcs
    .filter((pc) => !historicalIds.has(pc.id))
    .map((pc) => ({ ...pc, active: false }))

  return {
    ok: true,
    state: {
      ...state,
      settings: {
        ...state.settings,
        clubName,
        pricePerHour,
        maxDuration,
        pcCount,
        timezone: CLUB_TIMEZONE,
      },
      pcs: [...pcs, ...archivedPcs],
    },
  }
}
