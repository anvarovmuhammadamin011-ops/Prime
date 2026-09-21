const base = (props) => ({
  width: props.size || 20,
  height: props.size || 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export const IconHome = (props) => (
  <svg {...base(props)}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M9.5 20v-6h5v6" />
  </svg>
)

export const IconMap = (props) => (
  <svg {...base(props)}>
    <path d="M12 21s-7-6.1-7-11a7 7 0 1 1 14 0c0 4.9-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
)

export const IconUser = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20c1.2-3.6 4.1-5 7.5-5s6.3 1.4 7.5 5" />
  </svg>
)

export const IconLogout = (props) => (
  <svg {...base(props)}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)

export const IconCoin = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6.5v11" />
    <path d="M15 8.2c-1.7-1.1-5-.9-5 .9 0 2.6 6 1.4 6 4 0 1.8-3.3 2-5 .9" />
  </svg>
)

export const IconGift = (props) => (
  <svg {...base(props)}>
    <rect x="4" y="9" width="16" height="12" rx="2" />
    <path d="M12 9v12" />
    <path d="M4 13h16" />
    <path d="M12 9c-3.5 0-5-1.5-5-3s1.5-3 3-3c2.5 0 2 3 2 6Z" />
    <path d="M12 9c3.5 0 5-1.5 5-3s-1.5-3-3-3c-2.5 0-2 3-2 6Z" />
  </svg>
)

export const IconClock = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </svg>
)

export const IconBolt = (props) => (
  <svg {...base(props)}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
  </svg>
)

export const IconCrown = (props) => (
  <svg {...base(props)}>
    <path d="M3 7.5 7.5 11 12 4.5 16.5 11 21 7.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V7.5Z" />
  </svg>
)

export const IconCheck = (props) => (
  <svg {...base(props)}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
)

export const IconX = (props) => (
  <svg {...base(props)}>
    <path d="M5 5l14 14" />
    <path d="M19 5 5 19" />
  </svg>
)

export const IconCopy = (props) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const IconGamepad = (props) => (
  <svg {...base(props)}>
    <path d="M6 8h12a4 4 0 0 1 4 4v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-1.5-.7l-2.2-2.6a1 1 0 0 0-1.5 0l-2.2 2.6A2 2 0 0 1 9 18H7a2 2 0 0 1-2-2v-4a4 4 0 0 1 1-4Z" />
    <path d="M7 12h.01M10.5 10.5v3M9.75 12h1.5M16 12h2M16.5 10.5v3" />
  </svg>
)

export const IconCalendar = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
)

export const IconLock = (props) => (
  <svg {...base(props)}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
    <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" />
  </svg>
)

export const IconPower = (props) => (
  <svg {...base(props)}>
    <path d="M12 3v9" />
    <path d="M7 6.1a8 8 0 1 0 10 0" />
  </svg>
)

export const IconSettings = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.03Z" />
  </svg>
)

export const IconPlay = (props) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="M7 4.5v15l13-7.5-13-7.5Z" />
  </svg>
)

export const IconPause = (props) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
)

export const IconPlus = (props) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMinus = (props) => (
  <svg {...base(props)}>
    <path d="M5 12h14" />
  </svg>
)

export const IconCart = (props) => (
  <svg {...base(props)}>
    <circle cx="9" cy="20" r="1.6" />
    <circle cx="17" cy="20" r="1.6" />
    <path d="M3 4h2l2.6 12.5a1.5 1.5 0 0 0 1.4 1.1h8.6a1.5 1.5 0 0 0 1.4-1.1L21 8H6" />
  </svg>
)

export const IconTrash = (props) => (
  <svg {...base(props)}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
)

export const IconChart = (props) => (
  <svg {...base(props)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IconDesktop = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export const IconWallet = (props) => (
  <svg {...base(props)}>
    <path d="M20 7H5a2 2 0 0 1 0-4h13v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1" />
    <path d="M16 13h.01" />
  </svg>
)

export const IconStar = (props) => (
  <svg {...base(props)} fill="currentColor" stroke="none">
    <path d="m12 2.5 2.95 5.98 6.6.96-4.78 4.65 1.13 6.58L12 17.57l-5.9 3.1 1.13-6.58L2.45 9.44l6.6-.96L12 2.5Z" />
  </svg>
)

export const IconUsers = (props) => (
  <svg {...base(props)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5" />
    <path d="M16 4.6a3.5 3.5 0 1 1 0 6.8" />
    <path d="M18.5 15.6c1.6.7 2.7 2.2 3 4.4" />
  </svg>
)

export const IconTrendUp = (props) => (
  <svg {...base(props)}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M21 7h-6M21 7v6" />
  </svg>
)

export const IconTrendDown = (props) => (
  <svg {...base(props)}>
    <path d="m3 7 6 6 4-4 8 8" />
    <path d="M21 17h-6M21 17v-6" />
  </svg>
)

export const IconTag = (props) => (
  <svg {...base(props)}>
    <path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0L2 12.8V3h9.8l8.7 8.7a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.4" />
  </svg>
)

export const IconFile = (props) => (
  <svg {...base(props)}>
    <path d="M14 3H6a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V8L14 3Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
)

export const IconSave = (props) => (
  <svg {...base(props)}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </svg>
)

export const IconTrophy = (props) => (
  <svg {...base(props)}>
    <path d="M6 9V2h12v7" />
    <path d="M6 2h12" />
    <path d="M12 18v4" />
    <path d="M6 22h12" />
    <path d="M6 9H2v3a6 6 0 0 0 12 0V9" />
    <path d="M18 9h4v3a6 6 0 0 1-12 0V9" />
  </svg>
)

export const IconSword = (props) => (
  <svg {...base(props)}>
    <path d="m14.5 17.5 3 3 3-3" />
    <path d="m14.5 11.5 3 3 3-3" />
    <path d="M6 19V5a2 2 0 0 1 2-2h2" />
    <path d="M14 4h2a2 2 0 0 1 2 2v2" />
  </svg>
)

export const IconBracket = (props) => (
  <svg {...base(props)}>
    <path d="M16 3v4h4" />
    <path d="M20 7v10" />
    <path d="M16 17v4h4" />
    <path d="M6 7H3v10h3" />
    <path d="M6 7v4a4 4 0 0 0 4 4" />
    <path d="M6 17v-4a4 4 0 0 1 4-4" />
    <circle cx="2" cy="12" r="1" />
    <circle cx="22" cy="7" r="1" />
    <circle cx="22" cy="17" r="1" />
  </svg>
)

export const IconMedal = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="14" r="7" />
    <path d="M8 4 10 14" />
    <path d="M16 4 14 14" />
    <path d="M12 11v4" />
    <path d="M10 14h4" />
  </svg>
)

export const IconTeam = (props) => (
  <svg {...base(props)}>
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="7" r="3" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    <path d="M17 14a4 4 0 0 1 4 4v3" />
  </svg>
)

export const IconLink = (props) => (
  <svg {...base(props)}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

export const IconScore = (props) => (
  <svg {...base(props)}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)