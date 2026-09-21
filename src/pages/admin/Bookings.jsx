import { useState } from 'react'
import { useHall } from '../../hall/HallContext.jsx'
import { fmt } from '../../data.js'
import { IconCheck, IconX } from '../../components/Icons.jsx'

const FILTERS = ['all', 'pending', 'confirmed', 'rejected']

const METHOD_CLASS = {
  CLICK: 'method-click',
  PAYME: 'method-payme',
  BALANCE: 'method-balance',
}

export default function AdminBookings() {
  const hall = useHall()
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState('')

  function notify(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const all = hall.adminBookings
  const counts = {
    all: all.length,
    pending: all.filter((b) => b.status === 'pending').length,
    confirmed: all.filter((b) => b.status === 'confirmed').length,
    rejected: all.filter((b) => b.status === 'rejected').length,
  }

  const visible = all.filter((b) => filter === 'all' || b.status === filter)

  function approve(b) {
    hall.approveBooking(b.id)
    notify(`${b.machine} — bron tasdiqlandi`)
  }

  function reject(b) {
    hall.rejectBooking(b.id)
    notify(`${b.machine} — bekor qilindi, mablag‘ qaytarildi`)
  }

  return (
    <div className="page">
      <section className="filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
            <span className="count-pill">{counts[f]}</span>
          </button>
        ))}
      </section>

      <section className="admin-booking-grid">
        {visible.map((b) => (
          <article key={b.id} className="admin-booking card">
            <div className="booking-head">
              <div>
                <h4>{b.customer}</h4>
                <span className="muted small">
                  {b.machine} · {b.date}
                </span>
              </div>
              <span
                className={`badge ${
                  b.status === 'confirmed'
                    ? 'st-available'
                    : b.status === 'pending'
                      ? 'st-pending'
                      : 'st-booked'
                }`}
              >
                {b.status === 'confirmed'
                  ? 'Confirmed'
                  : b.status === 'pending'
                    ? 'Pending'
                    : 'Rejected'}
              </span>
            </div>

            <div className="admin-booking-meta">
              <div>
                <span className="muted small">Boshlanish</span>
                <b>{b.time}</b>
              </div>
              <div>
                <span className="muted small">Davomiylik</span>
                <b>{b.hours} soat</b>
              </div>
              <div>
                <span className="muted small">To‘lov</span>
                <b>{fmt(b.amount)} so‘m</b>
              </div>
              <div>
                <span className="muted small">Usul</span>
                <span className={`method-badge ${METHOD_CLASS[b.method]}`}>{b.method}</span>
              </div>
            </div>

            {b.status === 'pending' ? (
              <div className="modal-actions">
                <button className="btn btn-ghost reject" onClick={() => reject(b)}>
                  <IconX size={16} /> Reject
                </button>
                <button className="btn btn-primary" onClick={() => approve(b)}>
                  <IconCheck size={16} /> Confirm
                </button>
              </div>
            ) : null}
          </article>
        ))}
        {!visible.length ? <p className="muted">Bu holatda bronlar yo‘q</p> : null}
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}