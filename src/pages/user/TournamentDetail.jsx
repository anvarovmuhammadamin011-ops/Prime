import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { GAMES, STATUS_LABELS, TOURNAMENT_STATUS, MATCH_STATUS, getRoundName, fmt } from '../../data/tournaments.js'
import {
  IconTrophy,
  IconClock,
  IconUsers,
  IconCoin,
  IconCheck,
  IconX,
  IconTeam,
  IconLink,
  IconCrown,
} from '../../components/Icons.jsx'

export default function TournamentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    tournaments,
    getTeamsForTournament,
    getMatchesForTournament,
    getTeamForUser,
    isUserInTournament,
    createTeamForTournament,
  } = useTournament()

  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [teamName, setTeamName] = useState('')

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

  const gameName = GAMES.find((g) => g.id === tournament.game)?.name || tournament.game
  const tournamentTeams = getTeamsForTournament(tournament.id)
  const tournamentMatches = getMatchesForTournament(tournament.id)
  const myTeam = getTeamForUser(tournament.id, user.phone)
  const isInTournament = isUserInTournament(tournament.id, user.phone)
  const canRegister =
    tournament.status === TOURNAMENT_STATUS.registration &&
    tournamentTeams.length < tournament.maxTeams &&
    !isInTournament

  const completedMatches = tournamentMatches.filter((m) => m.status === MATCH_STATUS.completed)

  const rounds = []
  tournamentMatches.forEach((m) => {
    if (!rounds[m.round]) rounds[m.round] = []
    rounds[m.round].push(m)
  })

  const handleCreateTeam = () => {
    if (!teamName.trim()) return
    createTeamForTournament(tournament.id, teamName.trim(), user.phone, user.name)
    setTeamName('')
    setShowCreateTeam(false)
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/tournaments')}>
        ← Turnirlar
      </button>

      <section className="t-detail card">
        <div className="t-detail-header">
          <div>
            <span className="t-game-badge t-game-badge-lg">{gameName}</span>
            <h2>{tournament.name}</h2>
            <span className={`t-status t-status-${tournament.status}`}>
              {STATUS_LABELS[tournament.status]}
            </span>
          </div>
        </div>

        <div className="t-detail-grid">
          <div className="t-info-card">
            <IconClock size={20} />
            <div>
              <p className="t-info-label">Sana va vaqt</p>
              <p className="t-info-value">{tournament.date} · {tournament.startTime}</p>
            </div>
          </div>
          <div className="t-info-card">
            <IconUsers size={20} />
            <div>
              <p className="t-info-label">Jamoa hajmi</p>
              <p className="t-info-value">{tournament.teamSize} o'yinchi</p>
            </div>
          </div>
          <div className="t-info-card">
            <IconUsers size={20} />
            <div>
              <p className="t-info-label">Jamoa soni</p>
              <p className="t-info-value">{tournamentTeams.length} / {tournament.maxTeams}</p>
            </div>
          </div>
          <div className="t-info-card">
            <IconCoin size={20} />
            <div>
              <p className="t-info-label">Kirish to'lovi</p>
              <p className="t-info-value">
                {tournament.entryFee > 0 ? `${fmt(tournament.entryFee)} so'm / jamoa` : 'BEPUL'}
              </p>
            </div>
          </div>
          {tournament.prizePool > 0 && (
            <div className="t-info-card t-prize-card">
              <IconTrophy size={20} />
              <div>
                <p className="t-info-label">Sovrin jamg'armasi</p>
                <p className="t-info-value t-prize-value">{fmt(tournament.prizePool)} so'm</p>
              </div>
            </div>
          )}
          <div className="t-info-card">
            <IconCrown size={20} />
            <div>
              <p className="t-info-label">Filial</p>
              <p className="t-info-value">{tournament.branch}</p>
            </div>
          </div>
        </div>

        {tournament.rules && (
          <div className="t-rules">
            <h4>Qoidalar</h4>
            <p>{tournament.rules}</p>
          </div>
        )}
      </section>

      {/* G'olib */}
      {tournament.status === TOURNAMENT_STATUS.finished && tournament.winnerId && (
        <section className="t-winner-banner card">
          <IconTrophy size={32} className="t-winner-trophy" />
          <div>
            <p className="t-winner-label">G'olib</p>
            <h3 className="t-winner-name">
              {tournamentTeams.find((t) => t.id === tournament.winnerId)?.name || 'Noma\'lum'}
            </h3>
          </div>
        </section>
      )}

      {/* Jamoalar */}
      <section className="t-teams card">
        <h3 className="section-title">
          Ro'yxatdan o'tgan jamoalar ({tournamentTeams.length} / {tournament.maxTeams})
        </h3>

        {tournamentTeams.length > 0 ? (
          <div className="t-teams-list">
            {tournamentTeams.map((team, i) => (
              <div className={`t-team-row ${team.id === tournament.winnerId ? 't-team-row-champion' : ''}`} key={team.id}>
                <span className="t-team-seed">#{i + 1}</span>
                <span className="t-team-name">
                  {team.id === tournament.winnerId && <IconTrophy size={14} className="t-champion-icon" />}
                  {team.name}
                </span>
                <span className="t-team-members">
                  <IconUsers size={14} /> {team.members.length} / {tournament.teamSize}
                </span>
                {tournament.status === TOURNAMENT_STATUS.registration && (
                  <span className={`t-team-status ${team.isPaid ? 't-paid' : 't-unpaid'}`}>
                    {team.isPaid ? "To'langan" : "To'lanmagan"}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted t-no-teams">Hozircha jamoalar yo'q. Birinchi bo'lib jamoa yarating!</p>
        )}
      </section>

      {/* Bracket */}
      {tournament.bracketGenerated && (
        <section className="t-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/tournaments/${tournament.id}/bracket`)}
          >
            Bracketni ko'rish
          </button>
        </section>
      )}

      {/* Match natijalari - tugagan turnirlar uchun */}
      {tournament.status === TOURNAMENT_STATUS.finished && completedMatches.length > 0 && (
        <section className="t-match-results card">
          <h3 className="section-title">
            <IconTrophy size={18} /> Barcha match natijalari
          </h3>
          <div className="t-match-results-list">
            {rounds.map((roundMatches, roundIdx) => (
              <div className="t-match-results-round" key={roundIdx}>
                <h4 className="t-match-round-title">
                  {getRoundName(roundIdx, rounds.length - 1)}
                </h4>
                {roundMatches.filter(m => m.status === MATCH_STATUS.completed).map((m) => {
                  const teamAWon = m.winnerId === m.teamAId
                  const teamBWon = m.winnerId === m.teamBId
                  return (
                    <div className="t-match-result-row" key={m.id}>
                      <div className={`t-match-team ${teamAWon ? 't-match-team-won' : 't-match-team-lost'}`}>
                        {teamAWon && <IconTrophy size={12} />}
                        <span className="t-match-team-name">{m.teamAName}</span>
                        <span className={`t-match-score ${teamAWon ? 't-match-score-win' : ''}`}>
                          {m.scoreA}
                        </span>
                      </div>
                      <span className="t-match-vs">VS</span>
                      <div className={`t-match-team ${teamBWon ? 't-match-team-won' : 't-match-team-lost'}`}>
                        <span className={`t-match-score ${teamBWon ? 't-match-score-win' : ''}`}>
                          {m.scoreB}
                        </span>
                        <span className="t-match-team-name">{m.teamBName}</span>
                        {teamBWon && <IconTrophy size={12} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mening jamoam */}
      {isInTournament && myTeam && (
        <section className="t-my-team card">
          <h3 className="section-title">Mening jamoam</h3>
          <div className="t-team-card">
            <div className="t-team-card-header">
              <span className="t-team-name-lg">{myTeam.name}</span>
              {myTeam.leaderId === user.phone && (
                <span className="t-leader-badge"><IconCrown size={14} /> Sardor</span>
              )}
            </div>
            <div className="t-team-members-list">
              {myTeam.members.map((m) => (
                <div className="t-member" key={m.userId}>
                  <div className="t-member-avatar">
                    {m.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <p className="t-member-name">{m.name}</p>
                    {m.userId === myTeam.leaderId && (
                      <span className="t-leader-small">Sardor</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="t-team-card-footer">
              <span className={myTeam.isReady ? 't-ready' : 't-not-ready'}>
                {myTeam.isReady ? '✓ Tayyor' : `${myTeam.members.length} / ${tournament.teamSize} a'zo`}
              </span>
              {myTeam.leaderId === user.phone && (
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/tournaments/team/${myTeam.id}`)}
                >
                  <IconLink size={14} /> Jamoani boshqarish
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Ro'yxatdan o'tish */}
      {canRegister && (
        <section className="t-actions">
          {!showCreateTeam ? (
            <button className="btn btn-primary btn-lg" onClick={() => setShowCreateTeam(true)}>
              <IconTeam size={18} /> Jamoa yaratish
            </button>
          ) : (
            <div className="t-create-team-form card">
              <h3>Jamoa yaratish</h3>
              <div className="t-form-row">
                <input
                  type="text"
                  placeholder="Jamoa nomi"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="input"
                  maxLength={30}
                />
              </div>
              <div className="t-form-actions">
                <button className="btn btn-primary" onClick={handleCreateTeam} disabled={!teamName.trim()}>
                  <IconCheck size={16} /> Yaratish
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowCreateTeam(false); setTeamName('') }}>
                  <IconX size={16} /> Bekor qilish
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {tournament.status === TOURNAMENT_STATUS.registration && isInTournament && (
        <div className="t-registered-notice card">
          <IconCheck size={20} />
          <span>Siz ushbu turnirga ro'yxatdan o'tgansiz</span>
        </div>
      )}
    </div>
  )
}
