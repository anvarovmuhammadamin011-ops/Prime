// Demo (mock) API — backend mavjud bo'lmaganda frontend to'liq ishlashi uchun.
// Real server javob formatlarini aynan takrorlaydi (server/routes va service'larga mos).

const HOUR_MS = 60 * 60 * 1000
const STORAGE_KEY = 'prime-v1-demo-state'
const SESSION_TTL_MS = 60 * 60 * 1000

const BOOKING_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  NO_SHOW: 'no_show',
})

const DEMO_PASSWORD = 'demo12345'
const DEMO_ACCOUNTS = [
  { name: 'Abdulloh Karimov', phone: '+998901234567', role: 'user' },
  { name: 'Prime Admin', phone: '+998901111111', role: 'admin' },
  { name: 'Prime Superadmin', phone: '+998900000000', role: 'superadmin' },
]

function zoneForNumber(number) {
  if (number >= 19) return 'ps5'
  if (number >= 15) return 'vip'
  if (number >= 8) return 'gaming'
  return 'standard'
}

const MINUTE_MS = 60 * 1000

function createPc(number) {
  return {
    id: `pc-${number}`,
    number,
    name: number >= 19 ? `PS5 ${number - 18}` : `PC ${number}`,
    zone: zoneForNumber(number),
    active: true,
    pricePerHour: 18000,
    status: 'free',
    session: null,
    booking: null,
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    telegramId: user.telegramId || null,
    createdAt: user.createdAt,
  }
}

function bookingView(state, booking) {
  const session = booking.sessionId ? state.sessions.find((s) => s.id === booking.sessionId) || null : null
  return {
    ...booking,
    session: session ? sessionView(session) : null,
  }
}

function sessionView(session) {
  return { ...session }
}

function pcView(state, pc) {
  const now = Date.now()
  const session = state.sessions.find((s) => s.pcId === pc.id && s.status === 'active' && s.endsAt > now) || null
  const booking = state.bookings.find(
    (b) =>
      b.pcId === pc.id &&
      [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ACTIVE].includes(b.status) &&
      b.startAt <= now &&
      b.endAt > now,
  ) || null
  return {
    ...pc,
    status: session ? 'active' : booking ? 'booked' : 'free',
    session: session ? sessionView(session) : null,
    booking: booking ? bookingView(state, booking) : null,
  }
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 9 && digits.startsWith('9')) return `+998${digits}`
  if (digits.length === 12 && digits.startsWith('998')) return `+${digits}`
  return null
}

function overlaps(a, b) {
  return a.pcId === b.pcId && a.startAt < b.endAt && b.startAt < a.endAt
}

const BLOCKING = new Set([BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ACTIVE])

function createInitialState() {
  const now = Date.now()
  const state = {
    users: DEMO_ACCOUNTS.map((account, index) => ({
      id: `user-demo-${index + 1}`,
      name: account.name,
      phone: account.phone,
      role: account.role,
      telegramId: null,
      createdAt: new Date(now - 30 * 24 * HOUR_MS).toISOString(),
      password: DEMO_PASSWORD,
    })),
    settings: {
      clubName: 'Prime Game Club',
      pricePerHour: 18000,
      maxDuration: 4,
      pcCount: 20,
      timezone: 'Asia/Tashkent',
    },
    pcs: Array.from({ length: 20 }, (_, index) => createPc(index + 1)),
    bookings: [],
    sessions: [],
    tokens: [],
  }
  return state
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    if (!parsed?.users?.length || !parsed?.pcs?.length) return createInitialState()
    return parsed
  } catch {
    return createInitialState()
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    void 0
  }
}

function nextId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function createTokens(state, user) {
  state.tokens = state.tokens.filter((token) => token.expiresAt > Date.now())
  const accessToken = `demo-access-${nextId('t')}`
  const refreshToken = `demo-refresh-${nextId('t')}`
  state.tokens.push({ accessToken, refreshToken, userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS })
  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
    accessTokenTtl: 900,
  }
}

