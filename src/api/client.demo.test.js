import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest'

// client.js va mock-server.js window/localStorage/fetch ishlatadi — ularni import'dan oldin stub qilamiz
const storageMap = new Map()
const localStorageStub = {
  getItem: (key) => (storageMap.has(key) ? storageMap.get(key) : null),
  setItem: (key, value) => storageMap.set(key, String(value)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
}

vi.stubGlobal('window', { localStorage: localStorageStub })
vi.stubGlobal('localStorage', localStorageStub)

let client

beforeAll(async () => {
  client = await import('./client.js')
})

afterEach(() => {
  vi.unstubAllGlobals()
  // stublarni qaytaramiz (client moduli window'ga bog'liq)
  vi.stubGlobal('window', { localStorage: localStorageStub })
  vi.stubGlobal('localStorage', localStorageStub)
})

function noServerResponse() {
  // Render routier javobi: 404, JSON emas (x-render-routing: no-server holati)
  return {
    ok: false,
    status: 404,
    headers: { get: () => 'text/plain; charset=utf-8' },
    text: async () => 'Not Found',
    json: async () => {
      throw new Error('not json')
    },
  }
}

describe('client.js demo fallback', () => {
  it('real API 404 (no-server) qaytarsa demo rejimga o\'tadi va demo hisob bilan kiriladi', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(noServerResponse()))
    vi.stubGlobal('fetch', fetchMock)

    // 1. Brauzer demo tugmasini bosganda qiladigan ish: login so'rovi
    const result = await client.apiRequest('/auth/login', {
      method: 'POST',
      body: { phone: '+998901234567', password: 'demo12345' },
      auth: false,
    })

    // Real API'ga bitta murojaat bo'ldi, so'ng demo rejimga o'tildi
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(client.isDemoMode()).toBe(true)
    expect(result.user.role).toBe('user')
    expect(result.user.phone).toBe('+998901234567')
    expect(result.accessToken).toBeTruthy()
    expect(result.refreshToken).toBeTruthy()

    // AuthContext login'dan keyin qiladigan ish: sessiyani saqlash
    client.setSession(result)

    // 2. Demo rejimda keyingi so'rovlar tarmoqqa chiqmaydi
    const settings = await client.apiRequest('/settings')
    expect(settings.settings.clubName).toBe('Prime Game Club')
    const pcs = await client.apiRequest('/pcs')
    expect(pcs.pcs).toHaveLength(20)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // 3. Sessiya saqlandi (/auth/me ishlaydi)
    const me = await client.apiRequest('/auth/me')
    expect(me.user.id).toBe(result.user.id)
  })

  it('demo rejimda admin hisob ham kiradi va admin endpointlari ochiladi', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(noServerResponse())))

    const admin = await client.apiRequest('/auth/login', {
      method: 'POST',
      body: { phone: '+998901111111', password: 'demo12345' },
      auth: false,
    })
    expect(admin.user.role).toBe('admin')
    client.setSession(admin)

    const users = await client.apiRequest('/admin/users?pageSize=100')
    expect(users.items.length).toBeGreaterThanOrEqual(3)
  })

  it('demo rejimda noto\'g\'ri parol 401 beradi', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(noServerResponse())))

    await expect(
      client.apiRequest('/auth/login', {
        method: 'POST',
        body: { phone: '+998901234567', password: 'demo12345' },
        auth: false,
      }),
    ).resolves.toBeTruthy()

    await expect(
      client.apiRequest('/auth/login', {
        method: 'POST',
        body: { phone: '+998901234567', password: 'not-the-password' },
        auth: false,
      }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })
  })
})
