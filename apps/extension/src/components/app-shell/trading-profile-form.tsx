"use client"

import * as React from "react"
import {
  BitcoinIcon,
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
  chatComposerLiquidSheetRowClass,
  chatComposerLiquidSheetRowIconClass,
  chatMobilePrimaryButtonClass,
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

const fieldRowClass = cn(
  chatComposerLiquidSheetRowClass,
  "min-h-13 gap-3 px-3.5 text-[15px] font-medium tracking-[-0.016em]"
)

const fieldIconClass = "size-4.5 shrink-0 text-foreground/80"

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
  // Returning users skip the intro / "Edit profile" gate and land on the
  // saved values summary; first-time setup still starts on intro.
  const [view, setView] = React.useState<FormView>(() =>
    hasSavedProfile ? "home" : "intro"
  )
  // Draft commits on Done (check). Swipe-dismiss without Done discards it.
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
    if (!saved) return
    onSaved?.(saved)
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
    ) : null

  const isPickerView =
    view === "experience" ||
    view === "target_market" ||
    view === "risk" ||
    view === "country"

  function handleDone() {
    if (isPickerView) {
      setView("home")
      return
    }
    if (view === "home") {
      onSave()
      return
    }
    onDone()
  }

  const headerTitle =
    view === "experience"
      ? t("experienceLabel")
      : view === "target_market"
        ? t("targetMarketLabel")
        : view === "risk"
          ? t("riskLabel")
          : view === "country"
            ? t("countryLabel")
            : title

  let body: React.ReactNode

  if (view === "intro") {
    body = (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-3.5 text-center">
        <IntroIllustration />
        <p className="mt-5 text-[17px] font-semibold tracking-tight text-foreground">
          {t("introTitle")}
        </p>
        <p className="mx-auto mt-2 max-w-[20rem] text-[14px] leading-relaxed text-muted-foreground">
          {t("introBody")}
        </p>
      </div>
    )
  } else if (view === "experience") {
    body = (
      <PickerStack>
        {EXPERIENCE_LEVELS.map((level) => {
          const Icon = EXPERIENCE_ICONS[level]
          return (
            <OptionRow
              key={level}
              icon={<Icon className={fieldIconClass} />}
              label={experienceLabel(level)}
              selected={draft.experience_level === level}
              onSelect={() => {
                patch("experience_level", level)
                setView("home")
              }}
            />
          )
        })}
      </PickerStack>
    )
  } else if (view === "target_market") {
    body = (
      <PickerStack>
        {TARGET_MARKETS.map((market) => {
          const Icon = MARKET_ICONS[market]
          return (
            <OptionRow
              key={market}
              icon={<Icon className={fieldIconClass} />}
              label={marketLabel(market)}
              selected={draft.target_market === market}
              onSelect={() => {
                patch("target_market", market)
                setView("home")
              }}
            />
          )
        })}
      </PickerStack>
    )
  } else if (view === "risk") {
    body = (
      <PickerStack>
        {RISK_TOLERANCES.map((risk) => {
          const Icon = RISK_ICONS[risk]
          return (
            <OptionRow
              key={risk}
              icon={<Icon className={fieldIconClass} />}
              label={riskLabel(risk)}
              selected={draft.risk_tolerance === risk}
              onSelect={() => {
                patch("risk_tolerance", risk)
                setView("home")
              }}
            />
          )
        })}
      </PickerStack>
    )
  } else if (view === "country") {
    body = (
      <PickerStack>
        <OptionRow
          icon={<CircleHelpIcon className={fieldIconClass} />}
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
            icon={<GlobeIcon className={fieldIconClass} />}
            label={option.name}
            selected={selectedCountryCode === option.code}
            onSelect={() => {
              patch("country", option.enName)
              setView("home")
            }}
          />
        ))}
      </PickerStack>
    )
  } else {
    body = (
      <div className="flex flex-col gap-3">
        <p className="px-3.5 text-[13px] leading-relaxed text-muted-foreground">
          {t("editorHint")}
        </p>
        <div className="flex flex-col gap-1.5">
          <FieldRow
            icon={<GaugeIcon className={fieldIconClass} />}
            label={t("experienceLabel")}
            value={experienceLabel(draft.experience_level)}
            onClick={() => setView("experience")}
          />
          <FieldRow
            icon={<LineChartIcon className={fieldIconClass} />}
            label={t("targetMarketLabel")}
            value={marketLabel(draft.target_market)}
            onClick={() => setView("target_market")}
          />
          <FieldRow
            icon={<ShieldIcon className={fieldIconClass} />}
            label={t("riskLabel")}
            value={riskLabel(draft.risk_tolerance)}
            onClick={() => setView("risk")}
          />
          <FieldRow
            icon={<GlobeIcon className={fieldIconClass} />}
            label={t("countryLabel")}
            value={countrySummary()}
            onClick={() => setView("country")}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col px-4 pb-1",
        view === "intro" ? "overflow-visible" : "overflow-hidden",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-2 pt-1 pb-3">
        <h2 className="min-w-0 flex-1 truncate text-start text-[22px] font-normal tracking-tight text-foreground">
          {headerTitle}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDone}
          aria-label={common("done")}
          title={common("done")}
          className={cn(
            chatMobilePrimaryButtonClass,
            "chat-ios26-liquid-glass relative isolate size-9 shrink-0 overflow-hidden rounded-full px-0 text-white hover:text-white"
          )}
        >
          <SfCheckIcon className="size-4.5 stroke-[2.4] text-white" />
        </Button>
      </div>

      <div
        className={cn(
          "min-h-0 flex-1",
          view === "intro"
            ? "flex flex-col"
            : isPickerView
              ? "flex flex-col overflow-hidden"
              : "overflow-y-auto overscroll-contain pb-2"
        )}
      >
        {body}
      </div>

      {footer ? (
        <div className={cn(chatMobileSheetFooterBarClass, "relative z-10 shrink-0 px-0")}>
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
}: {
  icon: React.ReactNode
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={fieldRowClass}>
      <span className={chatComposerLiquidSheetRowIconClass}>{icon}</span>
      <span className="min-w-0 flex-1 text-foreground">{label}</span>
      <span className="max-w-[40%] shrink-0 truncate text-[14px] text-muted-foreground">
        {value}
      </span>
      <ChevronRightIcon
        className="size-4 shrink-0 text-muted-foreground/50 rtl:rotate-180"
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
    <button type="button" onClick={onSelect} className={fieldRowClass}>
      <span className={chatComposerLiquidSheetRowIconClass}>{icon}</span>
      <span className="min-w-0 flex-1 text-foreground">{label}</span>
      {selected ? (
        <SelectionCheckBadge />
      ) : (
        <span className="size-5 shrink-0" aria-hidden />
      )}
    </button>
  )
}

function PickerStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto overscroll-contain scrollbar-gutter-stable">
      {children}
    </div>
  )
}

export { TradingProfileForm }
