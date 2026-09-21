import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { useHall } from '../hall/HallContext.jsx'
import { createInitialBookings } from '../data.js'

const STORAGE_KEY = 'prime-club-state'
const ClubContext = createContext(null)

export function ClubProvider({ children }) {
  const { user } = useAuth()
  const hall = useHall()
  const [bookings, setBookings] = useState([])
  const [balance, setBalance] = useState(0)
  const [bonus, setBonus] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const isUser = user && user.role === 'user'
    setLoaded(false)
    if (!isUser) {
      setBookings([])
      setBalance(0)
      setBonus(0)
      return
    }
    const key = STORAGE_KEY + '-' + user.phone
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const s = JSON.parse(raw)
        setBookings(s.bookings || createInitialBookings())
        setBalance(s.balance ?? user.balance)
        setBonus(s.bonus ?? user.bonus)
      } catch {
        setBookings(createInitialBookings())
        setBalance(user.balance)
        setBonus(user.bonus)
      }
    } else {
      setBookings(createInitialBookings())
      setBalance(user.balance)
      setBonus(user.bonus)
    }
    setLoaded(true)
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'user' || !loaded) return
    const key = STORAGE_KEY + '-' + user.phone
    localStorage.setItem(key, JSON.stringify({ bookings, balance, bonus }))
  }, [bookings, balance, bonus, loaded, user])

  function book(machineId, hours) {
    const machine = hall.machines.find((m) => m.id === machineId)
    if (!machine || machine.status !== 'available') return
    const price = machine.price * hours
    hall.bookFromUser(machineId, hours)
    const date = new Date()
    const start = `${String(date.getHours()).padStart(2, '0')}:00`
    const end = `${String((date.getHours() + hours) % 24).padStart(2, '0')}:00`
    const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
    setBookings((prev) => [
      { id: Date.now(), machine: machine.name, date: d, time: `${start} - ${end}`, hours, price, status: 'confirmed' },
      ...prev,
    ])
    setBalance((b) => b - price)
    setBonus((b) => b + hours * 5)
  }

  function redeem() {
    if (bonus < 100) return false
    setBonus((b) => b - 100)
    setBalance((b) => b + 15000)
    return true
  }

  return (
    <ClubContext.Provider
      value={{
        machines: hall.machines,
        bookings,
        balance,
        bonus,
        loaded,
        availableCount: hall.availableCount,
        totalCount: hall.totalCount,
        book,
        redeem,
      }}
    >
      {children}
    </ClubContext.Provider>
  )
}

export function useClub() {
  return useContext(ClubContext)
}