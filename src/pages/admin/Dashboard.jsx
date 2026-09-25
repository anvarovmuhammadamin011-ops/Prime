import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useClub } from '../../club/ClubContext.jsx'
import { BOOKING_STATUS, SESSION_STATUS } from '../../club/bookingRules.js'
import { PC_STATUS_CLASSES, PC_STATUS_LABELS, formatHms, formatTime } from '../../data.js'
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconDesktop,
  IconPower,
  IconUsers,
  IconX,
} from '../../components/Icons.jsx'

export default function AdminDashboard() {
  const { users } = useAuth()
  const {
    state,
    pcRows,
    activeCount,
    availableCount,
    totalCount,
    todayBookings,
    todaySessions,
    todayUsers,
    now,
    startSession,
  } = useClub()
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(null)
  const [starting, setStarting] = useState(false)

  const pending = todayBookings
    .filter((booking) => booking.status === BOOKING_STATUS.PENDING)
    .sort((a, b) => a.startAt - b.startAt)
  const activeSessions = state.sessions.filter(
    (session) =>
      session.status === SESSION_STATUS.ACTIVE && session.startedAt <= now && session.endsAt > now,
  )

  function userFor(session) {
    return users.find((item) => item.id === session.userId) || {
      name: session.userName,
      phone: session.userPhone,
    }
  }

  function pcNumber(pcId) {
    return Number(pcRows.find((pc) => pc.id === pcId)?.number) || 0
  }

  async function handleStart(event) {
    event.preventDefault()
    setStarting(true)
    const result = await startSession(code)
    setStarting(false)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setMessage({
      type: 'success',
      text: `PC-${String(result.session.pcNumber || pcNumber(result.session.pcId)).padStart(2, '0')} sessiyasi boshlandi`,
    })
    setCode('')
  }

  return (
    <div className="page admin-dashboard">
      <section className="admin-welcome">
        <div>
          <span className="eyebrow">Bugungi holat</span>
          <h1>PC va sessiyalar markazi</h1>
          <p className="muted">Faqat tasdiqlash, kod kiritish va holatni nazorat qiling.</p>
        </div>
        <Link className="button primary" to="/admin/bookings">
          <IconCalendar size={18} /> Bronlarni ko‘rish
        </Link>
      </section>

      <section className="admin-metrics">
        <div className="metric-card card">
          <span className="metric-icon violet"><IconCalendar size={20} /></span>
          <div>
            <span>Bugungi bronlar</span>
            <strong>{todayBookings.length}</strong>
          </div>
        </div>
        <div className="metric-card card">
          <span className="metric-icon red"><IconPower size={20} /></span>
          <div>
            <span>Hozir ishlayapti</span>
            <strong>{activeCount}</strong>
          </div>
        </div>
        <div className="metric-card card">
          <span className="metric-icon green"><IconUsers size={20} /></span>
          <div>
            <span>Bugungi foydalanuvchilar</span>
            <strong>{todayUsers}</strong>
          </div>
        </div>
        <div className="metric-card card">
          <span className="metric-icon blue"><IconClock size={20} /></span>
          <div>
            <span>Bugungi sessiyalar</span>
            <strong>{todaySessions.length}</strong>
          </div>
        </div>
      </section>

      <section className="start-session-panel">
        <div className="start-session-copy">
          <span className="live-label">
            <span className="status-dot active" /> Sessiyani boshlash
          </span>
          <h2>Foydalanuvchi kodini kiriting</h2>
          <p>Kod tasdiqlangan bron bilan bog‘langan va bir marta ishlatiladi.</p>
        </div>
        <form className="start-code-form" onSubmit={handleStart}>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Kirish kodi"
          />
          <button className="button primary" type="submit" disabled={starting || code.length !== 6}>
            <IconPower size={18} /> {starting ? 'Boshlanmoqda...' : 'Boshlash'}
          </button>
        </form>
        {message ? (
          <div className={`session-message ${message.type}`}>
            {message.type === 'success' ? <IconCheck size={17} /> : <IconX size={17} />}
            {message.text}
          </div>
        ) : null}
      </section>

      <div className="admin-two-column">
        <section className="card admin-section-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Live</span>
              <h2>Faol sessiyalar</h2>
            </div>
            <span className="badge active">{activeSessions.length}</span>
          </div>
          {activeSessions.length ? (
            <div className="active-session-list">
              {activeSessions.map((session) => {
                const user = userFor(session)
                return (
                  <div className="active-session-row" key={session.id}>
                    <span className="session-pc-mark">
                      <IconDesktop size={18} />
                    </span>
                    <div>
                      <strong>PC-{String(session.pcNumber || pcNumber(session.pcId)).padStart(2, '0')}</strong>
                      <span>{user?.name || 'Foydalanuvchi'}</span>
                    </div>
                    <div className="row-timer">
                      <strong>{formatHms(session.endsAt - now)}</strong>
                      <span>{formatTime(session.endsAt)} da tugaydi</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-inline">Hozir faol sessiya yo‘q.</div>
          )}
        </section>

        <section className="card admin-section-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Tasdiqlash</span>
              <h2>Kutilayotgan bronlar</h2>
            </div>
            <span className="badge pending">{pending.length}</span>
          </div>
          {pending.length ? (
            <div className="pending-list compact-list">
              {pending.slice(0, 5).map((booking) => {
                const user = userFor({
                  userId: booking.userId,
                  userName: booking.userName,
                  userPhone: booking.userPhone,
                })
                return (
                  <div className="pending-row" key={booking.id}>
                    <div>
                      <strong>{user?.name || 'Foydalanuvchi'}</strong>
                      <span>
                        PC-{String(booking.pcNumber || pcNumber(booking.pcId)).padStart(2, '0')} · {formatTime(booking.startAt)}
                      </span>
                    </div>
                    <span className="muted small">{booking.durationHours} soat</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-inline">Kutilayotgan bron yo‘q.</div>
          )}
          <Link className="text-link" to="/admin/bookings">
            Barcha bronlarni ochish
          </Link>
        </section>
      </div>

      <section className="card admin-section-card">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Zal</span>
            <h2>PC holati</h2>
          </div>
          <div className="inline-statuses">
            <span><i className="status-dot free" /> {availableCount} bo‘sh</span>
            <span><i className="status-dot active" /> {activeCount} faol</span>
          </div>
        </div>
        <div className="admin-pc-grid">
          {pcRows.map((pc) => (
            <div className={`admin-pc-card ${PC_STATUS_CLASSES[pc.status]}`} key={pc.id}>
              <div>
                <strong>PC-{String(pc.number).padStart(2, '0')}</strong>
                <span className={`badge ${PC_STATUS_CLASSES[pc.status]}`}>
                  {PC_STATUS_LABELS[pc.status]}
                </span>
              </div>
              {pc.session ? (
                <span className="pc-timer">{formatHms(pc.session.endsAt - now)}</span>
              ) : pc.booking ? (
                <span className="muted small">{formatTime(pc.booking.startAt)}</span>
              ) : (
                <span className="muted small">Band emas</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="admin-summary-line">
        <span><strong>{availableCount}</strong> bo‘sh</span>
        <span><strong>{totalCount - availableCount - activeCount}</strong> bron qilingan</span>
        <span><strong>{activeCount}</strong> ishlayapti</span>
      </div>
    </div>
  )
}
