"use client"

import * as React from "react"

import {
  chatDesktopDialogClass,
  chatDesktopDialogFooterClass,
  chatMobileSheetBodyClass,
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
import type { AuthUserError } from "@/lib/auth-user-errors"
import { cn } from "@/lib/utils"

type AuthErrorSheetProps = {
  error: AuthUserError | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
  onReload?: () => void
  /** Side panel uses a bottom sheet; login page uses a centered modal. */
  variant?: "sheet" | "dialog"
}

function AuthErrorSheet({
  error,
  open,
  onOpenChange,
  onClose,
  onReload,
  variant = "sheet",
}: AuthErrorSheetProps) {
  const title = error?.title ?? "Something went wrong"
  const description = error?.description ?? "Please try again."

  const handleReload = React.useCallback(() => {
    if (onReload) {
      onReload()
      return
    }
    window.location.reload()
  }, [onReload])

  const handleDismiss = React.useCallback(() => {
    onOpenChange(false)
    onClose()
  }, [onClose, onOpenChange])

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange(next)
      if (!next) onClose()
    },
    [onClose, onOpenChange]
  )

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(chatDesktopDialogClass, "max-w-sm gap-0 p-0")}
          showCloseButton={false}
          gsapMotion
          open={open}
        >
          <div className="flex flex-col gap-3 px-5 pt-5 pb-1">
            <DialogHeader className="gap-1.5 space-y-0 text-start">
              <DialogTitle className="text-[1.2rem] font-semibold tracking-[-0.02em] text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className={cn(chatDesktopDialogFooterClass, "gap-2")}>
            <Button
              type="button"
              className={cn(
                chatMobileSheetSecondaryButtonClass,
                "h-11! min-h-11 w-full sm:w-auto sm:flex-1"
              )}
              onClick={handleDismiss}
            >
              Close
            </Button>
            <Button
              type="button"
              className={cn(
                chatMobileSheetPrimaryButtonClass,
                "h-11! min-h-11 w-full sm:w-auto sm:flex-1"
              )}
              onClick={handleReload}
            >
              Reload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={chatMobileSheetContentClass}
      >
        <div aria-hidden className={chatMobileSheetHandleClass} />
        <SheetHeader className={chatMobileSheetHeaderClass}>
          <SheetTitle className={chatMobileSheetTitleClass}>{title}</SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className={cn(chatMobileSheetBodyClass, "pt-1")} />
        <SheetFooter className={chatMobileSheetFooterClass}>
          <div className={cn(chatMobileSheetFooterBarClass, "space-y-2")}>
            <Button
              type="button"
              className={chatMobileSheetPrimaryButtonClass}
              onClick={handleReload}
            >
              Reload
            </Button>
            <Button
              type="button"
              className={chatMobileSheetSecondaryButtonClass}
              onClick={handleDismiss}
            >
              Close
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { AuthErrorSheet }
export type { AuthErrorSheetProps }
