import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  apiRequest,
  clearSession,
  getApiErrorMessage,
  getSession,
  linkTelegramAccount,
  setSession,
  telegramSession,
  unlinkTelegramAccount,
  subscribeToSession,
} from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(getSession)
  const [user, setUser] = useState(() => getSession()?.user || null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(Boolean(getSession()?.accessToken))
  const [usersLoading, setUsersLoading] = useState(false)
  const [error, setError] = useState('')
  const accessTokenRef = useRef(session?.accessToken || null)
  const usersRequestSequence = useRef(0)
  const userId = user?.id || null
  const userRole = user?.role || null

  useEffect(() => {
    return subscribeToSession((nextSession) => {
      const nextAccessToken = nextSession?.accessToken || null
      const tokenChanged = accessTokenRef.current !== nextAccessToken
      accessTokenRef.current = nextAccessToken
      setSessionState(nextSession)
      setUser(nextSession?.user || null)
      if (tokenChanged) setLoading(Boolean(nextAccessToken))
    })
  }, [])

  useEffect(() => {
    let active = true
    if (!session?.accessToken) {
      return () => {
        active = false
      }
    }
    apiRequest('/auth/me')
      .then((data) => {
        if (!active) return
        const current = getSession()
        if (!current) return
        setSession({ ...current, user: data.user })
        setUser(data.user)
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        clearSession()
        setError(getApiErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.accessToken])

  const refreshUsers = useCallback(async () => {
    const sequence = usersRequestSequence.current + 1
    usersRequestSequence.current = sequence
    if (!userId || userRole === 'user') {
      setUsers([])
      setUsersLoading(false)
      return []
    }
    setUsersLoading(true)
    try {
      const data = await apiRequest('/admin/users?pageSize=100')
      if (usersRequestSequence.current !== sequence) return []
      setUsers(data.items || [])
      setError('')
      return data.items || []
    } catch (requestError) {
      if (usersRequestSequence.current === sequence) setError(getApiErrorMessage(requestError))
      return []
    } finally {
      if (usersRequestSequence.current === sequence) setUsersLoading(false)
    }
  }, [userId, userRole])

  useEffect(() => {
    queueMicrotask(() => {
      if (userId && userRole !== 'user') void refreshUsers()
      else {
        usersRequestSequence.current += 1
        setUsers([])
      }
    })
  }, [userId, userRole, refreshUsers])

  const login = useCallback(async (phone, password) => {
    setError('')
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { phone, password },
        auth: false,
      })
      setSession(data)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const register = useCallback(async ({ name, phone, password }) => {
    setError('')
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: { name, phone, password },
        auth: false,
      })
      setSession(data)
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return { ok: false, error: message }
    }
  }, [])

  const telegramLogin = useCallback(async (initData) => {
    setError('')
    try {
      const data = await telegramSession(initData)
      setSession(data)
      setUser(data.user)
      return { ok: true, user: data.user, telegram: data.telegram }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return { ok: false, error: message, code: requestError?.code || 'API_ERROR' }
    }
  }, [])

  const linkTelegram = useCallback(async (initData, phone, password) => {
    setError('')
    try {
      const data = await linkTelegramAccount(initData, phone, password)
      setSession(data)
      setUser(data.user)
      return { ok: true, user: data.user, telegram: data.telegram }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return { ok: false, error: message, code: requestError?.code || 'API_ERROR' }
    }
  }, [])

  const unlinkTelegram = useCallback(async (password) => {
    setError('')
    try {
      const data = await unlinkTelegramAccount(password)
      const current = getSession()
      if (current) setSession({ ...current, user: data.user })
      setUser(data.user)
      return { ok: true, user: data.user, unlinked: data.unlinked }
    } catch (requestError) {
      const message = getApiErrorMessage(requestError)
      setError(message)
      return { ok: false, error: message, code: requestError?.code || 'API_ERROR' }
    }
  }, [])

  const updateProfile = useCallback(async (patch) => {
    try {
      const data = await apiRequest('/profile', { method: 'PATCH', body: patch })
      const current = getSession()
      if (current) setSession({ ...current, user: data.user })
      setUser(data.user)
      return { ok: true, user: data.user }
    } catch (requestError) {
      return { ok: false, error: getApiErrorMessage(requestError) }
    }
  }, [])

  const logout = useCallback(async () => {
    const current = getSession()
    if (current?.refreshToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: { refreshToken: current.refreshToken },
          retry: false,
        })
      } catch {
        void 0
      }
    }
    clearSession()
    setError('')
  }, [])

  const value = useMemo(
    () => ({
      user,
      users,
      loading,
      usersLoading,
      error,
      login,
      register,
      telegramLogin,
      linkTelegram,
      unlinkTelegram,
      updateProfile,
      logout,
      refreshUsers,
    }),
    [
      user,
      users,
      loading,
      usersLoading,
      error,
      login,
      register,
      telegramLogin,
      linkTelegram,
      unlinkTelegram,
      updateProfile,
      logout,
      refreshUsers,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
