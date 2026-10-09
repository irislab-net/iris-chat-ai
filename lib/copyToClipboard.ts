/**
 * Copy text on user gesture.
 *
 * Order of attempts:
 *   1. `navigator.clipboard.writeText` — primary path (HTTPS + secure context).
 *      May reject silently inside in-app WebViews (Telegram, FB, etc.) where
 *      the Clipboard permission is denied.
 *   2. iOS-safe `execCommand("copy")` fallback — uses a temporary input
 *      that is visible (tiny, transparent, but NOT `display:none` /
 *      `opacity:0`), selected with the iOS-specific Range + setSelectionRange
 *      pattern. Required because WebKit refuses to copy from off-screen /
 *      hidden inputs.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }

  return execCommandCopyFallback(text)
}

function execCommandCopyFallback(text: string): boolean {
  if (typeof document === "undefined") return false
  try {
    const isIOS =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent)

    const el = document.createElement("textarea")
    el.value = text
    el.setAttribute("readonly", "")
    el.contentEditable = "true"
    el.style.position = "fixed"
    el.style.top = "0"
    el.style.left = "0"
    el.style.width = "1px"
    el.style.height = "1px"
    el.style.padding = "0"
    el.style.border = "none"
    el.style.outline = "none"
    el.style.boxShadow = "none"
    el.style.background = "transparent"
    el.style.color = "transparent"
    el.style.fontSize = "16px"
    document.body.appendChild(el)

    const previousActive = document.activeElement as HTMLElement | null

    if (isIOS) {
      const range = document.createRange()
      range.selectNodeContents(el)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      el.setSelectionRange(0, text.length)
    } else {
      el.focus()
      el.select()
    }

    const ok = document.execCommand("copy")
    document.body.removeChild(el)

    if (previousActive && typeof previousActive.focus === "function") {
      try {
        previousActive.focus()
      } catch {
        /* ignore */
      }
    }

    return ok
  } catch {
    return false
  }
}
