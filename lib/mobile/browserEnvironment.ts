type TelegramWebAppLike = {
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
}

type TelegramWindow = Window & {
  Telegram?: { WebApp?: TelegramWebAppLike }
}

/** True when running inside Telegram’s in-app browser / WebApp. */
export function isTelegramBrowser(): boolean {
  if (typeof window === "undefined") return false
  const w = window as TelegramWindow
  if (w.Telegram?.WebApp) return true
  const ua = navigator.userAgent || ""
  return /Telegram/i.test(ua)
}

export function getTelegramWebApp(): TelegramWebAppLike | null {
  if (typeof window === "undefined") return null
  return (window as TelegramWindow).Telegram?.WebApp ?? null
}
