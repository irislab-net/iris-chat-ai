/**
 * When true, avoid programmatic `.focus()` / Radix `onOpenAutoFocus` defaults so mobile
 * does not open the soft keyboard or scroll the viewport on initial load / hydration.
 */
export function shouldDeferInputAutofocusToUser(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(max-width: 639px)").matches) return true
  if (window.matchMedia("(pointer: coarse)").matches) return true
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : ""
  return /iPhone|iPad|iPod|Android/i.test(ua)
}
