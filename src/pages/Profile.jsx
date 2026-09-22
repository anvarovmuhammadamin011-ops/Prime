import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { ACHIEVEMENTS, REFERRAL_CODE, fmt } from '../data.js'
import {
  IconCoin,
  IconGift,
  IconClock,
  IconCalendar,
  IconCrown,
  IconCopy,
  IconCheck,
} from '../components/Icons.jsx'

export default function Profile() {
  const { user } = useAuth()
  const { balance, bonus, bookings, redeem } = useClub()
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')

  const hours = user.hours ?? 184

  const metrics = [
    { icon: IconCoin, label: 'Balans', value: fmt(balance), unit: 'UZS' },
    { icon: IconGift, label: 'Bonus ballar', value: bonus, unit: 'ball' },
    { icon: IconClock, label: "O'ynalgan", value: hours, unit: 'soat' },
    { icon: IconCalendar, label: 'Bronlar', value: bookings.length, unit: 'ta' },
  ]

  const progress = Math.min(100, Math.round((bonus / 100) * 100))
  const next40 = 100 - (bonus % 100)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(REFERRAL_CODE)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = REFERRAL_CODE
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setToast('Referral kod nusxalandi')
    setTimeout(() => setCopied(false), 1600)
    setTimeout(() => setToast(''), 2400)
  }

  function handleRedeem() {
    if (bonus < 100) return
    if (redeem()) {
      setToast('15,000 so\u2018m balansga qo\u2018shildi')
      setTimeout(() => setToast(''), 2400)
    }
  }

  const initials = (user.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const tierCls = user.tier === 'Premium' ? 'premium' : 'standard'

  return (
    <div className="page">
      <div className="profile-hero card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initials}</div>
          <span className="online-dot" />
        </div>
        <div className="profile-meta">
          <h2>{user.name}</h2>
          <p className="muted">{user.phone}</p>
          <p className="muted small">
            A&#39;zo bo&#39;lgan sana: {user.joined}
          </p>
          <span className={`tier-badge ${tierCls}`}>
            <IconCrown size={13} /> {user.tier === 'Premium' ? 'VIP a\u2018zo' : user.tier}
          </span>
        </div>
      </div>

      <section className="metrics profile-stats">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div className="metric card" key={m.label}>
              <div className="metric-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="metric-label">{m.label}</p>
                <p className="metric-value">
                  {m.value}
                  <span className="metric-unit"> {m.unit}</span>
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="card">
        <div className="loyalty-head">
          <div>
            <h3 className="section-title">Sodiqlik dasturi</h3>
            <p className="muted small">
              Har 100 ball to&#39;plaganingizda <b>15,000 so&#39;m</b>ga almashtirish imkoniyati.
            </p>
          </div>
          <div className="loyalty-pct">
            <span>{progress}%</span>
            <b>Bonus</b>
          </div>
        </div>
        <div className="progress-block">
          <div className="progress-head">
            <span className="muted small">Keyingi mukofotgacha: {next40} ball</span>
            <b className="small">{bonus % 100}/100</b>
          </div>
          <div className="progress progress-anim">
            <span style={{ width: `${Math.min(100, bonus % 100)}%` }} />
          </div>
        </div>
        <button
          className={`btn ${bonus >= 100 ? 'btn-primary' : ''} btn-block`}
          disabled={bonus < 100}
          onClick={handleRedeem}
        >
          Almashtirish · 15,000 so&#39;m
        </button>

        <div className="divider" />

        <h3 className="section-title">Do&#39;stni taklif qiling</h3>
        <p className="muted small">
          Referral kod orqali taklif qilingan har bir do&#39;st uchun ham siz, ham do&#39;stingiz{' '}
          <b>20,000 so&#39;m + 100 bonus ball</b> oladi.
        </p>
        <div className="referral-row">
          <code>{REFERRAL_CODE}</code>
          <button className="btn btn-ghost" onClick={copyCode}>
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            {copied ? 'Nusxalandi' : 'Nusxa olish'}
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Yutuqlar</h3>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`ach ${a.earned ? 'earned' : 'locked'}`}>
              <div className="ach-icon">
                <span>{a.emoji}</span>
              </div>
              <strong>{a.title}</strong>
              <span className="muted small">{a.desc}</span>
              {a.progress ? <span className="ach-progress">{a.progress}</span> : null}
              <span className={`badge ${a.earned ? 'st-available' : 'st-booked'}`}>
                {a.earned ? 'Ochilgan' : 'Yopiq'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Bron tarixi</h3>
        {bookings.length ? (
          <div className="table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Joy / Zona</th>
                  <th>Sana va vaqt</th>
                  <th>Davomiylik</th>
                  <th>Narx</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td data-label="Joy / Zona">
                      <b>{b.machine}</b>
                    </td>
                    <td data-label="Sana va vaqt" className="muted">
                      {b.date} · {b.time}
                    </td>
                    <td data-label="Davomiylik" className="muted">
                      {b.hours} soat
                    </td>
                    <td data-label="Narx">
                      {fmt(b.price)} so&#39;m
                    </td>
                    <td data-label="Holat">
                      <span
                        className={`badge ${b.status === 'confirmed' ? 'st-available' : 'st-pending'}`}
                      >
                        {b.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Bronlar hozircha yo&#39;q</p>
        )}
      </section>

      {toast ? (
        <div className="toast">
          <IconCheck size={16} /> {toast}
        </div>
      ) : null}
    </div>
  )
}