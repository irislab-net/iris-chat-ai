import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { AuthProvider } from "@/components/auth/auth-provider"
import { ChatAside } from "@/components/app-shell/chat-aside"
import { CookieConsentBanner } from "@/components/privacy/cookie-consent-banner"
import { NextIntlClientProvider } from "next-intl"
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
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextIntlClientProvider locale="en">
      <ThemeProvider>
        <AuthProvider>
          <div className="relative flex h-full min-h-0 flex-col">
            <ChatAside
              className="h-full min-h-0"
              onClose={() => {}}
              isPrimaryContent
            />
            <CookieConsentBanner />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  </StrictMode>
)
