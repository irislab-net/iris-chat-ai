"use client"

import { Link } from "@/i18n/navigation"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { ExurLogo } from "@/components/brand/exur-logo"
import { Button } from "@/components/ui/button"
import { localizedPlanLabel } from "@/lib/billing/localized-plan-label"
import { APP_NEWS_PATH } from "@/lib/site"
import {
  landingGlassNavIcon,
  landingGlassSheen,
  landingGlassSurface,
} from "@/lib/landing-modern-styles"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/api/types"

function BillingPageHeader({
  isAuthenticated,
  user,
  page = "billing",
}: {
  isAuthenticated: boolean
  user: User | null
  page?: "billing" | "upgrade"
}) {
  const t = useTranslations(page === "upgrade" ? "upgradePage" : "billingPage")
  const tw = useTranslations("workspace")

  const planLine = isAuthenticated
    ? t("currentPlanLine", {
        plan: localizedPlanLabel(user?.tier, (key) => tw(key)),
      })
    : t("statusSignedOut")

  return (
    <header className="mt-3 flex items-center gap-3 sm:mt-5">
      <div
        className={cn(
          landingGlassSurface,
          "flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-white/44 px-3.5 py-2 sm:px-4 dark:bg-white/10"
        )}
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <ExurLogo
          decorative
          variant="mark"
          size={36}
          className="relative z-10 size-9 shrink-0"
        />
        <div className="relative z-10 min-w-0 flex-1 ps-0.5">
          <p className="truncate text-[15px] font-medium leading-tight tracking-tight">
            {t("title")}
          </p>
          <p className="mt-0.5 truncate text-[13px] leading-snug text-muted-foreground">
            {planLine}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(landingGlassNavIcon, "shrink-0 text-foreground")}
        nativeButton={false}
        render={<Link href={APP_NEWS_PATH} aria-label={t("backToDesk")} />}
      >
        <span aria-hidden className={cn(landingGlassSheen, "rounded-full")} />
        <XIcon className="relative z-10 size-4" />
      </Button>
    </header>
  )
}

export { BillingPageHeader }
