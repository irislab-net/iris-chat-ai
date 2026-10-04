type StandaloneWindow = Window & {
  navigator: Navigator & { standalone?: boolean }
}

/** True when the app is running as an installed Home Screen / standalone PWA. */
export function isStandaloneDisplay(win?: StandaloneWindow): boolean {
  if (typeof window === "undefined") return false
  const target = win ?? (window as StandaloneWindow)
  try {
    if (
      target.document.documentElement.classList.contains("display-standalone")
    ) {
      return true
    }
  } catch {
    // ignore
  }
  try {
    if (target.matchMedia("(display-mode: standalone)").matches) return true
    if (target.matchMedia("(display-mode: fullscreen)").matches) return true
  } catch {
    // ignore
  }
  return target.navigator.standalone === true
}
