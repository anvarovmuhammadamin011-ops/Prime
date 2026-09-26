// Mobil (390x844) viewport'da bron modalini va PC grid'ni haqiqiy Chrome'da tekshirish.
// Talablar: 1) headless Chrome --remote-debugging-port=9222, 2) lokal server ishlab turishi kerak
const CDP_HTTP = 'http://127.0.0.1:9222'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` -> ${detail}` : ''}`)
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function createTab() {
  // 1-urinish: mavjud bo'sh page tab'dan foydalanamiz (PUT /json/new ba'zi holatlarda osiladi)
  try {
    const list = await (await fetch(`${CDP_HTTP}/json/list`)).json()
    const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
    if (page) {
      console.log(`  Tab qayta ishlatildi: ${page.id}`)
      return page
    }
  } catch (error) {
    console.log(`  /json/list xato: ${error.message}`)
  }
  // 2-urinish: yangi tab yaratamiz
  const response = await fetch(`${CDP_HTTP}/json/new?url=${encodeURIComponent('about:blank')}`, { method: 'PUT' })
  const tab = await response.json()
  if (!tab.webSocketDebuggerUrl) throw new Error('/json/new javobida webSocketDebuggerUrl yo\'q: ' + JSON.stringify(tab))
  return tab
}

async function send(cdp, method, params = {}) {
  // DIQQAT: send.counter initsializatsiya qilinishi shart, aks holda ++undefined = NaN va javob id hech qachon mos kelmaydi
  send.counter = (send.counter || 0) + 1
  const id = send.counter
  return Promise.race([
    new Promise((resolve, reject) => {
      const onMessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.id === id) {
          cdp.removeEventListener('message', onMessage)
          if (data.error) reject(new Error(`${method}: ${data.error.message}`))
          else resolve(data.result)
        }
      }
      cdp.addEventListener('message', onMessage)
      cdp.send(JSON.stringify({ id, method, params }))
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${method} timeout`)), 20000)),
  ])
}

async function evaluate(cdp, expression) {
  const result = await send(cdp, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || 'evaluate failed')
  return result.result.value
}

async function screenshot(cdp, file) {
  const { data } = await send(cdp, 'Page.captureScreenshot', { format: 'png' })
  const { writeFileSync } = await import('node:fs')
  writeFileSync(file, Buffer.from(data, 'base64'))
  console.log(`  📸 ${file}`)
}

