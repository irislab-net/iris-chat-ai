import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

import { AuthProvider } from "@/components/auth/auth-provider"
import { ChatAside } from "@/components/app-shell/chat-aside"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NextIntlClientProvider } from "next-intl"
import type { AppLocale } from "@/i18n/routing"
import {
  applyLocaleToDocument,
  readStoredLocale,
} from "@/lib/i18n/locale"
import {
  applyThemeToDocument,
  ThemeProvider,
} from "@/shims/use-theme"
import "@/styles/globals.css"
import "@/styles/chat-gemini.css"

// Apply system/light/dark before first paint (don't wait for account menu mount).
applyThemeToDocument()

/**
 * Pass `onClose` so ChatAside uses the mobile shell (same as the web chat
 * overlay): Gemini menu → history drawer, account menu → news sheet.
 * Side panel has no parent to dismiss into, so onClose is a no-op.
 */
function SidePanelRoot() {
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
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <div className="relative flex h-full min-h-0 flex-col">
              <ChatAside
                className="h-full min-h-0"
                onClose={() => {}}
                isPrimaryContent
              />
              <Toaster position="top-center" />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SidePanelRoot />
  </StrictMode>
)