function createBookingRecord(state, user, { pcId, startAt, durationHours }) {
  const pc = state.pcs.find((item) => item.id === pcId)
  if (!pc) throw httpError(404, 'PC_NOT_FOUND', 'Bunday kompyuter topilmadi')
  if (!pc.active) throw httpError(409, 'PC_INACTIVE', 'Kompyuter hozir mavjud emas')
  const hours = Number(durationHours)
  if (!Number.isFinite(hours) || hours < 1 || hours > state.settings.maxDuration) {
    throw httpError(400, 'INVALID_DURATION', `Davomiylik 1–${state.settings.maxDuration} soat bo'lsin`)
  }
  const start = new Date(startAt).getTime()
  if (!Number.isFinite(start)) throw httpError(400, 'INVALID_START', 'Boshlanish vaqti noto‘g‘ri')
  if (start < Date.now() - 5 * MINUTE_MS) {
    throw httpError(400, 'START_IN_PAST', 'Boshlanish vaqti o‘tib ketgan')
  }
  const end = start + hours * HOUR_MS
  const candidate = { pcId: pc.id, startAt: start, endAt: end }
  const conflict = state.bookings.find(
    (booking) => BLOCKING.has(booking.status) && overlaps(candidate, { pcId: booking.pcId, startAt: booking.startAt, endAt: booking.endAt }),
  )
  if (conflict) throw httpError(409, 'BOOKING_CONFLICT', 'Bu vaqt oralig‘ida kompyuter band')
  const pricePerHour = state.settings.pricePerHour
  const booking = {
    id: nextId('booking'),
    pcId: pc.id,
    pcNumber: pc.number,
    userId: user.id,
    status: BOOKING_STATUS.PENDING,
    startAt: start,
    endAt: end,
    durationHours: hours,
    pricePerHour,
    totalPrice: pricePerHour * hours,
    accessCode: null,
    hasAccessCode: false,
    arrivalConfirmedAt: null,
    arrivalDueAt: start - 15 * MINUTE_MS,
    reminderSentAt: null,
    approvedAt: null,
    accessCodeUsedAt: null,
    sessionId: null,
    createdAt: Date.now(),
  }
  state.bookings.unshift(booking)
  return booking
}

function requireAuth(state, authorization) {
  const token = String(authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) throw httpError(401, 'UNAUTHORIZED', 'Avtorizatsiya talab qilinadi')
  const tokenRecord = state.tokens.find((item) => item.accessToken === token)
  if (!tokenRecord) throw httpError(401, 'INVALID_TOKEN', 'Sessiya muddati tugagan, qayta kiring')
  const user = state.users.find((item) => item.id === tokenRecord.userId)
  if (!user) throw httpError(401, 'INVALID_TOKEN', 'Foydalanuvchi topilmadi')
  return user
}

function requireStaff(user) {
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw httpError(403, 'FORBIDDEN', 'Bu amal uchun ruxsat yo‘q')
  }
}

function httpError(status, code, message) {
  const error = new Error(message)
  error.mockStatus = status
  error.mockCode = code
  return error
}

function paginate(items, query) {
  const pageSize = Math.max(1, Number(query.get('pageSize')) || 50)
  const page = Math.max(1, Number(query.get('page')) || 1)
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize }
}

function expireStale(state) {
  const now = Date.now()
  for (const booking of state.bookings) {
    // Demo rejimda pending buyurtma faqat muddati to'liq o'tgach expire bo'ladi
    if (booking.status === BOOKING_STATUS.PENDING && now >= booking.endAt) {
      booking.status = BOOKING_STATUS.EXPIRED
    }
    if (booking.status === BOOKING_STATUS.ACTIVE && now >= booking.endAt) {
      booking.status = BOOKING_STATUS.COMPLETED
      if (booking.sessionId) {
        const session = state.sessions.find((item) => item.id === booking.sessionId)
        if (session) session.status = 'completed'
      }
    }
  }
  state.sessions = state.sessions.filter((session) => !(session.status === 'active' && session.endsAt <= now))
}

