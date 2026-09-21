import { useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { fmt, SUPER_METRICS } from '../data.js'
import {
  IconChart,
  IconWallet,
  IconUsers,
  IconGift,
  IconTag,
  IconGamepad,
  IconLogout,
  IconCrown,
  IconTrendUp,
  IconTrophy,
} from './Icons.jsx'
import SuperAdminMobileNav from './SuperAdminMobileNav.jsx'

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const NAV = [
    { to: '/superadmin', label: 'Boshqaruv', icon: IconChart, end: true },
    { to: '/superadmin/finance', label: 'Moliya', icon: IconWallet },
    { to: '/superadmin/staff', label: 'Xodimlar', icon: IconUsers },
    { to: '/superadmin/promotions', label: 'Aksiyalar', icon: IconGift },
    { to: '/superadmin/pricing', label: 'Narxlar', icon: IconTag },
    { to: '/superadmin/tournaments', label: 'Turnirlar', icon: IconTrophy },
  ]

  const currentLabel = NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label || 'Boshqaruv'

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
          <IconCrown size={13} /> Super Admin
        </div>

        <nav className="side-nav">
          <p className="nav-label">Strategik boshqaruv</p>
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
            <span>Super Admin</span>
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
              <IconTrendUp size={14} /> Dar {fmt(SUPER_METRICS.revenue)}
            </span>
            <span className="chip chip-violet">
              <IconCrown size={13} /> {fmt(SUPER_METRICS.margin)}% marja
            </span>
            <span className="chip chip-accent">{SUPER_METRICS.utilization}% band</span>
            <div className="top-avatar">{initials}</div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>

      <SuperAdminMobileNav />
    </div>
  )
}