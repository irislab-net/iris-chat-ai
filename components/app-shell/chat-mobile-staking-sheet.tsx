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
  chatMobileSheetSecondaryButtonClass,
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
          "flex flex-col gap-0 overflow-hidden border-0"
        )}
      >
        <div
          aria-hidden
          className={cn(chatMobileSheetHandleClass, "shrink-0")}
        />
        <SheetHeader
          className={cn(chatMobileSheetHeaderClass, "shrink-0 gap-1.5")}
        >
          <SheetTitle className={chatMobileSheetTitleClass}>
            {t("stakingSheetTitle")}
          </SheetTitle>
          <SheetDescription className={chatMobileSheetDescriptionClass}>
            {t("stakingSheetBody")}
          </SheetDescription>
        </SheetHeader>
        <div
          className={cn(
            chatMobileSheetBodyClass,
            "min-h-0 flex-1 overflow-y-auto pt-1 pb-2"
          )}
        >
          <div className="chat-staking-liquid-noise relative isolate overflow-hidden rounded-[1.65rem] border-0 px-3.5 py-4">
            <div aria-hidden className="chat-staking-liquid-noise-wash" />
            <div aria-hidden className="chat-staking-liquid-noise-grain" />
            <div aria-hidden className="chat-staking-liquid-noise-sheen" />
            <div className="relative z-10">
              <ChatStakingCoinTree active={open} />
            </div>
          </div>
        </div>
        <SheetFooter className={cn(chatMobileSheetFooterClass, "shrink-0")}>
          <div className={cn(chatMobileSheetFooterBarClass, "pt-4")}>
            <Button
              type="button"
              className={chatMobileSheetSecondaryButtonClass}
              onClick={() => onOpenChange(false)}
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
