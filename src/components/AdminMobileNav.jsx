import { useLocation } from 'react-router-dom'
import { useHall } from '../hall/HallContext.jsx'
import {
  IconChart,
  IconDesktop,
  IconCart,
  IconCalendar,
  IconTrophy,
} from './Icons.jsx'

export default function AdminMobileNav() {
  const location = useLocation()
  const hall = useHall()

  const pendingCount = hall.adminBookings.filter((b) => b.status === 'pending').length

  const NAV = [
    { to: '/admin', label: 'Boshqaruv', icon: IconChart, end: true },
    { to: '/admin/computers', label: 'PC', icon: IconDesktop },
    { to: '/admin/bar', label: 'Bar', icon: IconCart },
    { to: '/admin/bookings', label: 'Buyurtma', icon: IconCalendar, badge: pendingCount },
    { to: '/admin/tournaments', label: 'Turnir', icon: IconTrophy },
  ]

  return (
    <nav className="mobile-nav">
      {NAV.map((item) => {
        const Icon = item.icon
        const active = item.end
          ? location.pathname === item.to
          : location.pathname.startsWith(item.to)
        return (
          <a
            key={item.to}
            href={`#${item.to}`}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
          >
            <span style={{ position: 'relative' }}>
              <Icon size={20} />
              {item.badge > 0 && (
                <span className="mobile-nav-badge">{item.badge}</span>
              )}
            </span>
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
