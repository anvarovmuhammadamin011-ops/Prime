import { useParams, useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { getRoundName, MATCH_STATUS } from '../../data/tournaments.js'
import { IconTrophy, IconDesktop, IconCheck, IconX } from '../../components/Icons.jsx'

export default function TournamentBracket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tournaments, getMatchesForTournament } = useTournament()

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

  const matches = getMatchesForTournament(tournament.id)
  if (!tournament.bracketGenerated || matches.length === 0) {
    return (
      <div className="page">
        <button className="btn-back" onClick={() => navigate(`/tournaments/${id}`)}>
          ← Orqaga
        </button>
        <div className="t-empty card">
          <IconTrophy size={48} />
          <h3>Bracket hali yaratilmagan</h3>
          <p className="muted">Admin bracketni yaratgandan keyin bu yerda ko'rinadi</p>
        </div>
      </div>
    )
  }

  const rounds = []
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = []
    rounds[m.round].push(m)
  })

  const totalRounds = rounds.length

  const renderMatch = (match) => {
    const isCompleted = match.status === MATCH_STATUS.completed
    const isLive = match.status === MATCH_STATUS.live
    const hasWinner = match.winnerId !== null
    const teamAWon = hasWinner && match.winnerId === match.teamAId
    const teamBWon = hasWinner && match.winnerId === match.teamBId
    const hasBothTeams = match.teamAId && match.teamBId

    return (
      <div
        className={`bracket-match ${isLive ? 'bracket-match-live' : ''} ${isCompleted ? 'bracket-match-done' : ''}`}
        key={match.id}
      >
        <div className={`bracket-team ${teamAWon ? 'bracket-winner' : ''} ${isCompleted && !teamAWon && hasBothTeams ? 'bracket-loser' : ''}`}>
          <span className="bracket-team-name">
            {teamAWon && <IconTrophy size={12} className="bracket-trophy-icon" />}
            {match.teamAName || 'BYE'}
          </span>
          {isCompleted && hasBothTeams && (
            <span className={`bracket-score ${teamAWon ? 'bracket-score-win' : 'bracket-score-lose'}`}>
              {match.scoreA}
            </span>
          )}
          {isCompleted && hasBothTeams && (
            <span className={`bracket-result-icon ${teamAWon ? 'bracket-result-win' : 'bracket-result-lose'}`}>
              {teamAWon ? <IconCheck size={14} /> : <IconX size={14} />}
            </span>
          )}
        </div>

        <div className="bracket-vs">
          {isCompleted ? `${match.scoreA} : ${match.scoreB}` : 'VS'}
        </div>

        <div className={`bracket-team ${teamBWon ? 'bracket-winner' : ''} ${isCompleted && !teamBWon && hasBothTeams ? 'bracket-loser' : ''}`}>
          <span className="bracket-team-name">
            {teamBWon && <IconTrophy size={12} className="bracket-trophy-icon" />}
            {match.teamBName || 'BYE'}
          </span>
          {isCompleted && hasBothTeams && (
            <span className={`bracket-score ${teamBWon ? 'bracket-score-win' : 'bracket-score-lose'}`}>
              {match.scoreB}
            </span>
          )}
          {isCompleted && hasBothTeams && (
            <span className={`bracket-result-icon ${teamBWon ? 'bracket-result-win' : 'bracket-result-lose'}`}>
              {teamBWon ? <IconCheck size={14} /> : <IconX size={14} />}
            </span>
          )}
        </div>

        {isLive && (
          <div className="bracket-match-status bracket-status-live">
            <span className="live-dot" /> Jonliy
          </div>
        )}

        {match.assignedPCs && (match.assignedPCs.teamA.length > 0 || match.assignedPCs.teamB.length > 0) && (
          <div className="bracket-pcs">
            <IconDesktop size={10} />
            {[...match.assignedPCs.teamA, ...match.assignedPCs.teamB].join(', ')}
          </div>
        )}
      </div>
    )
  }

  const completedMatches = matches.filter((m) => m.status === MATCH_STATUS.completed)

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(`/tournaments/${id}`)}>
        ← {tournament.name}
      </button>

      <section className="t-bracket-header card">
        <h2>{tournament.name} — Bracket</h2>
        <div className="t-bracket-header-info">
          <span>{rounds.length} tur</span>
          <span>{matches.length} match</span>
          <span>{completedMatches.length} / {matches.length} tugallangan</span>
        </div>
      </section>

      <div className="bracket-container">
        {rounds.map((roundMatches, roundIdx) => (
          <div className="bracket-round" key={roundIdx}>
            <h4 className="bracket-round-title">
              {getRoundName(roundIdx, totalRounds - 1)}
            </h4>
            <div className="bracket-round-matches">
              {roundMatches.map((m) => renderMatch(m))}
            </div>
          </div>
        ))}
      </div>

      {completedMatches.length > 0 && (
        <section className="t-results-summary card">
          <h3 className="section-title">
            <IconTrophy size={18} /> Match natijalari
          </h3>
          <div className="t-results-list">
            {completedMatches.map((m) => {
              const winnerName = m.winnerId === m.teamAId ? m.teamAName : m.teamBName
              const loserName = m.winnerId === m.teamAId ? m.teamBName : m.teamAName
              return (
                <div className="t-result-item" key={m.id}>
                  <div className="t-result-teams">
                    <span className={`t-result-team ${m.winnerId === m.teamAId ? 't-result-winner' : 't-result-loser'}`}>
                      {m.teamAName}
                    </span>
                    <span className="t-result-score">
                      {m.scoreA} : {m.scoreB}
                    </span>
                    <span className={`t-result-team ${m.winnerId === m.teamBId ? 't-result-winner' : 't-result-loser'}`}>
                      {m.teamBName}
                    </span>
                  </div>
                  <div className="t-result-round">
                    {getRoundName(m.round, totalRounds - 1)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
