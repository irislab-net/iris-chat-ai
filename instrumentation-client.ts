import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  // Replay is a large chunk — do not register it at init time.
  integrations: [],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
})

if (dsn && typeof window !== "undefined") {
  const schedule =
    "requestIdleCallback" in window
      ? (cb: () => void) =>
          window.requestIdleCallback(cb, { timeout: 4_000 })
      : (cb: () => void) => window.setTimeout(cb, 2_000)

  schedule(() => {
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
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
