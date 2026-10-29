"use client"

import { useTranslations } from "next-intl"

import { chatMobilePrimaryButtonClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { SfCheckIcon } from "@/components/icons/sf-menu-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Blue liquid-glass Done — tinted glass circle, white check (account / desk sheets). */
const chatSheetDoneCheckClass = cn(
  chatMobilePrimaryButtonClass,
  "chat-ios26-liquid-glass relative isolate size-9 shrink-0 overflow-hidden rounded-full px-0 text-white hover:text-white"
)

type ChatSheetDoneCheckProps = {
  onClick: () => void
  className?: string
}

function ChatSheetDoneCheck({ onClick, className }: ChatSheetDoneCheckProps) {
  const common = useTranslations("common")
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={common("done")}
      title={common("done")}
      className={cn(chatSheetDoneCheckClass, className)}
    >
      <SfCheckIcon className="size-4.5 stroke-[2.4] text-white" />
    </Button>
  )
}

export { ChatSheetDoneCheck, chatSheetDoneCheckClass }
