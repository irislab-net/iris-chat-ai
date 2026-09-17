export const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client"
export const GOOGLE_ONE_TAP_DISMISSED_KEY = "iris-google-one-tap-dismissed"

let scriptPromise: Promise<void> | null = null

export function isGoogleOneTapDismissed() {
  if (typeof window === "undefined") return true
  return sessionStorage.getItem(GOOGLE_ONE_TAP_DISMISSED_KEY) === "1"
}

export function markGoogleOneTapDismissed() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(GOOGLE_ONE_TAP_DISMISSED_KEY, "1")
}

export function clearGoogleOneTapDismissed() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(GOOGLE_ONE_TAP_DISMISSED_KEY)
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }

  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`
    )

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("google_identity_script_failed")),
        { once: true }
      )
      if (window.google?.accounts?.id) resolve()
      return
    }

    const script = document.createElement("script")
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("google_identity_script_failed"))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function cancelGoogleOneTap() {
  window.google?.accounts?.id?.cancel()
}
