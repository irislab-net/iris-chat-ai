"use client"

import { ArrowUpIcon, GlobeIcon, PaperclipIcon } from "lucide-react"
import { useRouter } from "@/i18n/navigation"
import { useState } from "react"

import { LandingBadge } from "@/components/landing/modern/sphere-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HERO, HERO_CHIPS, TRUSTED_LOGOS } from "@/lib/landing-modern-data"
import { landingGlass, landingInner } from "@/lib/landing-modern-styles"
import { APP_NEWS_PATH } from "@/lib/site"
import { cn } from "@/lib/utils"

export function HeroSection() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  function handleAsk() {
    const q = query.trim()
    router.push(q ? `${APP_NEWS_PATH}&q=${encodeURIComponent(q)}` : APP_NEWS_PATH)
  }

  return (
    <section className="relative pb-16 pt-4 sm:pb-20 lg:pb-24">
      <div className={cn(landingInner, "relative pt-8 text-center sm:pt-12 lg:pt-14")}>
        <LandingBadge light>{HERO.badge}</LandingBadge>

        <h1
          className="mt-8 font-[family-name:var(--font-display)] text-4xl font-normal leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
        >
          {HERO.titleBefore} {HERO.titleAfter}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          {HERO.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {HERO_CHIPS.map((chip) => {
            const Icon = chip.icon
            return (
              <Button
                key={chip.label}
                type="button"
                variant="ghost"
                className={cn(
                  "h-auto gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/90",
                  landingGlass,
                  "hover:bg-white/18 hover:text-white"
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {chip.label}
              </Button>
            )
          })}
        </div>

        <div
          className={cn(
            "mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full p-2 sm:mt-10 sm:p-2.5",
            landingGlass,
            "shadow-[0_20px_60px_rgba(15,23,42,0.15)]"
          )}
        >
          <div className="flex items-center gap-1 pl-2 sm:pl-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Attach"
            >
              <PaperclipIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Web"
            >
              <GlobeIcon className="size-4" />
            </Button>
          </div>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder={HERO.inputPlaceholder}
            className="h-10 flex-1 border-0 bg-transparent px-1 text-base text-white shadow-none placeholder:text-white/55 focus-visible:ring-0 md:text-base"
          />

          <Button
            type="button"
            size="icon"
            onClick={handleAsk}
            className="size-10 shrink-0 rounded-full bg-white text-[#2563EB] hover:bg-white/90"
            aria-label="Ask Exur"
          >
            <ArrowUpIcon className="size-4" />
          </Button>
        </div>

        <div className="mt-14 sm:mt-16">
          <p className="text-sm font-medium text-white/70">{HERO.socialProof}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {TRUSTED_LOGOS.map((logo, index) => {
              const Icon = logo.icon
              return (
                <div key={logo.name} className="flex items-center gap-8">
                  <div className="flex items-center gap-2 text-white/85">
                    <Icon className="size-4" strokeWidth={1.75} />
                    <span className="text-sm font-medium">{logo.name}</span>
                  </div>
                  {index < TRUSTED_LOGOS.length - 1 && (
                    <span className="hidden h-5 w-px bg-white/20 sm:block" aria-hidden />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