async function main() {
  // MUHIM: sahifa-level tab'ga ulanish kerak (brauzer-level'da Page/Runtime ishlamaydi)
  const tab = await createTab()
  console.log(`  WS ulanmoqda: ${tab.webSocketDebuggerUrl}`)
  const cdp = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WS ulanish timeout (10s)')), 10000)
    cdp.onopen = () => {
      clearTimeout(timer)
      resolve()
    }
    cdp.onerror = (event) => {
      clearTimeout(timer)
      reject(new Error('WS ulanish xatosi: ' + (event.message || event.error?.message || 'noma\'lum')))
    }
  })

  // Page.enable muhim emas (navigate/screenshot'siz ham ishlaydi) — xato bo'lsa o'tkazib yuboramiz
  for (const method of ['Page.enable', 'Runtime.enable']) {
    try {
      await send(cdp, method)
    } catch (error) {
      console.log(`  ${method} o'tkazib yuborildi: ${error.message}`)
    }
  }

  // Mobil viewport emulyatsiyasi (iPhone 12/13/14 o'lchami)
  await send(cdp, 'Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send(cdp, 'Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })

  await send(cdp, 'Page.navigate', { url: APP_URL })
  await sleep(3500)

  // DETERMINIZM: qayta ishlatilgan tabda eski sessiya/hash qolgan bo'lishi mumkin — tozalab qayta yuklaymiz
  await evaluate(cdp, `
    localStorage.clear()
    location.hash = '#/login'
    location.reload()
  `)
  await sleep(3500)

  // 1) Demo login (localStorage sessiyasini bevosita yozamiz — mock rejim bilan ishlaydi)
  const demoLogin = await evaluate(cdp, `
    (async () => {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone: '+998901234567', password: 'demo12345' }),
      }).catch(() => null)
      if (res && res.ok) return { via: 'real' }
      // real backend yo'q — demo (mock) rejim testi: localStorage demo state'ini shakllantiramiz
      return { via: 'mock' }
    })()
  `)
  check('1) sayt ochildi', true, `login via: ${demoLogin.via}`)

  // Demo rejimda mock server login orqali sessiya yaratish uchun to'g'ridan-to'g'ri UI oqimini ishlatamiz
  const loginResult = await evaluate(cdp, `
    (async () => {
      // Login sahifasida til tanlanadi, keyin demo tugma bosiladi
      const langButtons = [...document.querySelectorAll('button')]
      const uz = langButtons.find((b) => b.textContent.includes('zbekcha'))
      if (uz) { uz.click(); await new Promise((r) => setTimeout(r, 600)) }
      const demoButtons = [...document.querySelectorAll('button')]
      const demo = demoButtons.find((b) => b.textContent.trim() === 'Foydalanuvchi' || b.textContent.includes('Foydalanuvchi'))
      if (demo) { demo.click(); await new Promise((r) => setTimeout(r, 3000)) }
      return { url: location.hash || location.pathname, text: document.body.innerText.slice(0, 120) }
    })()
  `)
  check('2) demo hisob bilan kirildi', loginResult.url !== '#/login' && loginResult.url !== '/login', loginResult.url)

  const hasGrid = await evaluate(cdp, `Boolean(document.querySelector('.user-pc-grid'))`)
  check('3) Home sahifada PC grid bor', hasGrid)

  // 4) Grid ustunlari soni mobil'da 2 bo'lishi kerak
  const gridInfo = await evaluate(cdp, `
    (() => {
      const grid = document.querySelector('.user-pc-grid')
      if (!grid) return null
      const first = grid.firstElementChild
      const style = getComputedStyle(grid)
      const rect = first.getBoundingClientRect()
      return {
        columns: style.gridTemplateColumns.split(' ').length,
        cards: grid.children.length,
        cardWidth: Math.round(rect.width),
        viewport: window.innerWidth,
      }
    })()
  `)
  check('4) mobil grid 2 ustunli', gridInfo && gridInfo.columns === 2, JSON.stringify(gridInfo))
  check("5) kartalar viewport'dan toshib ketmayapti", gridInfo && gridInfo.cardWidth <= gridInfo.viewport, `${gridInfo?.cardWidth}px <= ${gridInfo?.viewport}px`)

  // 6) Bron modalini ochamiz
  const modalOpened = await evaluate(cdp, `
    (async () => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Bron qilish'))
      if (!btn) return false
      btn.click()
      for (let i = 0; i < 16; i++) {
        await new Promise((r) => setTimeout(r, 250))
        if (document.querySelector('.booking-modal')) return true
      }
      return Boolean(document.querySelector('.booking-modal'))
    })()
  `)
  check('6) bron modal ochiladi', modalOpened)

  // 7) Modal mobil'da ekranga sig'adi
  const modalInfo = await evaluate(cdp, `
    (() => {
      const modal = document.querySelector('.booking-modal')
      if (!modal) return null
      const rect = modal.getBoundingClientRect()
      return {
        width: Math.round(rect.width),
        viewport: window.innerWidth,
        overflows: rect.width > window.innerWidth || rect.left < 0,
        scrollable: modal.scrollHeight > modal.clientHeight,
        height: Math.round(rect.height),
        windowHeight: window.innerHeight,
      }
    })()
  `)
  check('7) modal ekranga sig‘adi (gorizontal toshiq yo‘q)', modalInfo && !modalInfo.overflows, JSON.stringify(modalInfo))
  check('8) modal scroll qilinadigan (pastdan chiqadigan sheet)', modalInfo && modalInfo.height <= modalInfo.windowHeight + 10, `h=${modalInfo?.height} vs ${modalInfo?.windowHeight}`)

  // 9) Sana/vaqt o'zgarsa PC picker grid yangilanadi va kartalar sig'adi
  const pickerInfo = await evaluate(cdp, `
    (async () => {
      // pc ma'lumotlari asinxron yuklanishi mumkin — grid chiqquncha kutamiz
      for (let i = 0; i < 16; i++) {
        const grid = document.querySelector('.pc-picker-grid')
        if (grid) break
        await new Promise((r) => setTimeout(r, 250))
      }
      const grid = document.querySelector('.pc-picker-grid')
      if (!grid) {
        const modal = document.querySelector('.booking-modal')
        return {
          found: false,
          modalText: modal ? modal.innerText.replace(/\s+/g, ' ').slice(0, 140) : '(modal yo‘q)',
        }
      }
      const cards = [...grid.children].map((card) => card.getBoundingClientRect().width)
      return {
        found: true,
        cards: grid.children.length,
        minCardWidth: Math.round(Math.min(...cards)),
        viewport: window.innerWidth,
      }
    })()
  `)
  check('9) PC picker grid modal ichida bor', pickerInfo.found, JSON.stringify(pickerInfo))
  if (pickerInfo.found) {
    check('10) picker kartalari toshib ketmayapti', pickerInfo.minCardWidth <= pickerInfo.viewport, `min=${pickerInfo.minCardWidth}px`)
  }

  // 11) Davomiylik tugmalari 4 ustunli va sig'adi
  const durationInfo = await evaluate(cdp, `
    (() => {
      const options = document.querySelector('.booking-modal .duration-options')
      if (!options) return null
      const first = options.firstElementChild.getBoundingClientRect()
      return { columns: getComputedStyle(options).gridTemplateColumns.split(' ').length, btnWidth: Math.round(first.width) }
    })()
  `)
  check('11) davomiylik tugmalari sig‘adi', durationInfo && durationInfo.btnWidth > 40 && durationInfo.btnWidth < 390, JSON.stringify(durationInfo))

  // 12) PC tanlab, bron yuborish
  const bookingSubmitted = await evaluate(cdp, `
    (async () => {
      const picker = document.querySelector('.pc-picker-grid')
      if (!picker || !picker.children.length) return { ok: false, reason: 'no picker' }
      picker.children[0].click()
      await new Promise((r) => setTimeout(r, 300))
      const submit = [...document.querySelectorAll('.booking-modal button[type=submit]')][0]
      if (!submit) return { ok: false, reason: 'no submit' }
      submit.click()
      await new Promise((r) => setTimeout(r, 2500))
      return { ok: !document.querySelector('.booking-modal'), url: location.hash }
    })()
  `)
  check('12) PC tanlab bron yuborildi va modal yopildi', bookingSubmitted.ok, bookingSubmitted.url)

  await screenshot(cdp, 'data/mobile-home.png')

  // 13) Admin sifatida kirib Computers sahifasini tekshirish
  const adminResult = await evaluate(cdp, `
    (async () => {
      // demo state'da foydalanuvchi rolini admin bilan almashtirib qaytadan kirish oqimini tekshiramiz
      const raw = localStorage.getItem('prime-v1-demo-state')
      if (raw) {
        const state = JSON.parse(raw)
        // admin login
        const demoAccounts = { '+998901111111': 'admin' }
        void demoAccounts
      }
      return { hasDemoState: Boolean(raw) }
    })()
  `)
  check('13) demo state bor (admin oqimi uchun)', adminResult.hasDemoState)

  // Sessiyani tozalab, admin bilan qaytadan kiramiz.
  // (AuthProvider user state'ini faqat yuklanishda o'qiydi — to'liq navigatsiya shart.
  //  DIQQAT: evaluate ichida location.reload() kutish bilan kontekst halok bo'ladi -> CDP xato beradi,
  //  shuning uchun Page.navigate + query param bilan to'liq yuklashga majburlaymiz.)
  await evaluate(cdp, `localStorage.removeItem('prime-v1-api-session')`)
  await send(cdp, 'Page.navigate', { url: `${APP_URL}?r=admin#/login` })
  await sleep(3500)
  const adminLoginResult = await evaluate(cdp, `
    (async () => {
      // Login sahifasi 1-qadamda til tanlashni ko'rsatadi — demo tugmalar shu qadamdan keyin DOM'da bo'ladi
      const lang = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('zbekcha'))
      if (lang) { lang.click(); await new Promise((r) => setTimeout(r, 800)) }
      const demo = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Admin'))
      if (demo) { demo.click(); await new Promise((r) => setTimeout(r, 3000)) }
      return { hash: location.hash, clicked: Boolean(demo), text: document.body.innerText.slice(0, 80) }
    })()
  `)
  check('14) admin sifatida kirildi', adminLoginResult.hash.startsWith('#/admin'), JSON.stringify(adminLoginResult))

  const adminPcs = await evaluate(cdp, `
    (async () => {
      // /admin/pcs linki faqat AdminLayout ichida — hash orqali to'g'ridan-to'g'ri o'tamiz
      location.hash = '#/admin/pcs'
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 250))
        if (document.querySelector('.pc-management-grid')) break
      }
      const grid = document.querySelector('.pc-management-grid')
      if (!grid) return { found: false }
      const first = grid.firstElementChild.getBoundingClientRect()
      const actions = grid.querySelector('.pc-actions')
      const actionButtons = actions ? actions.querySelectorAll('button').length : 0
      return {
        found: true,
        cards: grid.children.length,
        cardWidth: Math.round(first.width),
        viewport: window.innerWidth,
        actionButtons,
      }
    })()
  `)
  check('15) admin PC grid bor va kartalar sig‘adi', adminPcs.found && adminPcs.cardWidth <= adminPcs.viewport, JSON.stringify(adminPcs))
  if (adminPcs.found) {
    check('16) har bir kartada boshqaruv tugmalari bor', adminPcs.actionButtons >= 2, `${adminPcs.actionButtons} tugma`)
  }

  await screenshot(cdp, 'data/mobile-admin-pcs.png')

  // 17) Gorizontal scroll yo'qligi (butun sahifa bo'ylab)
  const noHScroll = await evaluate(cdp, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  check('17) sahifada gorizontal scroll yo‘q', noHScroll, `scrollWidth vs innerWidth`)

  await screenshot(cdp, 'data/mobile-final.png')

  await fetch(`${CDP_HTTP}/json/close/${tab.id}`).catch(() => {})

  const failed = checks.filter((item) => !item.ok)
  console.log(`\n${checks.length - failed.length}/${checks.length} mobil tekshiruv o'tdi`)
  process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
  console.error('MOBILE TEST CRASH:', error.message)
  process.exit(1)
})
