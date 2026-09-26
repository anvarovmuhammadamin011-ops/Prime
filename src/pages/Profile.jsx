import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { IconLanguage } from '../components/Icons.jsx'

const LANGUAGES = [
  { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
]

function getSavedLanguage() {
  if (typeof window === 'undefined') return 'uz'
  const saved = window.localStorage.getItem('app_language')
  return LANGUAGES.some((lang) => lang.code === saved) ? saved : 'uz'
}
import { getTelegramInitData, isTelegramWebApp, openTelegramBot } from '../telegram/webApp.js'
import { BOOKING_STATUS } from '../club/bookingRules.js'
import {
  BOOKING_STATUS_CLASSES,
  BOOKING_STATUS_LABELS,
  formatDateTime,
  getInitials,
} from '../data.js'
import { IconCalendar, IconCheck, IconLogout, IconSend, IconUser } from '../components/Icons.jsx'

export default function Profile() {
  const { user, updateProfile, linkTelegram, unlinkTelegram, logout } = useAuth()
  const { getBookingsForUser } = useClub()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [telegramPassword, setTelegramPassword] = useState('')
  const [telegramBusy, setTelegramBusy] = useState(false)
  const [language, setLanguage] = useState(getSavedLanguage)
  const telegramEmbedded = isTelegramWebApp()

  const bookings = useMemo(() => getBookingsForUser(user.id), [getBookingsForUser, user.id])

  const completed = bookings.filter((booking) => booking.status === BOOKING_STATUS.COMPLETED).length
  const upcoming = bookings.filter(
    (booking) =>
      [BOOKING_STATUS.PENDING, BOOKING_STATUS.APPROVED, BOOKING_STATUS.ACTIVE].includes(
        booking.status,
      ),
  )

  function toggleEditing() {
    if (!editing) setName(user.name)
    setEditing((value) => !value)
  }

  function changeLanguage(code) {
    setLanguage(code)
    window.localStorage.setItem('app_language', code)
    setMessage(code === 'uz' ? 'Til o‘zgartirildi' : code === 'ru' ? 'Язык изменён' : 'Language changed')
    window.setTimeout(() => setMessage(''), 2500)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await updateProfile({ name })
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setName(result.user.name)
      setEditing(false)
      setMessage('Ism yangilandi')
    } finally {
      setSaving(false)
    }
  }

  async function handleTelegramUnlink(event) {
    event.preventDefault()
    setTelegramBusy(true)
    try {
      const result = await unlinkTelegram(telegramPassword)
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setTelegramPassword('')
      setMessage(result.unlinked ? 'Telegram akkaunti uzildi' : 'Telegram akkaunti ulanmagan')
    } finally {
      setTelegramBusy(false)
    }
  }

  async function handleTelegramLink(event) {
    event.preventDefault()
    const initData = getTelegramInitData()
    if (!initData) {
      setMessage('Telegram sessiyasi topilmadi. Bot orqali qayta oching.')
      return
    }
    setTelegramBusy(true)
    try {
      const result = await linkTelegram(initData, user.phone, telegramPassword)
      if (!result.ok) {
        setMessage(result.error)
        return
      }
      setTelegramPassword('')
      setMessage('Telegram akkaunti ulandi')
    } finally {
      setTelegramBusy(false)
    }
  }

  function launchTelegram() {
    if (!openTelegramBot()) setMessage('Telegram bot username sozlanmagan')
  }

  return (
    <div className="page profile-page">
      <section className="profile-card card">
        <div className="profile-avatar">{getInitials(user.name)}</div>
        <div className="profile-main">
          <span className="eyebrow">Foydalanuvchi profili</span>
          <h1>{user.name}</h1>
          <p>{user.phone}</p>
          <span className={`badge ${user.telegramId ? 'approved' : 'neutral'}`}>
            {user.telegramId ? 'Telegram ulangan' : 'Telefon orqali ro‘yxatdan o‘tgan'}
          </span>
        </div>
        <button className="button secondary" type="button" onClick={toggleEditing}>
          {editing ? 'Yopish' : 'Tahrirlash'}
        </button>
      </section>

      {!user.telegramId && !telegramEmbedded ? (
        <button className="button secondary wide telegram-link-button" type="button" onClick={launchTelegram}>
          <IconSend size={18} /> Telegram orqali ulash
        </button>
      ) : null}

      {!user.telegramId && telegramEmbedded ? (
        <form className="card profile-edit telegram-link-form" onSubmit={handleTelegramLink}>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Telegram Mini App</span>
              <h2>Akkauntni ulash</h2>
            </div>
          </div>
          <p className="muted">Parol bilan tasdiqlang. Telegram ID parol o‘rniga ishlatilmaydi.</p>
          <label className="field">
            <span>Parol</span>
            <input
              type="password"
              value={telegramPassword}
              onChange={(event) => setTelegramPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button primary" type="submit" disabled={telegramBusy}>
            <IconCheck size={17} /> {telegramBusy ? 'Ulanmoqda...' : 'Telegramga ulash'}
          </button>
        </form>
      ) : null}

      {user.telegramId ? (
        <form className="card profile-edit telegram-link-form" onSubmit={handleTelegramUnlink}>
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Telegram Mini App</span>
              <h2>Akkaunt ulangan</h2>
            </div>
          </div>
          <p className="muted">Ulanishni bekor qilish uchun parolni tasdiqlang.</p>
          <label className="field">
            <span>Parol</span>
            <input
              type="password"
              value={telegramPassword}
              onChange={(event) => setTelegramPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button className="button secondary" type="submit" disabled={telegramBusy}>
            <IconLogout size={17} /> {telegramBusy ? 'Bekor qilinmoqda...' : 'Ulanishni bekor qilish'}
          </button>
        </form>
      ) : null}

      <section className="card profile-language">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Sozlamalar</span>
            <h2><IconLanguage size={18} /> Til / Language / Язык</h2>
          </div>
        </div>
        <div className="language-options">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              className={`language-option ${language === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="language-flag">{lang.flag}</span>
              <span className="language-name">{lang.name}</span>
              {language === lang.code ? <IconCheck size={16} /> : null}
            </button>
          ))}
        </div>
      </section>

      {editing ? (
        <form className="card profile-edit" onSubmit={saveProfile}>
          <label className="field">
            <span>Ism</span>
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required />
          </label>
          <label className="field">
            <span>Telefon</span>
            <input value={user.phone} disabled />
          </label>
           <button className="button primary" type="submit" disabled={saving}>
             <IconCheck size={17} /> {saving ? 'Saqlanmoqda...' : 'Saqlash'}
           </button>
        </form>
      ) : null}

      {message ? <div className="inline-message" role="status">{message}</div> : null}

      <section className="profile-stats">
        <div className="card">
          <span className="status-dot booked" />
          <strong>{upcoming.length}</strong>
          <span>Kelgusi bron</span>
        </div>
        <div className="card">
          <span className="status-dot active" />
          <strong>{completed}</strong>
          <span>Tugagan sessiya</span>
        </div>
        <div className="card">
          <IconSend size={20} />
          <strong>{user.telegramId ? 'Ha' : 'Yo‘q'}</strong>
          <span>Telegram</span>
        </div>
      </section>

      <section className="card profile-bookings">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Mening bronlarim</span>
            <h2>So‘nggi faol yozuvlar</h2>
          </div>
          <Link className="text-link" to="/bookings">
            Barchasi
          </Link>
        </div>
        {bookings.length ? (
          <div className="profile-booking-list">
            {bookings.slice(0, 5).map((booking) => (
              <div className="profile-booking-row" key={booking.id}>
                <span className="booking-row-icon">
                  <IconCalendar size={18} />
                </span>
                <div>
                   <strong>PC-{String(Number(booking.pcNumber) || 0).padStart(2, '0')}</strong>
                  <span>{formatDateTime(booking.startAt)}</span>
                </div>
                <span className={`badge ${BOOKING_STATUS_CLASSES[booking.status]}`}>
                  {BOOKING_STATUS_LABELS[booking.status]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            <IconUser size={24} /> Hali bron yo‘q.
          </div>
        )}
      </section>

      <button className="button secondary wide logout-button" type="button" onClick={logout}>
        <IconLogout size={18} /> Hisobdan chiqish
      </button>
    </div>
  )
}
