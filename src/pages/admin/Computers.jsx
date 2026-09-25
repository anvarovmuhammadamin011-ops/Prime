import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useClub } from '../../club/ClubContext.jsx'
import { PC_STATUS } from '../../club/bookingRules.js'
import {
  PC_STATUS_CLASSES,
  PC_STATUS_LABELS,
  formatHms,
  formatTime,
} from '../../data.js'
import { IconClock, IconDesktop, IconUser } from '../../components/Icons.jsx'

const FILTERS = [
  { value: 'all', label: 'Hammasi' },
  { value: PC_STATUS.FREE, label: 'Bo‘sh' },
  { value: PC_STATUS.BOOKED, label: 'Bron qilingan' },
  { value: PC_STATUS.ACTIVE, label: 'Ishlayapti' },
]

export default function AdminComputers() {
  const { users } = useAuth()
  const { pcRows, now, activeCount, availableCount, bookedCount } = useClub()
  const [filter, setFilter] = useState('all')

  const visible = useMemo(
    () => pcRows.filter((pc) => filter === 'all' || pc.status === filter),
    [filter, pcRows],
  )

  function userFor(userId) {
    return users.find((user) => user.id === userId)
  }

  return (
    <div className="page admin-pcs-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">20 ta PC</span>
          <h1>PC holatlari</h1>
          <p className="muted">Holat booking va session ma’lumotlaridan avtomatik hisoblanadi.</p>
        </div>
        <div className="page-heading-mark">
          <IconDesktop size={24} />
          <span>{pcRows.length} ta qurilma</span>
        </div>
      </section>

      <section className="pc-summary-row">
        <div className="card"><span className="status-dot free" /><strong>{availableCount}</strong><span>bo‘sh</span></div>
        <div className="card"><span className="status-dot booked" /><strong>{bookedCount}</strong><span>bron qilingan</span></div>
        <div className="card"><span className="status-dot active" /><strong>{activeCount}</strong><span>ishlayapti</span></div>
      </section>

      <section className="filter-bar">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ? 'active' : ''}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="pc-management-grid">
        {visible.map((pc) => {
          const customer = pc.booking ? userFor(pc.booking.userId) : null
          return (
            <article className={`pc-management-card card ${PC_STATUS_CLASSES[pc.status]}`} key={pc.id}>
              <div className="pc-card-head">
                <span className="pc-monitor"><IconDesktop size={22} /></span>
                <div>
                  <h3>PC-{String(pc.number).padStart(2, '0')}</h3>
                  <span className={`badge ${PC_STATUS_CLASSES[pc.status]}`}>
                    {PC_STATUS_LABELS[pc.status]}
                  </span>
                </div>
              </div>

              {pc.session ? (
                <div className="pc-session-block">
                  <span className="live-label"><span className="status-dot active" /> Live</span>
                  <strong>{formatHms(pc.session.endsAt - now)}</strong>
                  <span>{formatTime(pc.session.endsAt)} da tugaydi</span>
                </div>
              ) : pc.booking ? (
                <div className="pc-booking-block">
                  <span className="eyebrow">Joriy bron</span>
                  <strong>{customer?.name || 'Foydalanuvchi'}</strong>
                  <span>
                    <IconClock size={14} /> {formatTime(pc.booking.startAt)}–{formatTime(pc.booking.endAt)}
                  </span>
                </div>
              ) : (
                <div className="pc-free-block">
                  <IconUser size={20} />
                  <span>Hozir band emas</span>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
