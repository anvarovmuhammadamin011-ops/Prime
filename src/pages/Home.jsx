import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { BOOKING_STATUS } from '../club/bookingRules.js'
import {
  BOOKING_STATUS_CLASSES,
  BOOKING_STATUS_LABELS,
  PC_STATUS_CLASSES,
  PC_STATUS_LABELS,
  formatDateTime,
  formatHms,
  formatMoney,
  formatTime,
  fromDateTimeInput,
  getDefaultBookingStart,
  toDateInputValue,
  toTimeInputValue,
} from '../data.js'
import { IconCalendar, IconClock, IconPlus, IconX } from '../components/Icons.jsx'

export default function Home() {
  const { user } = useAuth()
  const {
    settings,
    pcs,
    pcRows,
    availableCount,
    bookedCount,
    activeCount,
    totalCount,
    now,
    loading,
    getBookingsForUser,
    getSessionForBookingId,
    createBooking,
    isPcAvailable,
  } = useClub()
  const navigate = useNavigate()
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedPcId, setSelectedPcId] = useState('')
  const [date, setDate] = useState(toDateInputValue())
  const [time, setTime] = useState(toTimeInputValue())
  const [durationHours, setDurationHours] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const myBookings = getBookingsForUser(user.id)
  const activeBooking = myBookings.find((booking) => booking.status === BOOKING_STATUS.ACTIVE)
  const nextBooking = myBookings
    .filter(
      (booking) =>
        [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED].includes(booking.status) &&
        booking.endAt > now,
    )
    .sort((a, b) => a.startAt - b.startAt)[0]
  const activeSession = activeBooking ? getSessionForBookingId(activeBooking.id) : null

  const durationOptions = useMemo(
    () => Array.from({ length: settings.maxDuration }, (_, index) => index + 1),
    [settings.maxDuration],
  )
  const selectedStartAt = fromDateTimeInput(date, time)
  const selectedEndAt = Number.isFinite(selectedStartAt)
    ? selectedStartAt + durationHours * 60 * 60 * 1000
    : NaN
  const availablePcs = useMemo(
    () => pcRows.filter((pc) => isPcAvailable(pc.id, selectedStartAt, selectedEndAt)),
    [isPcAvailable, pcRows, selectedEndAt, selectedStartAt],
  )
  const effectiveSelectedPcId = availablePcs.some((pc) => pc.id === selectedPcId)
    ? selectedPcId
    : availablePcs[0]?.id || ''

  function openBooking(pcId = '') {
    const start = getDefaultBookingStart(now)
    const end = start + 60 * 60 * 1000
    const firstAvailable = pcRows.find((pc) => isPcAvailable(pc.id, start, end))
    setSelectedPcId(pcId || firstAvailable?.id || '')
    setDate(toDateInputValue(start))
    setTime(toTimeInputValue(start))
    setDurationHours(1)
    setError('')
    setBookingOpen(true)
  }

  async function submitBooking(event) {
    event.preventDefault()
    if (!effectiveSelectedPcId || !Number.isFinite(selectedStartAt)) {
      setError('PC va vaqtni to‘g‘ri tanlang')
      return
    }
    setSubmitting(true)
    setError('')
    const result = await createBooking({
      userId: user.id,
      pcId: effectiveSelectedPcId,
      startAt: selectedStartAt,
      durationHours,
    })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setBookingOpen(false)
    navigate('/bookings')
  }

  return (
    <div className="page home-page">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{settings.clubName}</span>
          <h2>Xush kelibsiz, {user.name.split(' ')[0]}</h2>
          <p className="muted">PC holatini ko‘ring va kelgusi sessiyangizni band qiling.</p>
        </div>
        <button className="button primary" type="button" onClick={() => openBooking()} disabled={loading}>
          <IconPlus size={18} /> Bron qilish
        </button>
      </section>

      {activeBooking && activeSession ? (
        <section className="active-session-card">
          <div>
            <span className="live-label">
              <span className="status-dot active" /> Faol sessiya
            </span>
            <h3>
              PC-{String(pcs.find((pc) => pc.id === activeBooking.pcId)?.number || 0).padStart(2, '0')}
            </h3>
            <p>{formatTime(activeSession.startedAt)} — {formatTime(activeSession.endsAt)}</p>
          </div>
          <div className="active-timer">
            <strong>{formatHms(activeSession.endsAt - now)}</strong>
            <span>qoldi</span>
          </div>
        </section>
      ) : null}

      <section className="club-overview">
        <div className="overview-copy">
          <span className="eyebrow">24/7 Gaming Club</span>
          <h2>{totalCount} ta PC bir qo‘lda boshqariladi.</h2>
          <p className="muted">
            Bo‘sh PC’ni tanlang, vaqtni belgilang va tasdiqlashdan keyin kirish kodini oling.
          </p>
        </div>
        <div className="status-metrics">
          <div>
            <span className="status-dot free" />
            <strong>{availableCount}</strong>
            <span>bo‘sh</span>
          </div>
          <div>
            <span className="status-dot booked" />
            <strong>{bookedCount}</strong>
            <span>bron qilingan</span>
          </div>
          <div>
            <span className="status-dot active" />
            <strong>{activeCount}</strong>
            <span>ishlayapti</span>
          </div>
        </div>
      </section>

      {nextBooking ? (
        <section className={`next-booking-card ${BOOKING_STATUS_CLASSES[nextBooking.status]}`}>
          <div className="next-booking-icon">
            <IconCalendar size={22} />
          </div>
          <div className="next-booking-copy">
            <span className="eyebrow">Keyingi bron</span>
            <h3>
              PC-{String(pcs.find((pc) => pc.id === nextBooking.pcId)?.number || 0).padStart(2, '0')}
            </h3>
            <p>{formatDateTime(nextBooking.startAt)} · {nextBooking.durationHours} soat</p>
          </div>
          <div className="next-booking-side">
            <span className={`badge ${BOOKING_STATUS_CLASSES[nextBooking.status]}`}>
              {BOOKING_STATUS_LABELS[nextBooking.status]}
            </span>
            {nextBooking.accessCode ? (
              <strong className="access-code small-code">{nextBooking.accessCode}</strong>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PC holati</span>
            <h2>Hozir band bo‘lgan joylar</h2>
          </div>
          <span className="muted">{formatMoney(settings.pricePerHour)} so‘m / soat</span>
        </div>
        <div className="user-pc-grid">
          {pcRows.map((pc) => (
            <button
              key={pc.id}
              type="button"
              className={`user-pc-card ${PC_STATUS_CLASSES[pc.status]}`}
              onClick={() => openBooking(pc.id)}
              disabled={loading}
            >
              <span className="user-pc-number">
                PC-{String(pc.number).padStart(2, '0')}
              </span>
              <span className="user-pc-status">
                <span className={`status-dot ${PC_STATUS_CLASSES[pc.status]}`} />
                {PC_STATUS_LABELS[pc.status]}
              </span>
              {pc.booking ? <small>{formatTime(pc.booking.startAt)}</small> : null}
              {pc.session ? <small>{formatHms(pc.session.endsAt - now)} qoldi</small> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="cash-note">
        <IconClock size={20} />
        <div>
          <strong>To‘lov faqat naqd</strong>
          <span>Narx booking paytida hisoblanadi. Wallet va onlayn to‘lov V1’da yo‘q.</span>
        </div>
      </section>

      {bookingOpen ? (
        <div className="modal-backdrop" onClick={() => setBookingOpen(false)}>
          <form className="modal-card booking-modal" onClick={(event) => event.stopPropagation()} onSubmit={submitBooking}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Yangi bron</span>
                <h2>PC va vaqtni tanlang</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setBookingOpen(false)}>
                <IconX size={19} />
              </button>
            </div>

            <label className="field">
              <span>PC</span>
              <select value={effectiveSelectedPcId} onChange={(event) => setSelectedPcId(event.target.value)} required>
                <option value="" disabled>
                  Bo‘sh PC tanlang
                </option>
                {availablePcs.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    PC-{String(pc.number).padStart(2, '0')} · {formatMoney(pc.pricePerHour)} so‘m/soat
                  </option>
                ))}
              </select>
            </label>

            <div className="field-grid two">
              <label className="field">
                <span>Sana</span>
                <input
                  type="date"
                  value={date}
                  min={toDateInputValue(now)}
                  onChange={(event) => setDate(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>Boshlanish</span>
                <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
              </label>
            </div>

            <label className="field">
              <span>Davomiylik</span>
              <div className="duration-options">
                {durationOptions.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    className={durationHours === hours ? 'active' : ''}
                    onClick={() => setDurationHours(hours)}
                  >
                    {hours} soat
                  </button>
                ))}
              </div>
            </label>

            <div className="booking-summary">
              <span>Taxminiy narx</span>
              <strong>
                {formatMoney(
                  (pcRows.find((pc) => pc.id === effectiveSelectedPcId)?.pricePerHour || 0) * durationHours,
                )}{' '}
                so‘m
              </strong>
            </div>

            {error ? <div className="form-alert error">{error}</div> : null}

            <button className="button primary wide" type="submit" disabled={submitting || !effectiveSelectedPcId}>
              <IconCalendar size={18} /> {submitting ? 'Yuborilmoqda...' : 'Bronni yuborish'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
