import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useClub } from '../../club/ClubContext.jsx'
import { BOOKING_STATUS } from '../../club/bookingRules.js'
import {
  BOOKING_STATUS_CLASSES,
  BOOKING_STATUS_LABELS,
  formatDate,
  formatHms,
  formatMoney,
  formatTime,
} from '../../data.js'
import { IconCalendar, IconCheck, IconClock, IconCopy, IconDesktop, IconX } from '../../components/Icons.jsx'

const FILTERS = [
  { value: 'all', label: 'Hammasi' },
  { value: BOOKING_STATUS.PENDING, label: 'Kutilmoqda' },
  { value: BOOKING_STATUS.APPROVED, label: 'Tasdiqlangan' },
  { value: BOOKING_STATUS.ACTIVE, label: 'Faol' },
  { value: BOOKING_STATUS.COMPLETED, label: 'Tugagan' },
  { value: BOOKING_STATUS.REJECTED, label: 'Rad etilgan' },
]

function AdminBookingCard({ booking, customer, pcNumber, remaining, onApprove, onReject }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const copyTimer = useRef(null)

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
    <article className={`admin-booking-card card ${BOOKING_STATUS_CLASSES[booking.status]}`}>
      <div className="admin-booking-head">
        <div className="admin-customer">
          <span className="customer-avatar">{customer?.name?.charAt(0) || 'F'}</span>
          <div>
            <h3>{customer?.name || 'Foydalanuvchi'}</h3>
            <span>{customer?.phone || 'Telefon topilmadi'}</span>
          </div>
        </div>
        <span className={`badge ${BOOKING_STATUS_CLASSES[booking.status]}`}>
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div className="admin-booking-details">
        <div>
          <span>PC</span>
          <strong>PC-{String(pcNumber).padStart(2, '0')}</strong>
        </div>
        <div>
          <span>Sana</span>
          <strong>{formatDate(booking.startAt)}</strong>
        </div>
        <div>
          <span>Vaqt</span>
          <strong>{formatTime(booking.startAt)}–{formatTime(booking.endAt)}</strong>
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

      {booking.status === BOOKING_STATUS.ACTIVE ? (
        <div className="admin-active-time">
          <span className="status-dot active" />
          <strong>{formatHms(remaining)}</strong>
          <span>qoldi</span>
        </div>
      ) : null}

      {booking.status === BOOKING_STATUS.APPROVED && booking.accessCode ? (
        <div className="admin-code-row">
          <div>
            <span>Kirish kodi</span>
            <strong>{booking.accessCode}</strong>
          </div>
          <button className="button secondary compact" type="button" onClick={copyCode}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            {copied ? 'Kopierlandi' : 'Kod'}
          </button>
        </div>
      ) : null}
      {copyError ? <div className="form-alert error">{copyError}</div> : null}

      {booking.status === BOOKING_STATUS.PENDING ? (
        <div className="admin-booking-actions">
          <button className="button danger-soft" type="button" onClick={() => onReject(booking.id)}>
            <IconX size={17} /> Rad etish
          </button>
          <button className="button primary" type="button" onClick={() => onApprove(booking.id)}>
            <IconCheck size={17} /> Tasdiqlash
          </button>
        </div>
      ) : null}
    </article>
  )
}

export default function AdminBookings() {
  const { users } = useAuth()
  const { state, now, approveBooking, rejectBooking, getSessionForBookingId } = useClub()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('uz-UZ')
    return state.bookings
      .filter((booking) => filter === 'all' || booking.status === filter)
      .filter((booking) => {
        if (!query) return true
        const user = users.find((item) => item.id === booking.userId)
        return [user?.name || booking.userName, user?.phone || booking.userPhone, `pc-${String(booking.pcNumber).padStart(2, '0')}`]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase('uz-UZ').includes(query))
      })
      .sort((a, b) => b.startAt - a.startAt)
  }, [filter, search, state.bookings, users])

  function customerFor(booking) {
    return users.find((user) => user.id === booking.userId) || {
      name: booking.userName,
      phone: booking.userPhone,
    }
  }

  async function handleApprove(bookingId) {
    const result = await approveBooking(bookingId)
    setMessage(result.ok ? 'Bron tasdiqlandi va kirish kodi yaratildi' : result.error)
  }

  async function handleReject(bookingId) {
    const result = await rejectBooking(bookingId)
    setMessage(result.ok ? 'Bron rad etildi' : result.error)
  }

  return (
    <div className="page admin-bookings-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Admin paneli</span>
          <h1>Bronlar</h1>
          <p className="muted">Foydalanuvchi, PC, vaqt va status bitta ro‘yxatda.</p>
        </div>
        <div className="page-heading-mark">
          <IconCalendar size={24} />
          <span>{state.bookings.length} ta bron</span>
        </div>
      </section>

      <section className="booking-toolbar card">
        <div className="filter-tabs">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? 'active' : ''}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              <span>
                {item.value === 'all'
                  ? state.bookings.length
                  : state.bookings.filter((booking) => booking.status === item.value).length}
              </span>
            </button>
          ))}
        </div>
        <label className="search-field">
          <span>Qidirish</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ism, telefon yoki PC"
          />
        </label>
      </section>

      {message ? (
        <button className="inline-message clickable" type="button" onClick={() => setMessage('')}>
          {message}
        </button>
      ) : null}

      {visible.length ? (
        <div className="admin-booking-list">
          {visible.map((booking) => {
            const session = getSessionForBookingId(booking.id)
            return (
              <AdminBookingCard
                key={booking.id}
                booking={booking}
                customer={customerFor(booking)}
                pcNumber={Number(booking.pcNumber) || 0}
                remaining={session ? session.endsAt - now : 0}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )
          })}
        </div>
      ) : (
        <div className="empty-state card">
          <IconClock size={28} />
          <h3>Bron topilmadi</h3>
          <p>Filtr yoki qidiruv shartini o‘zgartiring.</p>
        </div>
      )}

      <div className="cash-note compact-note">
        <IconDesktop size={20} />
        <div>
          <strong>To‘lov usuli: naqd</strong>
          <span>Onlayn payment, wallet va chegirma V1’da mavjud emas.</span>
        </div>
      </div>
    </div>
  )
}
