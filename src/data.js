export const BRAND = 'PRIME CLUB'

export const fmt = (n) => new Intl.NumberFormat('en-US').format(n)

export const XP_PER_LEVEL = 1000
export const XP_PER_HOUR = 65

export function levelFor(hours) {
  const totalXp = Math.round((hours || 0) * XP_PER_HOUR)
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const cur = totalXp % XP_PER_LEVEL
  return { level, cur, total: XP_PER_LEVEL, totalXp }
}

export const REGISTERED_STORAGE = 'prime-registered'

export const USERS = {
  user: {
    role: 'user',
    phone: '+998901234567',
    password: 'demo123',
    name: 'Abdulloh Karimov',
    joined: '2024-03-12',
    tier: 'Premium',
    balance: 310000,
    bonus: 90,
    hours: 184,
  },
  admin: {
    role: 'admin',
    phone: '+998901111111',
    password: 'demo123',
    name: 'Admin',
    joined: '2024-03-12',
    tier: 'Admin',
    balance: 0,
    bonus: 0,
    hours: 0,
  },
  superadmin: {
    role: 'superadmin',
    phone: '+998900000000',
    password: 'demo123',
    name: 'Super Admin',
    joined: '2024-02-01',
    tier: 'Super Admin',
    balance: 0,
    bonus: 0,
    hours: 0,
  },
}

export const DEMO_ACCOUNTS = [
  {
    key: 'user',
    label: 'Foydalanuvchi (Mijoz)',
    desc: 'Mijoz paneliga kirish',
    phone: '+998901234567',
  },
  {
    key: 'admin',
    label: 'Admin',
    desc: 'Administrator paneli',
    phone: '+998901111111',
  },
  {
    key: 'superadmin',
    label: 'Super Admin',
    desc: "To'liq boshqaruv",
    phone: '+998900000000',
  },
]

export const PRICING = [
  {
    name: 'VIP',
    price: 25000,
    badge: 'PREMIUM',
    specs: ['RTX 4090 24GB', '64GB DDR5', '27" 4K 240Hz'],
  },
  {
    name: 'Gaming Pro',
    price: 18000,
    badge: 'PRO',
    specs: ['RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz'],
  },
  {
    name: 'Standard',
    price: 10000,
    badge: 'CLASSIC',
    specs: ['RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz'],
  },
  {
    name: 'PS5 / Xbox',
    price: 20000,
    badge: 'CONSOLE',
    specs: ['PS5 / Xbox Series X', '55" OLED 4K TV', 'DualSense kontroller'],
  },
]

export const STATUS_LABELS = {
  available: 'Mavjud',
  booked: 'Band',
  maintenance: 'Texnik xizmat',
  pending: 'Kutilmoqda',
}

const mk = (name, zone, price, cpu, gpu, ram, monitor, status, temp, uptime, powered, sessionMin) => ({
  id: name,
  name,
  zone,
  price,
  cpu,
  gpu,
  ram,
  monitor,
  status,
  temp,
  uptime,
  powered: Boolean(powered),
  paused: false,
  sessionMin: sessionMin || 0,
})

export const HALL_STORAGE = 'prime-club-hall'
export const HALL_VERSION = 5

export function createInitialPricing() {
  return [
    {
      key: 'VIP',
      label: 'VIP',
      price: 25000,
      badge: 'PREMIUM',
      specs: ['RTX 4090 24GB', '64GB DDR5', '27" 4K 240Hz'],
    },
    {
      key: 'Gaming Pro',
      label: 'Gaming Pro',
      price: 18000,
      badge: 'PRO',
      specs: ['RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz'],
    },
    {
      key: 'Standard',
      label: 'Standard',
      price: 10000,
      badge: 'CLASSIC',
      specs: ['RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz'],
    },
    {
      key: 'PS5',
      label: 'PS5 / Xbox (Console)',
      price: 20000,
      badge: 'CONSOLE',
      specs: ['PS5 / Xbox Series X', '55" OLED 4K TV', 'DualSense kontroller'],
    },
  ]
}

