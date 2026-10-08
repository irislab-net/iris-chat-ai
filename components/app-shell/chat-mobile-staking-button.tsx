"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { chatMobileHeaderStakingClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { UPGRADE_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

/**
 * Liquid-glass Staking pill — thin aligned gradient rim that gently fades.
 */
function ChatMobileStakingButton({ className }: { className?: string }) {
  const t = useTranslations("workspace")

  return (
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
        nativeButton={false}
        render={<Link href={UPGRADE_PATH} />}
      >
        {t("staking")}
      </Button>
    </div>
  )
}

export { ChatMobileStakingButton }
