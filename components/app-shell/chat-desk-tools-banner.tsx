"use client"

import * as React from "react"
import { CandlestickChartIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import {
  isDeskToolsBannerSnoozed,
  snoozeDeskToolsBanner,
} from "@/lib/chat-desk-tools-banner"
import { cn } from "@/lib/utils"

const bannerSurfaceClass =
  "group/desk-banner relative isolate h-full w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow,transform] duration-300 hover:border-primary/25 hover:shadow-md active:scale-[0.99] before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[linear-gradient(to_right,color-mix(in_oklch,var(--foreground)_3%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklch,var(--foreground)_3%,transparent)_1px,transparent_1px)] before:bg-size-[20px_20px] before:[mask-image:radial-gradient(ellipse_at_50%_20%,black_42%,transparent_92%)] after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-[radial-gradient(ellipse_120%_90%_at_50%_-10%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_55%)]"

type ChatDeskToolsBannerProps = {
  onDock: () => void
  className?: string
}

function ChatDeskToolsBanner({ onDock, className }: ChatDeskToolsBannerProps) {
  const t = useTranslations("workspace")
  const [snoozed, setSnoozed] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    setSnoozed(isDeskToolsBannerSnoozed())
  }, [])

  if (snoozed !== false) return null

  function dismiss(event: React.MouseEvent) {
    event.stopPropagation()
    snoozeDeskToolsBanner()
    setSnoozed(true)
  }

  return (
    <AspectRatio ratio={2.35} className={cn("mx-2 mb-2 shrink-0", className)}>
      <div
        role="button"
        tabIndex={0}
        className={bannerSurfaceClass}
        onClick={onDock}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onDock()
          }
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-[linear-gradient(to_right,transparent,color-mix(in_oklch,var(--foreground)_12%,transparent),transparent)]"
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
                <CandlestickChartIcon className="size-3.5" aria-hidden />
              </div>
              <p className="truncate text-xs font-semibold tracking-tight">
                {t("deskToolsBannerTitle")}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7 shrink-0 text-muted-foreground hover:bg-background/70 hover:text-foreground"
              aria-label={t("deskToolsBannerDismiss")}
              onClick={dismiss}
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>

          <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {t("deskToolsBannerBody")}
          </p>
        </div>
      </div>
    </AspectRatio>
  )
}

export { ChatDeskToolsBanner }