export function createInitialMachines() {
  return [
    mk('VIP-01', 'VIP', 25000, 'Intel Core i9-14900K', 'RTX 4090 24GB', '64GB DDR5', '27" 4K 240Hz', 'available', 38, 1240, true),
    mk('VIP-02', 'VIP', 25000, 'Intel Core i9-14900K', 'RTX 4090 24GB', '64GB DDR5', '27" 4K 240Hz', 'booked', 58, 1120, true, 45),
    mk('VIP-03', 'VIP', 25000, 'Intel Core i9-14900K', 'RTX 4090 24GB', '64GB DDR5', '27" 4K 240Hz', 'pending', 44, 980, false),

    mk('GAMING-01', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'booked', 62, 890, true, 120),
    mk('GAMING-02', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'pending', 40, 760, false),
    mk('GAMING-03', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'available', 42, 1340, true),
    mk('GAMING-04', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'booked', 65, 1010, true, 90),
    mk('GAMING-05', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'available', 45, 820, true),
    mk('GAMING-06', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'maintenance', 30, 1560, false),
    mk('GAMING-07', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'available', 75, 720, true),
    mk('GAMING-08', 'Gaming Pro', 18000, 'Intel Core i7-13700K', 'RTX 4080 16GB', '32GB DDR5', '27" QHD 165Hz', 'pending', 39, 680, false),

    mk('STANDARD-01', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'booked', 55, 1430, true, 60),
    mk('STANDARD-02', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'available', 36, 1290, true),
    mk('STANDARD-03', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'available', 38, 1110, true),
    mk('STANDARD-04', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'available', 34, 990, true),
    mk('STANDARD-05', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'available', 37, 1450, true),
    mk('STANDARD-06', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'available', 35, 870, true),
    mk('STANDARD-07', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'available', 40, 760, true),
    mk('STANDARD-08', 'Standard', 10000, 'Intel Core i5-12400F', 'RTX 3070 8GB', '16GB DDR4', '24" FHD 144Hz', 'maintenance', 28, 1320, false),

    mk('PS5-01', 'PS5', 20000, 'AMD Zen 2 (8C/16T)', 'AMD RDNA 2 10.28TF', '16GB GDDR6', '55" OLED 4K', 'available', 70, 640, true),
    mk('PS5-02', 'PS5', 20000, 'AMD Zen 2 (8C/16T)', 'AMD RDNA 2 10.28TF', '16GB GDDR6', '55" OLED 4K', 'booked', 66, 580, true, 30),
    mk('PS5-03', 'PS5', 20000, 'AMD Zen 2 (8C/16T)', 'AMD RDNA 2 10.28TF', '16GB GDDR6', '55" OLED 4K', 'maintenance', 31, 510, false),
  ]
}

export const ZONE_LABELS = {
  VIP: 'VIP',
  'Gaming Pro': 'Gaming Pro',
  Standard: 'Standard',
  PS5: 'Konsol',
}

