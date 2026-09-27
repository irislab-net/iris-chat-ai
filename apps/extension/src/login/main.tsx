import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { NextIntlClientProvider } from "next-intl"

import { LoginWizard } from "@/login/login-wizard"
import { applyThemeToDocument } from "@/shims/use-theme"
import "@/styles/globals.css"
import "@/styles/chat-gemini.css"

// Login tab matches the marketing / consent surface (light glass), not system dark.
document.documentElement.classList.remove("dark")
document.documentElement.style.colorScheme = "light"
applyThemeToDocument("light")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NextIntlClientProvider locale="en">
      <LoginWizard />
    </NextIntlClientProvider>
  </StrictMode>
)
