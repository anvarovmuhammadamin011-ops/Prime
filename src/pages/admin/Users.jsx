import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useClub } from '../../club/ClubContext.jsx'
import { BOOKING_STATUS } from '../../club/bookingRules.js'
import { formatDate, getInitials } from '../../data.js'
import { IconCalendar, IconShield, IconUser, IconUsers } from '../../components/Icons.jsx'

export default function AdminUsers() {
  const { users } = useAuth()
  const { state } = useClub()
  const [search, setSearch] = useState('')

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('uz-UZ')
    return users
      .filter((user) =>
        [user.name, user.phone, user.role].some((value) =>
          value.toLocaleLowerCase('uz-UZ').includes(query),
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'uz'))
  }, [search, users])

  function userStats(userId) {
    const bookings = state.bookings.filter((booking) => booking.userId === userId)
    return {
      total: bookings.length,
      active: bookings.filter((booking) => booking.status === BOOKING_STATUS.ACTIVE).length,
      completed: bookings.filter((booking) => booking.status === BOOKING_STATUS.COMPLETED).length,
      lastBooking: bookings.sort((a, b) => b.createdAt - a.createdAt)[0] || null,
    }
  }

  return (
    <div className="page admin-users-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Foydalanuvchilar</span>
          <h1>Users</h1>
          <p className="muted">Ro‘yxatdan o‘tgan foydalanuvchilar va ularning bronlar ko‘rsatkichi.</p>
        </div>
        <div className="page-heading-mark">
          <IconUsers size={24} />
          <span>{users.filter((user) => user.role === 'user').length} ta mijoz</span>
        </div>
      </section>

      <section className="card user-search-panel">
        <label className="search-field">
          <span>Qidirish</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ism, telefon yoki rol"
          />
        </label>
      </section>

      <section className="user-table-card card">
        <div className="user-table-head">
          <span>Foydalanuvchi</span>
          <span>Rol</span>
          <span>Bronlar</span>
          <span>Faol</span>
          <span>Tugagan</span>
          <span>Oxirgi bron</span>
        </div>
        <div className="user-table-body">
          {visibleUsers.map((user) => {
            const stats = userStats(user.id)
            return (
              <div className="user-table-row" key={user.id}>
                <div className="table-user">
                  <span className="avatar small">{getInitials(user.name)}</span>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.phone}</span>
                  </div>
                </div>
                <span className={`role-pill ${user.role}`}>
                  {user.role === 'superadmin' ? <IconShield size={14} /> : <IconUser size={14} />}
                  {user.role}
                </span>
                <span className="table-number">{stats.total}</span>
                <span className="table-number active-number">{stats.active}</span>
                <span className="table-number">{stats.completed}</span>
                <span className="table-date">
                  {stats.lastBooking ? formatDate(stats.lastBooking.startAt) : '—'}
                </span>
              </div>
            )
          })}
        </div>
        {!visibleUsers.length ? (
          <div className="empty-inline"><IconUsers size={24} /> Foydalanuvchi topilmadi.</div>
        ) : null}
      </section>

      <div className="cash-note compact-note">
        <IconCalendar size={20} />
        <div>
          <strong>V1 ma’lumot modeli minimal</strong>
          <span>CRM, reyting, bonus va marketing ma’lumotlari qo‘shilmagan.</span>
        </div>
      </div>
    </div>
  )
}
