"use client"

import { useTranslations } from "next-intl"

import { chatMobileHeaderStakingClass } from "@/components/app-shell/chat-mobile-gemini-styles"
import { useAppFeatureVisible } from "@/hooks/use-app-feature-prefs"
import { useRouter } from "@/i18n/navigation"
import { STAKING_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

/**
 * Liquid-glass Staking pill — navigates to the staking app.
 * Hidden unless `NEXT_PUBLIC_FEATURE_STAKING` is on.
 */
function ChatMobileStakingButton({ className }: { className?: string }) {
  const t = useTranslations("workspace")
  const router = useRouter()
  const visible = useAppFeatureVisible("staking")
  if (!visible) return null

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
      <button
        type="button"
        className={cn(chatMobileHeaderStakingClass, "relative z-10 w-full")}
        aria-label={t("staking")}
        onClick={() => router.push(STAKING_PATH)}
      >
        {t("staking")}
      </button>
    </div>
  )
}

export { ChatMobileStakingButton }
