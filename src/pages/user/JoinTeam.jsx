import { useParams, useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { TOURNAMENT_STATUS } from '../../data/tournaments.js'
import { IconUsers, IconCrown, IconCheck, IconX } from '../../components/Icons.jsx'

export default function JoinTeam() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { teams, tournaments, addPlayerToTeam, isUserInTournament } = useTournament()

  const team = teams.find((t) => t.id === teamId)
  const tournament = team ? tournaments.find((t) => t.id === team.tournamentId) : null

  if (!team || !tournament) {
    return (
      <div className="page">
        <div className="t-empty card">
          <IconUsers size={48} />
          <h3>Jamoa topilmadi</h3>
          <p className="muted">Havola noto'g'ri yoki jamoa o'chirilgan</p>
          <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
            Turnirlar
          </button>
        </div>
      </div>
    )
  }

  const alreadyInTournament = isUserInTournament(tournament.id, user.phone)
  const alreadyInTeam = team.members.some((m) => m.userId === user.phone)
  const teamFull = team.members.length >= tournament.teamSize
  const regClosed = tournament.status !== TOURNAMENT_STATUS.registration
  const canJoin = !alreadyInTournament && !alreadyInTeam && !teamFull && !regClosed

  const handleJoin = () => {
    addPlayerToTeam(team.id, user.phone, user.name)
    navigate(`/tournaments/team/${team.id}`)
  }

  return (
    <div className="page">
      <section className="t-join-card card">
        <div className="t-join-header">
          <IconUsers size={40} />
          <h2>{team.name}</h2>
          <span className="t-tournament-name">{tournament.name}</span>
        </div>

        <div className="t-join-leader">
          <IconCrown size={16} />
          <span>Sardor: <strong>{team.leaderName}</strong></span>
        </div>

        <div className="t-join-members">
          <h4>A'zolar ({team.members.length} / {tournament.teamSize})</h4>
          {team.members.map((m) => (
            <div className="t-join-member" key={m.userId}>
              <div className="t-member-avatar-sm">
                {m.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <span>{m.name}</span>
            </div>
          ))}
        </div>

        <div className="t-join-actions">
          {canJoin ? (
            <button className="btn btn-primary btn-lg" onClick={handleJoin}>
              <IconCheck size={18} /> Jamoaga qo'shilish
            </button>
          ) : (
            <div className="t-join-blocked">
              {alreadyInTeam ? (
                <p className="t-join-msg t-join-ok">
                  <IconCheck size={16} /> Siz allaqachon ushbu jamoadasiz
                </p>
              ) : alreadyInTournament ? (
                <p className="t-join-msg t-join-warn">
                  <IconX size={16} /> Siz boshqa jamoadasiz
                </p>
              ) : teamFull ? (
                <p className="t-join-msg t-join-warn">
                  <IconX size={16} /> Jamoa to'liq
                </p>
              ) : regClosed ? (
                <p className="t-join-msg t-join-warn">
                  <IconX size={16} /> Ro'yxatdan o'tish muddati tugagan
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
