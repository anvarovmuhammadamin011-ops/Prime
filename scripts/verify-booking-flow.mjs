// Bron oqimini foydalanuvchi ko'rinishida tekshirish (mock server orqali, localStorage stub bilan)
const storage = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  },
}

const { mockRequest } = await import('../src/api/mock-server.js')

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` -> ${detail}` : ''}`)
}

function headers(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Home.jsx ishlatadigan yordamchilar bilan aynan bir xil grid hisobi
async function getAvailablePcs(token, startAt, endAt, maxDuration) {
  const pcs = await mockRequest('/pcs', { headers: headers(token) })
  const bookings = await mockRequest('/bookings?pageSize=100', { headers: headers(token) })
  const blocking = ['pending', 'approved', 'active']
  return pcs.pcs.filter((pc) => {
    if (!pc.active) return false
    const conflict = bookings.items.some(
      (booking) =>
        booking.pcId === pc.id &&
        blocking.includes(booking.status) &&
        booking.startAt < endAt &&
        startAt < booking.endAt,
    )
    return !conflict
  })
}

async function main() {
  const login = await mockRequest('/auth/login', {
    method: 'FROZEN'.replace('FROZEN', 'POST'),
    headers: headers(),
    body: JSON.stringify({ phone: '+998901234567', password: 'demo12345' }),
  })
  check('demo login', Boolean(login?.accessToken), login?.user?.role)
  const token = login.accessToken

  // === 1-qadam: Modal ochiladi (default vaqt: hozir+5 daq, keyingi 15 daq. chegara) ===
  const now = Date.now()
  const defaultStart = Math.ceil((now + 5 * 60 * 1000) / (15 * 60 * 1000)) * 15 * 60 * 1000

  let grid1 = await getAvailablePcs(token, defaultStart, defaultStart + 60 * 60 * 1000)
  check('1) modal ochilganda grid 20 ta bo‘sh PC ko‘rsatadi', grid1.length === 20, `${grid1.length} ta`)

  // === 2-qadam: Foydalanuvchi sanani/vaqtini o'zgartirdi (faqat grid hisobi o'zgaradi) ===
  const laterStart = defaultStart + 3 * 60 * 60 * 1000
  const grid2 = await getAvailablePcs(token, laterStart, laterStart + 2 * 60 * 60 * 1000)
  check('2) boshqa vaqt tanlandi — grid qayta hisoblanadi (hanuz 20 ta)', grid2.length === 20, `${grid2.length} ta`)

  // === 3-qadam: Vaqtga bron yaratildi (PC-5) ===
  const booking = await mockRequest('/bookings', {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ pcId: 'pc-5', startAt: new Date(laterStart).toISOString(), durationHours: 2 }),
  })
  check('3) PC-5 ga 2 soatlik bron yaratildi', booking?.booking?.pcId === 'pc-5', booking?.booking?.id)

  // === 4-qadam: PC-5 endi grid'da yo'q, qolgan 19 ta bor ===
  const grid3 = await getAvailablePcs(token, laterStart, laterStart + 2 * 60 * 60 * 1000)
  check('4) tanlangan vaqtda PC-5 grid‘dan yo‘qoladi', grid3.length === 19 && !grid3.some((pc) => pc.id === 'pc-5'), `${grid3.length} ta, pc-5 bor=${grid3.some((p) => p.id === 'pc-5')}`)

  // === 5-qadam: Boshqa vaqtda PC-5 hanuz bo'sh (grid vaqtga bog'liq) ===
  const farStart = laterStart + 4 * 60 * 60 * 1000
  const grid4 = await getAvailablePcs(token, farStart, farStart + 60 * 60 * 1000)
  check('5) boshqa vaqtda PC-5 yana bo‘sh ko‘rinadi', grid4.some((pc) => pc.id === 'pc-5'), `${grid4.length} ta`)

  // === 6-qadam: Chegaraviy holat — bron 1 daqiqadan keyin tugaydi, keyingi bron 30 daq. dan ===
  const soonEnd = now + 1 * 60 * 1000
  let conflictError = null
  try {
    await mockRequest('/bookings', {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ pcId: 'pc-5', startAt: new Date(laterStart + 60 * 60 * 1000).toISOString(), durationHours: 1 }),
    })
  } catch (error) {
    conflictError = error
  }
  check('6) PC-5 ga mos kelmagan vaqt ham overlap xato beradi', conflictError?.mockResponse?.status === 409, conflictError?.mockResponse?.payload?.error?.code)

  // === 7-qadam: Admin tasdiqlaydi — grid o'zgarmasligi kerak (pending ham band qiladi) ===
  const adminLogin = await mockRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone: '+998901111111', password: 'demo12345' }),
  })
  await mockRequest(`/admin/bookings/${booking.booking.id}/approve`, {
    method: 'POST',
    headers: headers(adminLogin.accessToken),
  })
  const grid5 = await getAvailablePcs(token, laterStart, laterStart + 2 * 60 * 60 * 1000)
  check('7) tasdiqlangach ham PC-5 band (grid to‘g‘ri)', grid5.length === 19 && !grid5.some((pc) => pc.id === 'pc-5'), `${grid5.length} ta`)

  const failed = results.filter((item) => !item.ok)
  console.log(`\n${results.length - failed.length}/${results.length} tekshiruv o'tdi`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
  console.error('BOOKING FLOW TEST CRASH:', error)
  process.exit(1)
})
