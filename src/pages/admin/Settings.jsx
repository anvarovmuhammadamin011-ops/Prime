import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useClub } from '../../club/ClubContext.jsx'
import { IconSave, IconSettings, IconShield } from '../../components/Icons.jsx'

export default function AdminSettings() {
  const { user } = useAuth()
  const { settings, updateSettings } = useClub()
  const [form, setForm] = useState({
    clubName: settings.clubName,
    pricePerHour: settings.pricePerHour,
    maxDuration: settings.maxDuration,
    pcCount: settings.pcCount,
  })
  const [message, setMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setForm({
        clubName: settings.clubName,
        pricePerHour: settings.pricePerHour,
        maxDuration: settings.maxDuration,
        pcCount: settings.pcCount,
      })
    })
  }, [settings])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    const result = await updateSettings(form)
    setSaving(false)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setMessage({ type: 'success', text: 'Sozlamalar saqlandi' })
  }

  return (
    <div className="page settings-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Admin sozlamalari</span>
          <h1>Sozlamalar</h1>
          <p className="muted">Faqat V1 uchun kerakli to‘rtta parametr.</p>
        </div>
        <div className="page-heading-mark">
          {user.role === 'superadmin' ? <IconShield size={24} /> : <IconSettings size={24} />}
          <span>{user.role === 'superadmin' ? 'Superadmin' : 'Admin'}</span>
        </div>
      </section>

      <form className="settings-layout" onSubmit={handleSubmit}>
        <section className="card settings-card">
          <div className="settings-section-head">
            <span className="metric-icon violet"><IconSettings size={20} /></span>
            <div>
              <h2>Club ma’lumotlari</h2>
              <p className="muted">Foydalanuvchi va admin panelida ko‘rinadi.</p>
            </div>
          </div>

          <label className="field">
            <span>Club nomi</span>
            <input
              value={form.clubName}
              onChange={(event) => updateField('clubName', event.target.value)}
              minLength={2}
              maxLength={40}
              required
            />
          </label>

          <label className="field">
            <span>1 soatlik PC narxi (so‘m)</span>
            <input
              type="number"
              value={form.pricePerHour}
              onChange={(event) => updateField('pricePerHour', event.target.value)}
              min="1000"
              max="1000000"
              step="1000"
              required
            />
          </label>

          <div className="field-grid two">
            <label className="field">
              <span>Maksimal davomiylik</span>
              <select
                value={form.maxDuration}
                onChange={(event) => updateField('maxDuration', Number(event.target.value))}
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((hours) => (
                  <option key={hours} value={hours}>{hours} soat</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>PC soni</span>
              <input
                type="number"
                value={form.pcCount}
                onChange={(event) => updateField('pcCount', event.target.value)}
                min="1"
                max="20"
                required
              />
            </label>
          </div>

          {message ? (
            <div className={`form-alert ${message.type}`}>{message.text}</div>
          ) : null}

           <button className="button primary" type="submit" disabled={saving}>
             <IconSave size={18} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
           </button>
        </section>

        <aside className="settings-side">
          <section className="card timezone-card">
            <span className="eyebrow">Vaqt zonasi</span>
            <h3>Asia/Tashkent</h3>
            <p className="muted">Barcha booking va sessiya vaqtlari shu zonada hisoblanadi.</p>
          </section>
          <section className="card rules-card">
            <span className="eyebrow">V1 qoidasi</span>
            <h3>Faqat naqd to‘lov</h3>
            <p>Narx ko‘rsatiladi, ammo wallet, payment va refund tizimi yo‘q.</p>
          </section>
           <section className="card danger-zone">
             <span className="eyebrow">Xavfsizlik</span>
             <h3>Ma’lumotlar serverda</h3>
             <p>Parol va booking ma’lumotlari brauzerda saqlanmaydi. Sessiya vaqtini server worker boshqaradi.</p>
           </section>
        </aside>
      </form>
    </div>
  )
}
