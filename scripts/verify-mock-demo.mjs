// Mock demo rejimini smoke-test qilish (node, window stub bilan)
const storage = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
}

const { mockRequest, isDemoMode } = await import('../src/api/mock-server.js')

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` -> ${detail}` : ''}`)
}

function headers(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function main() {
  // 1. Login
  const login = await mockRequest('/auth/login', {
    method: 'POST',
    headers: headers('demo-access-x'),
    body: JSON.stringify({ phone: '+998901234567', password: 'demo12345' }),
  })
  check('login user', Boolean(login?.accessToken && login.user?.role === 'user'), login?.user?.role)
  const userToken = login.accessToken

  // 2. Noto'g'ri parol
  let wrong = null
  try {
    await mockRequest('/auth/login', { method: 'POST', body: JSON.stringify({ phone: '+998901234567', password: 'x'.repeat(9) }) })
  } catch (error) {
    wrong = error
  }
  check('login rejects wrong password', wrong?.mockResponse?.status === 401, wrong?.mockResponse?.status)

  // 3. Admin login
  const adminLogin = await mockRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: '+998901111111', password: 'demo12345' }),
  })
  check('login admin', adminLogin?.user?.role === 'admin', adminLogin?.user?.role)
  const adminToken = adminLogin.accessToken

  // 4. Settings va pcs
  const settings = await mockRequest('/settings', { headers: headers(userToken) })
  check('settings', settings?.settings?.clubName === 'Prime Game Club', settings?.settings?.clubName)
  const pcs = await mockRequest('/pcs', { headers: headers(userToken) })
  check('pcs 20 ta, free', pcs?.pcs?.length === 20 && pcs.pcs.every((pc) => pc.status === 'free'), `${pcs?.pcs?.length}/free`)

  // 5. Booking yaratish (5 daqiqadan keyin — sessiya testi uchun)
  const startAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const created = await mockRequest('/bookings', {
    method: 'POST',
    headers: headers(userToken),
    body: JSON.stringify({ pcId: 'pc-1', startAt, durationHours: 2 }),
  })
  check('create booking', created?.booking?.status === 'pending' && created.booking.totalPrice === 36000, created?.booking?.id)
  const bookingId = created.booking.id

  // 6. Conflict
  let conflict = null
  try {
    await mockRequest('/bookings', {
      method: 'POST',
      headers: headers(userToken),
      body: JSON.stringify({ pcId: 'pc-1', startAt, durationHours: 1 }),
    })
  } catch (error) {
    conflict = error
  }
  check('overlap rejected', conflict?.mockResponse?.status === 409, conflict?.mockResponse?.payload?.error?.code)

  // 7. Admin tasdiqlash
  const approved = await mockRequest(`/admin/bookings/${bookingId}/approve`, { method: 'POST', headers: headers(adminToken) })
  check('approve', approved?.booking?.status === 'approved' && /^\d{6}$/.test(approved.accessCode || ''), approved?.accessCode)

  // 8. User ro'yxati
  const myBookings = await mockRequest('/bookings?pageSize=100', { headers: headers(userToken) })
  check('my bookings', myBookings?.total === 1, `total=${myBookings?.total}`)

  // 9. Admin dashboard ma'lumotlari
  const adminBookings = await mockRequest('/admin/bookings?pageSize=100', { headers: headers(adminToken) })
  check('admin bookings', adminBookings?.total === 1, `total=${adminBookings?.total}`)

  // 10. Sessiya boshlash
  let sessionStart = null
  try {
    sessionStart = await mockRequest('/admin/sessions/start', {
      method: 'POST',
      headers: headers(adminToken),
      body: JSON.stringify({ code: approved.accessCode }),
    })
  } catch (error) {
    sessionStart = { error }
  }
  check('start session', sessionStart?.session?.status === 'active' && sessionStart.booking?.status === 'active', sessionStart?.session?.id || sessionStart.error?.mockResponse?.payload?.error?.code)

  // 11. PCS endi active
  const pcsAfter = await mockRequest('/pcs', { headers: headers(userToken) })
  const pc1 = pcsAfter.pcs.find((pc) => pc.id === 'pc-1')
  check('pc-1 active', pc1?.status === 'active', pc1?.status)

  // 12. Staff guard
  let forbidden = null
  try {
    await mockRequest('/admin/bookings?pageSize=100', { headers: headers(userToken) })
  } catch (error) {
    forbidden = error
  }
  // 13. Refresh token oqimi
  const refreshed = await mockRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: login.refreshToken }),
  })
  check('refresh token', Boolean(refreshed?.accessToken && refreshed.user?.id === login.user.id), refreshed?.user?.id)
  check('staff guard', forbidden?.mockResponse?.status === 403, forbidden?.mockResponse?.status)

  // 13. Persistensiya
  const state2 = JSON.parse(window.localStorage.getItem('prime-v1-demo-state'))
  check('persisted', state2.bookings.length === 1 && state2.sessions.length === 1, `b=${state2.bookings.length} s=${state2.sessions.length}`)

  check('isDemoMode export', typeof isDemoMode === 'function')

  const failed = results.filter((item) => !item.ok)
  console.log(`\n${results.length - failed.length}/${results.length} tekshiruv o'tdi`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
  console.error('SMOKE TEST CRASH:', error)
  process.exit(1)
})