// route: (state, user, params, body, query, authorization) => { status, body }
const routes = [
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    auth: false,
    handle(state, _user, _params, body) {
      const phone = normalizePhone(body?.phone)
      const password = String(body?.password || '')
      let user = phone ? state.users.find((item) => item.phone === phone) : null
      if (!user && phone && password.length >= 8) {
        user = {
          id: nextId('user'),
          name: phone.endsWith('000000') ? 'Demo Superadmin' : 'Demo Foydalanuvchi',
          phone,
          role: 'user',
          telegramId: null,
          createdAt: new Date().toISOString(),
          password,
        }
        state.users.push(user)
      }
      if (!user || user.password !== password) {
        throw httpError(401, 'INVALID_CREDENTIALS', 'Telefon yoki parol noto‘g‘ri')
      }
      return createTokens(state, user)
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/register$/,
    auth: false,
    handle(state, _user, _params, body) {
      const name = String(body?.name || '').trim()
      const phone = normalizePhone(body?.phone)
      const password = String(body?.password || '')
      if (name.length < 2 || name.length > 80) throw httpError(400, 'INVALID_NAME', 'Ism 2–80 belgidan iborat bo‘lsin')
      if (!phone) throw httpError(400, 'INVALID_PHONE', 'Telefon +998 formatida bo‘lsin')
      if (password.length < 8 || password.length > 128) throw httpError(400, 'INVALID_PASSWORD', 'Parol 8–128 belgidan iborat bo‘lsin')
      if (state.users.some((item) => item.phone === phone)) {
        throw httpError(409, 'PHONE_EXISTS', 'Bunday telefon allaqachon ro‘yxatdan o‘tgan')
      }
      const user = {
        id: nextId('user'),
        name,
        phone,
        role: 'user',
        telegramId: null,
        createdAt: new Date().toISOString(),
        password,
      }
      state.users.push(user)
      return createTokens(state, user)
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/refresh$/,
    auth: false,
    handle(state, _user, _params, body) {
      const raw = String(body?.refreshToken || '')
      const record = state.tokens.find((item) => item.refreshToken === raw)
      if (!record || record.expiresAt <= Date.now()) {
        throw httpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token yaroqsiz')
      }
      state.tokens = state.tokens.filter((item) => item.refreshToken !== raw)
      const user = state.users.find((item) => item.id === record.userId)
      if (!user) throw httpError(401, 'INVALID_REFRESH_TOKEN', 'Foydalanuvchi topilmadi')
      return createTokens(state, user)
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/logout$/,
    auth: false,
    handle(state, _user, _params, body) {
      state.tokens = state.tokens.filter((item) => item.refreshToken !== body?.refreshToken)
      return { status: 204, body: null }
    },
  },
  {
    method: 'GET',
    pattern: /^\/auth\/me$/,
    handle(state, user) {
      return { user: toPublicUser(user) }
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/profile$/,
    handle(state, user, _params, body) {
      const name = String(body?.name || '').trim()
      if (name.length >= 2 && name.length <= 80) user.name = name
      if (body?.password && String(body.password).length >= 8) user.password = String(body.password)
      return { user: toPublicUser(user) }
    },
  },
  {
    method: 'GET',
    pattern: /^\/settings$/,
    handle(state) {
      return { settings: { ...state.settings } }
    },
  },
  {
    method: 'GET',
    pattern: /^\/pcs$/,
    handle(state) {
      expireStale(state)
      return { pcs: state.pcs.map((pc) => pcView(state, pc)) }
    },
  },
  {
    method: 'GET',
    pattern: /^\/bookings$/,
    handle(state, user, _params, _body, query) {
      expireStale(state)
      const items = state.bookings
        .filter((booking) => booking.userId === user.id)
        .sort((a, b) => b.startAt - a.startAt)
        .map((booking) => bookingView(state, booking))
      return paginate(items, query)
    },
  },
  {
    method: 'POST',
    pattern: /^\/bookings$/,
    handle(state, user, _params, body) {
      expireStale(state)
      const booking = createBookingRecord(state, user, {
        pcId: body?.pcId,
        startAt: body?.startAt,
        durationHours: body?.durationHours,
      })
      return { booking: bookingView(state, booking) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/bookings\/([^/]+)\/cancel$/,
    handle(state, user, params) {
      const booking = state.bookings.find((item) => item.id === params[0])
      if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Buyurtma topilmadi')
      if (booking.userId !== user.id) throw httpError(403, 'FORBIDDEN', 'Bu buyurtma sizga tegishli emas')
      if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(booking.status)) {
        throw httpError(409, 'INVALID_STATUS', 'Bu buyurtmani bekor qilish mumkin emas')
      }
      booking.status = BOOKING_STATUS.CANCELLED
      return { booking: bookingView(state, booking) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/bookings\/([^/]+)\/arrival$/,
    handle(state, user, params, body) {
      const booking = state.bookings.find((item) => item.id === params[0])
      if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Buyurtma topilmadi')
      if (booking.userId !== user.id) throw httpError(403, 'FORBIDDEN', 'Bu buyurtma sizga tegishli emas')
      if (booking.status !== BOOKING_STATUS.APPROVED) {
        throw httpError(409, 'INVALID_STATUS', 'Tasdiqlangan buyurtmagina kelishni tasdiqlash mumkin')
      }
      const minutes = Math.max(0, Math.min(60, Number(body?.minutes) || 0))
      booking.arrivalConfirmedAt = Date.now()
      booking.arrivalDueAt = Date.now() + minutes * MINUTE_MS
      return { booking: bookingView(state, booking) }
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/bookings$/,
    handle(state, user, _params, _body, query) {
      requireStaff(user)
      expireStale(state)
      const items = [...state.bookings].sort((a, b) => b.startAt - a.startAt).map((booking) => bookingView(state, booking))
      return paginate(items, query)
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/bookings\/([^/]+)\/approve$/,
    handle(state, user, params) {
      requireStaff(user)
      const booking = state.bookings.find((item) => item.id === params[0])
      if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Buyurtma topilmadi')
      if (booking.status !== BOOKING_STATUS.PENDING) {
        throw httpError(409, 'INVALID_STATUS', 'Faqat kutilayotgan buyurtma tasdiqlanadi')
      }
      booking.status = BOOKING_STATUS.APPROVED
      booking.approvedAt = Date.now()
      const accessCode = String(Math.floor(100000 + Math.random() * 900000))
      booking.accessCode = accessCode
      booking.hasAccessCode = true
      return { booking: bookingView(state, booking), accessCode }
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/bookings\/([^/]+)\/reject$/,
    handle(state, user, params) {
      requireStaff(user)
      const booking = state.bookings.find((item) => item.id === params[0])
      if (!booking) throw httpError(404, 'BOOKING_NOT_FOUND', 'Buyurtma topilmadi')
      if (booking.status !== BOOKING_STATUS.PENDING) {
        throw httpError(409, 'INVALID_STATUS', 'Faqat kutilayotgan buyurtma rad etiladi')
      }
      booking.status = BOOKING_STATUS.REJECTED
      return { booking: bookingView(state, booking) }
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/sessions$/,
    handle(state, user) {
      requireStaff(user)
      expireStale(state)
      const sessions = [...state.sessions].sort((a, b) => b.startedAt - a.startedAt).map(sessionView)
      return { sessions }
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/sessions\/start$/,
    handle(state, user, _params, body) {
      requireStaff(user)
      const code = String(body?.code || '').trim()
      const booking = state.bookings.find((item) => item.accessCode === code && item.status === BOOKING_STATUS.APPROVED)
      if (!booking) throw httpError(404, 'ACCESS_CODE_NOT_FOUND', 'Bunday kod bilan buyurtma topilmadi')
      const now = Date.now()
      if (now < booking.startAt - 10 * MINUTE_MS) {
        throw httpError(409, 'TOO_EARLY', 'Sessiyani kamida 10 daqiqa oldin boshlash mumkin')
      }
      if (now >= booking.endAt) throw httpError(409, 'TOO_LATE', 'Buyurtma muddati tugagan')
      const pc = state.pcs.find((item) => item.id === booking.pcId)
      booking.status = BOOKING_STATUS.ACTIVE
      booking.accessCodeUsedAt = now
      const session = {
        id: nextId('session'),
        bookingId: booking.id,
        pcId: booking.pcId,
        pcNumber: booking.pcNumber ?? pc?.number ?? null,
        userId: booking.userId,
        status: 'active',
        startedAt: now,
        endsAt: booking.endAt,
      }
      state.sessions.unshift(session)
      booking.sessionId = session.id
      return { booking: bookingView(state, booking), session: sessionView(session) }
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/settings$/,
    handle(state, user, _params, body) {
      requireStaff(user)
      const settings = { ...state.settings }
      if (body?.clubName !== undefined) {
        const name = String(body.clubName).trim()
        if (name.length >= 2 && name.length <= 80) settings.clubName = name
      }
      for (const key of ['pricePerHour', 'maxDuration', 'pcCount']) {
        if (body?.[key] !== undefined) {
          const value = Number(body[key])
          if (Number.isFinite(value) && value > 0) settings[key] = Math.floor(value)
        }
      }
      state.settings = settings
      const currentCount = state.pcs.length
      if (settings.pcCount > currentCount) {
        for (let number = currentCount + 1; number <= settings.pcCount; number += 1) {
          state.pcs.push(createPc(number))
        }
      } else if (settings.pcCount < currentCount) {
        state.pcs = state.pcs.slice(0, settings.pcCount)
      }
      return { settings: { ...state.settings } }
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/pcs$/,
    handle(state, user) {
      requireStaff(user)
      expireStale(state)
      return { pcs: state.pcs.map((pc) => pcView(state, pc)) }
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/pcs\/([^/]+)$/,
    handle(state, user, params, body) {
      requireStaff(user)
      const pc = state.pcs.find((item) => item.id === params[0])
      if (!pc) throw httpError(404, 'PC_NOT_FOUND', 'PC topilmadi')
      const active = Boolean(body?.active)
      if (!active) {
        const busy = state.sessions.some((session) => session.pcId === pc.id && session.status === 'active' && session.endsAt > Date.now())
          || state.bookings.some((booking) => booking.pcId === pc.id && BLOCKING.has(booking.status) && booking.endAt > Date.now())
        if (busy) throw httpError(409, 'PC_IN_USE', 'Faol sessiyasi yoki broni bor PC‘ni o‘chirib bo‘lmaydi')
      }
      pc.active = active
      return { pc: pcView(state, pc) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/pcs\/([^/]+)\/start-now$/,
    handle(state, user, params, body) {
      requireStaff(user)
      const pc = state.pcs.find((item) => item.id === params[0])
      if (!pc) throw httpError(404, 'PC_NOT_FOUND', 'PC topilmadi')
      if (!pc.active) throw httpError(409, 'PC_INACTIVE', 'PC o‘chirilgan — avval yoqing')
      const now = Date.now()
      let durationMs
      if (body?.minutes !== undefined) {
        const mins = Number(body.minutes)
        if (!Number.isInteger(mins) || mins < 15 || mins > 720) {
          throw httpError(400, 'INVALID_DURATION', 'Daqiqa 15–720 oralig‘ida bo‘lsin')
        }
        durationMs = mins * MINUTE_MS
      } else {
        const hrs = Number(body?.hours ?? 1)
        if (!Number.isInteger(hrs) || hrs < 1 || hrs > 12) {
          throw httpError(400, 'INVALID_DURATION', 'Soat 1–12 oralig‘ida bo‘lsin')
        }
        durationMs = hrs * 60 * MINUTE_MS
      }
      const busy = state.sessions.some((session) => session.pcId === pc.id && session.status === 'active' && session.endsAt > now)
        || state.bookings.some((booking) => booking.pcId === pc.id && BLOCKING.has(booking.status) && booking.startAt < now + durationMs && booking.endAt > now)
      if (busy) throw httpError(409, 'PC_IN_USE', 'Bu PC hozir band — boshqa PC tanlang')
      const booking = {
        id: nextId('booking'),
        pcId: pc.id,
        pcNumber: pc.number,
        userId: user.id,
        status: BOOKING_STATUS.ACTIVE,
        startAt: now,
        endAt: now + durationMs,
        durationHours: durationMs / HOUR_MS,
        pricePerHour: state.settings.pricePerHour,
        totalPrice: Math.round((durationMs / HOUR_MS) * state.settings.pricePerHour),
        accessCode: null,
        hasAccessCode: false,
        arrivalConfirmedAt: now,
        arrivalDueAt: null,
        reminderSentAt: null,
        approvedAt: now,
        accessCodeUsedAt: null,
        sessionId: null,
        createdAt: now,
      }
      state.bookings.unshift(booking)
      const session = {
        id: nextId('session'),
        bookingId: booking.id,
        pcId: pc.id,
        pcNumber: pc.number,
        userId: user.id,
        status: 'active',
        startedAt: now,
        endsAt: now + durationMs,
      }
      state.sessions.unshift(session)
      booking.sessionId = session.id
      return { pc: pcView(state, pc), bookingId: booking.id, session: sessionView(session) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/admin\/pcs\/([^/]+)\/stop$/,
    handle(state, user, params) {
      requireStaff(user)
      const pc = state.pcs.find((item) => item.id === params[0])
      if (!pc) throw httpError(404, 'PC_NOT_FOUND', 'PC topilmadi')
      const session = state.sessions.find((item) => item.pcId === pc.id && item.status === 'active')
      if (!session) throw httpError(409, 'SESSION_NOT_ACTIVE', 'Bu PC da faol sessiya yo‘q')
      session.status = 'completed'
      const booking = state.bookings.find((item) => item.id === session.bookingId)
      if (booking && booking.status === BOOKING_STATUS.ACTIVE) booking.status = BOOKING_STATUS.COMPLETED
      return { pc: pcView(state, pc), session: sessionView(session) }
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/users$/,
    handle(state, user, _params, _body, query) {
      requireStaff(user)
      const items = state.users.map(toPublicUser)
      return paginate(items, query)
    },
  },
]

function matchRoute(method, path) {
  for (const route of routes) {
    if (route.method !== method) continue
    const match = path.match(route.pattern)
    if (match) return { route, params: match.slice(1) }
  }
  return null
}

export function isDemoMode() {
  return typeof window !== 'undefined' && window.__PRIME_DEMO_MODE__ === true
}

export async function mockRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const [rawPath, rawQuery = ''] = path.split('?')
  const query = new URLSearchParams(rawQuery)
  const state = loadState()
  try {
    const found = matchRoute(method, rawPath)
    if (!found) throw httpError(404, 'NOT_FOUND', 'Endpoint demo rejimda mavjud emas')
    const { route, params } = found
    let body = options.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        body = null
      }
    }
    let user = null
    if (route.auth !== false) {
      user = requireAuth(state, options.headers?.Authorization)
    }
    const result = route.handle(state, user, params, body, query, options.headers?.Authorization)
    saveState(state)
    if (result?.status === 204) return null
    return result?.body ?? result
  } catch (error) {
    saveState(state)
    if (error?.mockStatus) {
      const responseError = new Error(error.message)
      responseError.mockResponse = {
        status: error.mockStatus,
        payload: { error: { code: error.mockCode, message: error.message } },
      }
      throw responseError
    }
    throw error
  }
}
