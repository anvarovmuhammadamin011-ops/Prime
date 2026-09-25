function getWebApp() {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

export function getTelegramInitData() {
  return getWebApp()?.initData || ''
}

export function isTelegramWebApp() {
  return Boolean(getTelegramInitData())
}

export function getTelegramUserPreview() {
  const user = getWebApp()?.initDataUnsafe?.user
  if (!user || typeof user !== 'object') return null
  return {
    id: String(user.id || ''),
    firstName: typeof user.first_name === 'string' ? user.first_name : '',
    lastName: typeof user.last_name === 'string' ? user.last_name : '',
    username: typeof user.username === 'string' ? user.username : '',
  }
}

export function initializeTelegramWebApp() {
  const webApp = getWebApp()
  if (!webApp) return false
  try {
    webApp.ready?.()
    webApp.expand?.()
  } catch {
    return false
  }
  return true
}

export function openTelegramBot() {
  const username = String(import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '').trim().replace(/^@/, '')
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username)) return false
  const url = `https://t.me/${username}?startapp`
  const webApp = getWebApp()
  if (webApp?.openTelegramLink) {
    try {
      webApp.openTelegramLink(url)
      return true
    } catch {
      return false
    }
  }
  if (typeof window === 'undefined') return false
  return window.open(url, '_blank', 'noopener,noreferrer') !== null
}
