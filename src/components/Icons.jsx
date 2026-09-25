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
    <path d="m3 11 9-7 9 7" />
    <path d="M5 10v10h14V10M9 20v-6h6v6" />
  </svg>
)

export const IconUser = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20c1.2-3.6 4.1-5 7.5-5s6.3 1.4 7.5 5" />
  </svg>
)

export const IconUsers = (props) => (
  <svg {...base(props)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.9-3 3.4-4.5 6.5-4.5s5.6 1.5 6.5 4.5" />
    <path d="M16 4.6a3.5 3.5 0 1 1 0 6.8M18.5 15.6c1.6.7 2.7 2.2 3 4.4" />
  </svg>
)

export const IconLogout = (props) => (
  <svg {...base(props)}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />
  </svg>
)

export const IconGamepad = (props) => (
  <svg {...base(props)}>
    <path d="M6 8h12a4 4 0 0 1 4 4v4a2 2 0 0 1-2 2h-2a1.5 1.5 0 0 1-1.3-.8l-2.2-2.5a1.5 1.5 0 0 0-2.5 0L11.8 17A1.5 1.5 0 0 1 10.5 18H7a2 2 0 0 1-2-2v-4a4 4 0 0 1 1-4Z" />
    <path d="M7 12h.01M10.5 10.5v3M9.75 12h1.5M16 12h2M16.5 10.5v3" />
  </svg>
)

export const IconCalendar = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
)

export const IconClock = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" />
  </svg>
)

export const IconDesktop = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

export const IconChart = (props) => (
  <svg {...base(props)}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
)

export const IconSettings = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 15a2 2 0 0 0 .4 2.2l-1.6 1.6a2 2 0 0 0-2.2.4 2 2 0 0 0-1.2 1.8H12a2 2 0 0 0-2-1.8 2 2 0 0 0-2.2-.4L6.2 17.2A2 2 0 0 0 6.6 15a2 2 0 0 0-1.8-1.2H3a2 2 0 0 0 0-4h.8A2 2 0 0 0 5.6 8a2 2 0 0 0-.4-2.2l1.6-1.6A2 2 0 0 0 9 4.6a2 2 0 0 0 1.2-1.8V2h4a2 2 0 0 0 2 1.8 2 2 0 0 0 2.2-.4l1.6 1.6A2 2 0 0 0 19.6 7a2 2 0 0 0 1.8 1.2h.6v4a2 2 0 0 0-1.8 1.2 2 2 0 0 0-1.2 1.6Z" />
  </svg>
)

export const IconShield = (props) => (
  <svg {...base(props)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const IconSend = (props) => (
  <svg {...base(props)}>
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
)

export const IconBell = (props) => (
  <svg {...base(props)}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
  </svg>
)

export const IconPower = (props) => (
  <svg {...base(props)}>
    <path d="M12 3v9M7 6.1a8 8 0 1 0 10 0" />
  </svg>
)

export const IconCheck = (props) => (
  <svg {...base(props)}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
)

export const IconX = (props) => (
  <svg {...base(props)}>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
)

export const IconCopy = (props) => (
  <svg {...base(props)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const IconPlus = (props) => (
  <svg {...base(props)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconSave = (props) => (
  <svg {...base(props)}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </svg>
)
