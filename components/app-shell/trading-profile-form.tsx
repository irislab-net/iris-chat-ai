"use client"

import * as React from "react"
import {
  BitcoinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  GaugeIcon,
  GlobeIcon,
  LineChartIcon,
  ShieldIcon,
  SparklesIcon,
  SproutIcon,
  type LucideIcon,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  chatAccentSecondaryFillClass,
  chatMobileGlassSurfaceClass,
  chatMobileSheetFooterBarClass,
  chatMobileSheetPrimaryButtonClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { ExurLogo } from "@/components/brand/exur-logo"
import { SfCheckIcon } from "@/components/icons/sf-menu-icons"
import { SelectionCheckBadge } from "@/components/ui/selection-check-badge"
import {
  getCountryOptions,
  matchCountryCode,
} from "@/lib/countries"
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

type FormView =
  | "intro"
  | "home"
  | "experience"
  | "target_market"
  | "risk"
  | "country"

const EXPERIENCE_ICONS: Record<ExperienceLevel, LucideIcon> = {
  beginner: SproutIcon,
  intermediate: GaugeIcon,
  advanced: SparklesIcon,
  not_sure: CircleHelpIcon,
}

const MARKET_ICONS: Record<TargetMarket, LucideIcon> = {
  crypto: BitcoinIcon,
  forex: LineChartIcon,
  commodities: LineChartIcon,
  multi: SparklesIcon,
  not_sure: CircleHelpIcon,
}

const RISK_ICONS: Record<RiskTolerance, LucideIcon> = {
  low: ShieldIcon,
  medium: GaugeIcon,
  high: SparklesIcon,
  not_sure: CircleHelpIcon,
}

const rowClass =
  "flex min-h-[3.25rem] w-full items-center gap-3.5 px-4 text-start text-[15px] font-normal tracking-[-0.01em] transition-colors active:bg-black/[0.03] dark:active:bg-white/[0.06]"

type TradingProfileFormProps = {
  title: string
  onDone: () => void
  initialProfile?: TradingProfile | null
  onSaved?: (profile: TradingProfile) => void
  className?: string
}

function TradingProfileForm({
  title,
  onDone,
  initialProfile = null,
  onSaved,
  className,
}: TradingProfileFormProps) {
  const t = useTranslations("workspace.tradingProfile")
  const common = useTranslations("common")
  const locale = useLocale()
  const hasSavedProfile = Boolean(initialProfile)
  const [view, setView] = React.useState<FormView>("intro")
  // Draft only commits on Save. Closing without Save discards it.
  const [draft, setDraft] = React.useState<TradingProfileDraft>(() =>
    tradingProfileToDraft(initialProfile)
  )

  const countryOptions = React.useMemo(
    () => getCountryOptions(locale),
    [locale]
  )

  const selectedCountryCode = React.useMemo(
    () => matchCountryCode(draft.country, countryOptions),
    [countryOptions, draft.country]
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

  function experienceLabel(level: ExperienceLevel) {
    return t(`experience.${level}`)
  }

  function marketLabel(market: TargetMarket) {
    return t(`targetMarket.${market}`)
  }

  function riskLabel(risk: RiskTolerance) {
    return t(`risk.${risk}`)
  }

  function countrySummary() {
    if (!draft.country.trim()) return t("notSure")
    const matched = countryOptions.find(
      (option) => option.code === selectedCountryCode
    )
    return matched?.name ?? draft.country
  }

  const footer =
    view === "intro" ? (
      <Button
        type="button"
        className={chatMobileSheetPrimaryButtonClass}
        onClick={() => setView("home")}
      >
        {hasSavedProfile ? t("editSetup") : t("setup")}
      </Button>
    ) : view === "home" ? (
      <Button
        type="button"
        className={chatMobileSheetPrimaryButtonClass}
        onClick={onSave}
      >
        {t("save")}
      </Button>
    ) : null

  let body: React.ReactNode

  if (view === "intro") {
    body = (
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.35rem] px-5 pt-6 pb-6 text-center",
          chatMobileGlassSurfaceClass
        )}
      >
        <IntroIllustration />
        <p className="relative mt-5 text-[17px] font-semibold tracking-tight text-foreground">
          {t("introTitle")}
        </p>
        <p className="relative mx-auto mt-2 max-w-[20rem] text-[14px] leading-relaxed text-muted-foreground">
          {t("introBody")}
        </p>
      </div>
    )
  } else if (view === "experience") {
    body = (
      <PickerView title={t("experienceLabel")} onBack={() => setView("home")}>
        {EXPERIENCE_LEVELS.map((level) => {
          const Icon = EXPERIENCE_ICONS[level]
          return (
            <OptionRow
              key={level}
              icon={<Icon className="size-[22px]" />}
              label={experienceLabel(level)}
              selected={draft.experience_level === level}
              onSelect={() => {
                patch("experience_level", level)
                setView("home")
              }}
            />
          )
        })}
      </PickerView>
    )
  } else if (view === "target_market") {
    body = (
      <PickerView
        title={t("targetMarketLabel")}
        onBack={() => setView("home")}
      >
        {TARGET_MARKETS.map((market) => {
          const Icon = MARKET_ICONS[market]
          return (
            <OptionRow
              key={market}
              icon={<Icon className="size-[22px]" />}
              label={marketLabel(market)}
              selected={draft.target_market === market}
              onSelect={() => {
                patch("target_market", market)
                setView("home")
              }}
            />
          )
        })}
      </PickerView>
    )
  } else if (view === "risk") {
    body = (
      <PickerView title={t("riskLabel")} onBack={() => setView("home")}>
        {RISK_TOLERANCES.map((risk) => {
          const Icon = RISK_ICONS[risk]
          return (
            <OptionRow
              key={risk}
              icon={<Icon className="size-[22px]" />}
              label={riskLabel(risk)}
              selected={draft.risk_tolerance === risk}
              onSelect={() => {
                patch("risk_tolerance", risk)
                setView("home")
              }}
            />
          )
        })}
      </PickerView>
    )
  } else if (view === "country") {
    body = (
      <PickerView title={t("countryLabel")} onBack={() => setView("home")}>
        <OptionRow
          icon={<CircleHelpIcon className="size-[22px]" />}
          label={t("notSure")}
          selected={!draft.country.trim()}
          onSelect={() => {
            patch("country", "")
            setView("home")
          }}
        />
        {countryOptions.map((option) => (
          <OptionRow
            key={option.code}
            icon={<GlobeIcon className="size-[22px]" />}
            label={option.name}
            selected={selectedCountryCode === option.code}
            onSelect={() => {
              patch("country", option.enName)
              setView("home")
            }}
          />
        ))}
      </PickerView>
    )
  } else {
    body = (
      <div className="flex flex-col gap-4">
        <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">
          {t("editorHint")}
        </p>
        <div
          className={cn(
            "overflow-hidden rounded-[1.35rem]",
            chatMobileGlassSurfaceClass
          )}
        >
          <FieldRow
            icon={<GaugeIcon className="size-[22px]" />}
            label={t("experienceLabel")}
            value={experienceLabel(draft.experience_level)}
            onClick={() => setView("experience")}
          />
          <FieldRow
            icon={<LineChartIcon className="size-[22px]" />}
            label={t("targetMarketLabel")}
            value={marketLabel(draft.target_market)}
            onClick={() => setView("target_market")}
            divider
          />
          <FieldRow
            icon={<ShieldIcon className="size-[22px]" />}
            label={t("riskLabel")}
            value={riskLabel(draft.risk_tolerance)}
            onClick={() => setView("risk")}
            divider
          />
          <FieldRow
            icon={<GlobeIcon className="size-[22px]" />}
            label={t("countryLabel")}
            value={countrySummary()}
            onClick={() => setView("country")}
            divider
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden px-4",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 pt-1 pb-3">
        <h2 className="min-w-0 flex-1 truncate text-start text-[22px] font-normal tracking-tight text-foreground">
          {title}
        </h2>
        <button
          type="button"
          onClick={onDone}
          aria-label={common("done")}
          title={common("done")}
          className={cn(
            chatAccentSecondaryFillClass,
            "chat-ios26-liquid-glass relative isolate flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full px-0"
          )}
        >
          <SfCheckIcon className="size-5" strokeWidth={2.6} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
        {body}
      </div>

      {footer ? (
        <div
          className={cn(
            chatMobileSheetFooterBarClass,
            "shrink-0 !bg-transparent px-0 shadow-none backdrop-blur-none"
          )}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}

function IntroIllustration() {
  return (
    <div aria-hidden className="relative mx-auto flex h-24 w-full items-center justify-center">
      <span className="pointer-events-none absolute inset-x-8 top-1/2 h-16 -translate-y-1/2 rounded-full bg-[#2563EB]/18 blur-2xl dark:bg-[#2563EB]/28" />
      <span
        className={cn(
          "relative inline-flex size-[4.75rem] items-center justify-center overflow-hidden rounded-full",
          "border-0 bg-white/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),inset_0_0_0_1px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-16px_rgba(37,99,235,0.45)]",
          "backdrop-blur-2xl backdrop-saturate-150 supports-backdrop-filter:bg-white/45",
          "dark:bg-[oklch(0.24_0_0_/0.9)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_18px_44px_-18px_rgba(0,0,0,0.55)] dark:supports-backdrop-filter:bg-[oklch(0.22_0_0_/0.78)]"
        )}
      >
        <ExurLogo
          decorative
          variant="gradient"
          size={72}
          className="size-14 overflow-hidden rounded-full"
        />
      </span>
    </div>
  )
}

function FieldRow({
  icon,
  label,
  value,
  onClick,
  divider,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick: () => void
  divider?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        rowClass,
        divider &&
          "border-t border-foreground/8 dark:border-white/10 [border-image:none]"
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-foreground/85">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-foreground">{label}</span>
      <span className="max-w-[40%] shrink-0 truncate text-[13px] text-muted-foreground">
        {value}
      </span>
      <ChevronRightIcon
        className="size-4 shrink-0 text-foreground/25 rtl:rotate-180"
        aria-hidden
      />
    </button>
  )
}

function OptionRow({
  icon,
  label,
  selected,
  onSelect,
}: {
  icon: React.ReactNode
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" onClick={onSelect} className={rowClass}>
      <span className="flex size-6 shrink-0 items-center justify-center text-foreground/85">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-foreground">{label}</span>
      {selected ? (
        <SelectionCheckBadge />
      ) : (
        <span className="size-5 shrink-0" aria-hidden />
      )}
    </button>
  )
}

function PickerView({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 self-start rounded-full px-1 py-1 text-[14px] font-medium text-[#1A73E8] dark:text-[#8AB4F8]"
      >
        <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden />
        {title}
      </button>
      <div
        className={cn(
          "overflow-hidden rounded-[1.35rem]",
          chatMobileGlassSurfaceClass
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { TradingProfileForm }
