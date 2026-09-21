import { createContext, useContext, useEffect, useState } from 'react'
import { createInitialHall, HALL_STORAGE, HALL_VERSION } from '../data.js'

const HallContext = createContext(null)

function load() {
  const raw = localStorage.getItem(HALL_STORAGE)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.version !== HALL_VERSION) return createInitialHall()
      return {
        machines: parsed.machines || [],
        adminBookings: parsed.adminBookings || [],
        barProducts: parsed.barProducts || [],
        barOrders: parsed.barOrders || [],
        expenses: parsed.expenses || [],
        promotions: parsed.promotions || [],
        pricing: parsed.pricing || [],
      }
    } catch {
      return createInitialHall()
    }
  }
  return createInitialHall()
}

export function HallProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    localStorage.setItem(
      HALL_STORAGE,
      JSON.stringify({ version: HALL_VERSION, ...state })
    )
  }, [state])

  useEffect(() => {
    const t = setInterval(() => {
      setState((s) => ({
        ...s,
        machines: s.machines.map((m) =>
          m.powered && !m.paused && m.status === 'booked'
            ? { ...m, sessionMin: m.sessionMin + 1, temp: Math.min(84, m.temp + 0.4) }
            : m
        ),
      }))
    }, 5000)
    return () => clearInterval(t)
  }, [])

  function updateMachine(id, patch) {
    setState((s) => ({
      ...s,
      machines: s.machines.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }

  function setMachineStatus(id, status) {
    updateMachine(id, { status, paused: false })
  }

  function togglePower(id) {
    setState((s) => ({
      ...s,
      machines: s.machines.map((m) =>
        m.id === id ? { ...m, powered: !m.powered, paused: false, status: m.status } : m
      ),
    }))
  }

  function setPower(id, on) {
    setState((s) => ({
      ...s,
      machines: s.machines.map((m) =>
        m.id === id ? { ...m, powered: on, paused: false } : m
      ),
    }))
  }

  function togglePause(id) {
    updateMachine(id, { paused: !state.machines.find((m) => m.id === id)?.paused })
  }

  function groupPower(zone, on) {
    setState((s) => ({
      ...s,
      machines: s.machines.map((m) => (m.zone === zone ? { ...m, powered: on, paused: false } : m)),
    }))
  }

  function bookFromUser(machineId, hours) {
    updateMachine(machineId, { status: 'booked', powered: true, sessionMin: 0 })
  }

  function machineByMachineId(machineId) {
    return state.machines.find((m) => m.id === machineId)
  }

  function approveBooking(id) {
    const b = state.adminBookings.find((x) => x.id === id)
    if (!b) return
    setState((s) => ({
      ...s,
      adminBookings: s.adminBookings.map((x) => (x.id === id ? { ...x, status: 'confirmed' } : x)),
      machines: s.machines.map((m) =>
        m.id === b.machine ? { ...m, status: 'booked', powered: true } : m
      ),
    }))
  }

  function rejectBooking(id) {
    const b = state.adminBookings.find((x) => x.id === id)
    if (!b) return
    setState((s) => ({
      ...s,
      adminBookings: s.adminBookings.map((x) => (x.id === id ? { ...x, status: 'rejected' } : x)),
      machines: s.machines.map((m) =>
        m.id === b.machine && m.status === 'pending' ? { ...m, status: 'available' } : m
      ),
    }))
  }

  function addProduct(product) {
    setState((s) => ({
      ...s,
      barProducts: [{ id: Date.now(), ...product }, ...s.barProducts],
    }))
  }

  function addExpense({ name, category, amount }) {
    const d = new Date()
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    setState((s) => ({
      ...s,
      expenses: [{ id: Date.now(), name, category, amount, date }, ...s.expenses],
    }))
  }

  function addPromotion({ code, discount, limit }) {
    setState((s) => ({
      ...s,
      promotions: [
        { id: Date.now(), code: code.toUpperCase(), discount, usage: 0, limit, active: true },
        ...s.promotions,
      ],
    }))
  }

  function togglePromotion(id) {
    setState((s) => ({
      ...s,
      promotions: s.promotions.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p
      ),
    }))
  }

  function updateZonePrice(zoneKey, price) {
    setState((s) => ({
      ...s,
      pricing: s.pricing.map((p) => (p.key === zoneKey ? { ...p, price } : p)),
      machines: s.machines.map((m) => (m.zone === zoneKey ? { ...m, price } : m)),
    }))
  }

  function placeOrder(items, total) {
    setState((s) => {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const order = {
        id: Date.now(),
        time,
        items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total,
      }
      return {
        ...s,
        barOrders: [order, ...s.barOrders],
        barProducts: s.barProducts.map((p) => {
          const found = items.find((i) => i.id === p.id)
          return found ? { ...p, stock: Math.max(0, p.stock - found.qty) } : p
        }),
      }
    })
  }

  const machines = state.machines
  const totalCount = machines.length
  const availableCount = machines.filter((m) => m.status === 'available').length
  const bookedCount = machines.filter((m) => m.status === 'booked').length
  const maintenanceCount = machines.filter((m) => m.status === 'maintenance').length
  const pendingMachined = machines.filter((m) => m.status === 'pending').length

  const barRevenue = state.barOrders.reduce((acc, o) => acc + o.total, 0)
  const salesCount = state.barOrders.length
  const lowStockCount = state.barProducts.filter((p) => p.stock < 5).length

  const value = {
    machines,
    adminBookings: state.adminBookings,
    barProducts: state.barProducts,
    barOrders: state.barOrders,
    expenses: state.expenses,
    promotions: state.promotions,
    pricing: state.pricing,
    totalCount,
    availableCount,
    bookedCount,
    maintenanceCount,
    pendingMachined,
    barRevenue,
    salesCount,
    lowStockCount,
    setMachineStatus,
    togglePower,
    setPower,
    togglePause,
    groupPower,
    bookFromUser,
    approveBooking,
    rejectBooking,
    addProduct,
    addExpense,
    addPromotion,
    togglePromotion,
    updateZonePrice,
    placeOrder,
  }

  return <HallContext.Provider value={value}>{children}</HallContext.Provider>
}

export function useHall() {
  return useContext(HallContext)
}