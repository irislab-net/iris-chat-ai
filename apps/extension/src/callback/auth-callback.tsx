"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { establishSessionFromApiCookies } from "@/adapters/auth"
import {
  EXUR_AUTH_SUCCESS,
  EXUR_LOGIN_ERROR,
} from "@/adapters/login-messages"
import { chromeTokenStore, storeAuthTokens } from "@/adapters/token-store"
import { ExurLogo } from "@/components/brand/exur-logo"
import { ChatMobileGeminiBackground } from "@/components/app-shell/chat-mobile-gemini-background"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { cn } from "@/lib/utils"

import { parseAuthCallbackUrl, scrubCallbackUrl } from "./parse-callback"

type Phase = "working" | "success" | "error"

function AuthCallback() {
  const t = useTranslations("workspace")
  const [phase, setPhase] = React.useState<Phase>("working")
  const [error, setError] = React.useState<string | null>(null)

  const closeTab = React.useCallback(() => {
    window.setTimeout(() => {
      try {
        window.close()
      } catch {
        /* Chrome may keep the tab open */
      }
    }, 900)
  }, [])

  const finishSuccess = React.useCallback(async () => {
    await chrome.runtime.sendMessage({ type: EXUR_AUTH_SUCCESS })
    setPhase("success")
    closeTab()
  }, [closeTab])

  const fail = React.useCallback((message: string) => {
    setError(message)
    setPhase("error")
    void chrome.runtime
      .sendMessage({ type: EXUR_LOGIN_ERROR, error: message })
      .catch(() => undefined)
  }, [])

  React.useEffect(() => {
    let cancelled = false

    ;(async () => {
      const fromUrl = parseAuthCallbackUrl()
      scrubCallbackUrl()

      try {
        if (fromUrl.ok) {
          await storeAuthTokens(fromUrl.pair)
          await chromeTokenStore.clearGuestToken?.()
        } else {
          // Normal API path: cookies only, no tokens in the redirect URL.
          await establishSessionFromApiCookies()
        }
        if (cancelled) return
        await finishSuccess()
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error
            ? err.message
            : fromUrl.ok
              ? "Could not save session"
              : fromUrl.error
        fail(message)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fail, finishSuccess])

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#FAFBFC] text-foreground">
      <ChatMobileGeminiBackground variant="hero" visible active tone="blue" />

      <header className="relative z-10 flex items-center gap-2.5 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-2 sm:px-8">
        <ExurLogo
          decorative
          size={36}
          className="size-9 rounded-full shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)]"
          priority
          variant="brand"
        />
        <span className="text-[1.05rem] font-semibold tracking-[-0.03em] text-foreground">
          Exur
        </span>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-24 pt-4 sm:px-6">
        <div className="w-full max-w-md text-center">
          {phase === "working" ? (
            <>
              <Skeleton className="mx-auto h-8 w-48" />
              <p className="mt-4 text-sm text-muted-foreground">
                {t("authCallbackConnecting")}
              </p>
            </>
          ) : null}

          {phase === "success" ? (
            <>
              <h1 className="text-[1.65rem] leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
                {t("authCallbackSuccessTitle")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
                {t("authCallbackSuccess")}
              </p>
              <Button
                type="button"
                className={cn(chatMobileSheetPrimaryButtonClass, "mt-8 w-full")}
                onClick={() => {
                  try {
                    window.close()
                  } catch {
                    /* ignore */
                  }
                }}
              >
                {t("authCallbackClose")}
              </Button>
            </>
          ) : null}

          {phase === "error" ? (
            <>
              <h1 className="text-[1.65rem] leading-tight font-semibold tracking-[-0.03em] text-foreground sm:text-[1.85rem]">
                {t("authCallbackErrorTitle")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
                {error ?? t("authCallbackError")}
              </p>
              <div className="mt-8 flex flex-col gap-2.5">
                <Button
                  type="button"
                  className={cn(chatMobileSheetPrimaryButtonClass, "w-full")}
                  onClick={() => {
                    window.location.assign(
                      chrome.runtime.getURL("login.html")
                    )
                  }}
                >
                  {t("tryAgain")}
                </Button>
                <Button
                  type="button"
                  className={cn(chatMobileSheetSecondaryButtonClass, "w-full")}
                  onClick={() => {
                    try {
                      window.close()
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  {t("authCallbackClose")}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export { AuthCallback }
