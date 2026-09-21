import { useMemo, useState } from 'react'
import { useClub } from '../club/ClubContext.jsx'
import { useHall } from '../hall/HallContext.jsx'
import { ZONE_LIST, STATUS_LABELS, fmt } from '../data.js'
import { IconCheck, IconX, IconClock } from '../components/Icons.jsx'

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'free', label: "Bo'sh" },
  { key: 'VIP', label: 'VIP' },
  { key: 'Gaming Pro', label: 'Gaming Pro' },
  { key: 'Standard', label: 'Standard' },
  { key: 'PS5', label: 'PS5' },
]

const STATUS_CLASS = {
  available: 'st-available',
  booked: 'st-booked',
  maintenance: 'st-maintenance',
  pending: 'st-pending',
}

export default function Map() {
  const { machines, balance, book } = useClub()
  const { pricing } = useHall()
  const ZONE_PRICE = Object.fromEntries(pricing.map((p) => [p.key, p.price]))
  const priceFor = (m) => ZONE_PRICE[m.zone] || m.price || 0
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [hours, setHours] = useState(2)
  const [done, setDone] = useState(false)

  const counts = useMemo(() => {
    const c = { available: 0, booked: 0, maintenance: 0, pending: 0 }
    for (const m of machines) c[m.status] = (c[m.status] || 0) + 1
    return c
  }, [machines])

  const visible = useMemo(() => {
    if (filter === 'all') return machines
    if (filter === 'free') return machines.filter((m) => m.status === 'available')
    return machines.filter((m) => m.zone === filter)
  }, [machines, filter])

  const current = machines.find((m) => m.id === selected?.id) || null
  const price = current ? priceFor(current) : 0

  function openBooking() {
    if (!current || current.status !== 'available') return
    setStep(1)
    setHours(2)
    setDone(false)
    setModalOpen(true)
  }

  function confirmBooking() {
    if (!current) return
    book(current.id, hours)
    setDone(true)
  }

  return (
    <div className="page">
      <section className="legend card">
        {[
          { key: 'available', label: 'Available', n: counts.available },
          { key: 'booked', label: 'Booked', n: counts.booked },
          { key: 'maintenance', label: 'Maintenance', n: counts.maintenance },
          { key: 'pending', label: 'Pending', n: counts.pending },
        ].map((s) => (
          <button
            key={s.key}
            className={`legend-item ${filter === s.key ? 'active' : ''}`}
            onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
          >
            <span className={`dot dot-${s.key}`} />
            <span>{s.label}</span>
            <b>{s.n}</b>
          </button>
        ))}
      </section>

      <section className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </section>

      <div className="map-layout">
        <section className="machine-grid">
          {visible.map((m) => (
            <button
              key={m.id}
              className={`machine card ${selected?.id === m.id ? 'selected' : ''}`}
              onClick={() => setSelected(m)}
            >
              <div className="machine-top">
                <span className="machine-name">{m.name}</span>
                <span className={`badge ${STATUS_CLASS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
              </div>
              <p className="machine-zone muted small">{m.zone} zonasi</p>
              <p className="machine-price">
                <span className="grad-text">{fmt(priceFor(m))}</span>
                <span className="muted small"> so&#39;m/soat</span>
              </p>
            </button>
          ))}
          {!visible.length ? <p className="muted">Bu filtr bo&#39;yicha joylar yo&#39;q</p> : null}
        </section>

        <aside className="details card">
          {current ? (
            <>
              <div className="details-head">
                <h3>{current.name}</h3>
                <span className={`badge ${STATUS_CLASS[current.status]}`}>
                  {STATUS_LABELS[current.status]}
                </span>
              </div>
              <p className="muted small">{current.zone} zona</p>

              <dl className="spec-dl">
                <dt>GPU</dt>
                <dd>{current.gpu}</dd>
                <dt>CPU</dt>
                <dd>{current.cpu}</dd>
                <dt>RAM</dt>
                <dd>{current.ram}</dd>
                <dt>Monitor</dt>
                <dd>{current.monitor}</dd>
                <dt>Narx</dt>
                <dd>
                  <b className="grad-text">{fmt(price)} so&#39;m/soat</b>
                </dd>
              </dl>

              {current.status === 'available' ? (
                <button className="btn btn-primary btn-block" onClick={openBooking}>
                  Book now
                </button>
              ) : (
                <button className="btn btn-block" disabled>
                  {current.status === 'booked'
                    ? 'Hozir band'
                    : current.status === 'maintenance'
                      ? 'Ta\u2018mirlashda'
                      : 'Tasdiqlanish kutilmoqda'}
                </button>
              )}
            </>
          ) : (
            <div className="details-empty">
              <div className="metric-icon">
                <IconClock size={22} />
              </div>
              <p>Kompyuterni tanlang</p>
              <span className="muted small">Tafsilotlar shu yerda ko\u2018rinadi</span>
            </div>
          )}
        </aside>
      </div>

      {modalOpen && current ? (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal booking-modal" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="booking-done">
                <div className="success-ring">
                  <IconCheck size={34} />
                </div>
                <h3>Bron tasdiqlandi!</h3>
                <p className="muted">
                  {current.name} · {hours} soat · 
                  <b className="grad-text"> {fmt(price * hours)} so&#39;m</b>
                </p>
                <p className="muted small">Balansga {hours * 5} bonus ball qo&#39;shildi</p>
                <button className="btn btn-primary btn-block" onClick={() => setModalOpen(false)}>
                  Yopish
                </button>
              </div>
            ) : (
              <>
                <div className="modal-head">
                  <h3>
                    Bron qilish <span className="muted">· {current.name}</span>
                  </h3>
                  <button type="button" className="icon-btn" onClick={() => setModalOpen(false)}>
                    <IconX size={18} />
                  </button>
                </div>

                <div className="stepper">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`step ${s === step ? 'active' : s < step ? 'done' : ''}`}>
                      <span className="step-num">{s < step ? <IconCheck size={14} /> : s}</span>
                      <span className="step-label">
                        {s === 1 ? 'Joyni tanlash' : s === 2 ? 'Vaqtni tanlash' : 'Tasdiqlash'}
                      </span>
                    </div>
                  ))}
                </div>

                {step === 1 ? (
                  <div className="modal-body">
                    <div className="sel-summary">
                      <div>
                        <strong>{current.name}</strong>
                        <p className="muted small">
                          {current.gpu} · {current.monitor}
                        </p>
                      </div>
                      <span className="badge st-available">Available</span>
                    </div>
                    <button className="btn btn-primary btn-block" onClick={() => setStep(2)}>
                      Davom etish
                    </button>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="modal-body">
                    <p className="muted small">Qancha vaqt o&#39;ynaysiz?</p>
                    <div className="hours-grid">
                      {[1, 2, 3, 4].map((h) => (
                        <button
                          key={h}
                          className={`hour-btn ${hours === h ? 'active' : ''}`}
                          onClick={() => setHours(h)}
                        >
                          <strong>{h} soat</strong>
                          <span>{fmt(price * h)} so&#39;m</span>
                        </button>
                      ))}
                    </div>
                    <p className="muted small total-line">
                      Jami: <b className="grad-text">{fmt(price * hours)} so&#39;m</b>
                    </p>
                    <div className="modal-actions">
                      <button className="btn btn-ghost" onClick={() => setStep(1)}>
                        Orqaga
                      </button>
                      <button className="btn btn-primary" onClick={() => setStep(3)}>
                        Davom etish
                      </button>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="modal-body">
                    <ul className="summary-list">
                      <li>
                        <span className="muted">Joy</span>
                        <b>{current.name}</b>
                      </li>
                      <li>
                        <span className="muted">Davomiylik</span>
                        <b>{hours} soat</b>
                      </li>
                      <li>
                        <span className="muted">Narx</span>
                        <b>{fmt(price * hours)} so&#39;m</b>
                      </li>
                      <li>
                        <span className="muted">Balans</span>
                        <b>{fmt(balance - price * hours)} so&#39;m</b>
                      </li>
                      <li>
                        <span className="muted">Bonus</span>
                        <b>+{hours * 5} ball</b>
                      </li>
                    </ul>
                    <div className="modal-actions">
                      <button className="btn btn-ghost" onClick={() => setStep(2)}>
                        Orqaga
                      </button>
                      <button className="btn btn-primary" onClick={confirmBooking}>
                        <IconCheck size={16} /> Bronni tasdiqlash
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}