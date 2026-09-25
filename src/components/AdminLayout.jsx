import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { getInitials } from '../data.js'
import {
  IconCalendar,
  IconChart,
  IconDesktop,
  IconGamepad,
  IconLogout,
  IconSettings,
  IconUsers,
} from './Icons.jsx'
import AdminMobileNav from './AdminMobileNav.jsx'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconChart, end: true },
  { to: '/admin/bookings', label: 'Bronlar', icon: IconCalendar, badge: true },
  { to: '/admin/pcs', label: 'PC’lar', icon: IconDesktop },
  { to: '/admin/users', label: 'Users', icon: IconUsers },
  { to: '/admin/settings', label: 'Sozlamalar', icon: IconSettings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { activeCount, availableCount, totalCount, todayBookings, loading, hasData, syncError, refreshData } = useClub()
  const location = useLocation()
  const pendingCount = todayBookings.filter((booking) => booking.status === 'pending').length
  const current = NAV.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  return (
    <div className="app-shell admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <IconGamepad size={21} />
          </span>
          <span>
            PRIME <strong>CLUB</strong>
          </span>
        </div>
        <div className="role-label">
          <span>{user.role === 'superadmin' ? 'Superadmin' : 'Administrator'}</span>
          <small>V1 boshqaruv paneli</small>
        </div>
        <nav className="side-nav">
          <span className="nav-caption">Boshqaruv</span>
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'side-link active' : 'side-link')}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge && pendingCount > 0 ? <b className="nav-badge">{pendingCount}</b> : null}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-card">
          <span className="status-dot active" />
          <div>
            <strong>{activeCount} ta sessiya faol</strong>
            <span>{availableCount}/{totalCount} ta PC bo‘sh</span>
          </div>
        </div>
        <div className="side-user">
          <span className="avatar">{getInitials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.phone}</span>
          </div>
          <button className="icon-button" type="button" onClick={logout} title="Chiqish" aria-label="Chiqish">
            <IconLogout size={18} />
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="topbar-eyebrow">Prime Game Club</span>
            <h1>{current?.label || 'Dashboard'}</h1>
          </div>
          <div className="topbar-actions">
            <span className="status-pill active">
              <span className="status-dot active" />
              {activeCount} faol
            </span>
            <span className="status-pill free">
              <span className="status-dot free" />
              {availableCount} bo‘sh
            </span>
            <span className="avatar small">{getInitials(user.name)}</span>
          </div>
        </header>
         <main className="content" aria-busy={loading}>
           {syncError ? (
             <div className="form-alert error sync-alert" role="alert">
               <span>{syncError}</span>
               <button className="text-button" type="button" onClick={() => refreshData()}>
                 Qayta urinish
               </button>
             </div>
           ) : null}
           {loading && !hasData ? (
             <div className="content-loading" role="status">Ma’lumotlar yuklanmoqda...</div>
           ) : syncError && !hasData ? null : <Outlet />}
         </main>
      </div>
      <AdminMobileNav />
    </div>
  )
}
