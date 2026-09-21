import { useState } from 'react'
import { useHall } from '../../hall/HallContext.jsx'
import { IconPlus, IconX, IconTag } from '../../components/Icons.jsx'

export default function SuperPromotions() {
  const hall = useHall()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ code: '', discount: '', limit: '' })
  const [toast, setToast] = useState('')

  const promos = hall.promotions

  function notify(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function handleToggle(p) {
    hall.togglePromotion(p.id)
    notify(p.active ? `${p.code} o\u2018chirildi (deactivate)` : `${p.code} faollashtirildi (activate)`)
  }

  function handleCreate(e) {
    e.preventDefault()
    const discount = Number(form.discount)
    const limit = Number(form.limit)
    if (!form.code.trim() || !discount || !limit) return
    hall.addPromotion({ code: form.code.trim(), discount, limit })
    setAddOpen(false)
    setForm({ code: '', discount: '', limit: '' })
    notify('Promokod yaratildi')
  }

  const activeCount = promos.filter((p) => p.active).length
  const exhausted = promos.filter((p) => !p.active).length

  return (
    <div className="page">
      <div className="promo-stats card">
        <div className="sa-stat">
          <div className="metric-icon">
            <IconTag size={20} />
          </div>
          <div>
            <b className="sa-stat-value">{promos.length}</b>
            <p className="metric-label">Jami promokodlar</p>
          </div>
        </div>
        <div className="sa-stat">
          <div className="metric-icon accent-violet">
            <IconPlus size={20} />
          </div>
          <div>
            <b className="sa-stat-value">{activeCount}</b>
            <p className="metric-label">Faol</p>
          </div>
        </div>
        <div className="sa-stat">
          <div className="metric-icon">
            <IconX size={20} />
          </div>
          <div>
            <b className="sa-stat-value">{exhausted}</b>
            <p className="metric-label">Limiti tugagan</p>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="group-head">
          <h3 className="section-title">Promokodlar</h3>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <IconPlus size={16} /> Promo yaratish
          </button>
        </div>

        <div className="promo-grid">
          {promos.map((p) => {
            const pct = Math.min(100, Math.round((p.usage / p.limit) * 100))
            const full = p.usage >= p.limit
            return (
              <article key={p.id} className={`promo card ${!p.active ? 'promo-off' : ''}`}>
                <div className="promo-top">
                  <code>{p.code}</code>
                  <span className="zone-badge">{p.discount}% chegirma</span>
                </div>

                <div className="promo-status-row">
                  <span className={`status-pill ${p.active ? 'on' : 'off'}`}>
                    {p.active ? 'faol' : 'faol emas'}
                  </span>
                  {full ? <span className="muted small">Limiti to\u2018lgan</span> : null}
                </div>

                <div className="promo-usage">
                  <div className="progress-head">
                    <span className="muted small">Foydalanish</span>
                    <b className="small">
                      {p.usage} / {p.limit}
                    </b>
                  </div>
                  <div className="progress">
                    <span
                      className={full ? 'progress-full' : ''}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  className={`btn btn-block ${p.active ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => handleToggle(p)}
                >
                  {p.active ? "o\u2018chirish" : 'yoqish'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      {addOpen ? (
        <div className="overlay" onClick={() => setAddOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <div className="modal-head">
              <h3>Yangi promokod yaratish</h3>
              <button type="button" className="icon-btn" onClick={() => setAddOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <label className="field">
              <span>Promokod nomi</span>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SUMMER25"
                required
              />
            </label>
            <label className="field">
              <span>Chegirma foizi (%)</span>
              <input
                type="number"
                min="1"
                max="100"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="25"
                required
              />
            </label>
            <label className="field">
              <span>Foydalanish limiti</span>
              <input
                type="number"
                min="1"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
                placeholder="100"
                required
              />
            </label>
            <button className="btn btn-primary btn-block" type="submit">
              <IconPlus size={16} /> Yaratish
            </button>
          </form>
        </div>
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}