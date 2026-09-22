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
  const [discountInput, setDiscountInput] = useState({})

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

  const paid = (b) => (b.amount || 0) - (b.discount || 0)

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
                  ? 'Tasdiqlangan'
                  : b.status === 'pending'
                    ? 'Kutilmoqda'
                    : 'Rad etilgan'}
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
                {b.discount ? (
                  <b className="grad-text">{fmt(paid(b))} so‘m</b>
                ) : (
                  <b>{fmt(b.amount)} so‘m</b>
                )}
              </div>
              <div>
                <span className="muted small">Usul</span>
                <span className={`method-badge ${METHOD_CLASS[b.method]}`}>{b.method}</span>
              </div>
            </div>

            {b.hours > 5 ? (
              <div className="discount-box">
                <div className="discount-head">
                  <strong>Skidka</strong>
                  <span className="muted small">5+ soat o‘ynash uchun</span>
                </div>

                {(b.discount || 0) > 0 ? (
                  <div className="discount-applied">
                    <span className="muted small">
                      Chegirma: <b className="grad-text">-{fmt(b.discount)} so‘m</b>
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        hall.setBookingDiscount(b.id, 0)
                        setDiscountInput((m) => ({ ...m, [b.id]: '' }))
                      }}
                    >
                      Bekor qilish
                    </button>
                  </div>
                ) : (
                  <div className="discount-form">
                    <input
                      type="number"
                      min="0"
                      max={b.amount}
                      className="discount-input"
                      placeholder="Chegirma summasi (so‘m)"
                      value={discountInput[b.id] || ''}
                      onChange={(e) => setDiscountInput((m) => ({ ...m, [b.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const v = Math.max(0, Number(discountInput[b.id] || 0))
                        if (v <= 0) return
                        hall.setBookingDiscount(b.id, v)
                        setDiscountInput((m) => ({ ...m, [b.id]: '' }))
                        notify(`${b.customer} — ${fmt(v)} so‘m chegirma qo‘shildi`)
                      }}
                    >
                      Qo‘llash
                    </button>
                  </div>
                )}

                <p className="discount-total">
                  {b.discount ? (
                    <>
                      Dastlabki {fmt(b.amount)} so‘m →{' '}
                    </>
                  ) : null}
                  <b className={`grad-text${b.discount ? ' new-total' : ''}`}>{fmt(paid(b))} so‘m</b>
                </p>
              </div>
            ) : null}

            {b.status === 'pending' ? (
              <div className="modal-actions">
                <button className="btn btn-ghost reject" onClick={() => reject(b)}>
                  <IconX size={16} /> Rad etish
                </button>
                <button className="btn btn-primary" onClick={() => approve(b)}>
                  <IconCheck size={16} /> Tasdiqlash
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