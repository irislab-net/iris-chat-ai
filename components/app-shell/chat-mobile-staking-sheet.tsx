"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { ChatStakingCoinTree } from "@/components/app-shell/chat-staking-coin-tree"
import {
  chatMobileSheetBodyClass,
  chatMobileSheetContentClass,
  chatMobileSheetDescriptionClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetFooterClass,
  chatMobileSheetHandleClass,
  chatMobileSheetHeaderClass,
  chatMobileSheetPrimaryButtonClass,
  chatMobileSheetTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ChatMobileStakingSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ChatMobileStakingSheet({
  open,
  onOpenChange,
}: ChatMobileStakingSheetProps) {
  const t = useTranslations("workspace")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton
        className={cn(
          chatMobileSheetContentClass,
          "flex flex-col gap-0 overflow-visible border-0"
        )}
      >
        <div
          aria-hidden
          className={cn(chatMobileSheetHandleClass, "shrink-0")}
        />

        <SheetHeader className={cn(chatMobileSheetHeaderClass, "shrink-0")}>
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("stakingSheetTitle")}
          </SheetTitle>
        </SheetHeader>

        <SheetDescription
          className={cn(
            chatMobileSheetDescriptionClass,
            "shrink-0 px-5 pe-14 pb-3"
          )}
        >
          {t("stakingSheetBody")}
        </SheetDescription>

        <div
          className={cn(
            chatMobileSheetBodyClass,
            "min-h-0 flex-1 overflow-visible pt-0"
          )}
        >
          <div className="relative isolate overflow-visible py-4">
            <div
              aria-hidden
              className="chat-staking-liquid-noise pointer-events-none absolute inset-0 overflow-hidden rounded-[1.65rem]"
            >
              <div className="chat-staking-liquid-noise-wash" />
              <div className="chat-staking-liquid-noise-grain" />
              <div className="chat-staking-liquid-noise-sheen" />
            </div>
            <div className="relative z-10 overflow-visible">
              <ChatStakingCoinTree active={open} />
            </div>
          </div>
        </div>

        <SheetFooter className={cn(chatMobileSheetFooterClass, "shrink-0")}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-4")}>
            <Button
              type="button"
              disabled
              className={chatMobileSheetPrimaryButtonClass}
            >
              {t("stakingComingSoon")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export { ChatMobileStakingSheet }
