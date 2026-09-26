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

export const IconPlay = (props) => (
  <svg {...base(props)}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" />
  </svg>
)

export const IconStop = (props) => (
  <svg {...base(props)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
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

export const IconArrowRight = (props) => (
  <svg {...base(props)}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

export const IconGlobe = (props) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
  </svg>
)

export const IconLanguage = (props) => (
  <svg {...base(props)}>
    <path d="M5 8l6 6" />
    <path d="M4 14h16" />
    <path d="M10 3v11" />
    <path d="M18 3v11" />
    <path d="M14 3v11" />
    <path d="M6 3v11" />
  </svg>
)

export const IconPhone = (props) => (
  <svg {...base(props)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

export const IconLock = (props) => (
  <svg {...base(props)}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

export const IconEye = (props) => (
  <svg {...base(props)}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconEyeOff = (props) => (
  <svg {...base(props)}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)
