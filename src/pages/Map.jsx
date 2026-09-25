import { useEffect, useMemo, useRef, useState } from 'react'
import { useClub } from '../club/ClubContext.jsx'
import { useHall } from '../hall/HallContext.jsx'
import { STATUS_LABELS, fmt } from '../data.js'
import { IconCheck, IconX, IconClock, IconPlus, IconMinus, IconDesktop } from '../components/Icons.jsx'

const ZONES = [
  { key: 'VIP', label: 'VIP', cols: 3, x: 1.5, y: 14.5, w: 21, h: 36.5 },
  { key: 'Gaming Pro', label: 'Gaming Pro', cols: 4, x: 24.5, y: 14.5, w: 74, h: 36.5 },
  { key: 'Standard', label: 'Standard', cols: 4, x: 1.5, y: 53.5, w: 60, h: 45 },
  { key: 'PS5', label: 'PS5', cols: 3, x: 63.5, y: 53.5, w: 35, h: 45 },
]

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'free', label: "Bo'sh" },
  { key: 'VIP', label: 'VIP' },
  { key: 'Gaming Pro', label: 'Gaming Pro' },
  { key: 'Standard', label: 'Standard' },
  { key: 'PS5', label: 'PS5' },
]

const STATUS_CLASS = {
  available: 'av',
  booked: 'bk',
  maintenance: 'mt',
  pending: 'pd',
}

const shortName = (n) => n.split('-')[1]

function parseTime(t) {
  const [hh, mm] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(hh, mm || 0, 0, 0)
  return d
}

