import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const enabled = Boolean(dsn) && process.env.NODE_ENV !== "development"

Sentry.init({
  dsn,
  enabled,
  tracesSampleRate: 0.1,
  // Replay is a large chunk — do not register it at init time.
  integrations: [],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  // Browser extensions / translate tools / vendor SDKs mutate DOM or throw
  // minified errors that are not actionable in app code.
  ignoreErrors: [
    // EXUR-FRONT-1A — extension eval blocked by production CSP
    /Refused to evaluate a string as JavaScript because 'unsafe-eval'/,
    // EXUR-FRONT-16 — React unmount after external DOM detach (Firefox wording)
    /can't access property ["']removeChild["'], .*parentNode is null/,
    // EXUR-FRONT-16/17 — Chromium / NotFoundError wording of the same class
    /Cannot read properties of null \(reading ['"]removeChild['"]\)/,
    /Failed to execute ['"]removeChild['"] on ['"]Node['"]/,
    // EXUR-FRONT-19 — Android WebView / in-app browser JavaScriptInterface
    /Java bridge method invocation error/,
    /Error invoking post:/,
  ],
  denyUrls: [
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-web-extension:\/\//i,
    // EXUR-FRONT-1D — Google Identity Services (One Tap) client
    /gsi\/client/i,
    /accounts\.google\.com\/gsi/i,
  ],
})

if (enabled && typeof window !== "undefined") {
  // Avoid requestIdleCallback — LH quiet windows arm it early and inflate TBT.
  const events = ["pointerdown", "keydown", "touchstart"] as const
  let settled = false

  function armReplay() {
    if (settled) return
    settled = true
    for (const event of events) {
      window.removeEventListener(event, armReplay)
    }
    void import("@sentry/nextjs")
      .then((lazySentry) => {
        Sentry.addIntegration(
          lazySentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          })
        )
      })
      .catch(() => {
        // Replay is optional — never block the app if the chunk fails.
      })
  }

  for (const event of events) {
    window.addEventListener(event, armReplay, { once: true, passive: true })
  }
  window.setTimeout(armReplay, 15_000)
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
