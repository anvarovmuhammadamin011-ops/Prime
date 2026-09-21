import { useParams, useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { IconTrophy, IconMedal } from '../../components/Icons.jsx'

export default function TournamentWinners() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tournaments, getTeamsForTournament } = useTournament()

  const tournament = tournaments.find((t) => t.id === id)
  if (!tournament) {
    return (
      <div className="page">
        <div className="t-empty card">
          <IconTrophy size={48} />
          <h3>Turnir topilmadi</h3>
          <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
            Orqaga
          </button>
        </div>
      </div>
    )
  }

  const teams = getTeamsForTournament(tournament.id)

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(`/tournaments/${id}`)}>
        ← {tournament.name}
      </button>

      <section className="t-winners-hero card">
        <IconTrophy size={48} className="t-winners-icon" />
        <h2>{tournament.name}</h2>
        <p className="muted">Natijalar</p>
      </section>

      <section className="t-podium">
        <div className="t-podium-card t-podium-2 card">
          <span className="t-podium-medal">🥈</span>
          <h3>2-o'rin</h3>
          <p className="t-podium-team">-</p>
          <span className="t-podium-prize">-</span>
        </div>
        <div className="t-podium-card t-podium-1 card">
          <span className="t-podium-medal">🥇</span>
          <h3>1-o'rin</h3>
          <p className="t-podium-team t-podium-champion">
            {tournament.winnerId
              ? teams.find((t) => t.id === tournament.winnerId)?.name || '-'
              : '-'}
          </p>
          <span className="t-podium-prize">
            {tournament.prizePool > 0 ? `${Math.floor(tournament.prizePool * 0.6).toLocaleString()} so'm` : '-'}
          </span>
        </div>
        <div className="t-podium-card t-podium-3 card">
          <span className="t-podium-medal">🥉</span>
          <h3>3-o'rin</h3>
          <p className="t-podium-team">-</p>
          <span className="t-podium-prize">-</span>
        </div>
      </section>

      <section className="t-results-list card">
        <h3 className="section-title">
          <IconMedal size={18} /> Barcha jamoalar
        </h3>
        <div className="t-results-table">
          {teams.map((team, i) => (
            <div className="t-result-row" key={team.id}>
              <span className="t-result-rank">#{i + 1}</span>
              <span className="t-result-name">{team.name}</span>
              <span className="t-result-members">{team.members.length} a'zo</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
