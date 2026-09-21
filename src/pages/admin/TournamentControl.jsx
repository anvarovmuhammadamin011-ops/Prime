import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import {
  GAMES,
  STATUS_LABELS,
  TOURNAMENT_STATUS,
  MATCH_STATUS,
  getRoundName,
  fmt,
} from '../../data/tournaments.js'
import {
  IconTrophy,
  IconUsers,
  IconCheck,
  IconX,
  IconPlay,
  IconDesktop,
  IconCoin,
  IconClock,
} from '../../components/Icons.jsx'

export default function TournamentControl() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    tournaments,
    getTeamsForTournament,
    getMatchesForTournament,
    markTeamPaid,
    generateTournamentBracket,
    startTournament,
    finishTournament,
    updateMatchScore,
    advanceWinnerToNextRound,
    startMatch,
  } = useTournament()

  const tournament = tournaments.find((t) => t.id === id)
  if (!tournament) {
    return (
      <div className="page">
        <div className="t-empty card">
          <IconTrophy size={48} />
          <h3>Turnir topilmadi</h3>
          <button className="btn btn-primary" onClick={() => navigate('/admin/tournaments')}>
            Orqaga
          </button>
        </div>
      </div>
    )
  }

  const teams = getTeamsForTournament(tournament.id)
  const matches = getMatchesForTournament(tournament.id)
  const gameName = GAMES.find((g) => g.id === tournament.game)?.name || tournament.game

  const rounds = []
  matches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = []
    rounds[m.round].push(m)
  })

  const handleMatchResult = (matchId, scoreA, scoreB, teamAId, teamBId) => {
    const winnerId = scoreA > scoreB ? teamAId : teamBId
    updateMatchScore(matchId, parseInt(scoreA), parseInt(scoreB), winnerId)
    advanceWinnerToNextRound(matchId)
  }

  const handleStartTournament = () => {
    generateTournamentBracket(tournament.id)
    startTournament(tournament.id)
  }

  const isFinal = (match) => {
    const totalRounds = rounds.length
    return match.round === totalRounds - 1 && match.status === MATCH_STATUS.completed
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/admin/tournaments')}>
        ← Turnirlar
      </button>

      <section className="t-control-header card">
        <div className="t-control-header-top">
          <div>
            <span className="t-game-badge t-game-badge-lg">{gameName}</span>
            <h2>{tournament.name}</h2>
          </div>
          <span className={`t-status t-status-${tournament.status}`}>
            {STATUS_LABELS[tournament.status]}
          </span>
        </div>

        <div className="t-control-stats">
          <div className="t-stat">
            <IconUsers size={18} />
            <div>
              <p className="t-stat-value">{teams.length}</p>
              <p className="t-stat-label">Jamoalar</p>
            </div>
          </div>
          <div className="t-stat">
            <IconCoin size={18} />
            <div>
              <p className="t-stat-value">{teams.filter((t) => t.isPaid).length}</p>
              <p className="t-stat-label">To'langan</p>
            </div>
          </div>
          <div className="t-stat">
            <IconClock size={18} />
            <div>
              <p className="t-stat-value">{tournament.date}</p>
              <p className="t-stat-label">{tournament.startTime}</p>
            </div>
          </div>
          <div className="t-stat">
            <IconTrophy size={18} />
            <div>
              <p className="t-stat-value">
                {tournament.prizePool > 0 ? `${fmt(tournament.prizePool)}` : 'BEPUL'}
              </p>
              <p className="t-stat-label">Sovrin</p>
            </div>
          </div>
        </div>

        {tournament.status === TOURNAMENT_STATUS.registration && teams.length >= 2 && (
          <div className="t-control-actions">
            <button className="btn btn-primary" onClick={handleStartTournament}>
              <IconPlay size={16} /> Turnirni boshlash
            </button>
          </div>
        )}
      </section>

      <section className="t-control-teams card">
        <h3 className="section-title">
          <IconUsers size={18} /> Jamoalar ({teams.length})
        </h3>
        <div className="t-admin-teams-table">
          {teams.map((team, i) => (
            <div className="t-admin-team-row" key={team.id}>
              <span className="t-team-seed">#{i + 1}</span>
              <span className="t-team-name">{team.name}</span>
              <span className="t-team-members-count">
                {team.members.length} / {tournament.teamSize}
              </span>
              <span className={`t-team-ready ${team.isReady ? 't-ready' : 't-not-ready'}`}>
                {team.isReady ? '✓' : '✕'}
              </span>
              <span className={`t-team-paid ${team.isPaid ? 't-paid' : 't-unpaid'}`}>
                {team.isPaid ? 'To\'langan' : 'To\'lanmagan'}
              </span>
              {!team.isPaid && (
                <button
                  className="btn btn-secondary btn-xs"
                  onClick={() => markTeamPaid(team.id)}
                >
                  <IconCheck size={12} /> Tasdiqlash
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {tournament.bracketGenerated && rounds.length > 0 && (
        <section className="t-control-bracket card">
          <h3 className="section-title">
            <IconTrophy size={18} /> Bracket
          </h3>
          <div className="t-admin-bracket">
            {rounds.map((roundMatches, roundIdx) => (
              <div className="t-admin-round" key={roundIdx}>
                <h4 className="t-admin-round-title">
                  {getRoundName(roundIdx, rounds.length - 1)}
                </h4>
                <div className="t-admin-round-matches">
                  {roundMatches.map((match) => (
                    <AdminMatchCard
                      key={match.id}
                      match={match}
                      onResult={handleMatchResult}
                      onStart={startMatch}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tournament.status === TOURNAMENT_STATUS.ongoing && (
        <section className="t-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (confirm('Turnirni tugatishni xohlaysizmi?')) {
                const lastRound = rounds[rounds.length - 1]
                const finalMatch = lastRound?.find((m) => m.status === MATCH_STATUS.completed)
                finishTournament(tournament.id, finalMatch?.winnerId || null)
                navigate('/admin/tournaments')
              }
            }}
          >
            Turnirni tugatish
          </button>
        </section>
      )}
    </div>
  )
}

function AdminMatchCard({ match, onResult, onStart }) {
  const [scoreA, setScoreA] = useState(match.scoreA || 0)
  const [scoreB, setScoreB] = useState(match.scoreB || 0)

  const isPending = match.status === MATCH_STATUS.pending
  const isLive = match.status === MATCH_STATUS.live
  const isCompleted = match.status === MATCH_STATUS.completed
  const hasBothTeams = match.teamAId && match.teamBId

  return (
    <div className={`t-admin-match ${isCompleted ? 't-admin-match-done' : ''} ${isLive ? 't-admin-match-live' : ''}`}>
      <div className="t-admin-match-teams">
        <div className="t-admin-match-team">
          <span className="t-admin-match-name">{match.teamAName || 'BYE'}</span>
          {isCompleted && <span className="t-admin-match-score">{match.scoreA}</span>}
          {(isLive || isPending) && hasBothTeams && (
            <input
              type="number"
              className="t-score-input"
              min={0}
              value={scoreA}
              onChange={(e) => setScoreA(parseInt(e.target.value) || 0)}
            />
          )}
        </div>
        <span className="t-admin-match-vs">VS</span>
        <div className="t-admin-match-team">
          <span className="t-admin-match-name">{match.teamBName || 'BYE'}</span>
          {isCompleted && <span className="t-admin-match-score">{match.scoreB}</span>}
          {(isLive || isPending) && hasBothTeams && (
            <input
              type="number"
              className="t-score-input"
              min={0}
              value={scoreB}
              onChange={(e) => setScoreB(parseInt(e.target.value) || 0)}
            />
          )}
        </div>
      </div>

      <div className="t-admin-match-actions">
        {isPending && hasBothTeams && (
          <button className="btn btn-secondary btn-xs" onClick={() => onStart(match.id)}>
            <IconPlay size={12} /> Boshlash
          </button>
        )}
        {isLive && hasBothTeams && (
          <button
            className="btn btn-primary btn-xs"
            onClick={() => onResult(match.id, scoreA, scoreB, match.teamAId, match.teamBId)}
          >
            <IconCheck size={12} /> Tasdiqlash
          </button>
        )}
        {isCompleted && match.winnerId && (
          <span className="t-admin-match-winner">
            <IconTrophy size={12} />{' '}
            {match.winnerId === match.teamAId ? match.teamAName : match.teamBName}
          </span>
        )}
      </div>
    </div>
  )
}
