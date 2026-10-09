"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import { useLocale, useTranslations } from "next-intl"
import {
  BitcoinIcon,
  GemIcon,
  LayersIcon,
  NewspaperIcon,
} from "lucide-react"

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
import { Button } from "@/components/ui/button"
import { trackStarterPromptClick } from "@/lib/analytics"
import { IRIS_SAMPLE_PROMPTS } from "@/lib/chat/sample-prompts"
import { localeDirection } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

const SAMPLE_PROMPT_ICONS = {
  "btc-setup": BitcoinIcon,
  "news-impact": NewspaperIcon,
  "xau-macro": GemIcon,
  "eth-liquidity": LayersIcon,
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
  onActivate,
}: {
  prompt: LocalizedSamplePrompt
  usePromptLabel: string
  disabled?: boolean
  onActivate: (prompt: LocalizedSamplePrompt) => void
}) {
  const Icon =
    SAMPLE_PROMPT_ICONS[prompt.id as keyof typeof SAMPLE_PROMPT_ICONS] ??
    NewspaperIcon
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null)

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return
    pointerStartRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start || disabled) return

    const dx = Math.abs(event.clientX - start.x)
    const dy = Math.abs(event.clientY - start.y)
    if (dx <= SAMPLE_PROMPT_TAP_SLOP_PX && dy <= SAMPLE_PROMPT_TAP_SLOP_PX) {
      onActivate(prompt)
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      aria-label={usePromptLabel}
      className={cn(
        chatSamplePromptButtonClass,
        "h-auto cursor-pointer select-none whitespace-normal"
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartRef.current = null
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
    </Button>
  )
}

export function IrisSamplePrompts({
  disabled,
  onEdit,
  onSend,
}: {
  disabled?: boolean
  onEdit: (text: string) => void
  /** When set, tap sends immediately (ChatGPT/Gemini-style). */
  onSend?: (text: string) => void
}) {
  const t = useTranslations("workspace")
  function activate(prompt: LocalizedSamplePrompt) {
    trackStarterPromptClick({
      prompt_id: prompt.id,
      action: onSend ? "send" : "edit",
    })
    ;(onSend ?? onEdit)(prompt.text)
  }
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
            onActivate={activate}
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
                onActivate={activate}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots className={chatSamplePromptCarouselDotsClass} />
      </Carousel>
    </div>
  )
}
