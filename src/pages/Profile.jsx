import { useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { ACHIEVEMENTS, REFERRAL_CODE, fmt } from '../data.js'
import { IconCoin, IconGift, IconClock, IconCopy, IconCheck, IconLock } from '../components/Icons.jsx'

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
    setTimeout(() => setCopied(false), 1600)
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

  return (
    <div className="page">
      <div className="profile-hero card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-meta">
          <h2>{user.name}</h2>
          <p className="muted">{user.phone}</p>
          <p className="muted small">
            A&#39;zo bo&#39;lgan sana: {user.joined} · Maqom:
            <span className={`tier-badge ${user.tier === 'Premium' ? 'premium' : ''}`}> {user.tier}</span>
          </p>
        </div>
      </div>

      <section className="metrics">
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

      <div className="two-col">
        <section className="card">
          <h3 className="section-title">Sodiqlik dasturi</h3>
          <p className="muted small">
            Har 100 ball to&#39;plaganingizda <b>15,000 so&#39;m</b>ga almashtirish imkoniyati.
          </p>
          <div className="progress-block">
            <div className="progress-head">
              <span className="muted small">
                Keyingi mukofotgacha: {next40} ball
              </span>
              <b className="small">
                {bonus % 100}/100
              </b>
            </div>
            <div className="progress">
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
          {bonus < 100 ? <p className="muted small">Yana {next40} ball to&#39;plang</p> : null}

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
                  {a.earned ? <IconCheck size={20} /> : <IconLock size={18} />}
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
      </div>

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
                    <td>
                      <b>{b.machine}</b>
                    </td>
                    <td className="muted">
                      {b.date} · {b.time}
                    </td>
                    <td className="muted">{b.hours} soat</td>
                    <td>{fmt(b.price)} so&#39;m</td>
                    <td>
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