import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { fmt } from '../../data/tournaments.js'
import {
  IconUsers,
  IconCrown,
  IconLink,
  IconCopy,
  IconCheck,
  IconX,
  IconTrash,
} from '../../components/Icons.jsx'

export default function TeamDetail() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { teams, tournaments, addPlayerToTeam, removePlayerFromTeam } = useTournament()

  const [copied, setCopied] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')

  const team = teams.find((t) => t.id === teamId)
  if (!team) {
    return (
      <div className="page">
        <div className="t-empty card">
          <IconUsers size={48} />
          <h3>Jamoa topilmadi</h3>
          <button className="btn btn-primary" onClick={() => navigate('/tournaments')}>
            Orqaga
          </button>
        </div>
      </div>
    )
  }

  const tournament = tournaments.find((t) => t.id === team.tournamentId)
  const isLeader = team.leaderId === user.phone

  const inviteLink = `${window.location.origin}${window.location.pathname}#/join-team/${team.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleAddPlayer = () => {
    if (!addName.trim() || !addPhone.trim()) return
    addPlayerToTeam(team.id, addPhone.trim(), addName.trim())
    setAddName('')
    setAddPhone('')
    setAddMode(false)
  }

  const handleRemovePlayer = (userId) => {
    removePlayerFromTeam(team.id, userId)
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate(-1)}>
        ← Orqaga
      </button>

      <section className="t-team-detail card">
        <div className="t-team-detail-header">
          <h2>{team.name}</h2>
          {tournament && (
            <span className="t-tournament-link" onClick={() => navigate(`/tournaments/${tournament.id}`)}>
              {tournament.name}
            </span>
          )}
        </div>

        <div className="t-team-members-section">
          <h3 className="section-title">
            <IconUsers size={18} /> A'zolar ({team.members.length})
          </h3>
          <div className="t-members-grid">
            {team.members.map((m) => (
              <div className="t-member-card" key={m.userId}>
                <div className="t-member-avatar-lg">
                  {m.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="t-member-info">
                  <p className="t-member-name">{m.name}</p>
                  {m.userId === team.leaderId && (
                    <span className="t-leader-badge"><IconCrown size={12} /> Sardor</span>
                  )}
                </div>
                {isLeader && m.userId !== team.leaderId && (
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => handleRemovePlayer(m.userId)}
                    title="O'chirish"
                  >
                    <IconTrash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isLeader && (
          <div className="t-invite-section">
            <h3 className="section-title">
              <IconLink size={18} /> Taklif havolasi
            </h3>
            <div className="t-invite-link-box">
              <input type="text" value={inviteLink} readOnly className="input" />
              <button className="btn btn-primary" onClick={handleCopyLink}>
                {copied ? <><IconCheck size={14} /> Nusxalandi</> : <><IconCopy size={14} /> Nusxalash</>}
              </button>
            </div>
            <p className="muted small">
              Havolani Telegram orqali sheriklaringizga yuboring
            </p>
          </div>
        )}

        {isLeader && !addMode && tournament?.status === 'registration' && team.members.length < (tournament?.teamSize || 5) && (
          <section className="t-actions">
            <button className="btn btn-secondary" onClick={() => setAddMode(true)}>
              <IconUsers size={14} /> A'zo qo'shish
            </button>
          </section>
        )}

        {isLeader && addMode && (
          <div className="t-add-player-form card">
            <h4>A'zo qo'shish</h4>
            <div className="t-form-row">
              <input
                type="text"
                placeholder="Ism familiya"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="input"
              />
              <input
                type="tel"
                placeholder="+998..."
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                className="input"
              />
            </div>
            <div className="t-form-actions">
              <button className="btn btn-primary" onClick={handleAddPlayer} disabled={!addName.trim() || !addPhone.trim()}>
                <IconCheck size={14} /> Qo'shish
              </button>
              <button className="btn btn-secondary" onClick={() => { setAddMode(false); setAddName(''); setAddPhone('') }}>
                <IconX size={14} /> Bekor
              </button>
            </div>
          </div>
        )}

        <div className="t-team-status-section">
          <div className="t-team-status-row">
            <span>Tayyor holat:</span>
            <span className={team.isReady ? 't-ready' : 't-not-ready'}>
              {team.isReady ? '✓ Tayyor' : 'Tayyor emas'}
            </span>
          </div>
          <div className="t-team-status-row">
            <span>To'lov:</span>
            <span className={team.isPaid ? 't-paid' : 't-unpaid'}>
              {team.isPaid ? '✓ To\'langan' : 'To\'lanmagan'}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
