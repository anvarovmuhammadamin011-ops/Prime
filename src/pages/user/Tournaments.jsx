import { useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { GAMES, STATUS_LABELS, TOURNAMENT_STATUS, MATCH_STATUS, fmt } from '../../data/tournaments.js'
import { IconTrophy, IconClock, IconUsers, IconCoin } from '../../components/Icons.jsx'

export default function Tournaments() {
  const { tournaments, getTeamsForTournament, getMatchesForTournament } = useTournament()
  const { user } = useAuth()
  const navigate = useNavigate()

  const gameName = (id) => GAMES.find((g) => g.id === id)?.name || id

  const activeTournaments = tournaments.filter(
    (t) => t.status === TOURNAMENT_STATUS.registration || t.status === TOURNAMENT_STATUS.ongoing
  )
  const upcomingTournaments = tournaments.filter((t) => t.status === TOURNAMENT_STATUS.upcoming)
  const finishedTournaments = tournaments.filter((t) => t.status === TOURNAMENT_STATUS.finished)

  const renderCard = (t) => {
    const teams = getTeamsForTournament(t.id)
    return (
      <div className="t-card card" key={t.id}>
        <div className="t-card-header">
          <span className="t-game-badge">{gameName(t.game)}</span>
          <span className={`t-status t-status-${t.status}`}>{STATUS_LABELS[t.status]}</span>
        </div>
        <h3 className="t-card-title">{t.name}</h3>
        <div className="t-card-info">
          <span><IconClock size={14} /> {t.date} · {t.startTime}</span>
          <span><IconUsers size={14} /> {t.branch}</span>
        </div>
        <div className="t-card-meta">
          <span className="t-meta-item">
            <IconUsers size={14} />
            {teams.length} / {t.maxTeams} jamoa
          </span>
          <span className="t-meta-item">
            <IconCoin size={14} />
            {t.entryFee > 0 ? `${fmt(t.entryFee)} so'm` : 'BEPUL'}
          </span>
          {t.prizePool > 0 && (
            <span className="t-meta-item t-prize">
              <IconTrophy size={14} />
              {fmt(t.prizePool)} so'm
            </span>
          )}
        </div>

        {t.status === TOURNAMENT_STATUS.finished && t.winnerId && (
          <div className="t-card-winner">
            <IconTrophy size={14} />
            <span>G'olib: <strong>{teams.find((tm) => tm.id === t.winnerId)?.name || "Noma'lum"}</strong></span>
          </div>
        )}

        {t.status === TOURNAMENT_STATUS.finished && (
          <FinishedMatchPreview tournamentId={t.id} getMatchesForTournament={getMatchesForTournament} />
        )}

        <button className="btn btn-primary t-card-btn" onClick={() => navigate(`/tournaments/${t.id}`)}>
          {t.status === TOURNAMENT_STATUS.finished ? 'Natijalarni ko\'rish' : 'Ko\'rish'}
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="t-hero card">
        <div>
          <p className="welcome-kicker">
            <span className="live-dot" /> Turnirlar
          </p>
          <h2>
            O'ynang, <span className="grad-text">yuting</span>, g'alaba qozoning!
          </h2>
          <p className="muted">Turnirlarga qo'shiling va sovrinlarni qo'lga kiriting</p>
        </div>
      </section>

      {activeTournaments.length > 0 && (
        <section className="t-section">
          <h3 className="section-title">Faol turnirlar</h3>
          <div className="t-grid">{activeTournaments.map(renderCard)}</div>
        </section>
      )}

      {upcomingTournaments.length > 0 && (
        <section className="t-section">
          <h3 className="section-title">Kutilayotgan turnirlar</h3>
          <div className="t-grid">{upcomingTournaments.map(renderCard)}</div>
        </section>
      )}

      {finishedTournaments.length > 0 && (
        <section className="t-section">
          <h3 className="section-title">Tugagan turnirlar</h3>
          <div className="t-grid">{finishedTournaments.map(renderCard)}</div>
        </section>
      )}

      {tournaments.length === 0 && (
        <div className="t-empty card">
          <IconTrophy size={48} />
          <h3>Hozircha turnirlar yo'q</h3>
          <p className="muted">Tez orada yangi turnirlar qo'shiladi</p>
        </div>
      )}
    </div>
  )
}

function FinishedMatchPreview({ tournamentId, getMatchesForTournament }) {
  const matches = getMatchesForTournament(tournamentId)
  const completed = matches.filter((m) => m.status === MATCH_STATUS.completed)

  if (completed.length === 0) return null

  const finalMatch = completed.reduce((latest, m) => (m.round > latest.round ? m : latest), completed[0])
  if (!finalMatch) return null

  const teamAWon = finalMatch.winnerId === finalMatch.teamAId

  return (
    <div className="t-card-match-preview">
      <span className="t-card-match-label">Final natijasi:</span>
      <div className="t-card-match-teams">
        <span className={teamAWon ? 't-card-match-winner' : ''}>
          {finalMatch.teamAName} <strong>{finalMatch.scoreA}</strong>
        </span>
        <span className="t-card-match-sep">:</span>
        <span className={!teamAWon ? 't-card-match-winner' : ''}>
          <strong>{finalMatch.scoreB}</strong> {finalMatch.teamBName}
        </span>
      </div>
    </div>
  )
}
