const SESSION_KEY = 'prime-v1-api-session'
// Production'da env berilmagan bo'lsa ham frontend ishlab turishi uchun Render API manzili fallback
const RENDER_API_BASE_URL = 'https://prime-club-api.onrender.com/api/v1'
const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? (String(import.meta.env.VITE_API_BASE_URL || '').trim() || RENDER_API_BASE_URL)
  : 'http://localhost:4000/api/v1'
const API_BASE_URL = String(DEFAULT_API_BASE_URL).replace(/\/$/, '')

let session = readSession()
let refreshPromise = null
const listeners = new Set()

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'API_ERROR', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function readSession() {
  if (typeof window === 'undefined') return null
  try {
    const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
    if (!stored?.accessToken || !stored?.refreshToken) return null
    return stored
  } catch {
    return null
  }
}

function notify() {
  for (const listener of listeners) listener(session)
}

function saveSession(nextSession) {
  session = nextSession
  if (typeof window !== 'undefined') {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(SESSION_KEY)
  }
  notify()
}

export function getSession() {
  return session
}

export function setSession(nextSession) {
  saveSession(nextSession ? { ...nextSession } : null)
}

export function clearSession() {
  saveSession(null)
}

export function subscribeToSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function errorFromResponse(status, payload) {
  const error = payload?.error
  return new ApiError(error?.message || 'Server bilan bog‘lanishda xatolik yuz berdi', {
    status,
    code: error?.code || 'API_ERROR',
    details: error?.details || null,
  })
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return response.json()
  const text = await response.text()
  return text ? { message: text } : null
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = true,
    signal,
    headers = {},
  } = options
  const requestHeaders = { Accept: 'application/json', ...headers }
  let payload = body
  if (body !== undefined && body !== null) {
    requestHeaders['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (auth && session?.accessToken) {
    requestHeaders.Authorization = `Bearer ${session.accessToken}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: payload,
      credentials: 'include',
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('API serverga ulanib bo‘lmadi', { status: 0, code: 'NETWORK_ERROR' })
  }
  const data = await parseResponse(response)
  if (!response.ok) throw errorFromResponse(response.status, data)
  return data
}

async function refreshAccessToken() {
  const refreshToken = session?.refreshToken
  if (!refreshToken) return false
  if (refreshPromise) return refreshPromise
  refreshPromise = request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
    retry: false,
  })
    .then((data) => {
      const current = getSession()
      if (!current || current.refreshToken !== refreshToken) return false
      if (data?.accessToken && data?.refreshToken) {
        saveSession({ ...current, ...data, user: data.user || current.user })
      }
      return true
    })
    .catch(() => {
      if (getSession()?.refreshToken === refreshToken) clearSession()
      return false
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

export async function apiRequest(path, options = {}) {
  try {
    return await request(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && options.auth !== false && options.retry !== false) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return request(path, { ...options, retry: false })
    }
    throw error
  }
}

export function getApiErrorMessage(error) {
  if (!(error instanceof ApiError)) return 'Server bilan bog‘lanishda xatolik yuz berdi'
  if (error.status === 404 || error.status === 405) {
    return 'API server topilmadi. Backend hali deploy qilinmagan yoki VITE_API_BASE_URL noto‘g‘ri.'
  }
  if (error.status === 0) {
    return 'API serverga ulanib bo‘lmadi. Internet yoki server holatini tekshiring.'
  }
  if (error.status === 429) return 'Juda ko‘p urinish. Biroz kutib, qayta yuboring.'
  if (error.status >= 500) return 'Serverda xatolik yuz berdi. Administratorga murojaat qiling.'
  return error.message
}

export function telegramSession(initData) {
  return apiRequest('/telegram/session', {
    method: 'POST',
    body: { initData },
    auth: false,
    retry: false,
  })
}

export function linkTelegramAccount(initData, phone, password) {
  return apiRequest('/telegram/link', {
    method: 'POST',
    body: { initData, phone, password },
    auth: false,
    retry: false,
  })
}

export function unlinkTelegramAccount(password) {
  return apiRequest('/telegram/unlink', {
    method: 'POST',
    body: { password },
  })
}

export { API_BASE_URL }
