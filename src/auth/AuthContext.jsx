import { createContext, useContext, useState } from 'react'
import { USERS, REGISTERED_STORAGE } from '../data.js'

const AUTH_KEY = 'prime-auth'
const AuthContext = createContext(null)

function getRegistered() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_STORAGE) || '[]')
  } catch {
    return []
  }
}

function getAllUsers() {
  const all = Object.values(USERS).reduce((acc, u) => {
    acc[u.phone] = u
    return acc
  }, {})
  for (const u of getRegistered()) all[u.phone] = u
  return all
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const phone = localStorage.getItem(AUTH_KEY)
    if (!phone) return null
    return getAllUsers()[phone] || null
  })

  function login(phone, password) {
    const u = getAllUsers()[phone.trim()]
    if (!u || u.password !== password) return null
    localStorage.setItem(AUTH_KEY, u.phone)
    setUser({ ...u })
    return u
  }

  function register({ name, phone, password }) {
    const clean = phone.trim()
    if (!name.trim() || !clean || !password) return { error: "Barcha maydonlarni to'ldiring" }
    if (getAllUsers()[clean]) return { error: 'Bunday telefon raqam allaqachon ro\u2018yxatdan o\u2018tgan' }
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`
    const newUser = {
      role: 'user',
      phone: clean,
      password,
      name: name.trim(),
      joined: iso,
      tier: 'Standard',
      balance: 50000,
      bonus: 0,
      hours: 0,
    }
    const registered = getRegistered()
    registered.push(newUser)
    localStorage.setItem(REGISTERED_STORAGE, JSON.stringify(registered))
    localStorage.setItem(AUTH_KEY, clean)
    setUser({ ...newUser })
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}