import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { useHall } from '../hall/HallContext.jsx'
import { FAVORITES, STATUS_LABELS, fmt } from '../data.js'
import {
  IconCoin,
  IconGift,
  IconClock,
  IconMap,
  IconBolt,
  IconCrown,
  IconCheck,
} from '../components/Icons.jsx'

const STATUS_BADGE = {
  available: 'st-available',
  booked: 'st-booked',
  maintenance: 'st-maintenance',
  pending: 'st-pending',
}

export default function Home() {
  const { user } = useAuth()
  const { machines, bookings, balance, bonus, availableCount, totalCount } = useClub()
  const { pricing } = useHall()
  const navigate = useNavigate()

  const heroes = [
    { icon: IconCoin, label: 'Balans', value: fmt(balance), unit: 'UZS', sub: 'Hisobingizdagi mablag\u2018' },
    { icon: IconGift, label: 'Bonus ballar', value: bonus, unit: 'ball', sub: '100 ball = 15,000 so\u2018m' },
    { icon: IconClock, label: "O'ynalgan soat", value: user.hours ?? 184, unit: 'soat', sub: 'Jami o\u2018yin vaqti' },
    { icon: IconMap, label: "Bo'sh kompyuter", value: `${availableCount} / ${totalCount}`, unit: '', sub: 'Hozir bo\u2018sh o\u2018rinlar' },
  ]

  const favorites = FAVORITES.map((id) => machines.find((m) => m.id === id)).filter(Boolean)

  return (
    <div className="page">
      <section className="welcome card">
        <div>
          <p className="welcome-kicker">
            <span className="live-dot" /> Hozir {availableCount} ta joy bo&#39;sh (jami {totalCount})
          </p>
          <h2>
            Xush kelibsiz, <span className="grad-text">{user.name}</span>!
          </h2>
          <p className="muted">Bugun qaysi zonada o&#39;ynashni xohlaysiz?</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/map')}>
          Hoziroq bron qiling
        </button>
      </section>

      <section className="metrics">
        {heroes.map((h) => {
          const Icon = h.icon
          return (
            <div className="metric card" key={h.label}>
              <div className="metric-icon">
                <Icon size={22} />
              </div>
              <div>
                <p className="metric-label">{h.label}</p>
                <p className="metric-value">
                  {h.value}
                  {h.unit ? <span className="metric-unit"> {h.unit}</span> : null}
                </p>
                <p className="muted small">{h.sub}</p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="quick card">
        <h3 className="section-title">Tezkor o&#39;tish</h3>
        <div className="quick-grid">
          <button className="quick-item" onClick={() => navigate('/map')}>
            <div className="quick-icon accent1">
              <IconMap size={22} />
            </div>
            <div>
              <strong>Interaktiv xarita</strong>
              <span>Zaldagi kompyuterlar joylashuvi</span>
            </div>
          </button>
          <button className="quick-item" onClick={() => navigate('/map')}>
            <div className="quick-icon accent2">
              <IconBolt size={22} />
            </div>
            <div>
              <strong>Bron qilish</strong>
              <span>3 bosqichli tezkor joy band qilish</span>
            </div>
          </button>
          <button className="quick-item" onClick={() => navigate('/profile')}>
            <div className="quick-icon accent3">
              <IconGift size={22} />
            </div>
            <div>
              <strong>Sodiqlik dasturi</strong>
              <span>Ballarni pulga almashtirish</span>
            </div>
          </button>
        </div>
      </section>

      <section className="pricing card">
        <div className="pricing-head">
          <h3 className="section-title">Narxlar va tariflar</h3>
          <span className="muted small">so&#39;m / soat</span>
        </div>
        <div className="pricing-grid">
          {pricing.map((p) => (
            <div className="price-card" key={p.key}>
              <div className="price-top">
                <span className="zone-badge">{p.badge}</span>
                {p.key === 'VIP' ? <IconCrown size={16} /> : null}
              </div>
              <h4>{p.label}</h4>
              <p className="price-val">
                <span className="grad-text">{fmt(p.price)}</span>
                <span className="muted small"> / soat</span>
              </p>
              <ul className="spec-list">
                {p.specs.map((s) => (
                  <li key={s}>
                    <span className="dot-check">
                      <IconCheck size={12} />
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <h3 className="section-title">Sevimlilar</h3>
          {favorites.length ? (
            <ul className="fav-list">
              {favorites.map((m) => (
                <li key={m.id} className="fav-row">
                  <button className="fav-main" onClick={() => navigate('/map')}>
                    <strong>{m.name}</strong>
                    <span className="muted small">
                      {m.zone} · {fmt(m.price)} so&#39;m/soat
                    </span>
                  </button>
                  <span className={`badge ${STATUS_BADGE[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sevimlilar yo&#39;q</p>
          )}
        </section>

        <section className="card">
          <h3 className="section-title">Mening bronlarim</h3>
          {bookings.length ? (
            <ul className="book-list">
              {bookings.map((b) => (
                <li key={b.id} className="book-row">
                  <div className="book-date">
                    <strong>{b.date.slice(8, 10)}</strong>
                    <span>{b.date.slice(0, 7)}</span>
                  </div>
                  <div className="book-info">
                    <strong>{b.machine}</strong>
                    <span className="muted small">
                      {b.time} · {b.hours} soat
                    </span>
                  </div>
                  <div className="book-right">
                    <span className="muted small">{fmt(b.price)} so&#39;m</span>
                    <span className={`badge ${b.status === 'confirmed' ? 'st-available' : 'st-pending'}`}>
                      {b.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Bronlar yo&#39;q</p>
          )}
        </section>
      </div>
    </div>
  )
}