"use client"

import * as React from "react"
import {
  ActivityIcon,
  BookmarkIcon,
  LineChartIcon,
  MicIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { useAppFeaturePrefs } from "@/hooks/use-app-feature-prefs"
import {
  APP_FEATURE_SETTINGS_ORDER,
  type AppFeatureId,
} from "@/lib/app-features"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  chatComposerLiquidSheetRowClass,
  chatComposerLiquidSheetRowIconClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"

const FEATURE_ICONS: Record<AppFeatureId, LucideIcon> = {
  signal: TrendingUpIcon,
  correlation: LineChartIcon,
  volatility: ActivityIcon,
  watchlist: BookmarkIcon,
  voice: MicIcon,
}

function featureLabelKey(id: AppFeatureId) {
  switch (id) {
    case "signal":
      return "composerToolSignalLabel" as const
    case "correlation":
      return "composerToolCorrelationLabel" as const
    case "volatility":
      return "composerToolVolatilityLabel" as const
    case "watchlist":
      return "signalCardWatchlist" as const
    case "voice":
      return "featureToggleVoiceLabel" as const
  }
}

function featureHintKey(id: AppFeatureId) {
  switch (id) {
    case "signal":
      return "featureToggleSignalHint" as const
    case "correlation":
      return "featureToggleCorrelationHint" as const
    case "volatility":
      return "featureToggleVolatilityHint" as const
    case "watchlist":
      return "featureToggleWatchlistHint" as const
    case "voice":
      return "featureToggleVoiceHint" as const
  }
}

function AppFeatureToggleRow({
  id,
  checked,
  onCheckedChange,
}: {
  id: AppFeatureId
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const t = useTranslations("workspace")
  const labelId = React.useId()
  const Icon = FEATURE_ICONS[id]

  return (
    <div
      className={cn(
        chatComposerLiquidSheetRowClass,
        "cursor-default hover:bg-white/40 dark:hover:bg-white/[0.08]"
      )}
    >
      <span className={chatComposerLiquidSheetRowIconClass}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-start">
        <p
          id={labelId}
          className="text-[15px] font-medium leading-snug tracking-[-0.01em] text-foreground"
        >
          {t(featureLabelKey(id))}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          {t(featureHintKey(id))}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={labelId}
        className="shrink-0"
      />
    </div>
  )
}

function AppFeatureToggles({ className }: { className?: string }) {
  const { prefs, setVisible } = useAppFeaturePrefs()

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {APP_FEATURE_SETTINGS_ORDER.map((id) => (
        <AppFeatureToggleRow
          key={id}
          id={id}
          checked={prefs[id]}
          onCheckedChange={(checked) => setVisible(id, checked)}
        />
      ))}
    </div>
  )
}

export { AppFeatureToggles }
