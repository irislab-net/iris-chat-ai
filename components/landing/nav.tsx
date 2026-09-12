"use client"

import { useTranslations } from "next-intl"

import { IrisLabLogo } from "@/components/brand/iris-lab-logo"
import { LandingNavActions } from "@/components/landing/landing-nav-actions"
import { Link } from "@/i18n/navigation"
import { LANDING_CONTAINER } from "@/lib/landing-layout"
import { LANDING_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export function LandingNav() {
  const t = useTranslations("common")

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className={cn("flex items-center justify-between py-4 md:py-5", LANDING_CONTAINER)}>
        <Link
          href={LANDING_PATH}
          className="flex items-center gap-3 text-foreground"
          aria-label={t("brand")}
        >
          <IrisLabLogo decorative size={40} className="size-10 rounded-lg" priority />
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            {t("brand")}
          </span>
        </Link>

        <LandingNavActions />
      </div>
    </header>
  )
}
