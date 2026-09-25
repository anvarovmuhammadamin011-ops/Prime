import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useClub } from '../../club/ClubContext.jsx'
import { BOOKING_STATUS } from '../../club/bookingRules.js'
import {
  BOOKING_STATUS_CLASSES,
  BOOKING_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatHms,
  formatMoney,
  formatTime,
} from '../../data.js'
import { IconBell, IconCalendar, IconCheck, IconClock, IconCopy, IconDesktop, IconX } from '../../components/Icons.jsx'

function BookingCard({ booking, pcNumber, session, now, onCancel, onArrival }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const copyTimer = useRef(null)
  const reminderOpen =
    booking.status === BOOKING_STATUS.APPROVED &&
    !booking.arrivalChoice &&
    now >= booking.startAt &&
    now < booking.startAt + 10 * 60 * 1000

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  async function copyCode() {
    if (!booking.accessCode) return
    setCopyError('')
    try {
      await navigator.clipboard.writeText(booking.accessCode)
      setCopied(true)
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
      setCopyError('Kodni nusxalashda xatolik yuz berdi')
    }
  }

  return (
    <article className={`booking-card ${BOOKING_STATUS_CLASSES[booking.status]}`}>
      <div className="booking-card-head">
        <div className="booking-pc">
          <span className="booking-pc-icon">
            <IconDesktop size={20} />
          </span>
          <div>
            <span className="eyebrow">Gaming PC</span>
            <h3>PC-{String(pcNumber).padStart(2, '0')}</h3>
          </div>
        </div>
        <span className={`badge ${BOOKING_STATUS_CLASSES[booking.status]}`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div className="booking-meta-grid">
        <div>
          <span>Sana</span>
          <strong>{formatDate(booking.startAt)}</strong>
        </div>
        <div>
          <span>Vaqt</span>
          <strong>
            {formatTime(booking.startAt)}–{formatTime(booking.endAt)}
          </strong>
        </div>
        <div>
          <span>Davomiylik</span>
          <strong>{booking.durationHours} soat</strong>
        </div>
        <div>
          <span>Naqd narx</span>
          <strong>{formatMoney(booking.totalPrice)} so‘m</strong>
        </div>
      </div>

      {booking.status === BOOKING_STATUS.ACTIVE && session ? (
        <div className="booking-live-timer">
          <span className="live-label">
            <span className="status-dot active" /> Ishlayapti
          </span>
          <strong>{formatHms(session.endsAt - now)}</strong>
          <span>qoldi</span>
        </div>
      ) : null}

      {booking.status === BOOKING_STATUS.APPROVED && booking.accessCode ? (
        <div className="code-panel">
          <div>
            <span>Kirish kodingiz</span>
            <strong>{booking.accessCode}</strong>
          </div>
          <button className="button secondary compact" type="button" onClick={copyCode}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            {copied ? 'Kopierlandi' : 'Kod'}
          </button>
        </div>
      ) : null}
      {copyError ? <div className="form-alert error">{copyError}</div> : null}

      {reminderOpen ? (
        <div className="telegram-reminder">
          <div className="reminder-icon">
            <IconBell size={20} />
          </div>
          <div>
            <strong>Telegram bot: qachon kelasiz?</strong>
            <span>Bron boshlandi. Kelish vaqtini tanlang.</span>
            <div className="reminder-actions">
              <button type="button" onClick={() => onArrival(booking.id, 5)}>
                5 daqiqa
              </button>
              <button type="button" onClick={() => onArrival(booking.id, 10)}>
                10 daqiqa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {booking.status === BOOKING_STATUS.APPROVED && booking.arrivalChoice ? (
        <div className="arrival-confirmed">
          <IconCheck size={17} />
          <span>Kelish vaqti: {booking.arrivalChoice} daqiqa</span>
        </div>
      ) : null}

      {booking.status === BOOKING_STATUS.PENDING ? (
        <div className="pending-note">
          <IconClock size={17} />
          <span>Bron so‘rovingiz yuborildi. Admin tasdiqlashini kuting.</span>
        </div>
      ) : null}

      {[BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(booking.status) ? (
        <button className="text-button danger" type="button" onClick={() => onCancel(booking.id)}>
          <IconX size={15} /> Bronni bekor qilish
        </button>
      ) : null}
    </article>
  )
}

export default function Bookings() {
  const { user } = useAuth()
  const {
    settings,
    now,
    getBookingsForUser,
    getSessionForBookingId,
    cancelBooking,
    confirmArrival,
  } = useClub()
  const userBookings = getBookingsForUser(user.id)
  const [message, setMessage] = useState('')

  async function handleCancel(bookingId) {
    const result = await cancelBooking(bookingId)
    setMessage(result.ok ? 'Bron bekor qilindi' : result.error)
  }

  async function handleArrival(bookingId, minutes) {
    const result = await confirmArrival(bookingId, minutes)
    setMessage(result.ok ? `${minutes} daqiqali kelish vaqti saqlandi` : result.error)
  }

  const currentUserBookings = userBookings
  const active = currentUserBookings.filter((booking) => booking.status === BOOKING_STATUS.ACTIVE)
  const upcoming = currentUserBookings
    .filter(
      (booking) =>
        [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(booking.status) &&
        booking.endAt > now,
    )
    .sort((a, b) => a.startAt - b.startAt)
  const history = currentUserBookings.filter(
    (booking) =>
      !active.includes(booking) &&
      !upcoming.includes(booking) &&
      booking.status !== BOOKING_STATUS.PENDING &&
      booking.status !== BOOKING_STATUS.APPROVED,
  )

  function pcNumber(booking) {
    return Number(booking.pcNumber) || 0
  }

  return (
    <div className="page bookings-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Mening bronlarim</span>
          <h1>Sessiyangizni nazorat qiling</h1>
          <p className="muted">
            Kod faqat tasdiqlangan bron uchun va bir marta ishlaydi.
          </p>
        </div>
        <div className="page-heading-mark">
          <IconCalendar size={24} />
          <span>{upcoming.length + active.length} faol yozuv</span>
        </div>
      </section>

      {message ? (
        <div className="inline-message" onClick={() => setMessage('')}>
          {message}
        </div>
      ) : null}

      {active.length ? (
        <section className="content-section">
          <div className="section-heading compact">
            <h2>Faol sessiya</h2>
          </div>
          <div className="booking-list">
            {active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                pcNumber={pcNumber(booking)}
                session={getSessionForBookingId(booking.id)}
                now={now}
                onCancel={handleCancel}
                onArrival={handleArrival}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="content-section">
        <div className="section-heading compact">
          <h2>Kelgusi bronlar</h2>
          <span className="muted">{upcoming.length} ta</span>
        </div>
        {upcoming.length ? (
          <div className="booking-list">
            {upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                pcNumber={pcNumber(booking)}
                session={getSessionForBookingId(booking.id)}
                now={now}
                onCancel={handleCancel}
                onArrival={handleArrival}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state card">
            <IconCalendar size={28} />
            <h3>Kelgusi bron yo‘q</h3>
            <p>Home sahifasidan birinchi PC’ingizni band qiling.</p>
          </div>
        )}
      </section>

      <section className="content-section">
        <div className="section-heading compact">
          <h2>Tarix</h2>
          <span className="muted">{history.length} ta</span>
        </div>
        {history.length ? (
          <div className="history-list">
            {history.map((booking) => (
              <div className="history-row" key={booking.id}>
                <div>
                  <strong>PC-{String(pcNumber(booking)).padStart(2, '0')}</strong>
                  <span>{formatDateTime(booking.startAt)}</span>
                </div>
                <span className={`badge ${BOOKING_STATUS_CLASSES[booking.status]}`}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted empty-inline">Tarix bo‘sh.</p>
        )}
      </section>

      <div className="cash-note">
        <IconClock size={20} />
        <div>
          <strong>{formatMoney(settings.pricePerHour)} so‘m / soat</strong>
          <span>To‘lov Game Club’da naqd amalga oshiriladi.</span>
        </div>
      </div>
    </div>
  )
}
