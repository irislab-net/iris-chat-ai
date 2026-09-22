"use client"

import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import { useTranslations } from "next-intl"
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
import { cn } from "@/lib/utils"

const SAMPLE_PROMPT_ICONS = {
  "btc-signal": BitcoinIcon,
  "market-pulse": ActivityIcon,
  "key-levels": LayersIcon,
} as const

const SAMPLE_PROMPT_TAP_SLOP_PX = 8

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function IrisSamplePromptCard({
  prompt,
  disabled,
  onEdit,
}: {
  prompt: (typeof IRIS_SAMPLE_PROMPTS)[number]
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
      aria-label={`Use prompt: ${prompt.title}`}
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
  const [reduceMotion, setReduceMotion] = React.useState(false)
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

  React.useEffect(() => {
    setReduceMotion(prefersReducedMotion())
  }, [])

  return (
    <div className={chatEmptyHeroPromptsClass}>
      <p className="self-center px-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {t("samplePromptsLabel")}
      </p>
      <div className={chatSamplePromptStaticListClass}>
        {IRIS_SAMPLE_PROMPTS.map((prompt) => (
          <IrisSamplePromptCard
            key={prompt.id}
            prompt={prompt}
            disabled={disabled}
            onEdit={onEdit}
          />
        ))}
      </div>
      <Carousel
        className={chatSamplePromptCarouselClass}
        opts={{
          align: "center",
          loop: true,
          dragFree: false,
          duration: 32,
          skipSnaps: false,
        }}
        plugins={reduceMotion ? undefined : [autoplayPlugin]}
      >
        <CarouselContent className={chatSamplePromptCarouselContentClass}>
          {IRIS_SAMPLE_PROMPTS.map((prompt) => (
            <CarouselItem
              key={prompt.id}
              className={chatSamplePromptCarouselItemClass}
            >
              <IrisSamplePromptCard
                prompt={prompt}
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
