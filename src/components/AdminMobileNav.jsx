import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { useClub } from '../club/ClubContext.jsx'
import {
  IconCalendar,
  IconChart,
  IconDesktop,
  IconLogout,
  IconSettings,
  IconUsers,
} from './Icons.jsx'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconChart, end: true },
  { to: '/admin/bookings', label: 'Bronlar', icon: IconCalendar, badge: true },
  { to: '/admin/pcs', label: 'PC', icon: IconDesktop },
  { to: '/admin/users', label: 'Users', icon: IconUsers },
  { to: '/admin/settings', label: 'Sozlama', icon: IconSettings },
]

export default function AdminMobileNav() {
  const { logout } = useAuth()
  const { todayBookings } = useClub()
  const pendingCount = todayBookings.filter((booking) => booking.status === 'pending').length

  return (
    <nav className="mobile-nav admin-mobile-nav">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="mobile-icon-wrap">
              <Icon size={20} />
              {item.badge && pendingCount > 0 ? <b className="nav-badge">{pendingCount}</b> : null}
            </span>
            <span>{item.label}</span>
          </NavLink>
        )
       })}
       <button className="mobile-logout" type="button" onClick={() => void logout()}>
         <IconLogout size={20} />
         <span>Chiqish</span>
       </button>
     </nav>
  )
}
