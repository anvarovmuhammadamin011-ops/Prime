import { isDemoMode as isMockDemoMode, mockRequest } from './mock-server.js'

const SESSION_KEY = 'prime-v1-api-session'
// Production'da env berilmagan bo'lsa ham frontend ishlab turishi uchun Render API manzili fallback
const RENDER_API_BASE_URL = 'https://prime-club-api-x7ab.onrender.com/api/v1'
const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? (String(import.meta.env.VITE_API_BASE_URL || '').trim() || RENDER_API_BASE_URL)
  : 'http://localhost:4000/api/v1'
const API_BASE_URL = String(DEFAULT_API_BASE_URL).replace(/\/$/, '')

// Backend tavfsiz holatda demo (mock) rejimga avtomatik o'tish
let demoMode = isMockDemoMode()
function enableDemoMode() {
  if (demoMode) return
  demoMode = true
  if (typeof window !== 'undefined') window.__PRIME_DEMO_MODE__ = true
}
export function isDemoMode() {
  return demoMode
}

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
    const networkError = new ApiError('API serverga ulanib bo‘lmadi', { status: 0, code: 'NETWORK_ERROR' })
    networkError.backendUnavailable = true
    throw networkError
  }
  const data = await parseResponse(response)
  if (!response.ok) {
    const error = errorFromResponse(response.status, data)
    const contentType = response.headers.get('content-type') || ''
    // JSON bo'lmagan 404/5xx — bu odatda routier yoki proxy javobi (masalan Render "no-server")
    if ([404, 405, 502, 503].includes(response.status) && !contentType.includes('application/json')) {
      error.backendUnavailable = true
    }
    throw error
  }
  return data
}

async function refreshAccessToken() {
  const refreshToken = session?.refreshToken
  if (!refreshToken) return false
  if (refreshPromise) return refreshPromise
  refreshPromise = dispatch('/auth/refresh', {
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

function mockDispatch(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.auth !== false && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`
  }
  return mockRequest(path, { ...options, headers }).catch((error) => {
    if (error?.mockResponse) {
      throw errorFromResponse(error.mockResponse.status, error.mockResponse.payload)
    }
    throw error
  })
}

async function dispatch(path, options = {}) {
  if (demoMode) return mockDispatch(path, options)
  try {
    return await request(path, options)
  } catch (error) {
    const unavailable =
      error instanceof ApiError &&
      (error.backendUnavailable || error.status === 0) &&
      options.retry !== false &&
      !options.signal
    if (!unavailable) throw error
    // Backend javob bermadi — demo rejimga o'tamiz va so'rovni mock bilan davom ettiramiz
    enableDemoMode()
    return mockDispatch(path, options)
  }
}

export async function apiRequest(path, options = {}) {
  try {
    return await dispatch(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && options.auth !== false && options.retry !== false) {
      const refreshed = await refreshAccessToken()
      if (refreshed) return dispatch(path, { ...options, retry: false })
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
