import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  getTelegramInitData,
  getTelegramUserPreview,
  initializeTelegramWebApp,
  isTelegramWebApp,
  openTelegramBot,
  requestContact,
} from '../telegram/webApp.js'
import { IconGamepad, IconSend, IconShield, IconGlobe, IconPhone, IconUser, IconEye, IconEyeOff, IconArrowRight } from '../components/Icons.jsx'

const LANGUAGES = [
  { code: 'uz', name: 'O\'zbekcha', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
]

const TEXTS = {
  uz: {
    welcome: 'Prime Game Club ga xush kelibsiz',
    subtitle: 'Tilni tanlang va davom eting',
    selectLanguage: 'Tilni tanlang',
    sharePhone: 'Telefon raqamni ulashish',
    phoneShared: 'Telefon raqamingiz qabul qilindi',
    registerTitle: 'Ro\'yxatdan o\'ting',
    registerSubtitle: 'Ism, familiya va parol kiriting',
    firstName: 'Ism',
    lastName: 'Familiya',
    password: 'Parol',
    confirmPassword: 'Parolni tasdiqlash',
    generatePassword: 'Parol avtomatik yaratilsin',
    yourPassword: 'Sizning kirish parolingiz',
    savePassword: 'Ushbu parolni saqlab qo\'ying, u tizimga kirish uchun kerak bo\'ladi',
    registerBtn: 'Ro\'yxatdan o\'tish',
    loginTitle: 'Kirish',
    loginSubtitle: 'Telefon va parol bilan kiring',
    phone: 'Telefon raqam',
    loginBtn: 'Kirish',
    telegramLogin: 'Telegram orqali kirish',
    or: 'yoki',
    loading: 'Yuklanmoqda...',
    errorPhoneExists: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan',
    errorInvalidPhone: 'Telefon raqam noto\'g\'ri formatda',
    errorPasswordMismatch: 'Parollar mos kelmayapti',
    errorShortPassword: 'Parol kamida 8 belgi bo\'lishi kerak',
    errorRequired: 'Barcha maydonlarni to\'ldiring',
    errorGeneric: 'Xatolik yuz berdi, qayta urinib ko\'ring',
    successRegistered: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!',
    passwordCopied: 'Parol nusxalandi',
  },
  ru: {
    welcome: 'Добро пожаловать в Prime Game Club',
    subtitle: 'Выберите язык и продолжите',
    selectLanguage: 'Выберите язык',
    sharePhone: 'Поделиться номером телефона',
    phoneShared: 'Ваш номер телефона принят',
    registerTitle: 'Регистрация',
    registerSubtitle: 'Введите имя, фамилию и пароль',
    firstName: 'Имя',
    lastName: 'Фамилия',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    generatePassword: 'Сгенерировать пароль автоматически',
    yourPassword: 'Ваш пароль для входа',
    savePassword: 'Сохраните этот пароль, он понадобится для входа в систему',
    registerBtn: 'Зарегистрироваться',
    loginTitle: 'Вход',
    loginSubtitle: 'Войдите по телефону и паролю',
    phone: 'Номер телефона',
    loginBtn: 'Войти',
    telegramLogin: 'Войти через Telegram',
    or: 'или',
    loading: 'Загрузка...',
    errorPhoneExists: 'Этот номер телефона уже зарегистрирован',
    errorInvalidPhone: 'Неверный формат номера телефона',
    errorPasswordMismatch: 'Пароли не совпадают',
    errorShortPassword: 'Пароль должен быть минимум 8 символов',
    errorRequired: 'Заполните все поля',
    errorGeneric: 'Произошла ошибка, попробуйте снова',
    successRegistered: 'Вы успешно зарегистрировались!',
    passwordCopied: 'Пароль скопирован',
  },
  en: {
    welcome: 'Welcome to Prime Game Club',
    subtitle: 'Select language and continue',
    selectLanguage: 'Select Language',
    sharePhone: 'Share Phone Number',
    phoneShared: 'Your phone number has been received',
    registerTitle: 'Register',
    registerSubtitle: 'Enter name, surname and password',
    firstName: 'First Name',
    lastName: 'Last Name',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    generatePassword: 'Generate password automatically',
    yourPassword: 'Your login password',
    savePassword: 'Save this password, you will need it to log in',
    registerBtn: 'Register',
    loginTitle: 'Login',
    loginSubtitle: 'Enter with phone and password',
    phone: 'Phone Number',
    loginBtn: 'Login',
    telegramLogin: 'Login via Telegram',
    or: 'or',
    loading: 'Loading...',
    errorPhoneExists: 'This phone number is already registered',
    errorInvalidPhone: 'Invalid phone number format',
    errorPasswordMismatch: 'Passwords do not match',
    errorShortPassword: 'Password must be at least 8 characters',
    errorRequired: 'Please fill all fields',
    errorGeneric: 'An error occurred, please try again',
    successRegistered: 'Successfully registered!',
    passwordCopied: 'Password copied',
  },
}

function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function getInitialLanguage() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app_language')
    if (saved && LANGUAGES.some(l => l.code === saved)) return saved
    const browserLang = navigator.language.slice(0, 2)
    if (LANGUAGES.some(l => l.code === browserLang)) return browserLang
  }
  return 'uz'
}

