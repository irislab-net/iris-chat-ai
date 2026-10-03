"use client"

import * as React from "react"
import { RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetSecondaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { GoogleGlyph } from "@/components/auth/google-glyph"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsDesktop } from "@/hooks/use-media-query"
import { landingCta } from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"

export type ChatErrorDialogAction = "retry" | "connect"

type ChatErrorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Localized / sanitized reason shown to the user. */
  message: string
  action?: ChatErrorDialogAction
  retrying?: boolean
  signingIn?: boolean
  onRetry?: () => void
  onSignIn?: () => void
}

function ChatErrorDialog({
  open,
  onOpenChange,
  message,
  action = "retry",
  retrying = false,
  signingIn = false,
  onRetry,
  onSignIn,
}: ChatErrorDialogProps) {
  const t = useTranslations("workspace.chatError")
  const tw = useTranslations("workspace")
  const isDesktop = useIsDesktop()

  if (isDesktop === null) return null

  const busy = retrying || signingIn

  const actions = (
    <>
      {action === "connect" ? (
        <Button
          type="button"
          className={cn(
            isDesktop
              ? cn(landingCta("primary", "sm"), "rounded-full gap-2")
              : cn(chatMobileSheetPrimaryButtonClass, "gap-2")
          )}
          disabled={busy}
          onClick={() => {
            onOpenChange(false)
            onSignIn?.()
          }}
        >
          <GoogleGlyph className="size-4 shrink-0" />
          {signingIn ? tw("connecting") : tw("continueWithGoogle")}
        </Button>
      ) : (
        <Button
          type="button"
          className={cn(
            isDesktop
              ? cn(landingCta("primary", "sm"), "rounded-full gap-2")
              : cn(chatMobileSheetPrimaryButtonClass, "gap-2")
          )}
          disabled={busy || !onRetry}
          onClick={() => {
            onOpenChange(false)
            onRetry?.()
          }}
        >
          <RefreshCwIcon className="size-4 shrink-0" aria-hidden />
          {retrying ? t("retrying") : tw("tryAgain")}
        </Button>
      )}
      <Button
        type="button"
        className={cn(
          isDesktop
            ? cn(landingCta("secondary", "sm"), "rounded-full")
            : chatMobileSheetSecondaryButtonClass
        )}
        disabled={busy}
        onClick={() => onOpenChange(false)}
      >
        {t("dismiss")}
      </Button>
    </>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={chatDesktopDialogClass} showCloseButton>
          <div className="flex flex-col gap-4 px-5 pt-5 pb-1">
            <DialogHeader className="gap-2 space-y-0 text-start">
              <DialogTitle className="font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                {t("title")}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-pretty text-muted-foreground">
                {message}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter
            className={cn(
              chatDesktopDialogFooterClass,
              "flex-col gap-2 sm:flex-col sm:justify-stretch"
            )}
          >
            {actions}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={cn(chatMobileSheetContentClass, "gap-0 border-0")}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-2")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("title")}
          </SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {message}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "space-y-2 pt-4")}>
            {actions}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ChatErrorDialog }
