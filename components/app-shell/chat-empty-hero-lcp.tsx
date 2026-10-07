"use client"

import { BitcoinIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  chatEmptyHeroPromptsClass,
  chatSamplePromptButtonClass,
  chatSamplePromptCarouselDotsClass,
  chatSamplePromptDescriptionClass,
  chatSamplePromptIconClass,
  chatSamplePromptTextClass,
  chatSamplePromptTitleClass,
} from "@/components/app-shell/chat-mobile-gemini-styles"
import { IRIS_SAMPLE_PROMPTS } from "@/lib/chat/sample-prompts"
import { cn } from "@/lib/utils"

const FIRST_PROMPT = IRIS_SAMPLE_PROMPTS[0]

/**
 * SSR-safe empty-hero starters stub — paints the LCP sample description in the
 * first HTML response. Full Embla carousel hydrates as progressive enhancement.
 */
export function ChatEmptyHeroLcp() {
  const t = useTranslations("workspace")
  const title = t(`samplePrompts.${FIRST_PROMPT.id}.title`)
  const description = t(`samplePrompts.${FIRST_PROMPT.id}.description`)

  return (
    <div className={chatEmptyHeroPromptsClass} data-chat-empty-hero-lcp="">
      <p className="self-center px-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        {t("samplePromptsLabel")}
      </p>
      <div
        className={cn(
          chatSamplePromptButtonClass,
          "pointer-events-none h-auto min-h-23.5 select-none whitespace-normal sm:min-h-24 lg:min-h-19"
        )}
        aria-hidden
      >
        <span className="flex w-full min-w-0 items-start gap-2.5 sm:gap-3 lg:gap-2.5">
          <span className={chatSamplePromptIconClass}>
            <BitcoinIcon
              className="size-3.5 sm:size-4 lg:size-3.5"
              aria-hidden
            />
          </span>
          <span className={chatSamplePromptTextClass}>
            <span className={chatSamplePromptTitleClass}>{title}</span>
            <span className={chatSamplePromptDescriptionClass}>
              {description}
            </span>
          </span>
        </span>
      </div>
      <div
        className={cn(
          "flex items-center justify-center gap-1.5 lg:hidden",
          chatSamplePromptCarouselDotsClass
        )}
        aria-hidden
      >
        <span className="size-1.5 rounded-full bg-white/65 dark:bg-white/55" />
        <span className="size-1.5 rounded-full bg-white/45 dark:bg-white/35" />
        <span className="size-1.5 rounded-full bg-white/45 dark:bg-white/35" />
      </div>
    </div>
  )
}
