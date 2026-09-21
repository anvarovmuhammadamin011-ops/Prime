import { useLocation } from 'react-router-dom'
import {
  IconChart,
  IconWallet,
  IconUsers,
  IconGift,
  IconTag,
  IconTrophy,
} from './Icons.jsx'

export default function SuperAdminMobileNav() {
  const location = useLocation()

  const NAV = [
    { to: '/superadmin', label: 'Dashboard', icon: IconChart, end: true },
    { to: '/superadmin/finance', label: 'Finance', icon: IconWallet },
    { to: '/superadmin/staff', label: 'Staff', icon: IconUsers },
    { to: '/superadmin/promotions', label: 'Promo', icon: IconGift },
    { to: '/superadmin/pricing', label: 'Narx', icon: IconTag },
    { to: '/superadmin/tournaments', label: 'Turnir', icon: IconTrophy },
  ]

  return (
    <nav className="mobile-nav mobile-nav--sa">
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
            <Icon size={18} />
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
