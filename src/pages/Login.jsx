import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { DEMO_ACCOUNTS, USERS } from '../data.js'
import { IconGamepad, IconCheck, IconX } from '../components/Icons.jsx'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const [signup, setSignup] = useState(false)
  const [suName, setSuName] = useState('')
  const [suPhone, setSuPhone] = useState('')
  const [suPass, setSuPass] = useState('')
  const [suError, setSuError] = useState('')

  function go(u) {
    const target =
      u.role === 'user' ? '/' : u.role === 'superadmin' ? '/superadmin' : '/admin'
    navigate(target, { replace: true })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const u = login(phone, password)
    if (!u) {
      setError("Telefon raqam yoki parol noto'g'ri")
      return
    }
    go(u)
  }

  function demoLogin(acc) {
    setError('')
    setPhone(acc.phone)
    setPassword(USERS[acc.key].password)
    const u = login(acc.phone, USERS[acc.key].password)
    if (u) go(u)
  }

  function handleSignup(e) {
    e.preventDefault()
    setSuError('')
    const res = register({ name: suName, phone: suPhone, password: suPass })
    if (res.error) {
      setSuError(res.error)
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="login-wrap">
      <div className="brand-panel">
        <div className="brand-glow glow-1" />
        <div className="brand-glow glow-2" />
        <div className="brand-panel-inner">
          <div className="logo logo-light">
            <div className="logo-icon">
              <IconGamepad size={22} />
            </div>
            <span>
              PRIME <em>CLUB</em>
            </span>
          </div>
          <h2>
            O&#39;yin zali va <br />
            klublar uchun platforma
          </h2>
          <p>
            Kompyuterlarni tanlang, joy band qiling va bonuslarni to&#39;plang — hammasi bitta
            joyda.
          </p>
          <ul className="brand-points">
            <li>
              <IconCheck size={16} /> Real vaqtdagi joylar holati
            </li>
            <li>
              <IconCheck size={16} /> 3 bosqichli tezkor bron qilish
            </li>
            <li>
              <IconCheck size={16} /> Sodiqlik dasturi va bonuslar
            </li>
          </ul>
        </div>
      </div>

      <div className="form-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <h3>Hisobga kirish</h3>
          <p className="muted">Prime Club profilingizga kiring</p>

          <label className="field">
            <span>Telefon raqami</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998901234567"
              autoComplete="tel"
              required
            />
          </label>

          <label className="field">
            <span>Parol</span>
            <div className="pass-wrap">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" className="eye-btn" onClick={() => setShow(!show)}>
                {show ? 'Yashirish' : 'Ko\'rsatish'}
              </button>
            </div>
          </label>

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" className="btn btn-primary btn-block">
            Kirish
          </button>

          <p className="signup-line">
            Yangi foydalanuvchimisiz?{' '}
            <button type="button" className="link" onClick={() => setSignup(true)}>
              Ro'yxatdan o'tish
            </button>
          </p>
        </form>

        <div className="demo-card">
          <div className="demo-head">
            <span className="chip chip-violet">Demo hisoblar</span>
            <p>Bitta bosishda tizimga kiring</p>
          </div>
          {DEMO_ACCOUNTS.map((acc) => (
            <div className="demo-row" key={acc.key}>
              <div className="demo-info">
                <strong>{acc.label}</strong>
                <span>
                  {acc.phone}
                  {acc.label === 'Foydalanuvchi (Mijoz)' ? '  ·  demo parol avtomatik' : ''}
                </span>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => demoLogin(acc)}>
                Demo kirish
              </button>
            </div>
          ))}
          <p className="muted note">Demo parol: demo123</p>
        </div>
      </div>

      {signup ? (
        <div className="overlay" onClick={() => setSignup(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSignup}>
            <div className="modal-head">
              <h3>Ro&#39;yxatdan o&#39;tish</h3>
              <button type="button" className="icon-btn" onClick={() => setSignup(false)}>
                <IconX size={18} />
              </button>
            </div>

            <label className="field">
              <span>Ismingiz</span>
              <input value={suName} onChange={(e) => setSuName(e.target.value)} placeholder="Abdulloh Karimov" required />
            </label>
            <label className="field">
              <span>Telefon raqam</span>
              <input
                type="tel"
                value={suPhone}
                onChange={(e) => setSuPhone(e.target.value)}
                placeholder="+998901234567"
                required
              />
            </label>
            <label className="field">
              <span>Parol</span>
              <input
                type="password"
                value={suPass}
                onChange={(e) => setSuPass(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {suError ? <p className="error">{suError}</p> : null}

            <button type="submit" className="btn btn-primary btn-block">
              Ro&#39;yxatdan o&#39;tish
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}