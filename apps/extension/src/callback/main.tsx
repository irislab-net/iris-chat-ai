import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { NextIntlClientProvider } from "next-intl"

import { AuthCallback } from "@/callback/auth-callback"
import type { AppLocale } from "@/i18n/routing"
import {
  applyLocaleToDocument,
  readStoredLocale,
} from "@/lib/i18n/locale"
import { applyThemeToDocument } from "@/shims/use-theme"
import "@/styles/globals.css"
import "@/styles/chat-gemini.css"

document.documentElement.classList.remove("dark")
document.documentElement.style.colorScheme = "light"
applyThemeToDocument("light")

function CallbackRoot() {
  const [locale, setLocale] = useState<AppLocale | null>(null)

  useEffect(() => {
    let cancelled = false
    void readStoredLocale().then((next) => {
      if (cancelled) return
      applyLocaleToDocument(next)
      setLocale(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!locale) return null

  return (
    <NextIntlClientProvider locale={locale}>
      <AuthCallback />
    </NextIntlClientProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CallbackRoot />
  </StrictMode>
)
