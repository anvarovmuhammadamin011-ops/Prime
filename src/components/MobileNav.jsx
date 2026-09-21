import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { IconHome, IconMap, IconTrophy, IconTeam, IconUser } from './Icons.jsx'

const MOBILE_NAV = [
  { to: '/', label: 'Bosh sahifa', icon: IconHome, match: '/' },
  { to: '/map', label: 'Xarita', icon: IconMap },
  { to: '/tournaments', label: 'Turnirlar', icon: IconTrophy },
  { to: '/my-teams', label: 'Jamoa', icon: IconTeam },
  { to: '/profile', label: 'Profil', icon: IconUser },
]

export default function MobileNav() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user || user.role !== 'user') return null

  return (
    <nav className="mobile-nav">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon
        const active = item.match
          ? location.pathname === item.match
          : location.pathname.startsWith(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
