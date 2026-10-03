"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  chatMobileSheetPrimaryButtonClass,
  chatMobileGlassSurfaceClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  EXPERIENCE_LEVELS,
  RISK_TOLERANCES,
  TARGET_MARKETS,
  tradingProfileToDraft,
  writeTradingProfile,
  type ExperienceLevel,
  type RiskTolerance,
  type TargetMarket,
  type TradingProfile,
  type TradingProfileDraft,
} from "@/lib/trading-profile"
import { cn } from "@/lib/utils"

function ProfileChip({
  selected,
  label,
  onClick,
}: {
  selected: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium tracking-tight transition-colors",
        selected
          ? "bg-[#1A73E8] text-white shadow-[0_1px_4px_rgba(26,115,232,0.35)] dark:bg-[#8AB4F8] dark:text-[#0B1B33]"
          : cn(
              chatMobileGlassSurfaceClass,
              "text-foreground/85 hover:bg-foreground/8 dark:hover:bg-white/10"
            )
      )}
    >
      {label}
    </button>
  )
}

type TradingProfileFormProps = {
  initialProfile?: TradingProfile | null
  onSaved?: (profile: TradingProfile) => void
  className?: string
}

function TradingProfileForm({
  initialProfile = null,
  onSaved,
  className,
}: TradingProfileFormProps) {
  const t = useTranslations("workspace.tradingProfile")
  // Parent remounts this form via `key` when the sheet view opens; no prop sync needed.
  const [draft, setDraft] = React.useState<TradingProfileDraft>(() =>
    tradingProfileToDraft(initialProfile)
  )

  function patch<K extends keyof TradingProfileDraft>(
    key: K,
    value: TradingProfileDraft[K]
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function onSave() {
    const saved = writeTradingProfile(draft)
    if (saved) onSaved?.(saved)
  }

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <section className="space-y-2.5">
        <p className="text-[13px] font-medium text-muted-foreground">
          {t("experienceLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <ProfileChip
              key={level}
              selected={draft.experience_level === level}
              label={t(`experience.${level}`)}
              onClick={() =>
                patch("experience_level", level as ExperienceLevel)
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <p className="text-[13px] font-medium text-muted-foreground">
          {t("targetMarketLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {TARGET_MARKETS.map((market) => (
            <ProfileChip
              key={market}
              selected={draft.target_market === market}
              label={t(`targetMarket.${market}`)}
              onClick={() => patch("target_market", market as TargetMarket)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <p className="text-[13px] font-medium text-muted-foreground">
          {t("riskLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {RISK_TOLERANCES.map((risk) => (
            <ProfileChip
              key={risk}
              selected={draft.risk_tolerance === risk}
              label={t(`risk.${risk}`)}
              onClick={() => patch("risk_tolerance", risk as RiskTolerance)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <label
          htmlFor="trading-profile-country"
          className="text-[13px] font-medium text-muted-foreground"
        >
          {t("countryLabel")}
        </label>
        <Input
          id="trading-profile-country"
          value={draft.country}
          onChange={(event) => patch("country", event.target.value)}
          placeholder={t("countryPlaceholder")}
          autoComplete="country-name"
          maxLength={80}
          className={cn(
            "h-11 rounded-2xl border-0 px-3.5 text-[15px]",
            chatMobileGlassSurfaceClass
          )}
        />
      </section>

      <Button
        type="button"
        className={chatMobileSheetPrimaryButtonClass}
        onClick={onSave}
      >
        {t("save")}
      </Button>
    </div>
  )
}

export { TradingProfileForm }
