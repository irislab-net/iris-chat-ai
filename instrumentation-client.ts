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
