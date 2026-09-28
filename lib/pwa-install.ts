import { isStandaloneDisplay } from "@/lib/display-mode"

export const PWA_INSTALL_DISMISS_KEY = "iris-pwa-install-dismissed"
/** Soft nudge cooldown after dismiss (7 days). */
export const PWA_INSTALL_DISMISS_MS = 7 * 24 * 60 * 60 * 1000

export type BeforeInstallPromptEventLike = Event & {
  readonly platforms: ReadonlyArray<string>
  prompt: () => Promise<void>
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

export function isIosLikeDevice(
  win: Window & { navigator: Navigator } = window
): boolean {
  if (typeof win === "undefined") return false
  const ua = win.navigator.userAgent || ""
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS 13+ desktop UA
  return (
    win.navigator.platform === "MacIntel" && win.navigator.maxTouchPoints > 1
  )
}

/** Running as an installed app (standalone / fullscreen / minimal-ui / iOS standalone). */
export function isRunningAsInstalledPwa(
  win: Window & { navigator: Navigator & { standalone?: boolean } } = window
): boolean {
  if (typeof win === "undefined") return false
  if (isStandaloneDisplay(win)) return true
  try {
    if (win.matchMedia("(display-mode: minimal-ui)").matches) return true
  } catch {
    // ignore
  }
  try {
    if (document.referrer.startsWith("android-app://")) return true
  } catch {
    // ignore
  }
  return false
}

export function readInstallDismissedAt(): number | null {
  try {
    const raw = localStorage.getItem(PWA_INSTALL_DISMISS_KEY)
    if (!raw) return null
    const at = Number(raw)
    return Number.isFinite(at) ? at : null
  } catch {
    return null
  }
}

export function markInstallDismissed(at = Date.now()) {
  try {
    localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(at))
  } catch {
    // ignore
  }
}

export function clearInstallDismissed() {
  try {
    localStorage.removeItem(PWA_INSTALL_DISMISS_KEY)
  } catch {
    // ignore
  }
}

export function isInstallNudgeOnCooldown(
  now = Date.now(),
  cooldownMs = PWA_INSTALL_DISMISS_MS
): boolean {
  const at = readInstallDismissedAt()
  if (at == null) return false
  return now - at < cooldownMs
}

/** Chromium: installed related webapp (even when browsing in a tab). */
export async function getInstalledRelatedWebApps(): Promise<
  ReadonlyArray<{ platform: string; url?: string; id?: string }>
> {
  if (typeof navigator === "undefined") return []
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<
      Array<{ platform: string; url?: string; id?: string }>
    >
  }
  if (typeof nav.getInstalledRelatedApps !== "function") return []
  try {
    const apps = await nav.getInstalledRelatedApps()
    return apps.filter((app) => app.platform === "webapp")
  } catch {
    return []
  }
}