export default function Login() {
  const { login, register, telegramLogin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('language')
  const [language, setLanguage] = useState(() => getInitialLanguage())
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [telegramState, setTelegramState] = useState(() => (isTelegramWebApp() ? 'checking' : 'idle'))
  const attemptedInitData = useRef('')
  const telegramInitData = getTelegramInitData()
  const telegramPreview = getTelegramUserPreview()
  const telegramEmbedded = isTelegramWebApp()

  const t = TEXTS[language]

  useEffect(() => {
    localStorage.setItem('app_language', language)
  }, [language])

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
    return () => { active = false }
  }, [navigate, telegramEmbedded, telegramInitData, telegramLogin])

  function go(user) {
    navigate(user.role === 'user' ? '/' : '/admin', { replace: true })
  }

  function setLang(code) {
    setLanguage(code)
    setStep('phone')
  }

  async function handleSharePhone() {
    if (!telegramEmbedded) {
      setError(t.errorGeneric)
      return
    }
    try {
      setSubmitting(true)
      const contact = await requestContact()
      if (contact?.phone_number) {
        const normalized = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`
        setPhone(normalized)
        setStep('register')
        setSuccess(t.phoneShared)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch {
      setError(t.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegister(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim() || !surname.trim() || !phone) {
      setError(t.errorRequired)
      return
    }
    if (!autoGenerate) {
      if (!password) {
        setError(t.errorRequired)
        return
      }
      if (password.length < 8) {
        setError(t.errorShortPassword)
        return
      }
      if (password !== confirmPassword) {
        setError(t.errorPasswordMismatch)
        return
      }
    }

    setSubmitting(true)
    const finalPassword = autoGenerate ? generatePassword() : password

    try {
      const fullName = `${name.trim()} ${surname.trim()}`
      const result = await register({ name: fullName, phone, password: finalPassword })
      if (!result.ok) {
        if (result.error?.includes('already') || result.error?.includes('allaqachon')) {
          setError(t.errorPhoneExists)
        } else if (result.error?.includes('format') || result.error?.includes('formatida')) {
          setError(t.errorInvalidPhone)
        } else {
          setError(result.error || t.errorGeneric)
        }
        return
      }
      setGeneratedPassword(finalPassword)
      setShowGeneratedPassword(true)
      setSuccess(t.successRegistered)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    if (!phone || !password) {
      setError(t.errorRequired)
      return
    }
    setSubmitting(true)
    try {
      const result = await login(phone, password)
      if (!result.ok) {
        setError(result.error || t.errorGeneric)
        return
      }
      go(result.user)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTelegramLaunch() {
    if (!openTelegramBot()) {
      setError('Telegram bot username sozlanmagan. Administrator bilan bog\'laning.')
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(generatedPassword)
    setSuccess(t.passwordCopied)
    setTimeout(() => setSuccess(''), 2000)
  }

  function handleContinueAfterRegister() {
    setShowGeneratedPassword(false)
    setStep('login')
    setPassword(generatedPassword)
  }

  const isPhoneStep = step === 'phone'
  const isRegisterStep = step === 'register'

  return (
    <div className="auth-page" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {step === 'language' ? (
        <section className="auth-intro">
          <div className="brand brand-light">
            <span className="brand-mark"><IconGamepad size={24} /></span>
            <span>PRIME <strong>GAME CLUB</strong></span>
          </div>
          <div className="auth-intro-copy">
            <span className="eyebrow">{t.welcome}</span>
            <h1>{t.subtitle}</h1>
          </div>
          <div className="auth-card" style={{maxWidth: 400, margin: '20px auto 0'}}>
            <h2 style={{textAlign: 'center', marginBottom: 8}}>{t.selectLanguage}</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className="button secondary wide"
                  style={{
                    justifyContent: 'flex-start',
                    gap: 14,
                    padding: '14px 16px',
                    fontSize: 15,
                    textAlign: 'left',
                  }}
                  onClick={() => setLang(lang.code)}
                >
                  <span style={{fontSize: 24}}>{lang.flag}</span>
                  <span style={{flex: 1}}>{lang.name}</span>
                  <IconArrowRight size={20} />
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="auth-intro">
            <div className="brand brand-light">
              <span className="brand-mark"><IconGamepad size={24} /></span>
              <span>PRIME <strong>GAME CLUB</strong></span>
            </div>
            <div className="auth-intro-copy">
              <span className="eyebrow">{t.welcome}</span>
              <h1>{isPhoneStep ? t.sharePhone : isRegisterStep ? t.registerTitle : t.loginTitle}</h1>
              <p>{isPhoneStep ? t.subtitle : isRegisterStep ? t.registerSubtitle : t.loginSubtitle}</p>
            </div>
            <button
              type="button"
              className="button secondary"
              style={{margin: '20px auto 0', padding: '8px 16px', fontSize: 12}}
              onClick={() => setStep('language')}
            >
              <IconGlobe size={16} /> {LANGUAGES.find(l => l.code === language)?.name}
            </button>
          </section>

          <section className="auth-panel">
            <form className="auth-card" onSubmit={isRegisterStep ? handleRegister : handleLogin}>
              {isPhoneStep && telegramEmbedded ? (
                <>
                  <div className="auth-title">
                    <span className="auth-icon"><IconPhone size={22} /></span>
                    <div>
                      <h2>{t.sharePhone}</h2>
                      <p className="muted">{t.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="button primary wide"
                    onClick={handleSharePhone}
                    disabled={submitting}
                    style={{marginTop: 10}}
                  >
                    <IconPhone size={18} /> {submitting ? t.loading : t.sharePhone}
                  </button>
                  {!telegramEmbedded && (
                    <button
                      className="button secondary wide telegram-button"
                      type="button"
                      onClick={handleTelegramLaunch}
                    >
                      <IconSend size={18} /> {t.telegramLogin}
                    </button>
                  )}
                </>
              ) : isRegisterStep ? (
                <>
                  <div className="auth-title">
                    <span className="auth-icon"><IconUser size={22} /></span>
                    <div>
                      <h2>{t.registerTitle}</h2>
                      <p className="muted">{t.registerSubtitle}</p>
                    </div>
                  </div>

                  <label className="field">
                    <span>{t.firstName}</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.firstName}
                      autoComplete="given-name"
                      required
                      disabled={submitting}
                    />
                  </label>

                  <label className="field">
                    <span>{t.lastName}</span>
                    <input
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder={t.lastName}
                      autoComplete="family-name"
                      required
                      disabled={submitting}
                    />
                  </label>

                  <label className="field">
                    <span>{t.phone}</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      autoComplete="tel"
                      required
                      disabled={submitting || telegramEmbedded}
                    />
                  </label>

                  <label className="field">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span>{t.password}</span>
                      <label style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 400, cursor: 'pointer'}}>
                        <input
                          type="checkbox"
                          checked={autoGenerate}
                          onChange={(e) => setAutoGenerate(e.target.checked)}
                          disabled={submitting}
                        />
                        {t.generatePassword}
                      </label>
                    </div>
                    {!autoGenerate && (
                      <>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t.password}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          disabled={submitting}
                          style={{marginBottom: 8}}
                        />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t.confirmPassword}
                          autoComplete="new-password"
                          minLength={8}
                          required
                          disabled={submitting}
                        />
                        <button
                          type="button"
                          className="text-button"
                          style={{marginTop: -8, marginBottom: 4, fontSize: 12}}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />} {showPassword ? 'Yashirish' : 'Ko\'rsatish'}
                        </button>
                      </>
                    )}
                  </label>

                  {autoGenerate && (
                    <div className="form-alert notice" style={{marginTop: -8}}>
                      {t.generatePassword}
                    </div>
                  )}

                  {error ? <div className="form-alert error" role="alert">{error}</div> : null}
                  {success ? <div className="form-alert success" role="status">{success}</div> : null}

                  <button
                    className="button primary wide"
                    type="submit"
                    disabled={submitting || authLoading}
                  >
                    {submitting ? t.loading : t.registerBtn}
                  </button>

                  {showGeneratedPassword && generatedPassword && (
                    <div className="form-alert success" style={{marginTop: 10, padding: 16}}>
                      <div style={{marginBottom: 12}}>
                        <div style={{fontSize: 12, color: 'var(--muted)', marginBottom: 6}}>{t.yourPassword}</div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 16px',
                          background: 'var(--bg-soft)',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          fontSize: 20,
                          fontWeight: 800,
                          letterSpacing: '0.15em',
                          fontVariantNumeric: 'tabular-nums',
                          fontFamily: 'monospace',
                        }}>
                          <span>{generatedPassword}</span>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={copyPassword}
                            style={{minWidth: 40, height: 40}}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                          </button>
                        </div>
                      </div>
                      <p className="muted" style={{fontSize: 11, margin: 0}}>{t.savePassword}</p>
                      <button
                        type="button"
                        className="button primary wide"
                        style={{marginTop: 12}}
                        onClick={handleContinueAfterRegister}
                      >
                        {t.loginTitle} <IconArrowRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="auth-title">
                    <span className="auth-icon"><IconShield size={22} /></span>
                    <div>
                      <h2>{t.loginTitle}</h2>
                      <p className="muted">{t.loginSubtitle}</p>
                    </div>
                  </div>

                  <label className="field">
                    <span>{t.phone}</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      autoComplete="tel"
                      required
                      disabled={submitting}
                    />
                  </label>

                  <label className="field">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span>{t.password}</span>
                      <button
                        type="button"
                        className="text-button"
                        style={{fontSize: 12}}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />} {showPassword ? 'Yashirish' : 'Ko\'rsatish'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.password}
                      autoComplete="current-password"
                      required
                      disabled={submitting}
                    />
                  </label>

                  {error ? <div className="form-alert error" role="alert">{error}</div> : null}
                  {success ? <div className="form-alert success" role="status">{success}</div> : null}

                  <button
                    className="button primary wide"
                    type="submit"
                    disabled={submitting || authLoading}
                  >
                    {submitting ? t.loading : t.loginBtn}
                  </button>

                  {!telegramEmbedded ? (
                    <button
                      className="button secondary wide telegram-button"
                      type="button"
                      onClick={handleTelegramLaunch}
                    >
                      <IconSend size={18} /> {t.telegramLogin}
                    </button>
                  ) : (
                    <div className={`form-alert ${telegramState === 'error' ? 'error' : 'notice'}`} role={telegramState === 'error' ? 'alert' : 'status'}>
                      {telegramState === 'checking'
                        ? 'Telegram orqali avtomatik kirish tekshirilmoqda...'
                        : telegramState === 'needs-link'
                          ? `Telegram foydalanuvchisi${telegramPreview?.firstName ? ` ${telegramPreview.firstName}` : ''} hali ulanmagan.`
                          : telegramState === 'ready'
                            ? 'Telegram orqali avtomatik kirish bajarildi.'
                            : 'Telegram orqali avtomatik kirish bajarilmadi. Parol bilan davom eting.'}
                    </div>
                  )}
                </>
              )}
            </form>
          </section>
        </>
      )}
    </div>
  )
}