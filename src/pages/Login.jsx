import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  getTelegramInitData,
  getTelegramUserPreview,
  initializeTelegramWebApp,
  isTelegramWebApp,
  openTelegramBot,
} from '../telegram/webApp.js'
import { IconCheck, IconGamepad, IconSend, IconShield } from '../components/Icons.jsx'

export default function Login() {
  const { login, register, telegramLogin, linkTelegram, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [telegramState, setTelegramState] = useState(() => (isTelegramWebApp() ? 'checking' : 'idle'))
  const attemptedInitData = useRef('')
  const telegramInitData = getTelegramInitData()
  const telegramPreview = getTelegramUserPreview()
  const telegramEmbedded = isTelegramWebApp()

  useEffect(() => {
    if (!telegramEmbedded || attemptedInitData.current === telegramInitData) return undefined
    attemptedInitData.current = telegramInitData
    initializeTelegramWebApp()
    setTelegramState('checking')
    let active = true
    telegramLogin(telegramInitData).then((result) => {
      if (!active) return
      if (result.ok) {
        navigate(result.user.role === 'user' ? '/' : '/admin', { replace: true })
        return
      }
      setTelegramState(result.code === 'TELEGRAM_LINK_REQUIRED' ? 'needs-link' : 'error')
      if (result.code !== 'TELEGRAM_LINK_REQUIRED') setError(result.error)
    })
    return () => {
      active = false
    }
  }, [navigate, telegramEmbedded, telegramInitData, telegramLogin])

  function go(user) {
    navigate(user.role === 'user' ? '/' : '/admin', { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      let result
      if (telegramEmbedded && telegramState === 'needs-link') {
        result = await linkTelegram(telegramInitData, phone, password)
      } else {
        result = mode === 'register'
          ? await register({ name, phone, password })
          : await login(phone, password)
      }
      if (!result.ok) {
        setError(result.error)
        return
      }
      setTelegramState('ready')
      go(result.user)
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(nextMode) {
    if (telegramEmbedded && telegramState === 'needs-link') return
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  function handleTelegramLaunch() {
    if (!openTelegramBot()) {
      setNotice('Telegram bot username sozlanmagan. Administrator bilan bog‘laning.')
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-intro">
        <div className="brand brand-light">
          <span className="brand-mark">
            <IconGamepad size={24} />
          </span>
          <span>
            PRIME <strong>GAME CLUB</strong>
          </span>
        </div>
        <div className="auth-intro-copy">
          <span className="eyebrow">Oddiy bron va sessiya boshqaruvi</span>
          <h1>PC band qiling. Kodni ko‘rsating. O‘ynashni boshlang.</h1>
          <p>
            Turnir, reyting va murakkab funksiyalarsiz faqat Prime Game Club uchun kerakli
            asosiy oqim.
          </p>
        </div>
        <ul className="auth-points">
          <li>
            <IconCheck size={17} /> 20 ta PC holati bir joyda
          </li>
          <li>
            <IconCheck size={17} /> Tasdiqlash va bir martalik kirish kodi
          </li>
          <li>
            <IconCheck size={17} /> Vaqt tugashi bilan sessiya avtomatik yopiladi
          </li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist" aria-label="Kirish usuli">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              disabled={telegramEmbedded && telegramState === 'needs-link'}
              className={mode === 'login' ? 'active' : ''}
              onClick={() => switchMode('login')}
            >
              Kirish
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              disabled={telegramEmbedded && telegramState === 'needs-link'}
              className={mode === 'register' ? 'active' : ''}
              onClick={() => switchMode('register')}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>

           <div className="auth-title">
             <span className="auth-icon">
               {mode === 'login' ? <IconShield size={22} /> : <IconGamepad size={22} />}
             </span>
             <div>
               <h2>
                 {telegramEmbedded && telegramState === 'needs-link'
                   ? 'Telegram akkauntingizni ulang'
                   : mode === 'login'
                     ? 'Hisobga kiring'
                     : 'Ro‘yxatdan o‘ting'}
               </h2>
               <p className="muted">
                 {telegramEmbedded && telegramState === 'needs-link'
                   ? 'Mavjud Prime Club akkauntingizga Telegram orqali kiring'
                   : mode === 'login'
                     ? 'Telefon va parol bilan davom eting'
                     : 'Faqat ism, telefon va parol kerak'}
               </p>
             </div>
           </div>

            {telegramEmbedded ? (
              <div
                className={`form-alert ${telegramState === 'error' ? 'error' : 'notice'}`}
                role={telegramState === 'error' ? 'alert' : 'status'}
              >
                {telegramState === 'checking'
                  ? 'Telegram orqali avtomatik kirish tekshirilmoqda...'
                  : telegramState === 'needs-link'
                    ? `Telegram foydalanuvchisi${telegramPreview?.firstName ? ` ${telegramPreview.firstName}` : ''} hali ulanmagan. Telefon va parol bilan tasdiqlang.`
                    : telegramState === 'ready'
                      ? 'Telegram orqali avtomatik kirish bajarildi.'
                      : 'Telegram orqali avtomatik kirish bajarilmadi. Parol bilan davom eting.'}
              </div>
            ) : null}

           {mode === 'register' && !(telegramEmbedded && telegramState === 'needs-link') ? (
            <label className="field">
              <span>Ism</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ismingiz"
                autoComplete="name"
                required
              />
            </label>
          ) : null}

          <label className="field">
            <span>Telefon raqam</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+998 90 123 45 67"
              autoComplete="tel"
              required
            />
          </label>

          <label className="field">
            <span>Parol</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Kamida 8 belgi"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
          </label>

          {error ? <div className="form-alert error" role="alert">{error}</div> : null}
          {notice ? <div className="form-alert notice" role="status">{notice}</div> : null}

           <button
             className="button primary wide"
             type="submit"
              disabled={
                loading ||
                submitting ||
                (telegramEmbedded && ['idle', 'checking', 'ready'].includes(telegramState))
              }
           >
             {submitting
               ? 'Tekshirilmoqda...'
               : telegramEmbedded && telegramState === 'needs-link'
                 ? 'Telegramga ulash'
                 : mode === 'login'
                   ? 'Kirish'
                   : 'Ro‘yxatdan o‘tish'}
           </button>

           {!telegramEmbedded ? (
             <button
               className="button secondary wide telegram-button"
               type="button"
               onClick={handleTelegramLaunch}
             >
               <IconSend size={18} /> Telegram orqali kirish
             </button>
           ) : null}
        </form>
      </section>
    </div>
  )
}
