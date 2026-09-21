import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTournament } from '../../tournament/TournamentContext.jsx'
import { GAMES } from '../../data/tournaments.js'
import { IconCheck, IconX } from '../../components/Icons.jsx'

export default function CreateTournament() {
  const navigate = useNavigate()
  const { addTournament } = useTournament()

  const [form, setForm] = useState({
    name: '',
    game: 'cs2',
    date: '',
    startTime: '20:00',
    regDeadline: '',
    teamSize: 5,
    maxTeams: 16,
    entryFee: 0,
    prizePool: 0,
    rules: '',
    branch: 'Asosiy filial',
  })

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = () => {
    if (!form.name || !form.date || !form.startTime) return
    addTournament(form)
    navigate('/admin/tournaments')
  }

  return (
    <div className="page">
      <button className="btn-back" onClick={() => navigate('/admin/tournaments')}>
        ← Turnirlar
      </button>

      <section className="t-create-form card">
        <h2>Turnir yaratish</h2>

        <div className="t-form-grid">
          <div className="t-form-group">
            <label>Turnir nomi *</label>
            <input
              type="text"
              className="input"
              placeholder="PRIME CS2 CUP #1"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div className="t-form-group">
            <label>O'yin *</label>
            <select
              className="input"
              value={form.game}
              onChange={(e) => update('game', e.target.value)}
            >
              {GAMES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="t-form-group">
            <label>Sana *</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>

          <div className="t-form-group">
            <label>Boshlanish vaqti *</label>
            <input
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => update('startTime', e.target.value)}
            />
          </div>

          <div className="t-form-group">
            <label>Ro'yxatdan o'tish muddati</label>
            <input
              type="datetime-local"
              className="input"
              value={form.regDeadline}
              onChange={(e) => update('regDeadline', e.target.value)}
            />
          </div>

          <div className="t-form-group">
            <label>Jamoa hajmi</label>
            <input
              type="number"
              className="input"
              min={2}
              max={10}
              value={form.teamSize}
              onChange={(e) => update('teamSize', parseInt(e.target.value) || 5)}
            />
          </div>

          <div className="t-form-group">
            <label>Maksimal jamoa soni</label>
            <input
              type="number"
              className="input"
              min={4}
              max={64}
              step={2}
              value={form.maxTeams}
              onChange={(e) => update('maxTeams', parseInt(e.target.value) || 16)}
            />
          </div>

          <div className="t-form-group">
            <label>Kirish to'lovi (so'm / jamoa)</label>
            <input
              type="number"
              className="input"
              min={0}
              step={10000}
              value={form.entryFee}
              onChange={(e) => update('entryFee', parseInt(e.target.value) || 0)}
            />
            <span className="t-form-hint">0 = Bepul</span>
          </div>

          <div className="t-form-group">
            <label>Sovrin jamg'armasi (so'm)</label>
            <input
              type="number"
              className="input"
              min={0}
              step={100000}
              value={form.prizePool}
              onChange={(e) => update('prizePool', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="t-form-group">
            <label>Filial</label>
            <select
              className="input"
              value={form.branch}
              onChange={(e) => update('branch', e.target.value)}
            >
              <option>Asosiy filial</option>
              <option>2- filial</option>
              <option>3- filial</option>
            </select>
          </div>

          <div className="t-form-group t-form-full">
            <label>Qoidalar</label>
            <textarea
              className="input t-textarea"
              rows={3}
              placeholder="Turnir qoidalari..."
              value={form.rules}
              onChange={(e) => update('rules', e.target.value)}
            />
          </div>
        </div>

        <div className="t-form-actions">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name || !form.date}>
            <IconCheck size={16} /> Yaratish
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/tournaments')}>
            <IconX size={16} /> Bekor qilish
          </button>
        </div>
      </section>
    </div>
  )
}
