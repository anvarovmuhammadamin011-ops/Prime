import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useHall } from '../hall/HallContext.jsx'
import { fmt } from '../data.js'
import {
  IconChart,
  IconDesktop,
  IconCart,
  IconCalendar,
  IconGamepad,
  IconLogout,
  IconCoin,
  IconClock,
  IconTrophy,
} from './Icons.jsx'
import AdminMobileNav from './AdminMobileNav.jsx'

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const hall = useHall()
  const location = useLocation()

  const NAV = [
    { to: '/admin', label: 'Dashboard', icon: IconChart, end: true },
    { to: '/admin/computers', label: 'Computers', icon: IconDesktop },
    { to: '/admin/bar', label: 'Bar', icon: IconCart },
    { to: '/admin/bookings', label: 'Bookings', icon: IconCalendar },
    { to: '/admin/tournaments', label: 'Tournaments', icon: IconTrophy },
  ]

  const pendingCount = hall.adminBookings.filter((b) => b.status === 'pending').length

  const currentLabel =
    location.pathname === '/admin'
      ? 'Admin Dashboard'
      : location.pathname.startsWith('/admin/computers')
        ? 'Computers'
        : location.pathname.startsWith('/admin/bar')
          ? 'Bar'
          : location.pathname.startsWith('/admin/tournaments')
            ? 'Tournaments'
            : 'Bookings'

  const initials = (user.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <IconGamepad size={22} />
          </div>
          <span>
            PRIME <em>CLUB</em>
          </span>
        </div>

        <div className="admin-role">
          {user.role === 'superadmin' ? 'Super Admin' : 'Administrator'}
        </div>

        <nav className="side-nav">
          <p className="nav-label">Boshqaruv</p>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <a
                key={item.to}
                href={`#${item.to}`}
                className={`side-link ${active ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="side-user">
          <div className="avatar">{initials}</div>
          <div className="side-user-info">
            <strong>{user.name}</strong>
            <span>{user.role === 'superadmin' ? 'Super Admin' : 'Admin'}</span>
          </div>
          <button className="icon-btn" onClick={logout} title="Chiqish">
            <IconLogout size={18} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{currentLabel}</h1>
          <div className="topbar-right">
            <span className="chip chip-green">
              <IconClock size={15} /> {hall.bookedCount} / {hall.totalCount} faol
            </span>
            <span className="chip chip-accent">
              <IconCoin size={15} /> {fmt(hall.barRevenue)} UZS
            </span>
            <span className="chip chip-violet">{pendingCount} pending</span>
            <div className="top-avatar">{initials}</div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      <AdminMobileNav />
    </div>
  )
}