export function createInitialAdminBookings() {
  const today = new Date()
  const iso = (offset) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return [
    { id: 101, customer: 'Abdulloh Karimov', machine: 'VIP-02', date: iso(0), time: '18:00', hours: 3, amount: 75000, method: 'CLICK', status: 'confirmed' },
    { id: 102, customer: 'Malika Yusupova', machine: 'STANDARD-01', date: iso(-1), time: '15:00', hours: 5, amount: 50000, method: 'BALANCE', status: 'confirmed' },
    { id: 103, customer: 'Farrux Ergashev', machine: 'GAMING-04', date: iso(-1), time: '19:00', hours: 3, amount: 54000, method: 'PAYME', status: 'confirmed' },
    { id: 107, customer: 'Bobur Aliyev', machine: 'VIP-01', date: iso(-2), time: '17:00', hours: 2, amount: 50000, method: 'PAYME', status: 'confirmed' },
    { id: 108, customer: 'Jasur Nazarov', machine: 'GAMING-03', date: iso(-3), time: '20:00', hours: 3, amount: 54000, method: 'CLICK', status: 'confirmed' },

    { id: 104, customer: 'Abdulloh Karimov', machine: 'VIP-03', date: iso(1), time: '20:00', hours: 2, amount: 50000, method: 'BALANCE', status: 'pending' },
    { id: 105, customer: 'Malika Yusupova', machine: 'GAMING-02', date: iso(1), time: '12:00', hours: 2, amount: 36000, method: 'CLICK', status: 'pending' },
    { id: 106, customer: 'Sarvar Toshmatov', machine: 'GAMING-08', date: iso(1), time: '16:00', hours: 2, amount: 36000, method: 'PAYME', status: 'pending' },
    { id: 109, customer: 'Nodir Jurayev', machine: 'STANDARD-04', date: iso(1), time: '14:00', hours: 2, amount: 20000, method: 'BALANCE', status: 'pending' },
    { id: 110, customer: 'Gulnora Rahimova', machine: 'PS5-01', date: iso(1), time: '19:30', hours: 2, amount: 40000, method: 'CLICK', status: 'pending' },

    { id: 111, customer: 'Sardor Qosimov', machine: 'STANDARD-05', date: iso(-4), time: '13:00', hours: 4, amount: 40000, method: 'BALANCE', status: 'rejected' },
    { id: 112, customer: 'Madina Salimova', machine: 'GAMING-05', date: iso(-5), time: '18:30', hours: 2, amount: 36000, method: 'PAYME', status: 'rejected' },
  ]
}

export function createInitialBarProducts() {
  return [
    { id: 1, name: 'Pepsi 0.5L', cat: 'Ichimliklar', price: 8000, stock: 20 },
    { id: 2, name: 'Red Bull', cat: 'Ichimliklar', price: 15000, stock: 3 },
    { id: 3, name: 'Espresso', cat: 'Ichimliklar', price: 14000, stock: 12 },
    { id: 9, name: 'Water 0.5L', cat: 'Ichimliklar', price: 5000, stock: 24 },
    { id: 4, name: 'Lays Chips', cat: 'Kulolatlar', price: 12000, stock: 18 },
    { id: 5, name: 'Snickers', cat: 'Kulolatlar', price: 9000, stock: 15 },
    { id: 10, name: 'Doritos', cat: 'Kulolatlar', price: 10000, stock: 2 },
    { id: 6, name: 'Burger', cat: 'Issiq ovqat', price: 32000, stock: 8 },
    { id: 7, name: 'Hot-Dog', cat: 'Issiq ovqat', price: 22000, stock: 6 },
    { id: 11, name: 'Pizza Slice', cat: 'Issiq ovqat', price: 28000, stock: 4 },
    { id: 8, name: 'Cheesecake', cat: 'Shirinliklar', price: 25000, stock: 5 },
  ]
}

export function createInitialBarOrders() {
  return [
    {
      id: 201,
      time: '12:15',
      items: [
        { name: 'Espresso', qty: 1, price: 14000 },
        { name: 'Snickers', qty: 1, price: 9000 },
        { name: 'Lays Chips', qty: 1, price: 12000 },
      ],
      total: 35000,
    },
    {
      id: 202,
      time: '15:40',
      items: [
        { name: 'Red Bull', qty: 1, price: 15000 },
        { name: 'Hot-Dog', qty: 1, price: 22000 },
      ],
      total: 37000,
    },
    {
      id: 203,
      time: '18:05',
      items: [{ name: 'Espresso', qty: 1, price: 14000 }],
      total: 14000,
    },
  ]
}

export function createInitialHall() {
  return {
    machines: createInitialMachines(),
    adminBookings: createInitialAdminBookings(),
    barProducts: createInitialBarProducts(),
    barOrders: createInitialBarOrders(),
    expenses: createInitialExpenses(),
    promotions: createInitialPromotions(),
    pricing: createInitialPricing(),
  }
}

export const FAVORITES = ['VIP-01', 'GAMING-05', 'STANDARD-03']

