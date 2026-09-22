import { useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { GAMES, STATUS_LABELS, TOURNAMENT_STATUS, fmt } from '../../data/tournaments.js'
import {
  IconTrophy,
  IconUsers,
  IconClock,
  IconCoin,
  IconTrash,
  IconPlay,
  IconCheck,
  IconLock,
} from '../../components/Icons.jsx'

export default function AdminTournaments() {
  const navigate = useNavigate()
  const {
    tournaments,
    getTeamsForTournament,
    deleteTournament,
    openRegistration,
    closeRegistration,
    startTournament,
    generateTournamentBracket,
  } = useTournament()

  const gameName = (id) => GAMES.find((g) => g.id === id)?.name || id

  return (
    <div className="page">
      <div className="t-admin-header">
        <h2>Turnirlar</h2>
        <span className="muted small">
          <IconLock size={13} /> Yangi turnirni Super Admin yaratadi
        </span>
      </div>

      <div className="t-admin-list">
        {tournaments.map((t) => {
          const teams = getTeamsForTournament(t.id)
          return (
            <div className="t-admin-card card" key={t.id}>
              <div className="t-admin-card-top">
                <div>
                  <span className="t-game-badge">{gameName(t.game)}</span>
                  <h3>{t.name}</h3>
                </div>
                <span className={`t-status t-status-${t.status}`}>
                  {STATUS_LABELS[t.status]}
                </span>
              </div>

              <div className="t-admin-card-meta">
                <span><IconClock size={14} /> {t.date} · {t.startTime}</span>
                <span><IconUsers size={14} /> {teams.length} / {t.maxTeams}</span>
                <span><IconCoin size={14} /> {t.entryFee > 0 ? `${fmt(t.entryFee)} so'm` : 'BEPUL'}</span>
                {t.prizePool > 0 && (
                  <span className="t-prize"><IconTrophy size={14} /> {fmt(t.prizePool)} so'm</span>
                )}
              </div>

              <div className="t-admin-card-actions">
                {t.status === TOURNAMENT_STATUS.upcoming && (
                  <button className="btn btn-primary btn-sm" onClick={() => openRegistration(t.id)}>
                    <IconPlay size={14} /> Ro'yxatni ochish
                  </button>
                )}
                {t.status === TOURNAMENT_STATUS.registration && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => closeRegistration(t.id)}>
                      Ro'yxatni yopish
                    </button>
                    {teams.length >= 2 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          generateTournamentBracket(t.id)
                          startTournament(t.id)
                          navigate(`/admin/tournaments/${t.id}/control`)
                        }}
                      >
                        <IconPlay size={14} /> Turnirni boshlash
                      </button>
                    )}
                  </>
                )}
                {t.status === TOURNAMENT_STATUS.ongoing && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/admin/tournaments/${t.id}/control`)}
                  >
                    <IconPlay size={14} /> Boshqarish
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    if (confirm('Turnirni o\'chirishni xohlaysizmi?')) {
                      deleteTournament(t.id)
                    }
                  }}
                >
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          )
        })}

        {tournaments.length === 0 && (
          <div className="t-empty card">
            <IconTrophy size={48} />
            <h3>Turnirlar yo'q</h3>
            <p className="muted">Birinchi turniringizni yarating</p>
          </div>
        )}
      </div>
    </div>
  )
}
