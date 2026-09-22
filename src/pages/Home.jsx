import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { useTournament } from '../tournament/TournamentContext.jsx'
import { FAVORITES, STATUS_LABELS, fmt, levelFor } from '../data.js'
import { GAMES, TOURNAMENT_STATUS } from '../data/tournaments.js'
import {
  IconDesktop,
  IconTrophy,
  IconCalendar,
  IconCoin,
  IconClock,
  IconBolt,
  IconCrown,
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
  const { tournaments } = useTournament()
  const navigate = useNavigate()

  const first = (user.name || '').trim().split(' ')[0] || 'mehmon'
  const lvl = levelFor(user.hours ?? 0)
  const levelPct = Math.min(100, Math.round((lvl.cur / lvl.total) * 100))

  const favorites = FAVORITES.map((id) => machines.find((m) => m.id === id)).filter(Boolean)

  const upcoming = tournaments
    .filter((t) => t.status === TOURNAMENT_STATUS.registration || t.status === TOURNAMENT_STATUS.upcoming)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0]

  const nextBooking = bookings.find((b) => b.status === 'confirmed')

  const qa = [
    { to: '/map', label: 'PC', sub: 'Bron qilish', icon: IconDesktop, cls: 'qa-violet' },
    { to: '/tournaments', label: 'Turnir', sub: "Ro'yxatdan o'tish", icon: IconTrophy, cls: 'qa-blue' },
    { to: '/map', label: 'Bron', sub: 'Joy band qilish', icon: IconCalendar, cls: 'qa-green' },
    { to: '/profile', label: 'Bar & Bonus', sub: 'Balans va ballar', icon: IconCoin, cls: 'qa-cyan' },
  ]

  return (
    <div className="page home-page">
      <section className="home-hello">
        <div>
          <p className="home-kicker">
            <span className="live-dot" /> PRIME GAME CLUB
          </p>
          <h2>
            Salom, <span className="grad-text">{first}</span> 👋
          </h2>
          <p className="muted">Bugun nima o'ynaymiz?</p>
        </div>
        <div className="top-avatar profile-avatar" onClick={() => navigate('/profile')}>
          {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
        </div>
      </section>

      <button className="home-hero card" onClick={() => navigate('/map')}>
        <div className="home-hero-icon">
          <IconDesktop size={30} />
        </div>
        <div className="home-hero-info">
          <p className="home-hero-count">
            {availableCount} ta PC <span className="muted">bo'sh</span>
          </p>
          <p className="home-hero-sub">
            <span className="home-open-dot" /> Club ochiq · 24/7
          </p>
        </div>
        <div className="home-hero-cta">
          <IconBolt size={18} />
          <span>BOOK PC</span>
        </div>
      </button>

      <section>
        <h3 className="section-title">Tezkor harakatlar</h3>
        <div className="qa-grid">
          {qa.map((q) => {
            const Icon = q.icon
            return (
              <button className={`qa-card ${q.cls}`} key={q.label} onClick={() => navigate(q.to)}>
                <Icon size={22} />
                <strong>{q.label}</strong>
                <span>{q.sub}</span>
              </button>
            )
          })}
        </div>
      </section>

      {upcoming && (
        <section className="upcoming card">
          <div className="upcoming-head">
            <span className="t-game-badge">{GAMES.find((g) => g.id === upcoming.game)?.name || upcoming.game}</span>
            <span className="upcoming-tag">UPCOMING</span>
          </div>
          <h3 className="upcoming-title">🏆 {upcoming.name}</h3>
          <div className="upcoming-meta">
            <span><IconClock size={14} /> {upcoming.date} · {upcoming.startTime}</span>
            <span className="upcoming-teams">{upcoming.maxTeams} ta jamoa</span>
          </div>
          {upcoming.prizePool > 0 && (
            <div className="upcoming-prize">
              <IconCrown size={15} /> {fmt(upcoming.prizePool)} so'm sovrin
            </div>
          )}
          <button className="btn btn-primary btn-block" onClick={() => navigate(`/tournaments/${upcoming.id}`)}>
            Ko'rish →
          </button>
        </section>
      )}

      <section className="activity card">
        <div className="activity-head">
          <h3 className="section-title">Sizning faolligingiz</h3>
          <span className="activity-level">LEVEL {lvl.level}</span>
        </div>
        <div className="activity-stats">
          <div>
            <strong>{(user.hours ?? 0)}h</strong>
            <span className="muted small">O'ynalgan</span>
          </div>
          <div>
            <strong>{fmt(balance)}</strong>
            <span className="muted small">Balans · UZS</span>
          </div>
          <div>
            <strong>{bonus}</strong>
            <span className="muted small">Bonus ball</span>
          </div>
        </div>
        <div className="level-bar">
          <div className="level-bar-head">
            <span className="muted small">{fmt(lvl.cur)} / {fmt(lvl.total)} XP</span>
            <span className="muted small">LEVEL {lvl.level} → {lvl.level + 1}</span>
          </div>
          <div className="progress">
            <span style={{ width: `${levelPct}%` }} />
          </div>
        </div>
      </section>

      {nextBooking && (
        <button className="home-session card" onClick={() => navigate('/session')}>
          <div>
            <p className="home-session-label">Keyingi sessiya</p>
            <strong>{nextBooking.machine}</strong>
            <p className="muted small">{nextBooking.date} · {nextBooking.time}</p>
          </div>
          <span className="badge st-available">Tasdiqlangan</span>
        </button>
      )}

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
                      {m.zone} · {fmt(m.price)} so'm/soat
                    </span>
                  </button>
                  <span className={`badge ${STATUS_BADGE[m.status]}`}>{STATUS_LABELS[m.status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Sevimlilar yo'q</p>
          )}
        </section>

        <section className="card">
          <h3 className="section-title">Mening bronlarim</h3>
          {bookings.length ? (
            <ul className="book-list">
              {bookings.slice(0, 3).map((b) => (
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
                    <span className="muted small">{fmt(b.price)} so'm</span>
                    <span className={`badge ${b.status === 'confirmed' ? 'st-available' : 'st-pending'}`}>
                      {b.status === 'confirmed' ? 'Tasdiqlangan' : 'Kutilmoqda'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Bronlar yo'q</p>
          )}
        </section>
      </div>
    </div>
  )
}