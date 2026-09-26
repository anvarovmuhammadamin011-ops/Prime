import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest, getApiErrorMessage } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { BOOKING_STATUS, PC_STATUS, SESSION_STATUS, findBookingConflict, getPcStatus, getSessionForBooking } from './bookingRules.js'
import { isToday } from '../data.js'

const DEFAULT_SETTINGS = {
  clubName: 'Prime Game Club',
  pricePerHour: 18000,
  maxDuration: 4,
  pcCount: 20,
  timezone: 'Asia/Tashkent',
}

const ClubContext = createContext(null)

function emptyState() {
  return {
    version: 2,
    settings: { ...DEFAULT_SETTINGS },
    pcs: [],
    bookings: [],
    sessions: [],
  }
}

function toTimestamp(value) {
  if (typeof value === 'number') return value
  const parsed = Date.parse(value || '')
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function normalizeBooking(booking, accessCode = null) {
  return {
    ...booking,
    startAt: toTimestamp(booking.startAt),
    endAt: toTimestamp(booking.endAt),
    arrivalConfirmedAt: booking.arrivalConfirmedAt ? toTimestamp(booking.arrivalConfirmedAt) : null,
    arrivalDueAt: booking.arrivalDueAt ? toTimestamp(booking.arrivalDueAt) : null,
    reminderSentAt: booking.reminderSentAt ? toTimestamp(booking.reminderSentAt) : null,
    approvedAt: booking.approvedAt ? toTimestamp(booking.approvedAt) : null,
    accessCodeUsedAt: booking.accessCodeUsedAt ? toTimestamp(booking.accessCodeUsedAt) : null,
    session: booking.session ? normalizeSession(booking.session) : null,
    createdAt: toTimestamp(booking.createdAt),
    durationHours: Number(booking.durationHours),
    pricePerHour: Number(booking.pricePerHour),
    totalPrice: Number(booking.totalPrice),
    accessCode: accessCode || booking.accessCode || null,
    hasAccessCode: Boolean(accessCode || booking.accessCode || booking.hasAccessCode),
  }
}

function normalizePc(pc) {
  return {
    ...pc,
    number: Number(pc.number),
    active: pc.active !== false,
    pricePerHour: Number(pc.pricePerHour),
     session: pc.session
       ? {
           ...pc.session,
           startedAt: toTimestamp(pc.session.startedAt),
           endsAt: toTimestamp(pc.session.endsAt),
         }
       : null,
    booking: pc.booking
      ? {
          ...pc.booking,
          startAt: toTimestamp(pc.booking.startAt),
          endAt: toTimestamp(pc.booking.endAt),
        }
      : null,
  }
}

function normalizeSession(session) {
  return {
    ...session,
    startedAt: toTimestamp(session.startedAt),
    endsAt: toTimestamp(session.endsAt),
  }
}

function upsert(items, item) {
  const index = items.findIndex((current) => current.id === item.id)
  if (index === -1) return [item, ...items]
  const next = [...items]
  next[index] = { ...next[index], ...item }
  return next
}

function replaceBooking(items, booking) {
  return upsert(items, booking)
}

export function ClubProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(emptyState)
  const [now, setNow] = useState(() => Date.now())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState('')
  const [hasData, setHasData] = useState(false)
  const requestSequence = useRef(0)
  const userId = user?.id || null
  const userRole = user?.role || null

  const refreshData = useCallback(async ({ silent = false } = {}) => {
    const sequence = requestSequence.current + 1
    requestSequence.current = sequence
    if (!silent) {
      setSyncError('')
      setLoading(true)
    }
    try {
      const isStaff = Boolean(userId && userRole !== 'user')
      const [settingsData, pcsData, bookingsData, sessionsData] = await Promise.all([
        apiRequest('/settings'),
        apiRequest('/pcs'),
        userId
          ? apiRequest(isStaff ? '/admin/bookings?pageSize=100' : '/bookings?pageSize=100')
          : Promise.resolve(null),
        isStaff ? apiRequest('/admin/sessions') : Promise.resolve(null),
      ])
      if (requestSequence.current !== sequence) return
       setState({
         version: 2,
         settings: settingsData.settings || DEFAULT_SETTINGS,
         pcs: (pcsData.pcs || []).map(normalizePc),
         bookings: (bookingsData?.items || []).map((booking) => normalizeBooking(booking)),
         sessions: (sessionsData?.sessions || []).map(normalizeSession),
       })
       setHasData(true)
       setSyncError('')
    } catch (requestError) {
      if (requestSequence.current === sequence) setSyncError(getApiErrorMessage(requestError))
    } finally {
      if (requestSequence.current === sequence) setLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    requestSequence.current += 1
    queueMicrotask(() => {
      setState(emptyState())
      setHasData(false)
      setSyncError('')
      setLoading(true)
    })
  }, [userId])

  useEffect(() => {
    queueMicrotask(() => {
      void refreshData()
    })
  }, [refreshData])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!userId) return undefined
    const timer = window.setInterval(() => {
      void refreshData({ silent: true })
    }, 15000)
    const handleFocus = () => {
      void refreshData({ silent: true })
    }
    window.addEventListener('focus', handleFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshData, userId])

  async function createBooking(input) {
    try {
      const data = await apiRequest('/bookings', {
        method: 'POST',
        body: {
          pcId: input.pcId,
          startAt: new Date(input.startAt).toISOString(),
          durationHours: input.durationHours,
        },
      })
      const booking = normalizeBooking(data.booking)
      setState((current) => ({
        ...current,
        bookings: replaceBooking(current.bookings, booking),
      }))
      return { ok: true, booking }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function approveBooking(bookingId) {
    try {
      const data = await apiRequest(`/admin/bookings/${bookingId}/approve`, { method: 'POST' })
      const booking = normalizeBooking(data.booking, data.accessCode)
      setState((current) => ({
        ...current,
        bookings: replaceBooking(current.bookings, booking),
      }))
      return { ok: true, booking, accessCode: data.accessCode }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function rejectBooking(bookingId) {
    try {
      const data = await apiRequest(`/admin/bookings/${bookingId}/reject`, { method: 'POST' })
      const booking = normalizeBooking(data.booking)
      setState((current) => ({
        ...current,
        bookings: replaceBooking(current.bookings, booking),
      }))
      return { ok: true, booking }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function cancelBooking(bookingId) {
    try {
      const data = await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'POST' })
      const booking = normalizeBooking(data.booking)
      setState((current) => ({
        ...current,
        bookings: replaceBooking(current.bookings, booking),
      }))
      return { ok: true, booking }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function confirmArrival(bookingId, minutes) {
    try {
      const data = await apiRequest(`/bookings/${bookingId}/arrival`, {
        method: 'POST',
        body: { minutes },
      })
      const booking = normalizeBooking(data.booking)
      setState((current) => ({
        ...current,
        bookings: replaceBooking(current.bookings, booking),
      }))
      return { ok: true, booking }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function startSession(code) {
    try {
      const data = await apiRequest('/admin/sessions/start', {
        method: 'POST',
        body: { code },
      })
      const booking = normalizeBooking(data.booking)
      const session = normalizeSession(data.session)
      setState((current) => ({
        ...current,
        bookings: replaceBooking(current.bookings, booking),
        sessions: upsert(current.sessions, session),
      }))
      return { ok: true, booking, session }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function updateSettings(input) {
    try {
      const data = await apiRequest('/admin/settings', {
        method: 'PATCH',
        body: {
          clubName: input.clubName,
          pricePerHour: Number(input.pricePerHour),
          maxDuration: Number(input.maxDuration),
          pcCount: Number(input.pcCount),
        },
      })
      const pcsData = await apiRequest('/pcs')
      setState((current) => ({
        ...current,
        settings: data.settings,
        pcs: (pcsData.pcs || []).map(normalizePc),
      }))
      return { ok: true, settings: data.settings }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function togglePc(pcId, active) {
    try {
      const data = await apiRequest(`/admin/pcs/${pcId}`, {
        method: 'PATCH',
        body: { active },
      })
      await refreshData({ silent: true })
      return { ok: true, pc: data.pc }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function startPcNow(pcId, { minutes = null, hours = null } = {}) {
    try {
      const data = await apiRequest(`/admin/pcs/${pcId}/start-now`, {
        method: 'POST',
        body: minutes ? { minutes } : { hours: hours || 1 },
      })
      await refreshData({ silent: true })
      return { ok: true, pc: data.pc, session: data.session }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  async function stopPc(pcId) {
    try {
      const data = await apiRequest(`/admin/pcs/${pcId}/stop`, { method: 'POST' })
      await refreshData({ silent: true })
      return { ok: true, pc: data.pc, session: data.session }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }

  const activePcs = useMemo(
    () => state.pcs.filter((pc) => pc.active).sort((a, b) => a.number - b.number),
    [state.pcs],
  )

  const allSessions = useMemo(() => {
    const sessions = new Map(state.sessions.map((session) => [session.id, session]))
    for (const booking of state.bookings) {
      if (booking.session) sessions.set(booking.session.id, booking.session)
    }
    return [...sessions.values()].sort((a, b) => b.startedAt - a.startedAt)
  }, [state.bookings, state.sessions])

  const pcRows = useMemo(
    () =>
      activePcs.map((pc) => {
        const booking = state.bookings.find(
          (item) =>
            item.pcId === pc.id &&
            [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ACTIVE].includes(item.status) &&
            item.startAt <= now &&
            item.endAt > now,
        )
        const storedSession = allSessions.find(
          (item) =>
            item.pcId === pc.id &&
            item.status === SESSION_STATUS.ACTIVE &&
            item.startedAt <= now &&
            item.endsAt > now,
        )
        const session =
          storedSession ||
          (booking?.status === BOOKING_STATUS.ACTIVE
            ? {
                id: `derived-${booking.id}`,
                bookingId: booking.id,
                pcId: booking.pcId,
                userId: booking.userId,
                startedAt: booking.startAt,
                endsAt: booking.endAt,
                status: SESSION_STATUS.ACTIVE,
              }
            : null)
        const status = getPcStatus({ ...state, sessions: session ? [session] : [] }, pc.id, now)
        return { ...pc, status, session, booking }
      }),
    [activePcs, now, state, allSessions],
  )

  const availableCount = pcRows.filter((pc) => pc.status === PC_STATUS.FREE).length
  const bookedCount = pcRows.filter((pc) => pc.status === PC_STATUS.BOOKED).length
  const activeCount = pcRows.filter((pc) => pc.status === PC_STATUS.ACTIVE).length
  const todayBookings = state.bookings.filter((booking) => isToday(booking.startAt, now))
  const todaySessions = allSessions.filter((session) => isToday(session.startedAt, now))
  const todayUsers = new Set(todayBookings.map((booking) => booking.userId)).size

  const getBookingsForUser = useCallback(
    (userId) => state.bookings
      .filter((booking) => booking.userId === userId)
      .sort((a, b) => b.startAt - a.startAt),
    [state.bookings],
  )

  const getBookingById = useCallback(
    (bookingId) => state.bookings.find((booking) => booking.id === bookingId) || null,
    [state.bookings],
  )

  const isPcAvailable = useCallback(
    (pcId, startAt, endAt) => {
      if (
        !userId ||
        !Number.isFinite(startAt) ||
        !Number.isFinite(endAt) ||
        endAt <= startAt ||
        startAt < Date.now()
      ) return false
      return !findBookingConflict(state.bookings, {
        userId,
        pcId,
        startAt,
        endAt,
      })
    },
    [state.bookings, userId],
  )

  const getSessionForBookingId = useCallback(
    (bookingId) => {
      const session = getSessionForBooking({ ...state, sessions: allSessions }, bookingId, now)
      if (session) return session
      const booking = state.bookings.find(
        (item) => item.id === bookingId && item.status === BOOKING_STATUS.ACTIVE,
      )
      return booking
        ? {
            id: `derived-${booking.id}`,
            bookingId: booking.id,
            pcId: booking.pcId,
            userId: booking.userId,
            startedAt: booking.startAt,
            endsAt: booking.endAt,
            status: SESSION_STATUS.ACTIVE,
          }
        : null
    },
    [allSessions, now, state],
  )

  return (
    <ClubContext.Provider
      value={{
        state,
        bookings: state.bookings,
        sessions: allSessions,
        settings: state.settings,
        pcs: activePcs,
        pcRows,
        now,
        loading,
        hasData,
        syncError,
        totalCount: activePcs.length,
        availableCount,
        bookedCount,
        activeCount,
        todayBookings,
        todaySessions,
        todayUsers,
        refreshData,
        createBooking,
        togglePc,
        startPcNow,
        stopPc,
        approveBooking,
        rejectBooking,
        cancelBooking,
        confirmArrival,
        startSession,
        updateSettings,
        getBookingsForUser,
        getBookingById,
        isPcAvailable,
        getSessionForBookingId,
      }}
    >
      {children}
    </ClubContext.Provider>
  )
}

export function useClub() {
  return useContext(ClubContext)
}
