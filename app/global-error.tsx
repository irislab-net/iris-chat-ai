"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { StatusPage } from "@/components/status/status-page"
import { getLandingHref, getLaunchAppHref } from "@/lib/site"

import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <StatusPage
          code="Error"
          title="Something went wrong"
          body="We hit an unexpected snag loading this page. Try again, or jump back into the app."
          primary={{
            label: "Try again",
            onClick: reset,
            tone: "glass",
          }}
          secondary={{
            label: "Launch App",
            href: getLaunchAppHref(),
            tone: "light",
          }}
          note={
            <a
              href={getLandingHref()}
              className="underline-offset-4 hover:underline"
            >
              Back to Exur
            </a>
          }
        />
      </body>
    </html>
  )
}
