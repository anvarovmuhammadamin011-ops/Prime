import { useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { STATUS_LABELS, TOURNAMENT_STATUS } from '../../data/tournaments.js'
import { IconTeam, IconCrown, IconUsers, IconTrophy } from '../../components/Icons.jsx'

export default function MyTeams() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getUserTeams, tournaments } = useTournament()

  const myTeams = getUserTeams(user.phone)

  return (
    <div className="page">
      <section className="t-hero card">
        <div>
          <p className="welcome-kicker">
            <span className="live-dot" /> Mening jamoalarim
          </p>
          <h2>
            Sizning <span className="grad-text">jamoa</span>arlaringiz
          </h2>
          <p className="muted">Barcha turnirlardagi jamoalaringiz shu yerda</p>
        </div>
      </section>

      {myTeams.length > 0 ? (
        <div className="t-my-teams-grid">
          {myTeams.map((team) => {
            const tournament = tournaments.find((t) => t.id === team.tournamentId)
            return (
              <div className="t-my-team-card card" key={team.id}>
                <div className="t-my-team-header">
                  <div>
                    <h3>{team.name}</h3>
                    {tournament && (
                      <span className="t-tournament-link" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
                        {tournament.name}
                      </span>
                    )}
                  </div>
                  {team.leaderId === user.phone && (
                    <span className="t-leader-badge"><IconCrown size={12} /> Leader</span>
                  )}
                </div>

                {tournament && (
                  <div className="t-my-team-meta">
                    <span className={`t-status t-status-${tournament.status}`}>
                      {STATUS_LABELS[tournament.status]}
                    </span>
                    <span className="t-my-team-members">
                      <IconUsers size={14} /> {team.members.length}
                    </span>
                    {tournament.bracketGenerated && (
                      <span className="t-bracket-badge">
                        <IconTrophy size={14} /> Bracket
                      </span>
                    )}
                  </div>
                )}

                <div className="t-my-team-members-list">
                  {team.members.map((m) => (
                    <span className="t-mini-member" key={m.userId}>
                      {m.name.split(' ')[0]}
                      {m.userId === team.leaderId && <IconCrown size={10} />}
                    </span>
                  ))}
                </div>

                <div className="t-my-team-footer">
                  <span className={team.isReady ? 't-ready' : 't-not-ready'}>
                    {team.isReady ? '✓ Tayyor' : 'Tayyor emas'}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/tournaments/team/${team.id}`)}
                  >
                    Boshqarish
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="t-empty card">
          <IconTeam size={48} />
          <h3>Hozircha jamoalaringiz yo'q</h3>
          <p className="muted">Turnirlarga qo'shiling va jamoa yarating</p>
          <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
            Turnirlar
          </button>
        </div>
      )}
    </div>
  )
}
