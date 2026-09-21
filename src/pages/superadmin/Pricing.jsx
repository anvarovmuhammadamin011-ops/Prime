import { useState } from 'react'
import { useHall } from '../../hall/HallContext.jsx'
import { fmt } from '../../data.js'
import { IconSave, IconCheck } from '../../components/Icons.jsx'

export default function SuperPricing() {
  const hall = useHall()
  const [drafts, setDrafts] = useState({})
  const [toast, setToast] = useState('')

  const zones = hall.pricing

  function setDraft(key, value) {
    setDrafts((d) => ({ ...d, [key]: value }))
  }

  function save(zone) {
    const raw = drafts[zone.key]
    const price = Number(raw)
    if (!raw || !price || price <= 0) {
      setToast('Iltimos to\u2018g\u2018ri summa kiriting')
      setTimeout(() => setToast(''), 2000)
      return
    }
    hall.updateZonePrice(zone.key, price)
    setDraft(zone.key, '')
    setToast(`${zone.label} narxi ${fmt(price)} UZS/soatga yangilandi`)
    setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="page">
      <section className="pricing-intro card">
        <h3 className="section-title">Zonalar bo\u2018yicha soatlik narxlar</h3>
        <p className="muted small">
          Narxni o\u2018zgartiring va Saqlash tugmasini bosing — yangi tarif darhol mijozlar xaritasi va
          bron sahifasida aks etadi.
        </p>
      </section>

      <div className="zone-price-grid">
        {zones.map((z) => (
          <article className="card zone-price-card" key={z.key}>
            <div className="price-top">
              <span className="zone-badge">{z.badge}</span>
            </div>
            <h4>{z.label}</h4>
            <ul className="spec-list">
              {z.specs.map((s) => (
                <li key={s}>
                  <span className="dot-check">
                    <IconCheck size={12} />
                  </span>
                  {s}
                </li>
              ))}
            </ul>

            <p className="current-price">
              <span className="grad-text">{fmt(z.price)}</span>
              <span className="muted small"> UZS / soat</span>
            </p>

            <div className="price-edit">
              <label>
                <span className="muted small">Soatlik narx</span>
                <input
                  type="number"
                  min="0"
                  value={drafts[z.key] ?? ''}
                  onChange={(e) => setDraft(z.key, e.target.value)}
                  placeholder={`${z.price}`}
                />
              </label>
              <button className="btn btn-primary icon-save-btn" onClick={() => save(z)} title="Saqlash">
                <IconSave size={17} />
                <span>Saqlash</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}