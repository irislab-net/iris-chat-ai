"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import { useLocale, useTranslations } from "next-intl"
import { ActivityIcon, BitcoinIcon, LayersIcon } from "lucide-react"

import {
  chatEmptyHeroPromptsClass,
  chatSamplePromptButtonClass,
  chatSamplePromptCarouselClass,
  chatSamplePromptCarouselContentClass,
  chatSamplePromptCarouselDotsClass,
  chatSamplePromptCarouselItemClass,
  chatSamplePromptDescriptionClass,
  chatSamplePromptIconClass,
  chatSamplePromptStaticListClass,
  chatSamplePromptTextClass,
  chatSamplePromptTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@/components/ui/carousel"
import { IRIS_SAMPLE_PROMPTS } from "@/lib/iris-paper-trade/types"
import { localeDirection } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

const SAMPLE_PROMPT_ICONS = {
  "btc-signal": BitcoinIcon,
  "market-pulse": ActivityIcon,
  "key-levels": LayersIcon,
} as const

const SAMPLE_PROMPT_TAP_SLOP_PX = 8
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

type LocalizedSamplePrompt = {
  id: (typeof IRIS_SAMPLE_PROMPTS)[number]["id"]
  title: string
  description: string
  text: string
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener("change", onStoreChange)
  return () => media.removeEventListener("change", onStoreChange)
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function getReducedMotionServerSnapshot() {
  return false
}

function IrisSamplePromptCard({
  prompt,
  usePromptLabel,
  disabled,
  onEdit,
}: {
  prompt: LocalizedSamplePrompt
  usePromptLabel: string
  disabled?: boolean
  onEdit: (text: string) => void
}) {
  const Icon =
    SAMPLE_PROMPT_ICONS[prompt.id as keyof typeof SAMPLE_PROMPT_ICONS] ??
    ActivityIcon
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null)

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start || disabled) return

    const dx = Math.abs(event.clientX - start.x)
    const dy = Math.abs(event.clientY - start.y)
    if (dx <= SAMPLE_PROMPT_TAP_SLOP_PX && dy <= SAMPLE_PROMPT_TAP_SLOP_PX) {
      onEdit(prompt.text)
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={usePromptLabel}
      className={cn(
        chatSamplePromptButtonClass,
        "cursor-pointer select-none",
        disabled && "pointer-events-none opacity-50"
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null
      }}
      onKeyDown={(event) => {
        if (disabled) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onEdit(prompt.text)
        }
      }}
      onPointerEnter={() => {
        void import("@/lib/chat/parse-trade-setup")
      }}
    >
      <span className="flex w-full min-w-0 items-start gap-2.5 sm:gap-3 lg:gap-2.5">
        <span className={chatSamplePromptIconClass}>
          <Icon className="size-3.5 sm:size-4 lg:size-3.5" aria-hidden />
        </span>
        <span className={chatSamplePromptTextClass}>
          <span className={chatSamplePromptTitleClass}>{prompt.title}</span>
          <span className={chatSamplePromptDescriptionClass}>
            {prompt.description}
          </span>
        </span>
      </span>
    </div>
  )
}

export function IrisSamplePrompts({
  disabled,
  onEdit,
}: {
  disabled?: boolean
  onEdit: (text: string) => void
}) {
  const t = useTranslations("workspace")
  const textDir = localeDirection(useLocale())
  const reduceMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )
  const autoplayPlugin = React.useMemo(
    () =>
      Autoplay({
        delay: 4800,
        playOnInit: true,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    []
  )

  const prompts = React.useMemo(
    () =>
      IRIS_SAMPLE_PROMPTS.map((prompt) => ({
        id: prompt.id,
        title: t(`samplePrompts.${prompt.id}.title`),
        description: t(`samplePrompts.${prompt.id}.description`),
        text: t(`samplePrompts.${prompt.id}.text`),
      })),
    [t]
  )

  return (
    <div className={chatEmptyHeroPromptsClass} dir={textDir}>
      <p className="self-center px-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {t("samplePromptsLabel")}
      </p>
      <div className={chatSamplePromptStaticListClass}>
        {prompts.map((prompt) => (
          <IrisSamplePromptCard
            key={prompt.id}
            prompt={prompt}
            usePromptLabel={t("samplePrompts.usePrompt", {
              title: prompt.title,
            })}
            disabled={disabled}
            onEdit={onEdit}
          />
        ))}
      </div>
      <Carousel
        key={textDir}
        className={chatSamplePromptCarouselClass}
        opts={{
          align: "center",
          loop: true,
          dragFree: false,
          duration: 32,
          skipSnaps: false,
          direction: textDir,
        }}
        plugins={reduceMotion ? undefined : [autoplayPlugin]}
      >
        <CarouselContent className={chatSamplePromptCarouselContentClass}>
          {prompts.map((prompt) => (
            <CarouselItem
              key={prompt.id}
              className={chatSamplePromptCarouselItemClass}
            >
              <IrisSamplePromptCard
                prompt={prompt}
                usePromptLabel={t("samplePrompts.usePrompt", {
                  title: prompt.title,
                })}
                disabled={disabled}
                onEdit={onEdit}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className={chatSamplePromptCarouselDotsClass} />
      </Carousel>
    </div>
  )
}
