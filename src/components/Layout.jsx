import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { getInitials } from '../data.js'
import {
  IconCalendar,
  IconGamepad,
  IconHome,
  IconLogout,
  IconUser,
} from './Icons.jsx'
import MobileNav from './MobileNav.jsx'

const NAV = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/bookings', label: 'Bronlar', icon: IconCalendar },
  { to: '/profile', label: 'Profil', icon: IconUser },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { settings, availableCount, totalCount, loading, hasData, syncError, refreshData } = useClub()
  const location = useLocation()
  const title = NAV.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )?.label

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <IconGamepad size={21} />
          </span>
          <span>
            PRIME <strong>GAME CLUB</strong>
          </span>
        </div>
        <nav className="side-nav">
          <span className="nav-caption">Menyu</span>
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
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-card">
          <span className="status-dot free" />
          <div>
            <strong>{availableCount} ta PC bo‘sh</strong>
            <span>{settings.clubName}</span>
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
            <span className="topbar-eyebrow">Foydalanuvchi paneli</span>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <span className="status-pill free">
              <span className="status-dot free" />
              {availableCount}/{totalCount} bo‘sh
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
      <MobileNav />
    </div>
  )
}
