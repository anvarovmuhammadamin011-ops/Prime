﻿﻿import { useState } from 'react'
import { useHall } from '../../hall/HallContext.jsx'
import { ZONE_FILTERS, STATUS_LABELS, TEMP_HIGH, ZONE_LABELS, fmt } from '../../data.js'
import {
  IconPower,
  IconSettings,
  IconPlay,
  IconPause,
  IconPlus,
  IconMinus,
  IconX,
} from '../../components/Icons.jsx'

const STATUS_CLASS = {
  available: 'st-available',
  booked: 'st-booked',
  maintenance: 'st-maintenance',
  pending: 'st-pending',
}

const MODE_OPTIONS = [
  { key: 'available', label: 'Mavjud' },
  { key: 'maintenance', label: 'Texnik xizmat' },
  { key: 'pending', label: 'Kutilmoqda' },
  { key: 'booked', label: 'Band' },
]

export default function AdminComputers() {
  const hall = useHall()
  const [filter, setFilter] = useState('all')
  const [settingsFor, setSettingsFor] = useState(null)
  const [toast, setToast] = useState('')

  function notify(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const visible = hall.machines.filter((m) =>
    filter === 'all' ? true : m.zone === filter || (filter === 'PS5' && m.zone === 'PS5')
  )

  function fm(t) {
    const h = Math.floor(t / 60)
    const m = t % 60
    return h ? `${h} soat ${m}m` : `${m}m`
  }

  function handleSetting(machine, mode) {
    hall.setMachineStatus(machine.id, mode)
    setSettingsFor(null)
    notify(`${machine.name} → ${mode}`)
  }

  return (
    <div className="page">
      <section className="group-actions card">
        <div className="group-head">
          <h3 className="section-title">Guruhli harakatlar</h3>
          <button className="btn btn-ghost" onClick={() => notify('Barcha zonalar qayta yuklandi')}>
            <IconPlus size={16} /> Yangilash
          </button>
        </div>
        {ZONE_FILTERS.slice(1).map((z) => (
          <div className="zone-row" key={z.key}>
            <span className="zone-name">{ZONE_LABELS[z.key]}</span>
            <span className="muted small">
              {hall.machines.filter((m) => m.zone === z.key).length} ta
            </span>
            <div className="zone-actions">
              <button
                className="power-btn on"
                onClick={() => {
                  hall.groupPower(z.key, true)
                  notify(`${ZONE_LABELS[z.key]} zonasi yoqildi (YONIQ)`)
                }}
              >
                <IconPower size={15} /> YONIQ
              </button>
              <button
                className="power-btn off"
                onClick={() => {
                  hall.groupPower(z.key, false)
                  notify(`${ZONE_LABELS[z.key]} zonasi o‘chirildi (O'CHIQ)`)
                }}
              >
                <IconMinus size={15} /> O'CHIQ
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="filters">
        {ZONE_FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </section>

      <section className="admin-machine-grid">
        {visible.map((m) => (
          <div key={m.id} className="admin-machine card">
            <div className="machine-top">
              <span className="machine-name">{m.name}</span>
              <span className={`badge ${STATUS_CLASS[m.status]}`}>{STATUS_LABELS[m.status]}</span>
            </div>
            <p className="machine-zone muted small">
              {ZONE_LABELS[m.zone]} · {fmt(m.price)} so&#39;m/soat
            </p>

            <div className="admin-stats">
              <div className="stat-chip">
                <span className="muted small">Harorat</span>
                <b className={m.temp >= TEMP_HIGH ? 'temp-hot' : ''}>{Math.round(m.temp)}°C</b>
              </div>
              <div className="stat-chip">
                <span className="muted small">Ish vaqti</span>
                <b>{m.uptime} h</b>
              </div>
              <div className="stat-chip">
                <span className="muted small">Sessiya</span>
                <b className={m.paused ? 'temp-hot' : ''}>
                  {m.powered && m.status === 'booked' ? fm(m.sessionMin) : '—'}
                </b>
              </div>
            </div>

            <div className="admin-actions">
              <button
                className={`power-btn on ${m.powered ? 'active' : ''}`}
                onClick={() => {
                  hall.setPower(m.id, true)
                }}
                title="Yoqish"
              >
                <IconPower size={15} /> YONIQ
              </button>
              <button
                className="power-btn off"
                onClick={() => {
                  hall.setPower(m.id, false)
                }}
                title="O‘chirish"
              >
                <IconPower size={15} /> O'CHIQ
              </button>
              <button
                className="power-btn pause"
                disabled={!(m.powered && m.status === 'booked')}
                onClick={() => {
                  hall.togglePause(m.id)
                }}
                title={m.paused ? 'Davom etish' : 'Pauza qilish'}
              >
                {m.paused ? <IconPlay size={15} /> : <IconPause size={15} />}
                {m.paused ? 'Davom etish' : 'Pauza'}
              </button>
              <div className="settings-wrap">
                <button
                  className={`power-btn gear ${settingsFor === m.id ? 'active' : ''}`}
                  onClick={() => setSettingsFor(settingsFor === m.id ? null : m.id)}
                  title="Sozlamalar"
                >
                  <IconSettings size={15} />
                </button>
                {settingsFor === m.id ? (
                  <div className="settings-menu">
                    <p className="settings-title">Texnik holat</p>
                    {MODE_OPTIONS.map((mo) => (
                      <button
                        key={mo.key}
                        className={`settings-opt ${m.status === mo.key ? 'active' : ''}`}
                        onClick={() => handleSetting(m, mo.key)}
                      >
                        <span className={`dot dot-${mo.key}`} /> {mo.label}
                      </button>
                    ))}
                    <button className="settings-close" onClick={() => setSettingsFor(null)}>
                      <IconX size={13} /> Yopish
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </section>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}