export function createInitialBookings() {
  const today = new Date()
  const iso = (offset) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return [
    { id: 1, machine: 'VIP-01', date: iso(-2), time: '18:00 - 20:00', hours: 2, price: 50000, status: 'confirmed' },
    { id: 2, machine: 'STANDARD-01', date: iso(-5), time: '15:00 - 19:00', hours: 4, price: 40000, status: 'confirmed' },
    { id: 3, machine: 'VIP-02', date: iso(1), time: '20:00 - 22:00', hours: 2, price: 50000, status: 'pending' },
    { id: 4, machine: 'GAMING-03', date: iso(1), time: '12:00 - 15:00', hours: 3, price: 54000, status: 'pending' },
  ]
}

export const ACHIEVEMENTS = [
  { id: 'first', title: 'Birinchi bron', desc: 'Ilk bor joy band qilindi', earned: true, progress: null },
  { id: '100h', title: '100 soat', desc: 'Jami 100 soat o\u2018ynaldi', earned: true, progress: '184 / 100' },
  { id: 'vip', title: 'VIP mijoz', desc: 'VIP zonadan foydalanildi', earned: true, progress: null },
  { id: 'marafon', title: 'Marafon', desc: '12 soat uzluksiz sessiya', earned: false, progress: '6 / 12' },
]

export const REFERRAL_CODE = 'ABDU2024'

export const ZONE_LIST = ['VIP', 'Gaming Pro', 'Standard', 'PS5']

export const ZONE_FILTERS = [
  { key: 'all', label: 'Hammasi' },
  { key: 'VIP', label: 'VIP' },
  { key: 'Gaming Pro', label: 'Gaming Pro' },
  { key: 'Standard', label: 'Standard' },
  { key: 'PS5', label: 'Konsol' },
]

export const PEAK_HOURS = [
  { h: '12:00', p: 38 },
  { h: '13:00', p: 42 },
  { h: '14:00', p: 55 },
  { h: '15:00', p: 60 },
  { h: '16:00', p: 58 },
  { h: '17:00', p: 64 },
  { h: '18:00', p: 78 },
  { h: '19:00', p: 88 },
  { h: '20:00', p: 96 },
  { h: '21:00', p: 92 },
  { h: '22:00', p: 74 },
  { h: '23:00', p: 51 },
]

export const BAR_CATEGORIES = ['Hammasi', 'Ichimliklar', 'Kulolatlar', 'Issiq ovqat', 'Shirinliklar']

export const TEMP_HIGH = 60

export const MONTHLY_FINANCE = [
  { m: 'Yanvar', rev: 41, exp: 23 },
  { m: 'Fevral', rev: 44, exp: 24 },
  { m: 'Mart', rev: 50, exp: 25 },
  { m: 'Aprel', rev: 53, exp: 26 },
  { m: 'May', rev: 57, exp: 27 },
  { m: 'Iyun', rev: 64, exp: 28.1 },
]

export const SUPER_METRICS = {
  revenue: 64000000,
  revenueDelta: 12,
  expense: 28100000,
  profit: 35900000,
  margin: 56,
  utilization: 18,
}

export const EXPENSE_CATEGORIES = [
  { key: 'Maosh', label: 'Maosh', cls: 'exp-maosh' },
  { key: 'Kommunal', label: 'Kommunal', cls: 'exp-kommunal' },
  { key: 'Inventar', label: 'Inventar', cls: 'exp-inventar' },
]

export const FINANCE_REVENUE = 64000000

export function createInitialExpenses() {
  return [
    { id: 1, name: 'Xodimlar maoshi', category: 'Maosh', amount: 12500000, date: '2026-06-05' },
    { id: 2, name: 'Elektr energiyasi', category: 'Kommunal', amount: 8200000, date: '2026-06-01' },
    { id: 3, name: 'Internet (1Gbps)', category: 'Kommunal', amount: 1800000, date: '2026-06-03' },
    { id: 4, name: 'Bar mahsulotlari', category: 'Inventar', amount: 5600000, date: '2026-06-10' },
  ]
}

export function createInitialPromotions() {
  return [
    { id: 1, code: 'WELCOME15', discount: 15, usage: 42, limit: 100, active: true },
    { id: 2, code: 'NIGHT20', discount: 20, usage: 88, limit: 200, active: true },
    { id: 3, code: 'OLDPROMO', discount: 10, usage: 50, limit: 50, active: false },
  ]
}