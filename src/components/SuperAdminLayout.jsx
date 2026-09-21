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

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const NAV = [
    { to: '/superadmin', label: 'Dashboard', icon: IconChart, end: true },
    { to: '/superadmin/finance', label: 'Finance', icon: IconWallet },
    { to: '/superadmin/staff', label: 'Staff', icon: IconUsers },
    { to: '/superadmin/promotions', label: 'Promotions', icon: IconGift },
    { to: '/superadmin/pricing', label: 'Pricing', icon: IconTag },
    { to: '/superadmin/tournaments', label: 'Tournaments', icon: IconTrophy },
  ]

  const currentLabel = NAV.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )?.label || 'Dashboard'

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
              <IconTrendUp size={14} /> Rev {fmt(SUPER_METRICS.revenue)}
            </span>
            <span className="chip chip-violet">
              <IconCrown size={13} /> {fmt(SUPER_METRICS.margin)}% margin
            </span>
            <span className="chip chip-accent">{SUPER_METRICS.utilization}% util</span>
            <div className="top-avatar">{initials}</div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  )
}