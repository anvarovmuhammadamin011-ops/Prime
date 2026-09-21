import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import { fmt } from '../data.js'
import { IconHome, IconMap, IconUser, IconLogout, IconGamepad, IconCoin, IconGift, IconTrophy, IconTeam } from './Icons.jsx'
import MobileNav from './MobileNav.jsx'

const NAV = [
  { to: '/', label: 'Bosh sahifa', icon: IconHome, match: '/' },
  { to: '/map', label: 'Zal xaritasi', icon: IconMap },
  { to: '/tournaments', label: 'Turnirlar', icon: IconTrophy },
  { to: '/my-teams', label: 'Mening jamoalarim', icon: IconTeam },
  { to: '/profile', label: 'Profil', icon: IconUser },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { availableCount, totalCount, balance, bonus } = useClub()
  const location = useLocation()

  const title = location.pathname.startsWith('/map')
    ? 'Zal xaritasi'
    : location.pathname.startsWith('/profile')
      ? 'Profil'
      : location.pathname.startsWith('/tournaments')
        ? 'Turnirlar'
        : location.pathname.startsWith('/my-teams')
          ? 'Mening jamoalarim'
          : 'Bosh sahifa'

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

        <nav className="side-nav">
          <p className="nav-label">Menyu</p>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = item.match
              ? location.pathname === item.match
              : location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={`side-link ${active ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="side-user">
          <div className="avatar">{initials}</div>
          <div className="side-user-info">
            <strong>{user.name}</strong>
            <span>{user.tier}</span>
          </div>
          <button className="icon-btn" onClick={logout} title="Chiqish">
            <IconLogout size={18} />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="topbar-right">
            {user.role === 'user' ? (
              <>
                <span className="chip chip-green" title="Bo'sh kompyuterlar">
                  {availableCount} / {totalCount} bo&#39;sh
                </span>
                <span className="chip chip-accent">
                  <IconCoin size={15} /> {fmt(balance)} UZS
                </span>
                <span className="chip chip-violet">
                  <IconGift size={15} /> {bonus} ball
                </span>
              </>
            ) : null}
            <div className="top-avatar">{initials}</div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
