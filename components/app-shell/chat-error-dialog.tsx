"use client"

import * as React from "react"
import { RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetCompactContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatSheetDoneCheck } from "@/components/app-shell/chat-sheet-done-check"
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
  /** Localized title matched to failure kind. */
  title?: string
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
  title,
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
  const close = () => onOpenChange(false)
  const heading = title?.trim() || t("title")

  const primaryAction =
    action === "connect" ? (
      <Button
        type="button"
        className={cn(
          isDesktop
            ? cn(landingCta("primary", "sm"), "rounded-full gap-2")
            : cn(chatMobileSheetPrimaryButtonClass, "gap-2")
        )}
        disabled={busy}
        onClick={() => {
          close()
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
          close()
          onRetry?.()
        }}
      >
        <RefreshCwIcon className="size-4 shrink-0" aria-hidden />
        {retrying ? t("retrying") : tw("tryAgain")}
      </Button>
    )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={chatDesktopDialogClass} showCloseButton={false}>
          <div className="flex flex-col gap-3 px-5 pt-5 pb-1">
            <DialogHeader className="gap-1.5 space-y-0 text-start">
              <div className="flex items-center gap-2">
                <DialogTitle className="min-w-0 flex-1 font-heading text-[1.35rem] font-normal tracking-tight text-foreground">
                  {heading}
                </DialogTitle>
                <ChatSheetDoneCheck onClick={close} />
              </div>
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
            {primaryAction}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(chatMobileSheetCompactContentClass, "gap-0 border-0")}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={cn(chatMobileSheetHeaderClass, "gap-1.5 pe-5 pb-1")}>
          <div className="flex items-center gap-2">
            <SheetTitle
              className={cn(chatMobileSheetTitleClass, "min-w-0 flex-1")}
            >
              {heading}
            </SheetTitle>
            <ChatSheetDoneCheck onClick={close} />
          </div>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {message}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter className={cn(chatMobileSheetFooterClass, "mt-0")}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-5")}>
            {primaryAction}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ChatErrorDialog }
