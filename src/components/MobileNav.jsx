import { NavLink } from 'react-router-dom'
import { IconCalendar, IconHome, IconUser } from './Icons.jsx'

const NAV = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/bookings', label: 'Bronlar', icon: IconCalendar },
  { to: '/profile', label: 'Profil', icon: IconUser },
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
