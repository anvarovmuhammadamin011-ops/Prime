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
import { IconClock, IconDesktop, IconPlay, IconPower, IconStop, IconUser } from '../../components/Icons.jsx'

const FILTERS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'off', label: 'O‘chirilgan' },
  { value: PC_STATUS.FREE, label: 'Bo‘sh' },
  { value: PC_STATUS.BOOKED, label: 'Bron qilingan' },
  { value: PC_STATUS.ACTIVE, label: 'Ishlayapti' },
]

export default function AdminComputers() {
  const { users } = useAuth()
  const { pcRows, now, activeCount, availableCount, bookedCount, togglePc, startPcNow, stopPc } = useClub()
  const [filter, setFilter] = useState('all')
  const [busyPcId, setBusyPcId] = useState('')
  const [notice, setNotice] = useState('')
  const [schedulePc, setSchedulePc] = useState(null)
  const [scheduleHours, setScheduleHours] = useState(1)
  const [scheduleMinutes, setScheduleMinutes] = useState(0)

  const offCount = pcRows.filter((pc) => pc.active === false).length
  const visible = useMemo(
    () =>
      pcRows.filter((pc) => {
        if (filter === 'all') return true
        if (filter === 'off') return pc.active === false
        return pc.active !== false && pc.status === filter
      }),
    [filter, pcRows],
  )

  function userFor(userId) {
    return users.find((user) => user.id === userId)
  }

  function flash(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  async function run(pcId, action) {
    setBusyPcId(pcId)
    try {
      const result = await action()
      if (!result.ok) flash(result.error)
      return result
    } finally {
      setBusyPcId('')
    }
  }

  function handleToggle(pc) {
    const turningOff = pc.active !== false
    if (turningOff && (pc.session || pc.booking)) {
      flash('Faol sessiyasi yoki broni bor PC‘ni o‘chirib bo‘lmaydi')
      return
    }
    void run(pc.id, () => togglePc(pc.id, !turningOff)).then((result) => {
      if (result?.ok) flash(turningOff ? `PC-${String(pc.number).padStart(2, '0')} o‘chirildi` : `PC-${String(pc.number).padStart(2, '0')} yoqildi`)
    })
  }

  function handleStartNow(pc) {
    void run(pc.id, () => startPcNow(pc.id, { hours: 1 })).then((result) => {
      if (result.ok) flash(`PC-${String(pc.number).padStart(2, '0')} 1 soatga ishga tushirildi`)
    })
  }

  function handleStop(pc) {
    void run(pc.id, () => stopPc(pc.id)).then((result) => {
      if (result.ok) flash(`PC-${String(pc.number).padStart(2, '0')} sessiyasi to‘xtatildi`)
    })
  }

  function openSchedule(pc) {
    setSchedulePc(pc)
    setScheduleHours(1)
    setScheduleMinutes(0)
  }

  function submitSchedule(event) {
    event.preventDefault()
    const pc = schedulePc
    if (!pc) return
    const minutes = scheduleHours * 60 + scheduleMinutes
    setSchedulePc(null)
    void run(pc.id, () => startPcNow(pc.id, { minutes })).then((result) => {
      if (result.ok) flash(`PC-${String(pc.number).padStart(2, '0')} ${minutes} daqiqa ishga tushirildi`)
    })
  }

  return (
    <div className="page admin-pcs-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Boshqaruv</span>
          <h1>PC holatlari</h1>
          <p className="muted">PC‘ni yoqing/o‘chiring, “Hozir” bilan darhol ishga tushiring yoki vaqt belgilang.</p>
        </div>
        <div className="page-heading-mark">
          <IconDesktop size={24} />
          <span>{pcRows.length} ta qurilma</span>
        </div>
      </section>

      {notice ? <div className="inline-message" role="status">{notice}</div> : null}

      <section className="pc-summary-row">
        <div className="card"><span className="status-dot free" /><strong>{availableCount}</strong><span>bo‘sh</span></div>
        <div className="card"><span className="status-dot booked" /><strong>{bookedCount}</strong><span>bron qilingan</span></div>
        <div className="card"><span className="status-dot active" /><strong>{activeCount}</strong><span>ishlayapti</span></div>
        {offCount > 0 ? (
          <div className="card"><span className="status-dot off" /><strong>{offCount}</strong><span>o‘chirilgan</span></div>
        ) : null}
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
          const isOff = pc.active === false
          const customer = pc.booking ? userFor(pc.booking.userId) : null
          const busy = busyPcId === pc.id
          return (
            <article className={`pc-management-card card ${isOff ? 'off' : PC_STATUS_CLASSES[pc.status]}`} key={pc.id}>
              <div className="pc-card-head">
                <span className="pc-monitor"><IconDesktop size={22} /></span>
                <div>
                  <h3>PC-{String(pc.number).padStart(2, '0')}</h3>
                  <span className={`badge ${isOff ? 'off' : PC_STATUS_CLASSES[pc.status]}`}>
                    {isOff ? 'O‘chirilgan' : PC_STATUS_LABELS[pc.status]}
                  </span>
                </div>
              </div>

              {isOff ? (
                <div className="pc-free-block">
                  <IconPower size={20} />
                  <span>PC o‘chirilgan</span>
                </div>
              ) : pc.session ? (
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

              <div className="pc-actions">
                <button
                  type="button"
                  className={`button small ${isOff ? 'primary' : 'secondary'}`}
                  disabled={busy}
                  onClick={() => handleToggle(pc)}
                  title={isOff ? 'Yoqish' : 'O‘chirish'}
                >
                  <IconPower size={15} /> {isOff ? 'Yoqish' : 'O‘chirish'}
                </button>
                {!isOff && !pc.session ? (
                  <>
                    <button
                      type="button"
                      className="button small primary"
                      disabled={busy || Boolean(pc.booking)}
                      onClick={() => handleStartNow(pc)}
                      title="Hozir 1 soatga ishga tushirish"
                    >
                      <IconPlay size={15} /> Hozir
                    </button>
                    <button
                      type="button"
                      className="button small secondary"
                      disabled={busy || Boolean(pc.booking)}
                      onClick={() => openSchedule(pc)}
                      title="Vaqt belgilab ishga tushirish"
                    >
                      <IconClock size={15} /> Vaqt
                    </button>
                  </>
                ) : null}
                {!isOff && pc.session ? (
                  <button
                    type="button"
                    className="button small danger"
                    disabled={busy}
                    onClick={() => handleStop(pc)}
                    title="Sessiyani to'xtatish"
                  >
                    <IconStop size={15} /> To‘xtatish
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </section>

      {schedulePc ? (
        <div className="modal-backdrop" onClick={() => setSchedulePc(null)}>
          <form className="modal-card booking-modal" onClick={(event) => event.stopPropagation()} onSubmit={submitSchedule}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Vaqt belgilash</span>
                <h2>PC-{String(schedulePc.number).padStart(2, '0')} sessiyasi</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setSchedulePc(null)}>
                <IconClock size={19} />
              </button>
            </div>

            <label className="field">
              <span>Soat</span>
              <select value={scheduleHours} onChange={(event) => setScheduleHours(Number(event.target.value))}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((value) => (
                  <option key={value} value={value}>{value} soat</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Daqiqa</span>
              <div className="duration-options">
                {[0, 15, 30, 45].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={scheduleMinutes === value ? 'active' : ''}
                    onClick={() => setScheduleMinutes(value)}
                  >
                    {value === 0 ? '—' : `${value} daq`}
                  </button>
                ))}
              </div>
            </label>

            <div className="booking-summary">
              <span>Jami davomiylik</span>
              <strong>{scheduleHours * 60 + scheduleMinutes} daqiqa</strong>
            </div>

            <button
              className="button primary wide"
              type="submit"
              disabled={scheduleHours * 60 + scheduleMinutes < 15}
            >
              <IconPlay size={18} /> Ishga tushirish
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