function activeSession(bookings) {
  const now = new Date()
  const today = new Date().toISOString().slice(0, 10)
  for (const b of bookings) {
    if (b.status !== 'confirmed' || b.date !== today) continue
    const [s, e] = b.time.split(' - ').map((x) => x.trim())
    const start = parseTime(s)
    let end = parseTime(e || s)
    if (end <= start) end = new Date(end.getTime() + 24 * 3600 * 1000)
    if (now >= start && now < end) return b
  }
  return null
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

function QuickCard({ m, price, onClose, onBook }) {
  return (
    <div className="quick-card">
      <header className="quick-head">
        <div>
          <h3>{m.name}</h3>
          <span className={`quick-status st-${m.status}`}>{STATUS_LABELS[m.status]}</span>
        </div>
        <button type="button" className="icon-btn" onClick={onClose}>
          <IconX size={16} />
        </button>
      </header>
      <p className="quick-zone muted small">{m.zone}</p>
      <ul className="quick-specs">
        <li>
          <span>CPU</span>
          <b>{m.cpu}</b>
        </li>
        <li>
          <span>GPU</span>
          <b>{m.gpu}</b>
        </li>
        <li>
          <span>RAM</span>
          <b>{m.ram}</b>
        </li>
        <li>
          <span>Monitor</span>
          <b>{m.monitor}</b>
        </li>
      </ul>
      <div className="quick-price">
        <strong className="grad-text">{fmt(price)} so&#39;m</strong>
        <span className="muted small">/soat</span>
      </div>
      {m.status === 'available' ? (
        <button className="btn btn-primary btn-block" onClick={onBook}>
          Bron qilish
        </button>
      ) : (
        <button className="btn btn-block" disabled>
          {m.status === 'booked'
            ? 'Hozir band'
            : m.status === 'maintenance'
              ? 'Ta\u2018mirlashda'
              : 'Tasdiqlanish kutilmoqda'}
        </button>
      )}
    </div>
  )
}

export default function Map() {
  const { machines, bookings, balance, book } = useClub()
  const { pricing } = useHall()
  const ZONE_PRICE = Object.fromEntries(pricing.map((p) => [p.key, p.price]))
  const priceFor = (m) => ZONE_PRICE[m.zone] || m.price || 0

  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const [modalOpen, setModalOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [hours, setHours] = useState(2)
  const [done, setDone] = useState(false)

  const pointers = useRef({})
  const pinch = useRef(null)
  const drag = useRef(null)
  const vpRef = useRef(null)

  useEffect(() => {
    const el = vpRef.current
    function onWheel(e) {
      e.preventDefault()
      setZoom((z) => clamp(z * (1 - e.deltaY * 0.0015), 0.6, 2.6))
    }
    el?.addEventListener('wheel', onWheel, { passive: false })
    return () => el?.removeEventListener('wheel', onWheel)
  }, [])

  const mine = useMemo(() => {
    const s = activeSession(bookings)
    return s ? s.machine : null
  }, [bookings])

  const zoneStats = useMemo(
    () =>
      ZONES.map((z) => {
        const list = machines.filter((m) => m.zone === z.key)
        return { ...z, list, free: list.filter((m) => m.status === 'available').length }
      }),
    [machines]
  )

  const counts = useMemo(() => {
    const c = { all: machines.length, free: machines.filter((m) => m.status === 'available').length }
    for (const z of ZONES) c[z.key] = machines.filter((m) => m.zone === z.key).length
    return c
  }, [machines])

  const matches = (m) => {
    if (filter === 'all') return true
    if (filter === 'free') return m.status === 'available'
    return m.zone === filter
  }

  const current = machines.find((m) => m.id === selected) || null
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

  function zoomBy(f) {
    setZoom((z) => clamp(z * f, 0.6, 2.6))
  }

  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  function pointerDown(e) {
    pointers.current[e.pointerId] = { x: e.clientX, y: e.clientY }
    const keys = Object.keys(pointers.current)
    if (keys.length === 2) {
      const [a, b] = keys.map((k) => pointers.current[k])
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        panX: pan.x,
        panY: pan.y,
      }
      drag.current = null
    } else {
      drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
  }

  function pointerMove(e) {
    if (!pointers.current[e.pointerId]) return
    pointers.current[e.pointerId] = { x: e.clientX, y: e.clientY }
    const keys = Object.keys(pointers.current)
    if (keys.length === 2 && pinch.current) {
      const [a, b] = keys.map((k) => pointers.current[k])
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const z = clamp(pinch.current.zoom * (dist / pinch.current.dist), 0.6, 2.6)
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      setZoom(z)
      setPan({ x: pinch.current.panX + (cx - pinch.current.cx), y: pinch.current.panY + (cy - pinch.current.cy) })
      return
    }
    if (!drag.current) return
    const d = drag.current
    setPan({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) })
  }

  function pointerEnd(e) {
    delete pointers.current[e.pointerId]
    if (Object.keys(pointers.current).length < 2) pinch.current = null
    if (Object.keys(pointers.current).length === 0) drag.current = null
  }

  return (
    <div className="page">
      <section className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="flt-count">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </section>

      <div className="map-layout">
        <div className="plan-wrap">
          <div className="plan-toolbar">
            <div className="plan-legend">
              <span>
                <i className="dot-av" />Bo&#39;sh
              </span>
              <span>
                <i className="dot-bk" />Band
              </span>
              <span>
                <i className="dot-pd" />Kutilmoqda
              </span>
              <span>
                <i className="dot-mt" />Ta&#39;mirlash
              </span>
              <span>
                <i className="dot-mine" />Sizning PC
              </span>
            </div>
            <div className="plan-zoom">
              <button type="button" onClick={() => zoomBy(0.8)} title="Kichraytirish">
                <IconMinus size={14} />
              </button>
              <span className="plan-zoom-amt">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => zoomBy(1.25)} title="Kattalashtirish">
                <IconPlus size={14} />
              </button>
              <button type="button" className="plan-fit" onClick={resetView} title="Butun ko\u2018rinish">
                Sig&#39;dirish
              </button>
            </div>
          </div>

          <div
            className="plan-viewport"
            ref={vpRef}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerEnd}
            onPointerCancel={pointerEnd}
          >
            <div className="plan-inner" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
              <div className="plan-canvas">
                <div className="plan-floor" />

                <div className="room bar-room" style={{ left: '1.5%', top: '1.5%', width: '22%', height: '10.5%' }}>
                  <span className="bar-icon">
                    <IconDesktop size={16} />
                  </span>
                  <div>
                    <strong>KASSA · BAR</strong>
                    <span className="muted">Ichimliklar va gazaklar</span>
                  </div>
                </div>

                {zoneStats.map((z) => (
                  <section
                    key={z.key}
                    className="room"
                    style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
                  >
                    <header className="room-head">
                      <h4>{z.label}</h4>
                      <span className={`room-count ${z.free ? 'ok' : ''}`}>
                        {z.free}/{z.list.length}
                      </span>
                    </header>
                    <div className="room-seats" style={{ gridTemplateColumns: `repeat(${z.cols}, minmax(0, 1fr))` }}>
                      {z.list.map((m) => {
                        if (!matches(m)) return <span key={m.id} className="seat seat-hidden" />
                        const isMine = mine === m.name
                        const sel = selected === m.id
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`seat seat-${STATUS_CLASS[m.status]} ${sel ? 'selected' : ''} ${isMine ? 'mine' : ''}`}
                            onClick={() => setSelected(sel ? null : m.id)}
                            title={m.name}
                          >
                            <span className="pc-mon">
                              <i className="pc-screen" />
                              <i className="pc-stand" />
                              <i className="pc-base" />
                            </span>
                            {isMine ? <em className="pc-mine-badge">SIZ</em> : null}
                            <span className="pc-label">{shortName(m.name)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}

                <div className="plan-corridor c1">
                  <span>YO'LAK</span>
                </div>
                <div className="plan-corridor c2">
                  <span>YO'LAK</span>
                </div>
                <div className="plan-entrance">
                  <span>KIRISH</span>
                </div>
              </div>
            </div>
          </div>

          <p className="plan-hint muted small">
            Surish uchun bosib torting · Kattalashtirish uchun g&#39;ildirak yoki + / −· Mobil: pinch-zoom
          </p>
        </div>

        <aside className="quick-side">
          {current ? (
            <QuickCard m={current} price={price} onClose={() => setSelected(null)} onBook={openBooking} />
          ) : (
            <div className="quick-empty">
              <div className="metric-icon">
                <IconClock size={22} />
              </div>
              <p>Kompyuterni tanlang</p>
              <span className="muted small">Tafsilotlar shu yerda ko&#39;rinadi</span>
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
                  {current.name} · {hours} soat · <b className="grad-text"> {fmt(price * hours)} so&#39;m</b>
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
                      <span className="badge st-available">Mavjud</span>
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