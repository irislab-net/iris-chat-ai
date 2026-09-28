/** True when the app is running as an installed Home Screen / standalone PWA. */
export function isStandaloneDisplay(
  win: Window & { navigator: Navigator & { standalone?: boolean } } = window
): boolean {
  if (typeof win === "undefined") return false
  try {
    if (win.document.documentElement.classList.contains("display-standalone")) {
      return true
    }
  } catch {
    // ignore
  }
  try {
    if (win.matchMedia("(display-mode: standalone)").matches) return true
    if (win.matchMedia("(display-mode: fullscreen)").matches) return true
  } catch {
    // ignore
  }
  return win.navigator.standalone === true
}
