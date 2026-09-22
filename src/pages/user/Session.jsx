import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClub } from '../../club/ClubContext.jsx'
import { useHall } from '../../hall/HallContext.jsx'
import { fmt } from '../../data.js'
import { IconBolt, IconClock, IconDesktop, IconGamepad } from '../../components/Icons.jsx'

function parseTime(t) {
  const m = t.trim().match(/(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = parseInt(m[1], 10) % 24
  const min = parseInt(m[2], 10)
  const d = new Date()
  d.setHours(h, min, 0, 0)
  if (d < new Date()) d.setDate(d.getDate() + 1)
  return d
}

function formatHMS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return { h, m, s }
}

function timeLabel(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Session() {
  const { bookings, totalCount, availableCount } = useClub()
  const { machines } = useHall()
  const navigate = useNavigate()
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const confirmed = bookings.filter((b) => b.status === 'confirmed')
  const session = confirmed[0] || null

  const startDate = session ? parseTime(session.time.split('-')[0] || '') : null
  const endDate = session ? parseTime(session.time.split('-')[1] || '') : null
  const active = !!(endDate && endDate.getTime() > now)
  const remaining = endDate ? endDate.getTime() - now : 0
  const endsLabel = endDate ? timeLabel(endDate) : '—'
  const startsLabel = startDate ? timeLabel(startDate) : '—'

  const machine = session ? machines.find((m) => m.id === session.machine) : null

  if (!session) {
    return (
      <div className="page">
        <section className="s-empty card">
          <div className="s-empty-icon">
            <IconBolt size={30} />
          </div>
          <h2>Faol sessiya yo'q</h2>
          <p className="muted">PC bron qiling va sessiyangiz shu yerda ko'rinadi</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/map')}>
            <IconDesktop size={18} /> Hoziroq bron qilish
          </button>
          <p className="muted small">
            Hozir {availableCount} / {totalCount} ta PC bo'sh
          </p>
        </section>
      </div>
    )
  }

  const { h, m, s } = formatHMS(remaining)

  return (
    <div className="page session-page">
      <section className="session card">
        <p className="session-kicker">
          <span className="live-dot" /> SESSIYANGIZ
        </p>

        <div className="session-pc">
          {machine?.zone && <span className="t-game-badge">{machine.zone}</span>}
          <h2>{session.machine}</h2>
          {machine && <p className="muted small">{machine.gpu}</p>}
        </div>

        {active ? (
          <div className="session-timer">
            <span>{h}</span>:<span>{m}</span>:<span>{s}</span>
          </div>
        ) : (
          <div className="session-finished">
            <strong>Sessiya tugadi</strong>
            <p className="muted small">Yangi sessiya bron qilishingiz mumkin</p>
          </div>
        )}

        <p className="session-remain-label">{active ? 'qolgan vaqt' : 'sessiya yakunlandi'}</p>

        {machine?.gpu && (
          <div className="session-game">
            <IconGamepad size={16} />
            <span>{machine.zone} zona · {machine.monitor}</span>
          </div>
        )}

        <div className="session-times">
          <div>
            <span className="muted small">Boshlangan</span>
            <strong>{startsLabel}</strong>
          </div>
          <div>
            <span className="muted small">Tugaydi</span>
            <strong>{endsLabel}</strong>
          </div>
        </div>

        {active && (
          <div className="session-status">
            <IconBolt size={14} /> Session Active
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">
          <IconClock size={16} /> Ushbu sessiya: {fmt(session.hours)} soat
        </h3>
        <p className="muted small">
          {session.date} · {session.time}
        </p>
        <button className="btn btn-secondary btn-block" onClick={() => navigate('/profile')}>
          Bron tarixi
        </button>
      </section>
    </div>
  )
}