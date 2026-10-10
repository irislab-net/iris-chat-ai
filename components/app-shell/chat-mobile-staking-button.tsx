"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { chatMobileHeaderStakingClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { ChatMobileStakingSheet } from "@/components/app-shell/chat-mobile-staking-sheet"
import { Button } from "@/components/ui/button"
import { useAppFeatureVisible } from "@/hooks/use-app-feature-prefs"
import { trackStakingOpen } from "@/lib/analytics"
import { cn } from "@/lib/utils"

/**
 * Liquid-glass Staking pill — opens the staking preview sheet.
 * Hidden unless `NEXT_PUBLIC_FEATURE_STAKING` is on.
 * Mount only on empty/new-chat header (not threaded chat).
 */
function ChatMobileStakingButton({ className }: { className?: string }) {
  const t = useTranslations("workspace")
  const visible = useAppFeatureVisible("staking")
  const [open, setOpen] = React.useState(false)

  if (!visible) return null

  return (
    <>
      <div
        className={cn(
          "group/staking relative flex w-fit shrink-0 self-center overflow-visible rounded-full p-px",
          className
        )}
      >
        <span
          aria-hidden
          className="chat-staking-rim-glow pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-full"
        >
          <span className="chat-staking-rim-spin absolute top-1/2 left-1/2 aspect-square w-[220%] -translate-x-1/2 -translate-y-1/2" />
        </span>
        <Button
          type="button"
          className={cn(chatMobileHeaderStakingClass, "w-full")}
          aria-label={t("staking")}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            trackStakingOpen()
            setOpen(true)
          }}
        >
          {t("staking")}
        </Button>
      </div>
      <ChatMobileStakingSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

export { ChatMobileStakingButton }
