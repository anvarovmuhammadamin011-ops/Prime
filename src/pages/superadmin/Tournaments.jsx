import { useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { GAMES, STATUS_LABELS, TOURNAMENT_STATUS, fmt } from '../../data/tournaments.js'
import {
  IconTrophy,
  IconUsers,
  IconClock,
  IconCoin,
  IconCheck,
} from '../../components/Icons.jsx'

export default function SuperTournaments() {
  const navigate = useNavigate()
  const { tournaments, getTeamsForTournament, getMatchesForTournament } = useTournament()

  const gameName = (id) => GAMES.find((g) => g.id === id)?.name || id

  const totalTeams = tournaments.reduce(
    (sum, t) => sum + getTeamsForTournament(t.id).length,
    0
  )
  const totalMatches = tournaments.reduce(
    (sum, t) => sum + getMatchesForTournament(t.id).length,
    0
  )
  const completedMatches = tournaments.reduce(
    (sum, t) =>
      sum + getMatchesForTournament(t.id).filter((m) => m.status === 'completed').length,
    0
  )
  const totalPrize = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0)

  const stats = [
    { icon: IconTrophy, label: 'Turnirlar', value: tournaments.length },
    { icon: IconUsers, label: 'Jamoalar', value: totalTeams },
    { icon: IconCoin, label: 'Jami sovrin', value: `${fmt(totalPrize)} so'm` },
    { icon: IconCheck, label: 'Matchlar', value: `${completedMatches} / ${totalMatches}` },
  ]

  return (
    <div className="page">
      <section className="t-super-stats">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div className="t-super-stat card" key={s.label}>
              <Icon size={22} />
              <div>
                <p className="t-super-stat-value">{s.value}</p>
                <p className="t-super-stat-label">{s.label}</p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="t-super-list card">
        <h3 className="section-title">
          <IconTrophy size={18} /> Barcha turnirlar
        </h3>
        <div className="t-super-table">
          {tournaments.map((t) => {
            const teams = getTeamsForTournament(t.id)
            const matches = getMatchesForTournament(t.id)
            const completed = matches.filter((m) => m.status === 'completed').length
            return (
              <div className="t-super-row" key={t.id}>
                <div className="t-super-row-info">
                  <span className="t-game-badge">{gameName(t.game)}</span>
                  <div>
                    <p className="t-super-row-name">{t.name}</p>
                    <p className="muted small">{t.date} · {t.startTime}</p>
                  </div>
                </div>
                <div className="t-super-row-meta">
                  <span className={`t-status t-status-${t.status}`}>
                    {STATUS_LABELS[t.status]}
                  </span>
                  <span><IconUsers size={12} /> {teams.length}</span>
                  <span><IconCheck size={12} /> {completed}/{matches.length}</span>
                  {t.prizePool > 0 && (
                    <span className="t-prize"><IconCoin size={12} /> {fmt(t.prizePool)}</span>
                  )}
                </div>
              </div>
            )
          })}

          {tournaments.length === 0 && (
            <div className="t-empty">
              <IconTrophy size={32} />
              <p className="muted">Turnirlar yo'q</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
